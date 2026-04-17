import type { SubscriptionPlan } from '@/generated/prisma/client'

export interface PlanConfig {
  monthlyFee: number
  includedQuota: number
  label: string
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlan, PlanConfig> = {
  FREE: { monthlyFee: 0, includedQuota: 0, label: '무료' },
  STARTER: { monthlyFee: 500000, includedQuota: 100, label: '스타터' },
  PRO: { monthlyFee: 1000000, includedQuota: 300, label: '프로' },
  ENTERPRISE: { monthlyFee: 2000000, includedQuota: 1000, label: '엔터프라이즈' },
} as const

export const MESSAGE_PRICE_KRW = 500
