'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { logAuditAction } from '@/lib/audit'
import { sendNotification } from '@/lib/notifications'
import { startOfMonthKst, nowKst } from '@/lib/utils/timezone'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'super_admin') {
    throw new Error('Forbidden')
  }
  return session.user
}

export async function getAdminCreatorListV2(params: {
  status?: 'all' | 'active' | 'suspended'
  q?: string
  sort?: 'createdAt' | 'monthRevenue' | 'followers' | 'reliability'
  page?: number
  pageSize?: number
} = {}) {
  await requireAdmin()

  const { status = 'all', q, sort = 'createdAt', page = 1, pageSize = 20 } = params

  const where: Record<string, unknown> = {}
  if (status === 'active') where.status = 'ACTIVE'
  if (status === 'suspended') { where.OR = [{ status: 'SUSPENDED' }, { suspendedAt: { not: null } }] }
  if (q) {
    where.OR = [
      { displayName: { contains: q, mode: 'insensitive' } },
      { username: { contains: q, mode: 'insensitive' } },
      { instagramHandle: { contains: q, mode: 'insensitive' } },
    ]
  }

  let orderBy: Record<string, string> = { createdAt: 'desc' }
  if (sort === 'followers') orderBy = { igFollowers: 'desc' }
  if (sort === 'reliability') orderBy = { cnecReliabilityScore: 'desc' }

  const [creators, total] = await Promise.all([
    prisma.creator.findMany({
      where: where as never,
      select: {
        id: true,
        displayName: true,
        username: true,
        profileImageUrl: true,
        instagramHandle: true,
        status: true,
        suspendedAt: true,
        igFollowers: true,
        cnecReliabilityScore: true,
        cnecIsPartner: true,
        cnecTotalTrials: true,
        cnecCompletedPayments: true,
        createdAt: true,
      },
      orderBy: orderBy as never,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.creator.count({ where: where as never }),
  ])

  // 이번 달 매출 기여
  const monthStart = startOfMonthKst()
  const now = nowKst()
  const creatorIds = creators.map(c => c.id)

  const monthOrders = creatorIds.length > 0
    ? await prisma.order.groupBy({
        by: ['creatorId'],
        where: { creatorId: { in: creatorIds }, status: 'PAID', paidAt: { gte: monthStart, lte: now } },
        _sum: { totalAmount: true },
        _count: true,
      })
    : []

  const revenueMap = new Map(monthOrders.map(o => [o.creatorId, {
    revenue: Number(o._sum.totalAmount || 0),
    salesCount: o._count,
  }]))

  const items = creators.map(c => ({
    id: c.id,
    name: c.displayName || c.username || '알 수 없음',
    profileImageUrl: c.profileImageUrl,
    instagramHandle: c.instagramHandle,
    status: c.suspendedAt ? 'SUSPENDED' : (c.status || 'ACTIVE'),
    followers: c.igFollowers,
    reliabilityScore: c.cnecReliabilityScore ? Number(c.cnecReliabilityScore.toString()) : null,
    isPartner: c.cnecIsPartner,
    totalTrials: c.cnecTotalTrials,
    completedPayments: c.cnecCompletedPayments,
    monthRevenue: revenueMap.get(c.id)?.revenue ?? 0,
    monthSalesCount: revenueMap.get(c.id)?.salesCount ?? 0,
    createdAt: c.createdAt.toISOString(),
  }))

  if (sort === 'monthRevenue') {
    items.sort((a, b) => b.monthRevenue - a.monthRevenue)
  }

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

export async function getAdminCreatorDetailV2(id: string) {
  await requireAdmin()

  const creator = await prisma.creator.findUnique({
    where: { id },
    include: {
      user: { select: { email: true, name: true, status: true } },
    },
  })
  if (!creator) throw new Error('NOT_FOUND')

  const monthStart = startOfMonthKst()
  const now = nowKst()

  const [monthOrders, totalOrders, participations, settlements] = await Promise.all([
    prisma.order.findMany({
      where: { creatorId: id, status: 'PAID', paidAt: { gte: monthStart, lte: now } },
      select: { totalAmount: true },
    }),
    prisma.order.count({ where: { creatorId: id, status: { notIn: ['CANCELLED', 'REFUNDED'] } } }),
    prisma.campaignParticipation.findMany({
      where: { creatorId: id },
      select: {
        id: true, status: true, appliedAt: true,
        campaign: { select: { id: true, title: true, status: true, type: true } },
      },
      orderBy: { appliedAt: 'desc' },
      take: 10,
    }),
    prisma.settlement.findMany({
      where: { creatorId: id },
      select: { id: true, status: true, netAmount: true, createdAt: true, period: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ])

  const monthRevenue = monthOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0)

  return {
    creator: {
      id: creator.id,
      name: creator.displayName || creator.username || '알 수 없음',
      username: creator.username,
      profileImageUrl: creator.profileImageUrl,
      instagramHandle: creator.instagramHandle,
      email: creator.user?.email,
      status: creator.suspendedAt ? 'SUSPENDED' : (creator.status || 'ACTIVE'),
      suspendedAt: creator.suspendedAt?.toISOString() || null,
      suspendedReason: creator.suspendedReason,
      suspendedBy: creator.suspendedBy,
      followers: creator.igFollowers,
      reliabilityScore: creator.cnecReliabilityScore ? Number(creator.cnecReliabilityScore.toString()) : null,
      isPartner: creator.cnecIsPartner,
      totalTrials: creator.cnecTotalTrials,
      completedPayments: creator.cnecCompletedPayments,
      categories: creator.categories,
      createdAt: creator.createdAt.toISOString(),
      updatedAt: creator.updatedAt.toISOString(),
    },
    kpi: {
      monthRevenue,
      totalOrders,
      participationCount: participations.length,
    },
    participations: participations.map(p => ({
      id: p.id,
      status: p.status,
      appliedAt: p.appliedAt.toISOString(),
      campaign: p.campaign,
    })),
    settlements: settlements.map(s => ({
      ...s,
      netAmount: Number(s.netAmount || 0),
      createdAt: s.createdAt.toISOString(),
    })),
  }
}

export async function suspendCreator(params: { creatorId: string; reason: string }) {
  const admin = await requireAdmin()
  const { creatorId, reason } = params

  if (!reason || reason.length < 10) throw new Error('사유는 10자 이상 입력해주세요')

  const creator = await prisma.creator.findUnique({
    where: { id: creatorId },
    select: { id: true, displayName: true, username: true, status: true, suspendedAt: true, userId: true },
  })
  if (!creator) throw new Error('NOT_FOUND')
  if (creator.suspendedAt) throw new Error('이미 정지된 크리에이터예요')

  const now = new Date()

  await prisma.$transaction(async (tx) => {
    await tx.creator.update({
      where: { id: creatorId },
      data: {
        status: 'SUSPENDED',
        suspendedAt: now,
        suspendedReason: reason,
        suspendedBy: admin.id,
      },
    })
    await tx.user.update({
      where: { id: creator.userId },
      data: { status: 'suspended' },
    })
  })

  await logAuditAction({
    actorId: admin.id!,
    actorRole: 'super_admin',
    action: 'CREATOR_SUSPEND',
    targetType: 'CREATOR',
    targetId: creatorId,
    payload: { before: { status: creator.status }, after: { status: 'SUSPENDED', suspendedAt: now.toISOString() } },
    reason,
  })

  try {
    await sendNotification({
      userId: creator.userId,
      type: 'SYSTEM',
      title: '계정 정지 안내',
      message: `${creator.displayName || creator.username} 계정이 정지되었어요. 사유: ${reason}`,
      linkUrl: '/suspended',
    })
  } catch {}

  return { success: true as const }
}

export async function reactivateCreator(params: { creatorId: string; reason: string }) {
  const admin = await requireAdmin()
  const { creatorId, reason } = params

  if (!reason) throw new Error('해제 사유를 입력해주세요')

  const creator = await prisma.creator.findUnique({
    where: { id: creatorId },
    select: { id: true, displayName: true, username: true, suspendedAt: true, suspendedReason: true, userId: true },
  })
  if (!creator) throw new Error('NOT_FOUND')
  if (!creator.suspendedAt) throw new Error('정지 상태가 아닌 크리에이터예요')

  await prisma.$transaction(async (tx) => {
    await tx.creator.update({
      where: { id: creatorId },
      data: { status: 'ACTIVE', suspendedAt: null, suspendedReason: null, suspendedBy: null },
    })
    await tx.user.update({
      where: { id: creator.userId },
      data: { status: 'active' },
    })
  })

  await logAuditAction({
    actorId: admin.id!,
    actorRole: 'super_admin',
    action: 'CREATOR_REACTIVATE',
    targetType: 'CREATOR',
    targetId: creatorId,
    payload: { before: { status: 'SUSPENDED' }, after: { status: 'ACTIVE' } },
    reason,
  })

  try {
    await sendNotification({
      userId: creator.userId,
      type: 'SYSTEM',
      title: '계정 활성화 안내',
      message: `${creator.displayName || creator.username} 계정이 다시 활성화되었어요.`,
      linkUrl: '/creator/dashboard',
    })
  } catch {}

  return { success: true as const }
}
