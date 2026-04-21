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
    const balance = Number(subscription?.prepaidBalance ?? 0)
    if (balance < PRICING_V3.STANDARD.MESSAGE_PRICE) {
      throw new PricingLimitError(
        LIMIT_MESSAGES.STANDARD_INSUFFICIENT_BALANCE,
        'INSUFFICIENT_BALANCE',
      )
    }
    await prisma.brandSubscription.update({
      where: { brandId },
      data: { prepaidBalance: { decrement: PRICING_V3.STANDARD.MESSAGE_PRICE } },
    })
    return
  }

  if (plan.planV3 === 'PRO') {
    const used = subscription?.currentMonthUsed ?? 0
    if (used < PRICING_V3.PRO.INCLUDED_MESSAGES_MONTHLY) {
      await prisma.brandSubscription.update({
        where: { brandId },
        data: { currentMonthUsed: { increment: 1 } },
      })
    } else {
      // 초과분 ₩700 차감
      const balance = Number(subscription?.prepaidBalance ?? 0)
      if (balance < PRICING_V3.PRO.OVERAGE_MESSAGE_PRICE) {
        throw new PricingLimitError(
          LIMIT_MESSAGES.STANDARD_INSUFFICIENT_BALANCE,
          'INSUFFICIENT_BALANCE',
        )
      }
      await prisma.brandSubscription.update({
        where: { brandId },
        data: { prepaidBalance: { decrement: PRICING_V3.PRO.OVERAGE_MESSAGE_PRICE } },
      })
    }
  }
}
