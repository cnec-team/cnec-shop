import { prisma } from '@/lib/db'
import { PRICING_V3 } from './constants'
import { LIMIT_MESSAGES } from './labels'
import { resolveBrandPlan } from './plan-resolver'

export class PricingLimitError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message)
    this.name = 'PricingLimitError'
  }
}

export async function checkDailyDbLimit(brandId: string): Promise<void> {
  const subscription = await prisma.brandSubscription.findUnique({ where: { brandId } })
  const plan = resolveBrandPlan(subscription)

  if (plan.version !== 'v3') return // v2는 제한 없음 (기존 로직)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 날짜가 바뀌었으면 카운터 리셋
  if (subscription?.dailyDbViewedAt && subscription.dailyDbViewedAt < today) {
    await prisma.brandSubscription.update({
      where: { brandId },
      data: { dailyDbViewedAt: new Date(), dailyDbViewedCount: 0 },
    })
    return
  }

  const count = subscription?.dailyDbViewedCount ?? 0

  if (plan.planV3 === 'TRIAL' && count >= PRICING_V3.TRIAL.DAILY_DB_VIEW_LIMIT) {
    throw new PricingLimitError(LIMIT_MESSAGES.DAILY_DB_LIMIT_TRIAL, 'DAILY_DB_LIMIT_TRIAL')
  }

  if (plan.planV3 === 'STANDARD' && count >= PRICING_V3.STANDARD.DAILY_DB_VIEW_LIMIT) {
    throw new PricingLimitError(LIMIT_MESSAGES.DAILY_DB_LIMIT_STANDARD, 'DAILY_DB_LIMIT_STANDARD')
  }

  // PRO는 무제한
}

export async function incrementDailyDbView(brandId: string): Promise<void> {
  await prisma.brandSubscription.update({
    where: { brandId },
    data: {
      dailyDbViewedCount: { increment: 1 },
      dailyDbViewedAt: new Date(),
    },
  })
}
