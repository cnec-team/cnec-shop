import { prisma } from '@/lib/db'
import { ABUSE_DETECTION } from './constants'
import { LIMIT_MESSAGES } from './labels'
import { PricingLimitError } from './limits'

export async function checkRapidDetailView(brandId: string): Promise<void> {
  const oneHourAgo = new Date()
  oneHourAgo.setHours(oneHourAgo.getHours() - 1)

  const recent = await prisma.detailViewLog.count({
    where: { brandId, viewedAt: { gte: oneHourAgo } },
  })

  if (recent >= ABUSE_DETECTION.RAPID_DETAIL_VIEW_PER_HOUR) {
    await prisma.suspiciousActivityLog.create({
      data: {
        brandId,
        activityType: 'RAPID_DETAIL_VIEW',
        detail: { recentViews: recent, threshold: ABUSE_DETECTION.RAPID_DETAIL_VIEW_PER_HOUR },
        severity: 2,
      },
    })
    throw new PricingLimitError(LIMIT_MESSAGES.RAPID_DETAIL_VIEW_WARNING, 'RAPID_DETAIL_VIEW')
  }
}

export async function checkMassGroupAdd(brandId: string, addCount: number): Promise<void> {
  const oneHourAgo = new Date()
  oneHourAgo.setHours(oneHourAgo.getHours() - 1)

  const recent = await prisma.creatorGroupMember.count({
    where: {
      group: { brandId },
      addedAt: { gte: oneHourAgo },
    },
  })

  if (recent + addCount > ABUSE_DETECTION.MASS_GROUP_ADD_PER_HOUR) {
    await prisma.suspiciousActivityLog.create({
      data: {
        brandId,
        activityType: 'MASS_GROUP_ADD',
        detail: { recentAdds: recent, newAdds: addCount },
        severity: 3,
      },
    })
    throw new PricingLimitError(LIMIT_MESSAGES.MASS_GROUP_ADD_BLOCKED, 'MASS_GROUP_ADD')
  }
}