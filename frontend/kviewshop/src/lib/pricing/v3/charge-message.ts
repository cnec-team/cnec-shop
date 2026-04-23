import { prisma } from '@/lib/db'
import { PRICING_V3 } from './constants'
import { LIMIT_MESSAGES } from './labels'
import { resolveBrandPlan } from './plan-resolver'
import { PricingLimitError } from './limits'

export async function chargeMessageSendV3(
  brandId: string,
  _creatorId: string,
  _proposalId?: string,
): Promise<void> {
  const subscription = await prisma.brandSubscription.findUnique({ where: { brandId } })
  const plan = resolveBrandPlan(subscription)

  if (plan.version !== 'v3') {
    throw new Error('v3 과금 함수는 v3 플랜에서만 호출')
  }

  // RESTRICTED / DEACTIVATED 차단
  if (subscription?.status === 'RESTRICTED' || subscription?.status === 'DEACTIVATED') {
    throw new PricingLimitError(LIMIT_MESSAGES.SUBSCRIPTION_REQUIRED, 'SUBSCRIPTION_REQUIRED')
  }

  if (plan.planV3 === 'TRIAL') {
    const used = subscription?.trialUsedMessages ?? 0
    if (used >= PRICING_V3.TRIAL.INCLUDED_MESSAGES) {
      throw new PricingLimitError(
        LIMIT_MESSAGES.TRIAL_MESSAGE_EXCEEDED,
        'TRIAL_MESSAGE_EXCEEDED',
      )
    }
    await prisma.brandSubscription.update({
      where: { brandId },
      data: { trialUsedMessages: { increment: 1 } },
    })
    return
  }

  if (plan.planV3 === 'STANDARD') {
    const used = subscription?.currentMonthMessages ?? 0
    if (used >= PRICING_V3.STANDARD.MESSAGE_MONTHLY_LIMIT) {
      throw new PricingLimitError(
        LIMIT_MESSAGES.STANDARD_MESSAGE_LIMIT_REACHED,
        'STANDARD_MESSAGE_LIMIT_REACHED',
      )
    }
    await prisma.brandSubscription.update({
      where: { brandId },
      data: { currentMonthMessages: { increment: 1 } },
    })
    return
  }

  if (plan.planV3 === 'PRO') {
    const used = subscription?.currentMonthMessages ?? 0
    if (used < PRICING_V3.PRO.INCLUDED_MESSAGES_MONTHLY) {
      await prisma.brandSubscription.update({
        where: { brandId },
        data: { currentMonthMessages: { increment: 1 } },
      })
    } else {
      // 초과분 ₩700 누적
      await prisma.brandSubscription.update({
        where: { brandId },
        data: {
          currentMonthMessages: { increment: 1 },
          currentMonthOverageAmount: { increment: PRICING_V3.PRO.OVERAGE_MESSAGE_PRICE },
        },
      })
    }
  }
}
