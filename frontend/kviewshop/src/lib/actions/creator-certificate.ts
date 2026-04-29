'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

export interface CertificateData {
  creatorName: string
  shopId: string
  thisMonthEarnings: number
  totalEarnings: number
  followerCount: number
  totalOrders: number
  monthsActive: number
}

/**
 * 수익 ��증샷 데이터 조회 (본인 크리에이터만)
 */
export async function getCreatorCertificateData(): Promise<CertificateData | null> {
  const session = await auth()
  if (!session?.user?.id) return null

  const creator = await prisma.creator.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      shopId: true,
      username: true,
      displayName: true,
    },
  })
  if (!creator) return null

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [thisMonthResult, totalResult, followerCount, totalOrders, firstConversion] =
    await Promise.all([
      prisma.conversion.aggregate({
        where: {
          creatorId: creator.id,
          status: 'CONFIRMED',
          createdAt: { gte: thisMonthStart },
        },
        _sum: { commissionAmount: true },
      }),
      prisma.conversion.aggregate({
        where: {
          creatorId: creator.id,
          status: 'CONFIRMED',
        },
        _sum: { commissionAmount: true },
      }),
      prisma.follow.count({ where: { creatorId: creator.id } }),
      prisma.conversion.count({
        where: { creatorId: creator.id, status: 'CONFIRMED' },
      }),
      prisma.conversion.findFirst({
        where: { creatorId: creator.id },
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true },
      }),
    ])

  const monthsActive = firstConversion
    ? Math.max(
        1,
        Math.ceil(
          (now.getTime() - firstConversion.createdAt.getTime()) /
            (1000 * 60 * 60 * 24 * 30)
        )
      )
    : 0

  return {
    creatorName: creator.displayName || creator.username || '크리에이터',
    shopId: creator.shopId || creator.username || '',
    thisMonthEarnings: Number(thisMonthResult._sum.commissionAmount || 0),
    totalEarnings: Number(totalResult._sum.commissionAmount || 0),
    followerCount,
    totalOrders,
    monthsActive,
  }
}
