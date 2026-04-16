import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'
import { sendNotification } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser()
  if (!authUser || authUser.role !== 'brand_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const brand = await prisma.brand.findFirst({
    where: { userId: authUser.id },
    select: { id: true, brandName: true },
  })
  if (!brand) {
    return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
  }

  const body = await request.json()
  const { creatorIds, type, campaignId, templateId, commissionRate, message } = body as {
    creatorIds: string[]
    type: 'GONGGU' | 'CREATOR_PICK'
    campaignId?: string
    templateId?: string
    commissionRate?: number
    message?: string
  }

  if (!Array.isArray(creatorIds) || creatorIds.length === 0) {
    return NextResponse.json({ error: '크리에이터를 선택해주세요' }, { status: 400 })
  }

  if (type === 'GONGGU' && !campaignId) {
    return NextResponse.json({ error: '공구 제안 시 캠페인을 선택해주세요' }, { status: 400 })
  }

  if (campaignId) {
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, brandId: brand.id },
      select: { id: true, status: true },
    })
    if (!campaign) {
      return NextResponse.json({ error: '캠페인을 찾을 수 없습니다' }, { status: 404 })
    }
    if (!['RECRUITING', 'ACTIVE'].includes(campaign.status)) {
      return NextResponse.json({ error: '모집 중이거나 진행 중인 캠페인만 선택할 수 있습니다' }, { status: 400 })
    }
  }

  const creators = await prisma.creator.findMany({
    where: { id: { in: creatorIds } },
    select: { id: true, userId: true },
  })

  const existingProposals = await prisma.creatorProposal.findMany({
    where: {
      brandId: brand.id,
      creatorId: { in: creatorIds },
      status: 'PENDING',
      ...(campaignId ? { campaignId } : {}),
    },
    select: { creatorId: true },
  })
  const existingSet = new Set(existingProposals.map(p => p.creatorId))
  const newCreatorIds = creatorIds.filter(id => !existingSet.has(id))

  if (newCreatorIds.length === 0) {
    return NextResponse.json({ error: '선택한 크리에이터 모두 이미 제안이 발송되었습니다' }, { status: 409 })
  }

  await prisma.creatorProposal.createMany({
    data: newCreatorIds.map(creatorId => ({
      brandId: brand.id,
      creatorId,
      type,
      campaignId: campaignId || null,
      templateId: templateId || null,
      commissionRate: commissionRate ?? undefined,
      message: message || null,
      status: 'PENDING' as const,
    })),
  })

  // 알림 발송
  const notifLabel = type === 'GONGGU' ? '공구' : '크리에이터픽'
  for (const c of creators.filter(c => newCreatorIds.includes(c.id))) {
    try {
      await sendNotification({
        userId: c.userId,
        type: 'CAMPAIGN',
        title: '새로운 제안이 도착했습니다',
        message: `${brand.brandName ?? '브랜드'}에서 ${notifLabel} 제안이 왔습니다`,
        linkUrl: '/creator/proposals',
      })
    } catch {
      // 알림 실패가 주요 로직에 영향 주지 않도록
    }
  }

  return NextResponse.json({
    created: newCreatorIds.length,
    skipped: existingSet.size,
  })
}
