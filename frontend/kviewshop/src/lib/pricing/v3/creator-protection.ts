import { prisma } from '@/lib/db'
import { CREATOR_PROTECTION } from './constants'
import { LIMIT_MESSAGES } from './labels'
import { PricingLimitError } from './limits'

export async function checkCreatorProtection(
  brandId: string,
  creatorId: string,
  matchScore?: number,
): Promise<void> {
  const creator = await prisma.creator.findUnique({ where: { id: creatorId } })
  if (!creator) throw new Error('크리에이터를 찾을 수 없어요')

  // 1. 수신 토글
  if (!creator.acceptingProposals) {
    throw new PricingLimitError(LIMIT_MESSAGES.CREATOR_NOT_ACCEPTING, 'CREATOR_NOT_ACCEPTING')
  }

  // 2. 월 수신 상한
  if (creator.currentMonthProposals >= creator.monthlyProposalLimit) {
    throw new PricingLimitError(LIMIT_MESSAGES.CREATOR_MONTHLY_LIMIT, 'CREATOR_MONTHLY_LIMIT')
  }

  // 3. 90일 쿨다운
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - CREATOR_PROTECTION.REPROPOSAL_COOLDOWN_DAYS)
  const recent = await prisma.creatorProposal.findFirst({
    where: { brandId, creatorId, createdAt: { gte: cutoff } },
  })
  if (recent) {
    throw new PricingLimitError(LIMIT_MESSAGES.REPROPOSAL_COOLDOWN, 'REPROPOSAL_COOLDOWN')
  }

  // 4. 매칭 점수 게이팅
  if (matchScore !== undefined && matchScore < CREATOR_PROTECTION.MIN_MATCH_SCORE_TO_SEND) {
    throw new PricingLimitError(LIMIT_MESSAGES.LOW_MATCH_SCORE, 'LOW_MATCH_SCORE')
  }
}

export async function incrementCreatorProposalCount(creatorId: string): Promise<void> {
  await prisma.creator.update({
    where: { id: creatorId },
    data: { currentMonthProposals: { increment: 1 } },
  })
}
