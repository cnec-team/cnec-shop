'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { logAuditAction } from '@/lib/audit'
import { sendNotification } from '@/lib/notifications'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'super_admin') {
    throw new Error('Forbidden')
  }
  return session.user
}

export async function getCampaignForceDetail(campaignId: string) {
  await requireAdmin()

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      brand: { select: { id: true, brandName: true, companyName: true, userId: true } },
      _count: { select: { participations: true } },
    },
  })
  if (!campaign) throw new Error('NOT_FOUND')

  // 진행 중 주문 수
  const activeOrderCount = await prisma.order.count({
    where: {
      items: { some: { product: { campaignProducts: { some: { campaignId } } } } },
      status: { in: ['PAID', 'PREPARING', 'SHIPPING'] },
    },
  })

  return {
    id: campaign.id,
    title: campaign.title,
    status: campaign.status,
    type: campaign.type,
    startAt: campaign.startAt?.toISOString() || null,
    endAt: campaign.endAt?.toISOString() || null,
    isHidden: campaign.isHidden,
    hiddenAt: campaign.hiddenAt?.toISOString() || null,
    hiddenReason: campaign.hiddenReason,
    forceEndedAt: campaign.forceEndedAt?.toISOString() || null,
    forceEndedReason: campaign.forceEndedReason,
    brandName: campaign.brand?.brandName || campaign.brand?.companyName || '알 수 없음',
    brandUserId: campaign.brand?.userId || null,
    participationCount: campaign._count.participations,
    activeOrderCount,
    updatedAt: campaign.updatedAt.toISOString(),
  }
}

export async function forceEndCampaign(params: {
  campaignId: string
  reason: string
}) {
  const admin = await requireAdmin()
  const { campaignId, reason } = params

  if (!reason || reason.length < 10) throw new Error('사유는 10자 이상 입력해주세요')

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { id: true, title: true, status: true, forceEndedAt: true, brand: { select: { userId: true, brandName: true } } },
  })
  if (!campaign) throw new Error('NOT_FOUND')
  if (campaign.status === 'ENDED') throw new Error('이미 종료된 캠페인이에요')

  const now = new Date()
  const before = { status: campaign.status }

  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      status: 'ENDED',
      forceEndedAt: now,
      forceEndedBy: admin.id,
      forceEndedReason: reason,
    },
  })

  await logAuditAction({
    actorId: admin.id!,
    actorRole: 'super_admin',
    action: 'CAMPAIGN_FORCE_END',
    targetType: 'CAMPAIGN',
    targetId: campaignId,
    payload: { before, after: { status: 'ENDED', forceEndedAt: now.toISOString() } },
    reason,
  })

  try {
    if (campaign.brand?.userId) {
      await sendNotification({
        userId: campaign.brand.userId,
        type: 'CAMPAIGN',
        title: '캠페인 강제 종료 안내',
        message: `${campaign.title} 캠페인이 관리자에 의해 종료되었어요. 사유: ${reason}`,
        linkUrl: '/brand/campaigns',
      })
    }
  } catch {}

  return { success: true as const }
}

export async function setCampaignVisibility(params: {
  campaignId: string
  isHidden: boolean
  reason: string
}) {
  const admin = await requireAdmin()
  const { campaignId, isHidden, reason } = params

  if (isHidden && (!reason || reason.length < 10)) {
    throw new Error('차단 사유는 10자 이상 입력해주세요')
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { id: true, title: true, isHidden: true, brand: { select: { userId: true, brandName: true } } },
  })
  if (!campaign) throw new Error('NOT_FOUND')

  const now = new Date()

  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      isHidden,
      hiddenAt: isHidden ? now : null,
      hiddenBy: isHidden ? admin.id : null,
      hiddenReason: isHidden ? reason : null,
    },
  })

  await logAuditAction({
    actorId: admin.id!,
    actorRole: 'super_admin',
    action: 'CAMPAIGN_VISIBILITY_TOGGLE',
    targetType: 'CAMPAIGN',
    targetId: campaignId,
    payload: { before: { isHidden: campaign.isHidden }, after: { isHidden }, options: { reason } },
    reason: reason || (isHidden ? '노출 차단' : '노출 해제'),
  })

  try {
    if (campaign.brand?.userId && isHidden) {
      await sendNotification({
        userId: campaign.brand.userId,
        type: 'CAMPAIGN',
        title: '캠페인 노출 차단 안내',
        message: `${campaign.title} 캠페인이 노출 차단되었어요. 사유: ${reason}`,
        linkUrl: '/brand/campaigns',
      })
    }
  } catch {}

  return { success: true as const }
}
