'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { logAuditAction } from '@/lib/audit'
import { sendNotification, isValidEmail, normalizePhone } from '@/lib/notifications'
import { brandSuspendedMessage, brandReactivatedMessage } from '@/lib/notifications/templates'
import { startOfMonthKst, nowKst } from '@/lib/utils/timezone'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'super_admin') {
    throw new Error('Forbidden')
  }
  return session.user
}

export async function getAdminBrandListV2(params: {
  status?: 'all' | 'approved' | 'suspended' | 'pending'
  q?: string
  sort?: 'createdAt' | 'monthGmv' | 'name'
  page?: number
  pageSize?: number
} = {}) {
  await requireAdmin()

  const { status = 'all', q, sort = 'createdAt', page = 1, pageSize = 20 } = params

  const where: Record<string, unknown> = {}
  if (status === 'approved') where.approved = true
  if (status === 'suspended') where.suspendedAt = { not: null }
  if (status === 'pending') { where.approved = false; where.suspendedAt = null }
  if (q) {
    where.OR = [
      { brandName: { contains: q, mode: 'insensitive' } },
      { companyName: { contains: q, mode: 'insensitive' } },
      { businessNumber: { contains: q } },
    ]
  }

  const orderBy = sort === 'name' ? { brandName: 'asc' as const } : { createdAt: 'desc' as const }

  const [brands, total] = await Promise.all([
    prisma.brand.findMany({
      where: where as never,
      select: {
        id: true,
        brandName: true,
        companyName: true,
        logoUrl: true,
        businessNumber: true,
        approved: true,
        suspendedAt: true,
        creatorCommissionRate: true,
        customCommissionRate: true,
        createdAt: true,
        _count: { select: { campaigns: { where: { status: 'ACTIVE' } } } },
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.brand.count({ where: where as never }),
  ])

  // 이번 달 GMV 계산
  const monthStart = startOfMonthKst()
  const now = nowKst()
  const brandIds = brands.map(b => b.id)

  const monthOrders = brandIds.length > 0
    ? await prisma.order.groupBy({
        by: ['brandId'],
        where: { brandId: { in: brandIds }, status: 'PAID', paidAt: { gte: monthStart, lte: now } },
        _sum: { totalAmount: true },
        _count: true,
      })
    : []

  const gmvMap = new Map(monthOrders.map(o => [o.brandId, {
    gmv: Number(o._sum.totalAmount || 0),
    orders: o._count,
  }]))

  const items = brands.map(b => ({
    id: b.id,
    name: b.brandName || b.companyName || '알 수 없음',
    logoUrl: b.logoUrl,
    businessNumber: b.businessNumber,
    status: b.suspendedAt ? 'SUSPENDED' : b.approved ? 'APPROVED' : 'PENDING',
    commissionRate: b.customCommissionRate ?? b.creatorCommissionRate ?? 25,
    isCustomRate: b.customCommissionRate !== null,
    activeCampaigns: b._count.campaigns,
    monthGmv: gmvMap.get(b.id)?.gmv ?? 0,
    monthOrders: gmvMap.get(b.id)?.orders ?? 0,
    createdAt: b.createdAt.toISOString(),
  }))

  // Sort by GMV if requested
  if (sort === 'monthGmv') {
    items.sort((a, b) => b.monthGmv - a.monthGmv)
  }

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

export async function getAdminBrandDetailV2(id: string) {
  const admin = await requireAdmin()

  const brand = await prisma.brand.findUnique({
    where: { id },
    include: {
      user: { select: { email: true, name: true, status: true } },
    },
  })
  if (!brand) throw new Error('NOT_FOUND')

  const monthStart = startOfMonthKst()
  const now = nowKst()

  const [monthOrders, totalOrders, activeCampaigns, pendingSettlements, campaigns, products, settlements] =
    await Promise.all([
      prisma.order.findMany({
        where: { brandId: id, status: 'PAID', paidAt: { gte: monthStart, lte: now } },
        select: { totalAmount: true },
      }),
      prisma.order.count({ where: { brandId: id, status: { notIn: ['CANCELLED', 'REFUNDED'] } } }),
      prisma.campaign.count({ where: { brandId: id, status: 'ACTIVE' } }),
      prisma.settlement.count({ where: { status: 'PENDING' } }),
      prisma.campaign.findMany({
        where: { brandId: id },
        select: { id: true, title: true, status: true, type: true, startAt: true, endAt: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.product.findMany({
        where: { brandId: id },
        select: { id: true, name: true, status: true, stock: true, salePrice: true, isActive: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.settlement.findMany({
        where: { userId: brand.userId },
        select: { id: true, status: true, netAmount: true, createdAt: true, period: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ])

  const monthGmv = monthOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0)
  const totalGmv = totalOrders // simplified — would need aggregate for actual GMV

  return {
    brand: {
      id: brand.id,
      name: brand.brandName || brand.companyName || '알 수 없음',
      logoUrl: brand.logoUrl,
      businessNumber: brand.businessNumber,
      contactEmail: brand.contactEmail || brand.user?.email,
      contactPhone: brand.contactPhone,
      approved: brand.approved,
      suspendedAt: brand.suspendedAt?.toISOString() || null,
      suspendedReason: brand.suspendedReason,
      suspendedBy: brand.suspendedBy,
      commissionRate: brand.customCommissionRate ?? brand.creatorCommissionRate ?? 25,
      isCustomRate: brand.customCommissionRate !== null,
      platformFeeRate: Number(brand.platformFeeRate || 0.03),
      createdAt: brand.createdAt.toISOString(),
      updatedAt: brand.updatedAt.toISOString(),
    },
    kpi: {
      monthGmv,
      totalOrders,
      activeCampaigns,
      pendingSettlements,
      avgOrderValue: monthOrders.length > 0 ? Math.round(monthGmv / monthOrders.length) : 0,
    },
    campaigns: campaigns.map(c => ({
      ...c,
      startAt: c.startAt?.toISOString() || null,
      endAt: c.endAt?.toISOString() || null,
      createdAt: c.createdAt.toISOString(),
    })),
    products: products.map(p => ({
      ...p,
      salePrice: p.salePrice ? Number(p.salePrice) : null,
      createdAt: p.createdAt.toISOString(),
    })),
    settlements: settlements.map(s => ({
      ...s,
      netAmount: Number(s.netAmount || 0),
      createdAt: s.createdAt.toISOString(),
    })),
  }
}

export async function suspendBrand(params: {
  brandId: string
  reason: string
  autoStopCampaigns: boolean
}) {
  const admin = await requireAdmin()
  const { brandId, reason, autoStopCampaigns } = params

  if (!reason || reason.length < 10) throw new Error('사유는 10자 이상 입력해주세요')

  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    select: { id: true, brandName: true, companyName: true, suspendedAt: true, userId: true, approved: true, user: { select: { email: true, phone: true } } },
  })
  if (!brand) throw new Error('NOT_FOUND')
  if (brand.suspendedAt) throw new Error('이미 정지된 브랜드예요')

  const before = { approved: brand.approved, suspendedAt: null }
  const now = new Date()

  await prisma.$transaction(async (tx) => {
    await tx.brand.update({
      where: { id: brandId },
      data: {
        suspendedAt: now,
        suspendedReason: reason,
        suspendedBy: admin.id,
      },
    })

    if (autoStopCampaigns) {
      await tx.campaign.updateMany({
        where: { brandId, status: { in: ['ACTIVE', 'RECRUITING'] } },
        data: { status: 'ENDED' },
      })
    }

    // 세션 무효화 (user status 변경으로)
    await tx.user.update({
      where: { id: brand.userId },
      data: { status: 'suspended' },
    })
  })

  await logAuditAction({
    actorId: admin.id!,
    actorRole: 'super_admin',
    action: 'BRAND_SUSPEND',
    targetType: 'BRAND',
    targetId: brandId,
    payload: { before, after: { suspendedAt: now.toISOString(), reason }, options: { autoStopCampaigns } },
    reason,
  })

  try {
    const brandEmail = isValidEmail(brand.user?.email) ? brand.user!.email! : undefined
    const brandPhone = normalizePhone(brand.user?.phone)
    const tmpl = brandSuspendedMessage({
      brandName: brand.brandName || brand.companyName || '',
      reason,
      recipientEmail: brandEmail,
    })
    await sendNotification({
      userId: brand.userId,
      ...tmpl.inApp,
      phone: brandPhone,
      email: brandEmail,
      kakaoTemplate: brandPhone ? tmpl.kakao : undefined,
      emailTemplate: brandEmail ? tmpl.email : undefined,
    })
  } catch {}

  return { success: true as const }
}

export async function reactivateBrand(params: { brandId: string; reason: string }) {
  const admin = await requireAdmin()
  const { brandId, reason } = params

  if (!reason) throw new Error('해제 사유를 입력해주세요')

  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    select: { id: true, brandName: true, companyName: true, suspendedAt: true, suspendedReason: true, userId: true, user: { select: { email: true } } },
  })
  if (!brand) throw new Error('NOT_FOUND')
  if (!brand.suspendedAt) throw new Error('정지 상태가 아닌 브랜드예요')

  const before = { suspendedAt: brand.suspendedAt.toISOString(), suspendedReason: brand.suspendedReason }

  await prisma.$transaction(async (tx) => {
    await tx.brand.update({
      where: { id: brandId },
      data: { suspendedAt: null, suspendedReason: null, suspendedBy: null },
    })
    await tx.user.update({
      where: { id: brand.userId },
      data: { status: 'active' },
    })
  })

  await logAuditAction({
    actorId: admin.id!,
    actorRole: 'super_admin',
    action: 'BRAND_REACTIVATE',
    targetType: 'BRAND',
    targetId: brandId,
    payload: { before, after: { suspendedAt: null } },
    reason,
  })

  try {
    const brandEmail = isValidEmail(brand.user?.email) ? brand.user!.email! : undefined
    const tmpl = brandReactivatedMessage({
      brandName: brand.brandName || brand.companyName || '',
      recipientEmail: brandEmail,
    })
    await sendNotification({
      userId: brand.userId,
      ...tmpl.inApp,
      email: brandEmail,
      emailTemplate: brandEmail ? tmpl.email : undefined,
    })
  } catch {}

  return { success: true as const }
}

export async function updateBrandCommissionRate(params: {
  brandId: string
  newRate: number
  reason: string
}) {
  const admin = await requireAdmin()
  const { brandId, newRate, reason } = params

  if (newRate < 5 || newRate > 50) throw new Error('수수료율은 5% ~ 50% 범위만 가능해요')
  if (!reason) throw new Error('변경 사유를 입력해주세요')

  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    select: { id: true, brandName: true, companyName: true, creatorCommissionRate: true, customCommissionRate: true, userId: true },
  })
  if (!brand) throw new Error('NOT_FOUND')

  const currentRate = brand.customCommissionRate ?? brand.creatorCommissionRate ?? 25
  if (currentRate === newRate) throw new Error('동일한 수수료율이에요')

  await prisma.brand.update({
    where: { id: brandId },
    data: { customCommissionRate: newRate },
  })

  await logAuditAction({
    actorId: admin.id!,
    actorRole: 'super_admin',
    action: 'BRAND_COMMISSION_UPDATE',
    targetType: 'BRAND',
    targetId: brandId,
    payload: { before: { rate: currentRate }, after: { rate: newRate } },
    reason,
  })

  try {
    await sendNotification({
      userId: brand.userId,
      type: 'SYSTEM',
      title: '수수료율 변경 안내',
      message: `${brand.brandName || brand.companyName} 수수료율이 ${currentRate}%에서 ${newRate}%로 변경되었어요. 사유: ${reason}`,
      linkUrl: '/brand/settings',
    })
  } catch {}

  return { success: true as const }
}
