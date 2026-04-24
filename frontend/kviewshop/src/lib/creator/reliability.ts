import type { PrismaClient } from '@/generated/prisma/client'

/**
 * 크리에이터 신뢰도 점수 v1 계산
 * 공식: 협업 완료율 = cnecCompletedPayments / cnecTotalTrials
 * 범위: 0.0000 ~ 1.0000
 *
 * 향후 v2: 협업완료율 × 0.5 + 납기준수율 × 0.5
 * 향후 v3: 협업완료율 × 0.4 + 납기준수율 × 0.4 + 재협업의향률 × 0.2
 */
export function calculateReliabilityScoreV1(
  completedPayments: number | null | undefined,
  totalTrials: number | null | undefined
): number | null {
  const completed = completedPayments ?? 0
  const trials = totalTrials ?? 0
  if (trials === 0) return null
  const score = completed / trials
  return Math.max(0, Math.min(1, score))
}

/**
 * 0~1 점수 → 별점 숫자(0.0~5.0, 소수점 1자리)
 * 표시 예: 4.2점, 5.0점
 */
export function scoreToStarValue(score: number | null): number | null {
  if (score === null || score === undefined) return null
  const s = Math.max(0, Math.min(1, Number(score)))
  return Math.round(s * 50) / 10
}

/**
 * 별점 표시 여부 판단
 * 조건: cnecIsPartner=true AND cnecTotalTrials>0 AND completedPayments>0
 */
export function shouldShowStarRating(
  isPartner: boolean | null | undefined,
  totalTrials: number | null | undefined,
  completedPayments: number | null | undefined
): boolean {
  return Boolean(isPartner) && (totalTrials ?? 0) > 0 && (completedPayments ?? 0) > 0
}

/**
 * DM 발송 가능 여부
 * 조건: igUsername이 존재하고 비어있지 않음
 */
export function canSendDM(igUsername: string | null | undefined): boolean {
  return !!igUsername && igUsername.trim().length > 0
}

/**
 * 종합 연락 가능 여부
 */
export function isContactable(creator: {
  igUsername?: string | null
  cnecEmail1?: string | null
  cnecEmail2?: string | null
  cnecEmail3?: string | null
  cnecPhone?: string | null
  cnecVerificationStatus?: string | null
}): boolean {
  return canSendDM(creator.igUsername) ||
    canSendEmail(creator.cnecEmail1, creator.cnecEmail2, creator.cnecEmail3) ||
    canSendAlimtalk(creator.cnecPhone, creator.cnecVerificationStatus)
}

/**
 * 알림톡 발송 가능 여부
 * 조건: cnecPhone 존재 AND cnecVerificationStatus가 인증 완료 상태
 */
export function canSendAlimtalk(
  phone: string | null | undefined,
  verificationStatus: string | null | undefined
): boolean {
  if (!phone || phone.trim() === '') return false
  return verificationStatus === 'VERIFIED' || verificationStatus === 'COMPLETED'
}

/**
 * 이메일 발송 가능 여부
 * 조건: cnecEmail1, cnecEmail2, cnecEmail3 중 하나라도 유효한 이메일 형식
 */
export function canSendEmail(
  email1: string | null | undefined,
  email2: string | null | undefined,
  email3: string | null | undefined
): boolean {
  const emails = [email1, email2, email3].filter(Boolean)
  if (emails.length === 0) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emails.some(e => emailRegex.test(e!))
}

/**
 * cnecTotalTrials 또는 cnecCompletedPayments 업데이트 시 호출
 */
export async function recalculateAndUpdateReliability(
  prismaClient: PrismaClient,
  creatorId: string
): Promise<number | null> {
  const creator = await prismaClient.creator.findUnique({
    where: { id: creatorId },
    select: { cnecTotalTrials: true, cnecCompletedPayments: true },
  })
  if (!creator) return null
  const score = calculateReliabilityScoreV1(
    creator.cnecCompletedPayments,
    creator.cnecTotalTrials
  )
  await prismaClient.creator.update({
    where: { id: creatorId },
    data: { cnecReliabilityScore: score },
  })
  return score
}
