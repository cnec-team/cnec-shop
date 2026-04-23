import { prisma } from '@/lib/db'
import { PRICING_V3 } from './constants'
import { LIMIT_MESSAGES } from './labels'
import { resolveBrandPlan } from './plan-resolver'
import { PricingLimitError } from './limits'
import { UpsellRequiredError } from './errors'

export async function chargeCampaignCreation(
  brandId: string,
  campaignId: string,
): Promise<void> {
  const subscription = await prisma.brandSubscription.findUnique({ where: { brandId } })
  const plan = resolveBrandPlan(subscription)

  if (plan.version !== 'v3') return // v2는 기존 로직 사용

  // RESTRICTED / DEACTIVATED 차단
  if (subscription?.status === 'RESTRICTED' || subscription?.status === 'DEACTIVATED') {
    throw new UpsellRequiredError({
      reason: 'RESTRICTED_MODE',
      currentPlan: 'TRIAL',
      suggestedPlan: 'STANDARD',
      restrictedUntil: subscription.restrictedUntil?.toISOString(),
    })
  }

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
      throw new UpsellRequiredError({
        reason: 'CAMPAIGN_LIMIT_REACHED',
        currentPlan: 'STANDARD',
        suggestedPlan: 'PRO',
        limit: PRICING_V3.STANDARD.CAMPAIGN_MONTHLY_LIMIT,
        used,
        resetAt: subscription?.currentMonthResetAt?.toISOString(),
      })
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
