import { prisma } from '@/lib/db'
import { PRICING_V3 } from './constants'
import { LIMIT_MESSAGES } from './labels'
import { resolveBrandPlan } from './plan-resolver'
import { PricingLimitError } from './limits'

export async function chargeCampaignCreation(
  brandId: string,
  campaignId: string,
): Promise<void> {
  const subscription = await prisma.brandSubscription.findUnique({ where: { brandId } })
  const plan = resolveBrandPlan(subscription)

  if (plan.version !== 'v3') return // v2는 기존 로직 사용

  if (plan.planV3 === 'TRIAL') {
    const used = subscription?.trialUsedCampaigns ?? 0
    if (used >= PRICING_V3.TRIAL.INCLUDED_CAMPAIGNS) {
      throw new PricingLimitError(LIMIT_MESSAGES.TRIAL_CAMPAIGN_EXCEEDED, 'TRIAL_CAMPAIGN_EXCEEDED')
    }
    await prisma.$transaction([
      prisma.brandSubscription.update({
        where: { brandId },
        data: { trialUsedCampaigns: { increment: 1 } },
      }),
      prisma.campaignChargeLog.create({
        data: {
          brandId,
          campaignId,
          planV3: 'TRIAL',
          chargeAmount: 0,
          subscriptionId: subscription!.id,
        },
      }),
    ])
    return
  }

  if (plan.planV3 === 'STANDARD') {
    const used = subscription?.currentMonthCampaigns ?? 0
    if (used >= PRICING_V3.STANDARD.CAMPAIGN_MONTHLY_LIMIT) {
      throw new PricingLimitError(
        LIMIT_MESSAGES.STANDARD_CAMPAIGN_LIMIT_REACHED,
        'STANDARD_CAMPAIGN_LIMIT_REACHED',
      )
    }
    await prisma.$transaction([
      prisma.brandSubscription.update({
        where: { brandId },
        data: { currentMonthCampaigns: { increment: 1 } },
      }),
      prisma.campaignChargeLog.create({
        data: {
          brandId,
          campaignId,
          planV3: 'STANDARD',
          chargeAmount: 0,
          subscriptionId: subscription!.id,
        },
      }),
    ])
    return
  }

  if (plan.planV3 === 'PRO') {
    // 무제한 — 카운터만 증가 (분석용)
    await prisma.$transaction([
      prisma.brandSubscription.update({
        where: { brandId },
        data: { currentMonthCampaigns: { increment: 1 } },
      }),
      prisma.campaignChargeLog.create({
        data: {
          brandId,
          campaignId,
          planV3: 'PRO',
          chargeAmount: 0,
          subscriptionId: subscription!.id,
        },
      }),
    ])
  }
}
