import { prisma } from './db'

const POINT_AMOUNTS: Record<string, number> = {
  SIGNUP_BONUS: 3000,
  PERSONA_COMPLETE: 2000,
  FIRST_PRODUCT: 1000,
  FIRST_SALE: 5000,
  REFERRAL_INVITE: 5000,
  REFERRAL_SALE: 3000,
  WEEKLY_ACTIVE: 1000,
}

function getPointAmount(type: string): number {
  return POINT_AMOUNTS[type] ?? 0
}

/**
 * Award points to a creator (Prisma transaction version).
 * Deduplicates by (creatorId, pointType, relatedId).
 */
export async function awardPoints(
  creatorId: string,
  pointType: string,
  description?: string,
  relatedId?: string,
): Promise<{ success: boolean; balance?: number; error?: string }> {
  // Dedup check
  if (relatedId) {
    const existing = await prisma.creatorPoint.findFirst({
      where: { creatorId, pointType, relatedId },
    })
    if (existing) return { success: true }
  } else {
    const oneTimeTypes = ['SIGNUP_BONUS', 'PERSONA_COMPLETE', 'FIRST_PRODUCT', 'FIRST_SALE']
    if (oneTimeTypes.includes(pointType)) {
      const existing = await prisma.creatorPoint.findFirst({
        where: { creatorId, pointType },
      })
      if (existing) return { success: true }
    }
  }

  const amount = getPointAmount(pointType)
  if (amount === 0) {
    return { success: false, error: 'Unknown point type' }
  }

  return prisma.$transaction(async (tx) => {
    const lastPoint = await tx.creatorPoint.findFirst({
      where: { creatorId },
      orderBy: { createdAt: 'desc' },
      select: { balanceAfter: true },
    })

    const currentBalance = Number(lastPoint?.balanceAfter ?? 0)
    const newBalance = currentBalance + amount

    await tx.creatorPoint.create({
      data: {
        creatorId,
        pointType,
        amount,
        balanceAfter: newBalance,
        description: description ?? null,
        relatedId: relatedId ?? null,
      },
    })

    return { success: true, balance: newBalance }
  })
}

/**
 * Award arbitrary amount (e.g. withdrawals with negative amount).
 */
export async function awardPointsRaw(
  creatorId: string,
  pointType: string,
  amount: number,
  description?: string,
  relatedId?: string,
): Promise<{ success: boolean; balance?: number; error?: string }> {
  return prisma.$transaction(async (tx) => {
    const lastPoint = await tx.creatorPoint.findFirst({
      where: { creatorId },
      orderBy: { createdAt: 'desc' },
      select: { balanceAfter: true },
    })

    const currentBalance = Number(lastPoint?.balanceAfter ?? 0)
    const newBalance = currentBalance + amount

    if (amount < 0 && newBalance < 0) {
      return { success: false, error: 'Insufficient balance' }
    }

    await tx.creatorPoint.create({
      data: {
        creatorId,
        pointType,
        amount,
        balanceAfter: newBalance,
        description: description ?? null,
        relatedId: relatedId ?? null,
      },
    })

    return { success: true, balance: newBalance }
  })
}
