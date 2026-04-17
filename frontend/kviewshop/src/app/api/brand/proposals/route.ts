import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'
import { sendNotification } from '@/lib/notifications'
import { canSendMessage, consumeMessageCredit } from '@/lib/subscription/check'
import { getCreatorChannels, canProposalBeSent } from '@/lib/messaging/channel-availability'

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser || authUser.role !== 'brand_admin') {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 401 })
    }

    const brand = await prisma.brand.findFirst({
      where: { userId: authUser.id },
      select: {
        id: true,
        brandName: true,
        brandInstagramHandle: true,
        brandInstagramHandleStatus: true,
      },
    })
    if (!brand) {
      return NextResponse.json({ error: '브랜드를 찾을 수 없습니다' }, { status: 404 })
    }

    // 1. 구독 체크
    const subCheck = await canSendMessage(brand.id)
    if (!subCheck.ok) {
      return NextResponse.json(
        {
          error: '구독이 필요합니다',
          reason: subCheck.reason,
          currentPlan: subCheck.plan,
          currentUsed: subCheck.currentUsed,
          quota: subCheck.quota,
          upgradeUrl: '/brand/settings/subscription',
        },
        { status: 402 },
      )
    }

    const body = await request.json()
    const { creatorId, type, campaignId, templateId, commissionRate, message, useInstagramDm } =
      body as {
        creatorId: string
        type: 'GONGGU' | 'CREATOR_PICK'
        campaignId?: string
        templateId?: string
        commissionRate?: number
        message?: string
        useInstagramDm?: boolean
      }

    const creator = await prisma.creator.findUnique({
      where: { id: creatorId },
      select: {
        id: true,
        userId: true,
        displayName: true,
        cnecJoinStatus: true,
        hasBrandEmail: true,
        brandContactEmail: true,
        hasPhone: true,
        igUsername: true,
      },
    })
    if (!creator) {
      return NextResponse.json({ error: '크리에이터를 찾을 수 없습니다' }, { status: 404 })
    }

    // 2. 채널 가능 여부 체크
    const brandIgLinked = brand.brandInstagramHandleStatus === 'VERIFIED'
    const channelCheck = canProposalBeSent(creator, useInstagramDm ?? false, brandIgLinked)
    if (!channelCheck.ok) {
      return NextResponse.json(
        {
          error: '발송 가능한 채널이 없습니다',
          reason: channelCheck.reason,
          requiredAction: channelCheck.requiredAction,
        },
        { status: 400 },
      )
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
        return NextResponse.json(
          { error: '모집 중이거나 진행 중인 캠페인만 선택할 수 있습니다' },
          { status: 400 },
        )
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

    // 3. 채널 결정
    const channels = getCreatorChannels(creator)
    const attemptedChannels: string[] = []
    const succeededChannels: string[] = []
    const useDm = (useInstagramDm ?? false) && brandIgLinked && channels.dm

    if (channels.inApp) attemptedChannels.push('IN_APP')
    if (channels.email) attemptedChannels.push('EMAIL')
    if (channels.kakao) attemptedChannels.push('KAKAO')
    if (useDm) attemptedChannels.push('DM')

    // 4. 크레딧 소비 (시도 시점 과금)
    const credit = await consumeMessageCredit(
      brand.id,
      null, // proposalId는 아직 없음
      creatorId,
      attemptedChannels,
      succeededChannels,
    )

    // 5. 제안 생성
    const now = new Date()
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
        messageCreditId: credit.creditId,
        useInstagramDm: useDm,
        // 채널 상태 초기화
        inAppStatus: channels.inApp ? 'PENDING' : 'SKIPPED',
        emailStatus: channels.email ? 'PENDING' : 'SKIPPED',
        kakaoStatus: channels.kakao ? 'PENDING' : 'SKIPPED',
        dmStatus: useDm ? 'PENDING' : 'SKIPPED',
      },
    })

    // 6. 채널별 발송 시도
    const channelResults: Record<string, string> = {}

    // IN_APP: 알림 생성
    if (channels.inApp) {
      try {
        await sendNotification({
          userId: creator.userId,
          type: 'CAMPAIGN',
          title: '새로운 제안이 도착했습니다',
          message: `${brand.brandName ?? '브랜드'}에서 ${type === 'GONGGU' ? '공구' : '크리에이터픽'} 제안이 왔습니다`,
          linkUrl: '/creator/proposals',
        })
        succeededChannels.push('IN_APP')
        channelResults.inApp = 'SENT'
        await prisma.creatorProposal.update({
          where: { id: proposal.id },
          data: { inAppStatus: 'SENT', inAppSentAt: now },
        })
      } catch {
        channelResults.inApp = 'FAILED'
        await prisma.creatorProposal.update({
          where: { id: proposal.id },
          data: { inAppStatus: 'FAILED' },
        })
      }
    }

    // EMAIL: Part C에서 활성화
    if (channels.email) {
      channelResults.email = 'SKIPPED'
      await prisma.creatorProposal.update({
        where: { id: proposal.id },
        data: { emailStatus: 'SKIPPED' },
      })
    }

    // KAKAO: Part C에서 활성화
    if (channels.kakao) {
      channelResults.kakao = 'SKIPPED'
      await prisma.creatorProposal.update({
        where: { id: proposal.id },
        data: { kakaoStatus: 'SKIPPED' },
      })
    }

    // DM: DmSendQueue INSERT
    if (useDm && creator.igUsername) {
      try {
        await prisma.dmSendQueue.create({
          data: {
            brandId: brand.id,
            creatorId,
            proposalId: proposal.id,
            instagramUsername: creator.igUsername,
            messageBody:
              message ||
              `${brand.brandName ?? '브랜드'}에서 ${type === 'GONGGU' ? '공구' : '크리에이터픽'} 제안을 보냈습니다.`,
            status: 'PENDING',
            brandInstagramAccount: brand.brandInstagramHandle,
          },
        })
        channelResults.dm = 'QUEUED'
        await prisma.creatorProposal.update({
          where: { id: proposal.id },
          data: { dmStatus: 'SENT', dmQueuedAt: now },
        })
      } catch {
        channelResults.dm = 'FAILED'
      }
    }

    // 7. succeededChannels 업데이트
    await prisma.messageCredit.update({
      where: { id: credit.creditId },
      data: {
        succeededChannels,
        proposalId: proposal.id,
      },
    })

    // 남은 쿼터 계산
    const remainingQuota = Math.max(0, subCheck.quota - subCheck.currentUsed - 1)

    return NextResponse.json({
      proposal,
      credit: {
        id: credit.creditId,
        type: credit.type,
        cost: credit.cost,
      },
      remainingQuota,
      channelResults,
    })
  } catch (error) {
    console.error('제안 발송 오류:', error)
    return NextResponse.json({ error: '제안 발송 중 오류가 발생했습니다' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser || authUser.role !== 'brand_admin') {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 401 })
    }

    const brand = await prisma.brand.findFirst({
      where: { userId: authUser.id },
      select: { id: true },
    })
    if (!brand) {
      return NextResponse.json({ error: '브랜드를 찾을 수 없습니다' }, { status: 404 })
    }

    const sp = request.nextUrl.searchParams
    const status = sp.get('status') || undefined
    const page = Math.max(1, parseInt(sp.get('page') || '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(sp.get('limit') || '20', 10)))

    const where = {
      brandId: brand.id,
      ...(status
        ? { status: status as 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' }
        : {}),
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

    const serialized = proposals.map((p) => ({
      ...p,
      commissionRate: p.commissionRate ? Number(p.commissionRate) : null,
      creator: {
        ...p.creator,
        igEngagementRate: p.creator.igEngagementRate ? Number(p.creator.igEngagementRate) : null,
        totalSales: Number(p.creator.totalSales),
        totalEarnings: Number(p.creator.totalEarnings),
        totalRevenue: Number(p.creator.totalRevenue),
        igEstimatedCPRDecimal: p.creator.igEstimatedCPRDecimal
          ? Number(p.creator.igEstimatedCPRDecimal)
          : null,
        igEstimatedAdFee: p.creator.igEstimatedAdFee
          ? Number(p.creator.igEstimatedAdFee)
          : null,
      },
    }))

    return NextResponse.json({
      proposals: serialized,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('제안 목록 조회 오류:', error)
    return NextResponse.json({ error: '제안 목록 조회 중 오류가 발생했습니다' }, { status: 500 })
  }
}
