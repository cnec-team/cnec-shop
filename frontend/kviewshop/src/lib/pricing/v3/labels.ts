import type { BrandPlanV3, ProBillingCycle } from '@/generated/prisma/client'

export const PLAN_LABELS: Record<BrandPlanV3, string> = {
  TRIAL: '체험',
  STANDARD: '스탠다드',
  PRO: '프로',
}

export const PLAN_DESCRIPTIONS: Record<BrandPlanV3, string> = {
  TRIAL: '3일 동안 써보기',
  STANDARD: '쓴 만큼만 결제',
  PRO: '매달 공동구매 여는 브랜드를 위해',
}

export const BILLING_CYCLE_LABELS: Record<ProBillingCycle, string> = {
  MONTHLY: '월간',
  ANNUAL: '연간',
}

export const BILLING_CYCLE_DESCRIPTIONS: Record<ProBillingCycle, string> = {
  MONTHLY: '매달 자동 결제',
  ANNUAL: '1년에 한 번 결제하고 20% 할인받기',
}

export const LIMIT_MESSAGES = {
  TRIAL_CAMPAIGN_EXCEEDED: '체험은 공동구매 1번까지 열 수 있어요. 더 열고 싶다면 스탠다드로 바꿔주세요.',
  TRIAL_MESSAGE_EXCEEDED: '체험에서 보낼 수 있는 메시지를 모두 쓰셨어요. 스탠다드로 바꾸면 계속 보낼 수 있어요.',
  TRIAL_DETAIL_VIEW_EXCEEDED: '체험에서 열어볼 수 있는 상세정보를 모두 쓰셨어요.',
  STANDARD_CAMPAIGN_LIMIT_REACHED: '이번 달 공구 캠페인 3개를 모두 사용했어요. 프로 플랜으로 업그레이드하면 무제한으로 사용할 수 있어요.',
  STANDARD_MESSAGE_LIMIT_REACHED: '이번 달 메시지 100건을 모두 사용했어요. 프로 플랜으로 업그레이드하면 월 500건 + 초과분도 사용할 수 있어요.',
  STANDARD_INSUFFICIENT_BALANCE: '잔액이 부족해요. 충전하시면 바로 이어서 쓸 수 있어요.',
  DAILY_DB_LIMIT_TRIAL: '오늘은 30명까지 보셨어요. 내일 자정에 다시 30명을 볼 수 있어요.',
  DAILY_DB_LIMIT_STANDARD: '오늘은 100명까지 보셨어요. 무제한으로 보고 싶다면 프로로 바꿔주세요.',
  DAILY_DB_LIMIT_RESTRICTED: '제한 모드에서는 하루 10명까지 볼 수 있어요. 결제하시면 모든 기능을 다시 사용할 수 있어요.',
  DETAIL_VIEW_OVERAGE: '이번 달 무료 100번을 모두 쓰셨어요. 지금부터는 1번 열어볼 때마다 100원이 차감돼요.',
  RAPID_DETAIL_VIEW_WARNING: '짧은 시간에 너무 많이 열어보셨어요. 잠시 후에 다시 시도해주세요.',
  MASS_GROUP_ADD_BLOCKED: '시간당 300명까지 그룹에 추가할 수 있어요.',
  REPROPOSAL_COOLDOWN: '이 크리에이터에게는 90일에 한 번만 메시지를 보낼 수 있어요.',
  CREATOR_NOT_ACCEPTING: '이 크리에이터는 지금 새 제안을 받지 않고 있어요.',
  CREATOR_MONTHLY_LIMIT: '이 크리에이터는 이번 달 제안을 모두 받으셨어요. 다음 달에 다시 보낼 수 있어요.',
  LOW_MATCH_SCORE: '매칭 점수가 70점 미만이에요. 더 잘 맞는 크리에이터를 추천해드릴게요.',
  SUBSCRIPTION_REQUIRED: '활성 구독이 필요해요. 스탠다드(월 ₩99,000) 또는 프로(월 ₩330,000) 플랜을 선택하세요.',
  ACCOUNT_DEACTIVATED: '계정이 비활성화됐어요. 결제 후 데이터 복구 가능합니다.',
  RESTRICTED_MODE: '체험 기간이 종료됐어요. 결제하시면 모든 기능을 다시 사용할 수 있어요.',
} as const
