import type { BrandSubscription, BrandPlanV3, SubscriptionPlan } from '@/generated/prisma/client'

export type ResolvedPlan =
  | { version: 'v2'; legacyPlan: SubscriptionPlan }
  | { version: 'v3'; planV3: BrandPlanV3; proExpired: boolean }

export function resolveBrandPlan(subscription: BrandSubscription | null): ResolvedPlan {
  if (subscription?.planV3) {
    const now = new Date()

    // 프로 만료 실시간 체크
    if (
      subscription.planV3 === 'PRO' &&
      subscription.proExpiresAt &&
      subscription.proExpiresAt < now
    ) {
      return { version: 'v3', planV3: 'STANDARD', proExpired: true }
    }

    return { version: 'v3', planV3: subscription.planV3, proExpired: false }
  }

  if (subscription) {
    return { version: 'v2', legacyPlan: subscription.plan }
  }

  // 구독 없는 신규 브랜드 → TRIAL
  return { version: 'v3', planV3: 'TRIAL', proExpired: false }
}

export function isV3Plan(subscription: BrandSubscription | null): boolean {
  return resolveBrandPlan(subscription).version === 'v3'
}
