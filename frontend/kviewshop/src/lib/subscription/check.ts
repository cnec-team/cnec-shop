import { prisma } from '@/lib/db'
import { SUBSCRIPTION_PLANS, MESSAGE_PRICE_KRW } from './plans'
import type { SubscriptionPlan } from '@/generated/prisma/client'

interface CanSendResult {
  ok: boolean
  plan: SubscriptionPlan
  currentUsed: number
  quota: number
  reason?: string
}

export async function canSendMessage(brandId: string): Promise<CanSendResult> {
  const subscription = await prisma.brandSubscription.findUnique({
    where: { brandId },
  })

  if (!subscription || subscription.status !== 'ACTIVE') {
    return {
      ok: false,
      plan: 'FREE',
      currentUsed: 0,
      quota: 0,
      reason: 'NO_SUBSCRIPTION',
    }
  }

  if (subscription.plan === 'FREE') {
    return {
      ok: false,
      plan: 'FREE',
      currentUsed: subscription.currentMonthUsed,
      quota: subscription.includedMessageQuota,
      reason: 'NO_SUBSCRIPTION',
    }
  }

  // 쿼터 내이든 초과이든 발송 가능 (초과 시 건별 과금)
  return {
    ok: true,
    plan: subscription.plan,
    currentUsed: subscription.currentMonthUsed,
    quota: subscription.includedMessageQuota,
  }
}

interface ConsumeResult {
  creditId: string
  type: 'SUBSCRIPTION_FREE' | 'PAID'
  cost: number
}

export async function consumeMessageCredit(
  brandId: string,
  proposalId: string | null,
  creatorId: string,
  attemptedChannels: string[],
  succeededChannels: string[],
): Promise<ConsumeResult> {
  const subscription = await prisma.brandSubscription.findUnique({
    where: { brandId },
  })

  if (!subscription || subscription.plan === 'FREE') {
    throw new Error('구독이 필요합니다')
  }

  const withinQuota = subscription.currentMonthUsed < subscription.includedMessageQuota
  const creditType = withinQuota ? 'SUBSCRIPTION_FREE' : 'PAID'
  const cost = withinQuota ? 0 : MESSAGE_PRICE_KRW

  const [credit] = await prisma.$transaction([
    prisma.messageCredit.create({
      data: {
        brandId,
        proposalId,
        type: creditType,
        cost,
        pricePerMessage: MESSAGE_PRICE_KRW,
        attemptedChannels,
        succeededChannels,
        creatorId,
      },
    }),
    prisma.brandSubscription.update({
      where: { brandId },
      data: {
        currentMonthUsed: { increment: 1 },
      },
    }),
  ])

  return {
    creditId: credit.id,
    type: creditType,
    cost: Number(credit.cost),
  }
}

export async function resetMonthlyQuota(brandId: string): Promise<void> {
  await prisma.brandSubscription.update({
    where: { brandId },
    data: {
      currentMonthUsed: 0,
      currentMonthResetAt: new Date(),
    },
  })
}
