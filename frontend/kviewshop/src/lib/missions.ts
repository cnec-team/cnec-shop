import { prisma } from './db'
import { awardPoints } from './points'

const MISSION_REWARDS: Record<string, number> = {
  SHOP_OPEN: 0,
  FIRST_PRODUCT: 1000,
  SNS_SHARE: 1000,
  FIVE_PRODUCTS: 2000,
  FIRST_SALE: 5000,
}

const MISSION_KEYS = ['SHOP_OPEN', 'FIRST_PRODUCT', 'SNS_SHARE', 'FIVE_PRODUCTS', 'FIRST_SALE'] as const

/**
 * Ensure all missions exist for a creator (idempotent).
 */
export async function initCreatorMissions(creatorId: string) {
  for (const key of MISSION_KEYS) {
    const existing = await prisma.creatorMission.findFirst({
      where: { creatorId, missionKey: key },
    })
    if (!existing) {
      await prisma.creatorMission.create({
        data: {
          creatorId,
          missionKey: key,
          isCompleted: key === 'SHOP_OPEN', // SHOP_OPEN is auto-completed
          completedAt: key === 'SHOP_OPEN' ? new Date() : null,
          rewardAmount: MISSION_REWARDS[key] ?? 0,
          rewardClaimed: false,
        },
      })
    }
  }
}

/**
 * Check and complete a mission, awarding points if applicable.
 */
export async function checkAndCompleteMission(creatorId: string, missionKey: string) {
  const mission = await prisma.creatorMission.findFirst({
    where: { creatorId, missionKey },
  })

  if (!mission) return { success: false, error: 'Mission not found' }
  if (mission.isCompleted) return { success: true, alreadyCompleted: true }

  await prisma.creatorMission.update({
    where: { id: mission.id },
    data: { isCompleted: true, completedAt: new Date() },
  })

  if (mission.rewardAmount > 0 && !mission.rewardClaimed) {
    const pointType: Record<string, string> = {
      FIRST_PRODUCT: 'FIRST_PRODUCT',
      SNS_SHARE: 'WEEKLY_ACTIVE',
      FIVE_PRODUCTS: 'MONTHLY_TARGET',
      FIRST_SALE: 'FIRST_SALE',
    }

    const type = pointType[missionKey] || 'ADMIN_ADJUST'
    await awardPoints(creatorId, type, `30일 미션: ${missionKey}`, mission.id)

    await prisma.creatorMission.update({
      where: { id: mission.id },
      data: { rewardClaimed: true },
    })
  }

  return { success: true, reward: mission.rewardAmount }
}
