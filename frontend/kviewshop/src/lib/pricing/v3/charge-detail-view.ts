import { prisma } from '@/lib/db'
import { PRICING_V3 } from './constants'
import { LIMIT_MESSAGES } from './labels'
import { resolveBrandPlan } from './plan-resolver'
import { PricingLimitError } from './limits'

export async function chargeDetailView(brandId: string, creatorId: string): Promise<void> {
  const subscription = await prisma.brandSubscription.findUnique({ where: { brandId } })
  const plan = resolveBrandPlan(subscription)

  if (plan.version !== 'v3') return // v2는 과금 없음

  // 구독 레코드 없으면 과금 불가 — 무과금 통과
  if (!subscription) return

  if (plan.planV3 === 'TRIAL') {
    const used = subscription?.trialUsedDetailViews ?? 0
    if (used >= PRICING_V3.TRIAL.INCLUDED_DETAIL_VIEWS) {
      throw new PricingLimitError(
        LIMIT_MESSAGES.TRIAL_DETAIL_VIEW_EXCEEDED,
        'TRIAL_DETAIL_VIEW_EXCEEDED',
      )
    }
    await prisma.$transaction([
      prisma.brandSubscription.update({
        where: { brandId },
        data: { trialUsedDetailViews: { increment: 1 } },
      }),
      prisma.detailViewLog.create({
        data: {
          brandId,
          creatorId,
          planV3: 'TRIAL',
          isFreeQuota: true,
          chargeAmount: 0,
          subscriptionId: subscription!.id,
        },
      }),
    ])
    return
  }

  if (plan.planV3 === 'STANDARD') {
    const used = subscription?.monthlyDetailViewUsed ?? 0
    if (used < PRICING_V3.STANDARD.DETAIL_VIEW_FREE_QUOTA_MONTHLY) {
      // 무료 분량
      await prisma.$transaction([
        prisma.brandSubscription.update({
          where: { brandId },
          data: { monthlyDetailViewUsed: { increment: 1 } },
        }),
        prisma.detailViewLog.create({
          data: {
            brandId,
            creatorId,
            planV3: 'STANDARD',
            isFreeQuota: true,
            chargeAmount: 0,
            subscriptionId: subscription!.id,
          },
        }),
      ])
    } else {
      // 초과분 ₩100
      const balance = Number(subscription?.prepaidBalance ?? 0)
      if (balance < PRICING_V3.STANDARD.DETAIL_VIEW_OVERAGE_PRICE) {
        throw new PricingLimitError(
          LIMIT_MESSAGES.STANDARD_INSUFFICIENT_BALANCE,
          'INSUFFICIENT_BALANCE',
        )
      }
      await prisma.$transaction([
        prisma.brandSubscription.update({
          where: { brandId },
          data: { prepaidBalance: { decrement: PRICING_V3.STANDARD.DETAIL_VIEW_OVERAGE_PRICE } },
        }),
        prisma.detailViewLog.create({
          data: {
            brandId,
            creatorId,
            planV3: 'STANDARD',
            isFreeQuota: false,
            chargeAmount: PRICING_V3.STANDARD.DETAIL_VIEW_OVERAGE_PRICE,
            subscriptionId: subscription!.id,
          },
        }),
      ])
    }
    return
  }

  if (plan.planV3 === 'PRO') {
    // 무제한
    await prisma.detailViewLog.create({
      data: {
        brandId,
        creatorId,
        planV3: 'PRO',
        isFreeQuota: true,
        chargeAmount: 0,
        subscriptionId: subscription!.id,
      },
    })
  }
}
