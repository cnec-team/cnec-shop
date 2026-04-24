import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'
import { sendNotification, sendEmail, sendKakaoAlimtalk } from '@/lib/notifications'
import { proposalGongguInviteMessage, proposalProductPickMessage, bulkSendReportMessage } from '@/lib/notifications/templates'
import { canSendMessage, consumeMessageCredit } from '@/lib/subscription/check'
import { getCreatorChannels, canProposalBeSent } from '@/lib/messaging/channel-availability'
import { withRetry } from '@/lib/messaging/retry'
import { isV3Plan } from '@/lib/pricing/v3/plan-resolver'
import { chargeMessageSendV3 } from '@/lib/pricing/v3/charge-message'
import { checkCreatorProtection, incrementCreatorProposalCount } from '@/lib/pricing/v3/creator-protection'
import { isUpsellError, pricingLimitToUpsellContext } from '@/lib/pricing/v3/errors'
import { PricingLimitError } from '@/lib/pricing/v3/limits'
import { PRICING_V3 } from '@/lib/pricing/v3/constants'

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
      return NextResponse.json({ error: '브랜드�� 찾을 수 없습니다' }, { status: 404 })
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
      return NextResponse.json({ error: '공구 초대 시 캠페인을 선택해주세���' }, { status: 400 })
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

    // 플랜 확인
    const subscription = await prisma.brandSubscription.findUnique({ where: { brandId: brand.id } })
    const v3 = isV3Plan(subscription)

    // v2: 구독 체크
    let subCheck: { ok: boolean; plan: string; currentUsed: number; quota: number; reason?: string } | null = null
    if (!v3) {
      subCheck = await canSendMessage(brand.id)
      if (!subCheck.ok) {
        return NextResponse.json(
          { error: '구독이 필요합니다', reason: subCheck.reason, currentPlan: subCheck.plan, currentUsed: subCheck.currentUsed, quota: subCheck.quota, upgradeUrl: '/brand/settings/subscription' },
          { status: 402 },
        )
      }
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
      noSubscription: v3 ? false : !subCheck?.ok,
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

      if (v3 && subscription) {
        const sub = subscription
        const planV3 = sub.planV3
        let monthlyLimit: number | null = null
        let used = 0
        let remaining = Infinity

        if (planV3 === 'TRIAL') {
          monthlyLimit = PRICING_V3.TRIAL.INCLUDED_MESSAGES
          used = sub.trialUsedMessages ?? 0
          remaining = Math.max(0, monthlyLimit - used)
        } else if (planV3 === 'STANDARD') {
          monthlyLimit = PRICING_V3.STANDARD.MESSAGE_MONTHLY_LIMIT
          used = sub.currentMonthMessages ?? 0
          remaining = Math.max(0, monthlyLimit - used)
        } else if (planV3 === 'PRO') {
          monthlyLimit = PRICING_V3.PRO.INCLUDED_MESSAGES_MONTHLY
          used = sub.currentMonthMessages ?? 0
          remaining = Infinity
        }

        const canSendCount = Math.min(totalCount, remaining === Infinity ? totalCount : remaining)
        const blocked = totalCount - canSendCount

        return NextResponse.json({
          mode: 'v3',
          requested: totalCount,
          canSend: canSendCount,
          blocked,
          monthlyLimit,
          used,
          remaining: remaining === Infinity ? null : remaining,
          overageUnitPrice: planV3 === 'PRO' ? PRICING_V3.PRO.OVERAGE_MESSAGE_PRICE : null,
          estimatedCost: planV3 === 'PRO' && used + canSendCount > (monthlyLimit ?? 0)
            ? Math.max(0, used + canSendCount - (monthlyLimit ?? 0)) * PRICING_V3.PRO.OVERAGE_MESSAGE_PRICE
            : 0,
          channelBreakdown,
          blockers,
          skipped: existingSet.size,
        })
      }

      const freeRemaining = Math.max(0, (subCheck?.quota ?? 0) - (subCheck?.currentUsed ?? 0))
      const freeCount = Math.min(totalCount, freeRemaining)
      const paidCount = Math.max(0, totalCount - freeCount)

      return NextResponse.json({
        mode: 'v2',
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
      status?: 'SENT' | 'BLOCKED_LIMIT' | 'PROTECTED' | 'FAILED'
    }> = []
    let upsellContext: Record<string, unknown> | null = null

    const now = new Date()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cnecshop.com'
    const acceptUrl = `${siteUrl}/creator/proposals`
    const campaignName = campaignId
      ? (await prisma.campaign.findUnique({ where: { id: campaignId }, select: { title: true } }))?.title ?? ''
      : ''

    for (const c of reachableCreators) {
      try {
        // v3 크리에이터 보호 체크
        if (v3) {
          try {
            await checkCreatorProtection(brand.id, c.id)
          } catch (err) {
            if (isUpsellError(err)) throw err
            continue // PricingLimitError → 스킵
          }
        }

        const channels = getCreatorChannels(c)
        const attemptedChannels: string[] = []
        const succeededChannels: string[] = []
        const useDm = useDmFlag && brandIgLinked && channels.dm

        if (channels.inApp) attemptedChannels.push('IN_APP')
        if (channels.email) attemptedChannels.push('EMAIL')
        if (channels.kakao) attemptedChannels.push('KAKAO')
        if (useDm) attemptedChannels.push('DM')

        // 메시지 과금 (v3/v2 분기)
        let credit: { creditId: string; type: string; cost: number }
        if (v3) {
          try {
            await chargeMessageSendV3(brand.id, c.id)
          } catch (err) {
            if (isUpsellError(err)) throw err
            if (err instanceof PricingLimitError) {
              const ctx = pricingLimitToUpsellContext(err.code, err.message)
              if (ctx) { upsellContext = ctx; break }
            }
            throw err
          }
          const mc = await prisma.messageCredit.create({
            data: { brandId: brand.id, type: 'SUBSCRIPTION_FREE', cost: 0, pricePerMessage: 0, attemptedChannels, succeededChannels, creatorId: c.id },
          })
          credit = { creditId: mc.id, type: 'SUBSCRIPTION_FREE', cost: 0 }
        } else {
          credit = await consumeMessageCredit(brand.id, null, c.id, attemptedChannels, succeededChannels)
        }

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
            emailStatus: channels.email ? 'PENDING' : 'SKIPPED',
            kakaoStatus: channels.kakao ? 'PENDING' : 'SKIPPED',
            dmStatus: useDm ? 'PENDING' : 'SKIPPED',
          },
        })

        // 템플릿 빌드
        const template = type === 'GONGGU'
          ? proposalGongguInviteMessage({
              creatorName: c.displayName ?? '크리에이터',
              brandName: brand.brandName ?? '브랜드',
              campaignName,
              commissionRate: commissionRate ?? undefined,
              messageBody: message || undefined,
              acceptUrl,
            })
          : proposalProductPickMessage({
              creatorName: c.displayName ?? '��리에이터',
              brandName: brand.brandName ?? '브랜드',
              productName: campaignName,
              commissionRate: commissionRate ?? undefined,
              messageBody: message || undefined,
              acceptUrl,
            })

        const channelResults: Record<string, string> = {}

        // Promise.allSettled for parallel channel sends
        const tasks: Promise<void>[] = []

        // IN_APP
        if (channels.inApp) {
          tasks.push(
            sendNotification({
              userId: c.userId,
              type: template.inApp.type,
              title: template.inApp.title,
              message: template.inApp.message,
              linkUrl: template.inApp.linkUrl,
            })
              .then(() => {
                succeededChannels.push('IN_APP')
                channelResults.inApp = 'SENT'
                return prisma.creatorProposal.update({
                  where: { id: proposal.id },
                  data: { inAppStatus: 'SENT', inAppSentAt: now },
                }).then(() => {})
              })
              .catch(() => {
                channelResults.inApp = 'FAILED'
                prisma.creatorProposal.update({
                  where: { id: proposal.id },
                  data: { inAppStatus: 'FAILED' },
                }).catch(() => {})
              }),
          )
        }

        // EMAIL: Naver Works SMTP
        if (channels.email && c.brandContactEmail) {
          tasks.push(
            withRetry(
              () => sendEmail({
                to: c.brandContactEmail!,
                subject: template.email.subject,
                html: template.email.html,
              }),
              3,
              1000,
            )
              .then((result) => {
                if (result.success) {
                  succeededChannels.push('EMAIL')
                  channelResults.email = 'SENT'
                  return prisma.creatorProposal.update({
                    where: { id: proposal.id },
                    data: { emailStatus: 'SENT', emailSentAt: now },
                  }).then(() => {})
                } else {
                  channelResults.email = 'FAILED'
                  return prisma.creatorProposal.update({
                    where: { id: proposal.id },
                    data: { emailStatus: 'FAILED' },
                  }).then(() => {})
                }
              })
              .catch(() => {
                channelResults.email = 'FAILED'
                prisma.creatorProposal.update({
                  where: { id: proposal.id },
                  data: { emailStatus: 'FAILED' },
                }).catch(() => {})
              }),
          )
        }

        // KAKAO: 팝빌 알림톡
        if (channels.kakao) {
          tasks.push(
            (async () => {
              const creatorPhone = await prisma.creator.findUnique({
                where: { id: c.id },
                select: { phoneForAlimtalk: true },
              })
              if (!creatorPhone?.phoneForAlimtalk) return
              const kakaoResult = await withRetry(
                () => sendKakaoAlimtalk({
                  templateCode: template.kakao.templateCode,
                  receiverNum: creatorPhone.phoneForAlimtalk!,
                  receiverName: c.displayName ?? '크리에이터',
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
            })().catch(() => {
              channelResults.kakao = 'FAILED'
              prisma.creatorProposal.update({
                where: { id: proposal.id },
                data: { kakaoStatus: 'FAILED' },
              }).catch(() => {})
            }),
          )
        }

        // DM
        if (useDm && c.igUsername) {
          tasks.push(
            prisma.dmSendQueue.create({
              data: {
                brandId: brand.id,
                creatorId: c.id,
                proposalId: proposal.id,
                instagramUsername: c.igUsername,
                messageBody:
                  message ||
                  `${brand.brandName ?? '브��드'}에서 ${type === 'GONGGU' ? '공구' : '상품 추천'} ���대를 보냈습니다.`,
                status: 'PENDING',
                brandInstagramAccount: brand.brandInstagramHandle,
              },
            })
              .then(() => {
                succeededChannels.push('DM')
                channelResults.dm = 'QUEUED'
                return prisma.creatorProposal.update({
                  where: { id: proposal.id },
                  data: { dmStatus: 'SENT', dmQueuedAt: now },
                }).then(() => {})
              })
              .catch(() => {
                channelResults.dm = 'FAILED'
              }),
          )
        }

        await Promise.allSettled(tasks)

        // succeededChannels 업데이트
        await prisma.messageCredit.update({
          where: { id: credit.creditId },
          data: {
            succeededChannels,
            proposalId: proposal.id,
          },
        })

        if (v3) {
          incrementCreatorProposalCount(c.id).catch(err => console.error('[incrementCreatorProposalCount]', err))
        }

        results.push({
          creatorId: c.id,
          proposalId: proposal.id,
          creditType: credit.type,
          cost: credit.cost,
          channelResults,
          status: 'SENT',
        })
      } catch (err) {
        if (isUpsellError(err)) { upsellContext = err.toJSON(); break }
        // 개별 크리에이터 실패 시 건너뛰기
      }
    }

    // 리포트 메일 (fire-and-forget)
    const channelSummary: Record<string, number> = {}
    for (const r of results) {
      for (const [ch, st] of Object.entries(r.channelResults)) {
        if (st === 'SENT' || st === 'QUEUED') {
          channelSummary[ch] = (channelSummary[ch] || 0) + 1
        }
      }
    }
    const totalPaidCost = results.reduce((sum, r) => sum + r.cost, 0)
    const paidResults = results.filter(r => r.creditType === 'PAID')

    // Fetch brand contact email for report
    const brandForReport = await prisma.brand.findUnique({
      where: { id: brand.id },
      select: { contactEmail: true },
    })
    if (brandForReport?.contactEmail) {
      const report = bulkSendReportMessage({
        brandName: brand.brandName ?? '브랜드',
        sentCount: results.length,
        failedCount: reachableCreators.length - results.length,
        channelBreakdown: channelSummary,
        paidCount: paidResults.length,
        paidAmount: totalPaidCost,
        reportLink: `${siteUrl}/brand/creators/proposals`,
      })
      if (report.email) {
        sendEmail({
          to: brandForReport.contactEmail,
          subject: report.email.subject,
          html: report.email.html,
        }).catch(err => console.error('[bulk-report-email]', err))
      }
    }

    const sentCount = results.filter(r => r.status === 'SENT').length

    if (upsellContext) {
      return NextResponse.json(
        { partial: true, created: sentCount, skipped: existingSet.size, unreachable: channelBreakdown.unreachable, results, upsell: upsellContext },
        { status: 402 },
      )
    }

    return NextResponse.json({
      created: sentCount || results.length,
      skipped: existingSet.size,
      unreachable: channelBreakdown.unreachable,
      results,
    })
  } catch (error) {
    console.error('일괄 초대 발송 오류:', error)
    return NextResponse.json({ error: '일괄 초대 발송 중 오류가 발생했습니다' }, { status: 500 })
  }
}
