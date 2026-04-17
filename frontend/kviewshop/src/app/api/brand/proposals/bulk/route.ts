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

    const body = await request.json()
    const {
      creatorIds,
      type,
      campaignId,
      templateId,
      commissionRate,
      message,
      useInstagramDm,
      confirm,
    } = body as {
      creatorIds: string[]
      type: 'GONGGU' | 'PRODUCT_PICK'
      campaignId?: string
      templateId?: string
      commissionRate?: number
      message?: string
      useInstagramDm?: boolean
      confirm?: boolean
    }

    if (!Array.isArray(creatorIds) || creatorIds.length === 0) {
      return NextResponse.json({ error: '크리에이터를 선택해주세요' }, { status: 400 })
    }

    if (type === 'GONGGU' && !campaignId) {
      return NextResponse.json({ error: '공구 초대 시 캠페인을 선택해주세요' }, { status: 400 })
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

    // 구독 체크
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

    const creators = await prisma.creator.findMany({
      where: { id: { in: creatorIds } },
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

    const existingProposals = await prisma.creatorProposal.findMany({
      where: {
        brandId: brand.id,
        creatorId: { in: creatorIds },
        status: 'PENDING',
        ...(campaignId ? { campaignId } : {}),
      },
      select: { creatorId: true },
    })
    const existingSet = new Set(existingProposals.map((p) => p.creatorId))
    const newCreators = creators.filter((c) => !existingSet.has(c.id))

    if (newCreators.length === 0) {
      return NextResponse.json(
        { error: '선택한 크리에이터 모두 이미 제안이 발송되었습니다' },
        { status: 409 },
      )
    }

    const brandIgLinked = brand.brandInstagramHandleStatus === 'VERIFIED'
    const useDmFlag = useInstagramDm ?? false

    // 채널 분석
    const channelBreakdown = {
      inAppOnly: 0,
      emailAvailable: 0,
      kakaoAvailable: 0,
      dmOnly: 0,
      unreachable: 0,
    }
    const blockers = {
      noSubscription: !subCheck.ok,
      noChannelNoDm: 0,
      brandIgNotLinked: 0,
    }

    const reachableCreators: typeof newCreators = []

    for (const c of newCreators) {
      const channels = getCreatorChannels(c)
      const sendCheck = canProposalBeSent(c, useDmFlag, brandIgLinked)

      if (!sendCheck.ok) {
        if (sendCheck.reason === 'NO_CHANNEL') blockers.noChannelNoDm++
        if (sendCheck.reason === 'BRAND_IG_NOT_LINKED') blockers.brandIgNotLinked++
        channelBreakdown.unreachable++
        continue
      }

      reachableCreators.push(c)

      const hasBasicChannel = channels.inApp || channels.email || channels.kakao
      if (!hasBasicChannel && channels.dm) {
        channelBreakdown.dmOnly++
      }
      if (channels.inApp && !channels.email && !channels.kakao) channelBreakdown.inAppOnly++
      if (channels.email) channelBreakdown.emailAvailable++
      if (channels.kakao) channelBreakdown.kakaoAvailable++
    }

    // 미리보기 모드
    if (!confirm) {
      const totalCount = reachableCreators.length
      const freeRemaining = Math.max(0, subCheck.quota - subCheck.currentUsed)
      const freeCount = Math.min(totalCount, freeRemaining)
      const paidCount = Math.max(0, totalCount - freeCount)

      return NextResponse.json({
        totalCount,
        freeCount,
        paidCount,
        paidAmount: paidCount * 500,
        channelBreakdown,
        blockers,
        skipped: existingSet.size,
      })
    }

    // 실제 발송
    const results: Array<{
      creatorId: string
      proposalId: string
      creditType: string
      cost: number
      channelResults: Record<string, string>
    }> = []

    const now = new Date()

    for (const c of reachableCreators) {
      try {
        const channels = getCreatorChannels(c)
        const attemptedChannels: string[] = []
        const succeededChannels: string[] = []
        const useDm = useDmFlag && brandIgLinked && channels.dm

        if (channels.inApp) attemptedChannels.push('IN_APP')
        if (channels.email) attemptedChannels.push('EMAIL')
        if (channels.kakao) attemptedChannels.push('KAKAO')
        if (useDm) attemptedChannels.push('DM')

        const credit = await consumeMessageCredit(
          brand.id,
          null,
          c.id,
          attemptedChannels,
          succeededChannels,
        )

        const proposal = await prisma.creatorProposal.create({
          data: {
            brandId: brand.id,
            creatorId: c.id,
            type,
            campaignId: campaignId || null,
            templateId: templateId || null,
            commissionRate: commissionRate ?? undefined,
            message: message || null,
            status: 'PENDING',
            messageCreditId: credit.creditId,
            useInstagramDm: useDm,
            inAppStatus: channels.inApp ? 'PENDING' : 'SKIPPED',
            emailStatus: 'SKIPPED',
            kakaoStatus: 'SKIPPED',
            dmStatus: useDm ? 'PENDING' : 'SKIPPED',
          },
        })

        const channelResults: Record<string, string> = {}

        // IN_APP
        if (channels.inApp) {
          try {
            await sendNotification({
              userId: c.userId,
              type: 'CAMPAIGN',
              title: '새로운 제안이 도착했습니다',
              message: `${brand.brandName ?? '브랜드'}에서 ${type === 'GONGGU' ? '공구' : '상품 추천'} 제안이 왔습니다`,
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

        // DM
        if (useDm && c.igUsername) {
          try {
            await prisma.dmSendQueue.create({
              data: {
                brandId: brand.id,
                creatorId: c.id,
                proposalId: proposal.id,
                instagramUsername: c.igUsername,
                messageBody:
                  message ||
                  `${brand.brandName ?? '브랜드'}에서 ${type === 'GONGGU' ? '공구' : '상품 추천'} 초대를 보냈습니다.`,
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

        // succeededChannels 업데이트
        await prisma.messageCredit.update({
          where: { id: credit.creditId },
          data: {
            succeededChannels,
            proposalId: proposal.id,
          },
        })

        results.push({
          creatorId: c.id,
          proposalId: proposal.id,
          creditType: credit.type,
          cost: credit.cost,
          channelResults,
        })
      } catch {
        // 개별 크리에이터 실패 시 건너뛰기
      }
    }

    return NextResponse.json({
      created: results.length,
      skipped: existingSet.size,
      unreachable: channelBreakdown.unreachable,
      results,
    })
  } catch (error) {
    console.error('일괄 초대 발송 오류:', error)
    return NextResponse.json({ error: '일괄 초대 발송 중 오류가 발생했습니다' }, { status: 500 })
  }
}
