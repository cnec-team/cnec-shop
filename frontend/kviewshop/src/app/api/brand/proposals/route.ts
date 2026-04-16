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
  const { creatorId, type, campaignId, templateId, commissionRate, message } = body as {
    creatorId: string
    type: 'GONGGU' | 'CREATOR_PICK'
    campaignId?: string
    templateId?: string
    commissionRate?: number
    message?: string
  }

  const creator = await prisma.creator.findUnique({
    where: { id: creatorId },
    select: { id: true, userId: true, displayName: true },
  })
  if (!creator) {
    return NextResponse.json({ error: '크리에이터를 찾을 수 없습니다' }, { status: 404 })
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

  const existing = await prisma.creatorProposal.findFirst({
    where: {
      brandId: brand.id,
      creatorId,
      status: 'PENDING',
      ...(campaignId ? { campaignId } : {}),
    },
  })
  if (existing) {
    return NextResponse.json({ error: '이미 제안을 보낸 크리에이터입니다' }, { status: 409 })
  }

  const proposal = await prisma.creatorProposal.create({
    data: {
      brandId: brand.id,
      creatorId,
      type,
      campaignId: campaignId || null,
      templateId: templateId || null,
      commissionRate: commissionRate ?? undefined,
      message: message || null,
      status: 'PENDING',
    },
  })

  try {
    await sendNotification({
      userId: creator.userId,
      type: 'CAMPAIGN',
      title: '새로운 제안이 도착했습니다',
      message: `${brand.brandName ?? '브랜드'}에서 ${type === 'GONGGU' ? '공구' : '크리에이터픽'} 제안이 왔습니다`,
      linkUrl: '/creator/proposals',
    })
  } catch {
    // 알림 실패가 주요 로직에 영향 주지 않도록
  }

  return NextResponse.json({ proposal })
}

export async function GET(request: NextRequest) {
  const authUser = await getAuthUser()
  if (!authUser || authUser.role !== 'brand_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const brand = await prisma.brand.findFirst({
    where: { userId: authUser.id },
    select: { id: true },
  })
  if (!brand) {
    return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
  }

  const sp = request.nextUrl.searchParams
  const status = sp.get('status') || undefined
  const page = Math.max(1, parseInt(sp.get('page') || '1', 10))
  const limit = Math.min(50, Math.max(1, parseInt(sp.get('limit') || '20', 10)))

  const where = {
    brandId: brand.id,
    ...(status ? { status: status as 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' } : {}),
  }

  const [proposals, total] = await Promise.all([
    prisma.creatorProposal.findMany({
      where,
      include: { creator: true, campaign: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.creatorProposal.count({ where }),
  ])

  const serialized = proposals.map(p => ({
    ...p,
    commissionRate: p.commissionRate ? Number(p.commissionRate) : null,
    creator: {
      ...p.creator,
      igEngagementRate: p.creator.igEngagementRate ? Number(p.creator.igEngagementRate) : null,
      totalSales: Number(p.creator.totalSales),
      totalEarnings: Number(p.creator.totalEarnings),
      totalRevenue: Number(p.creator.totalRevenue),
    },
  }))

  return NextResponse.json({
    proposals: serialized,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  })
}
