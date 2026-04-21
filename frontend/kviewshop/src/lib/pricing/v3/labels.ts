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
  QUARTERLY: '3개월',
  ANNUAL: '1년',
}

export const BILLING_CYCLE_DESCRIPTIONS: Record<ProBillingCycle, string> = {
  QUARTERLY: '3개월마다 자동 결제',
  ANNUAL: '1년에 한 번 결제하고 20% 할인받기',
}

export const LIMIT_MESSAGES = {
  TRIAL_CAMPAIGN_EXCEEDED: '체험은 공동구매 1번까지 열 수 있어요. 더 열고 싶다면 스탠다드로 바꿔주세요.',
  TRIAL_MESSAGE_EXCEEDED: '체험에서 보낼 수 있는 메시지를 모두 쓰셨어요. 스탠다드로 바꾸면 계속 보낼 수 있어요.',
  TRIAL_DETAIL_VIEW_EXCEEDED: '체험에서 열어볼 수 있는 상세정보를 모두 쓰셨어요.',
  STANDARD_INSUFFICIENT_BALANCE: '잔액이 부족해요. 충전하시면 바로 이어서 쓸 수 있어요.',
  DAILY_DB_LIMIT_TRIAL: '오늘은 30명까지 보셨어요. 내일 자정에 다시 30명을 볼 수 있어요.',
  DAILY_DB_LIMIT_STANDARD: '오늘은 100명까지 보셨어요. 무제한으로 보고 싶다면 프로로 바꿔주세요.',
  DETAIL_VIEW_OVERAGE: '이번 달 무료 100번을 모두 쓰셨어요. 지금부터는 1번 열어볼 때마다 100원이 차감돼요.',
  CREATOR_DB_EXPORT_BLOCKED: '크리에이터 검색 결과는 크넥의 자산이라 엑셀로 내려받을 수 없어요. 메시지로 크리에이터와 소통해주세요.',
  GROUP_EXPORT_BLOCKED: '그룹에 저장한 크리에이터도 엑셀로 내려받을 수 없어요. 모든 플랜에서 동일해요.',
  CAMPAIGN_PARTICIPANT_EXPORT_PRO_ONLY: '캠페인 참여자 엑셀은 프로 플랜에서 쓸 수 있어요.',
  RAPID_DETAIL_VIEW_WARNING: '짧은 시간에 너무 많이 열어보셨어요. 잠시 후에 다시 시도해주세요.',
  MASS_GROUP_ADD_BLOCKED: '시간당 300명까지 그룹에 추가할 수 있어요.',
  REPROPOSAL_COOLDOWN: '이 크리에이터에게는 90일에 한 번만 메시지를 보낼 수 있어요.',
  CREATOR_NOT_ACCEPTING: '이 크리에이터는 지금 새 제안을 받지 않고 있어요.',
  CREATOR_MONTHLY_LIMIT: '이 크리에이터는 이번 달 제안을 모두 받으셨어요. 다음 달에 다시 보낼 수 있어요.',
  LOW_MATCH_SCORE: '매칭 점수가 70점 미만이에요. 더 잘 맞는 크리에이터를 추천해드릴게요.',
} as const
