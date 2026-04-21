/**
 * @deprecated v2 레거시 가격 정책. 신규 기능은 lib/pricing/v3/ 사용.
 * 이 파일은 FREE/STARTER/PRO(v2)/ENTERPRISE 가입자 지원용으로 유지됨.
 * 2026-Q3 이후 제거 예정.
 */
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
  // v3 enum 값 (v2 Record 타입 호환용, 실제 v3 로직은 lib/pricing/v3/ 사용)
  TRIAL: { monthlyFee: 0, includedQuota: 0, label: '체험' },
  STANDARD: { monthlyFee: 0, includedQuota: 0, label: '스탠다드' },
} as const

export const MESSAGE_PRICE_KRW = 500
