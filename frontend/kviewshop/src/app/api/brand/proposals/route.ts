import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'
import { sendNotification, sendEmail, sendKakaoAlimtalk } from '@/lib/notifications'
import { proposalGongguInviteMessage, proposalProductPickMessage } from '@/lib/notifications/templates'
import { canSendMessage, consumeMessageCredit } from '@/lib/subscription/check'
import { getCreatorChannels, canProposalBeSent } from '@/lib/messaging/channel-availability'
import { withRetry } from '@/lib/messaging/retry'
import { isV3Plan } from '@/lib/pricing/v3/plan-resolver'
import { chargeMessageSendV3 } from '@/lib/pricing/v3/charge-message'
import { checkCreatorProtection, incrementCreatorProposalCount } from '@/lib/pricing/v3/creator-protection'
import { isUpsellError, pricingLimitToUpsellContext } from '@/lib/pricing/v3/errors'
import { PricingLimitError } from '@/lib/pricing/v3/limits'

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

    // 1. 플랜 확인
    const subscription = await prisma.brandSubscription.findUnique({ where: { brandId: brand.id } })
    const v3 = isV3Plan(subscription)

    const body = await request.json()
    const { creatorId, type, campaignId, templateId, commissionRate, message, useInstagramDm } =
      body as {
        creatorId: string
        type: 'GONGGU' | 'PRODUCT_PICK'
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
      return NextResponse.json({ error: '공구 초대 시 캠페인을 선택��주세요' }, { status: 400 })
    }

    if (campaignId) {
      const campaign = await prisma.campaign.findFirst({
        where: { id: campaignId, brandId: brand.id },
        select: { id: true, status: true },
      })
      if (!campaign) {
        return NextResponse.json({ error: '캠페���을 찾을 수 없습니다' }, { status: 404 })
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

    // 3. v3 크리에이터 보호 체크
    if (v3) {
      try {
        await checkCreatorProtection(brand.id, creatorId)
      } catch (err) {
        if (isUpsellError(err)) {
          return NextResponse.json({ error: 'UPSELL_REQUIRED', upsell: err.toJSON() }, { status: 402 })
        }
        if (err instanceof PricingLimitError) {
          return NextResponse.json({ error: 'CREATOR_PROTECTED', message: err.message }, { status: 400 })
        }
        throw err
      }
    }

    // 4. 메시지 과금 (v3/v2 분기)
    if (v3) {
      try {
        await chargeMessageSendV3(brand.id, creatorId)
      } catch (err) {
        if (isUpsellError(err)) {
          return NextResponse.json({ error: 'UPSELL_REQUIRED', upsell: err.toJSON() }, { status: 402 })
        }
        if (err instanceof PricingLimitError) {
          const upsellCtx = pricingLimitToUpsellContext(err.code, err.message)
          if (upsellCtx) {
            return NextResponse.json({ error: 'UPSELL_REQUIRED', upsell: upsellCtx, message: err.message }, { status: 402 })
          }
          return NextResponse.json({ error: err.code, message: err.message }, { status: 400 })
        }
        throw err
      }
    } else {
      const subCheck = await canSendMessage(brand.id)
      if (!subCheck.ok) {
        return NextResponse.json(
          { error: '구독이 필요합니다', reason: subCheck.reason, currentPlan: subCheck.plan, currentUsed: subCheck.currentUsed, quota: subCheck.quota, upgradeUrl: '/brand/settings/subscription' },
          { status: 402 },
        )
      }
    }

    // 5. 채널 결정
    const channels = getCreatorChannels(creator)
    const attemptedChannels: string[] = []
    const succeededChannels: string[] = []
    const useDm = (useInstagramDm ?? false) && brandIgLinked && channels.dm

    if (channels.inApp) attemptedChannels.push('IN_APP')
    if (channels.email) attemptedChannels.push('EMAIL')
    if (channels.kakao) attemptedChannels.push('KAKAO')
    if (useDm) attemptedChannels.push('DM')

    // 6. 크레딧 소비
    let credit: { creditId: string; type: string; cost: number }
    if (v3) {
      const mc = await prisma.messageCredit.create({
        data: { brandId: brand.id, type: 'SUBSCRIPTION_FREE', cost: 0, pricePerMessage: 0, attemptedChannels, succeededChannels, creatorId },
      })
      credit = { creditId: mc.id, type: 'SUBSCRIPTION_FREE', cost: 0 }
    } else {
      credit = await consumeMessageCredit(brand.id, null, creatorId, attemptedChannels, succeededChannels)
    }

    // 7. 제안 생성
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

    // 6. 템플릿 빌드
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cnecshop.com'
    const acceptUrl = `${siteUrl}/creator/proposals`
    const campaignName = campaignId
      ? (await prisma.campaign.findUnique({ where: { id: campaignId }, select: { title: true } }))?.title ?? ''
      : ''

    const template = type === 'GONGGU'
      ? proposalGongguInviteMessage({
          creatorName: creator.displayName ?? '크리에이터',
          brandName: brand.brandName ?? '브랜드',
          campaignName,
          commissionRate: commissionRate ?? undefined,
          messageBody: message || undefined,
          acceptUrl,
        })
      : proposalProductPickMessage({
          creatorName: creator.displayName ?? '크리에이터',
          brandName: brand.brandName ?? '브랜드',
          productName: campaignName,
          commissionRate: commissionRate ?? undefined,
          messageBody: message || undefined,
          acceptUrl,
        })

    // 7. 채널별 발송 시도
    const channelResults: Record<string, string> = {}

    // IN_APP: 알림 생성
    if (channels.inApp) {
      try {
        await sendNotification({
          userId: creator.userId,
          type: template.inApp.type,
          title: template.inApp.title,
          message: template.inApp.message,
          linkUrl: template.inApp.linkUrl,
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

    // EMAIL: Naver Works SMTP 발송
    if (channels.email && creator.brandContactEmail) {
      try {
        const emailResult = await withRetry(
          () => sendEmail({
            to: creator.brandContactEmail!,
            subject: template.email.subject,
            html: template.email.html,
          }),
          3,
          1000,
        )
        if (emailResult.success) {
          succeededChannels.push('EMAIL')
          channelResults.email = 'SENT'
          await prisma.creatorProposal.update({
            where: { id: proposal.id },
            data: { emailStatus: 'SENT', emailSentAt: now },
          })
        } else {
          channelResults.email = 'FAILED'
          await prisma.creatorProposal.update({
            where: { id: proposal.id },
            data: { emailStatus: 'FAILED' },
          })
        }
      } catch {
        channelResults.email = 'FAILED'
        await prisma.creatorProposal.update({
          where: { id: proposal.id },
          data: { emailStatus: 'FAILED' },
        })
      }
    }

    // KAKAO: 팝빌 알림톡 발송
    if (channels.kakao) {
      try {
        const creatorPhone = await prisma.creator.findUnique({
          where: { id: creatorId },
          select: { phoneForAlimtalk: true },
        })
        if (creatorPhone?.phoneForAlimtalk) {
          const kakaoResult = await withRetry(
            () => sendKakaoAlimtalk({
              templateCode: template.kakao.templateCode,
              receiverNum: creatorPhone.phoneForAlimtalk!,
              receiverName: creator.displayName ?? '크리에이터',
              message: template.kakao.message,
              altText: template.kakao.message,
            }),
            3,
            1000,
          )
          if (kakaoResult.success) {
            succeededChannels.push('KAKAO')
            channelResults.kakao = 'SENT'
            await prisma.creatorProposal.update({
              where: { id: proposal.id },
              data: { kakaoStatus: 'SENT', kakaoSentAt: now },
            })
          } else {
            channelResults.kakao = 'FAILED'
            await prisma.creatorProposal.update({
              where: { id: proposal.id },
              data: { kakaoStatus: 'FAILED' },
            })
          }
        }
      } catch {
        channelResults.kakao = 'FAILED'
        await prisma.creatorProposal.update({
          where: { id: proposal.id },
          data: { kakaoStatus: 'FAILED' },
        })
      }
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

    // 8. succeededChannels 업데이트
    await prisma.messageCredit.update({
      where: { id: credit.creditId },
      data: {
        succeededChannels,
        proposalId: proposal.id,
      },
    })

    // v3: 크리에이터 프로포절 카운트 증가
    if (v3) {
      incrementCreatorProposalCount(creatorId).catch(err => {
        console.error('[incrementCreatorProposalCount]', err)
      })
    }

    return NextResponse.json({
      proposal,
      credit: {
        id: credit.creditId,
        type: credit.type,
        cost: credit.cost,
      },
      channelResults,
    })
  } catch (error) {
    console.error('제안 발송 오류:', error)
    return NextResponse.json({ error: '제안 발송 중 오류가 발생���습니다' }, { status: 500 })
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
