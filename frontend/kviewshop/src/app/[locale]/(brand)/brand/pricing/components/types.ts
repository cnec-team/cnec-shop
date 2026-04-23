export type PlanTier = 'trial' | 'standard' | 'pro'
export type BillingCycle = 'monthly' | 'annual'

export interface PlanFeature {
  label: string
  emphasis?: boolean
}

export interface PlanConfig {
  tier: PlanTier
  name: string
  description: string
  priceMonthly: number
  priceAnnualMonthly?: number
  priceAnnualTotal?: number
  priceAnnualOriginal?: number
  features: PlanFeature[]
  ctaLabel: string
  highlighted?: boolean
}

export const PLAN_CONFIGS: Record<PlanTier, PlanConfig> = {
  trial: {
    tier: 'trial',
    name: '체험',
    description: '3일간 모든 기능 써보기',
    priceMonthly: 0,
    features: [
      { label: '공동구매 1번 열기' },
      { label: '메시지 10번 보내기' },
      { label: '크리에이터 일 30명 보기' },
      { label: '상세정보 30번 열어보기' },
    ],
    ctaLabel: '체험 시작',
  },
  standard: {
    tier: 'standard',
    name: '스탠다드',
    description: '매달 여는 공구와 꾸준한 브랜드를 위해',
    priceMonthly: 99000,
    features: [
      { label: '공동구매 3번 열기 (매달)', emphasis: true },
      { label: '메시지 100번 보내기 (매달)', emphasis: true },
      { label: '크리에이터 일 100명 보기' },
      { label: '상세정보 매달 100번 무료' },
      { label: '캠페인 성과 리포트 (엑셀 포함)' },
      { label: '크넥샵 수수료 10%' },
    ],
    ctaLabel: '스탠다드로 시작하기',
    highlighted: true,
  },
  pro: {
    tier: 'pro',
    name: '프로',
    description: '본격 운영하는 대형 브랜드를 위해',
    priceMonthly: 330000,
    priceAnnualMonthly: 264000,
    priceAnnualTotal: 3168000,
    priceAnnualOriginal: 3960000,
    features: [
      { label: '공동구매 무제한', emphasis: true },
      { label: '메시지 매달 500건 포함 + 초과 ₩700' },
      { label: '크리에이터 무제한 보기' },
      { label: '상세정보 무제한' },
      { label: '캠페인 참여자 엑셀', emphasis: true },
      { label: '피부 타입 매칭 AI' },
      { label: '인스타 DM 자동 발송' },
      { label: '크넥샵 수수료 8% (2%p 할인)', emphasis: true },
    ],
    ctaLabel: '프로로 시작하기',
  },
}
