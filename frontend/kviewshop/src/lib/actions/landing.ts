'use server'

import { prisma } from '@/lib/db'

/**
 * 홈 랜딩 실시간 통계 (캐시 가능)
 */
export async function getLandingStats() {
  const [
    totalRevenueResult,
    creatorCount,
    brandCount,
    followerCount,
    totalOrders,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: {
        status: { in: ['PAID', 'PREPARING', 'SHIPPING', 'DELIVERED', 'CONFIRMED'] },
      },
      _sum: { totalAmount: true },
    }),
    prisma.creator.count({
      where: { status: 'ACTIVE' },
    }),
    prisma.brand.count({
      where: { user: { status: 'active' } },
    }),
    prisma.follow.count(),
    prisma.order.count({
      where: {
        status: { in: ['PAID', 'PREPARING', 'SHIPPING', 'DELIVERED', 'CONFIRMED'] },
      },
    }),
  ])

  return {
    totalRevenue: Number(totalRevenueResult._sum.totalAmount || 0),
    creatorCount,
    brandCount,
    followerCount,
    totalOrders,
  }
}

/**
 * 랜딩 페이지용 운영 원칙 쇼케이스 (원칙이 등록된 크리에이터 최대 3명)
 */
export async function getLandingPrinciples() {
  const creators = await prisma.creator.findMany({
    where: {
      status: 'ACTIVE',
      principles: { isEmpty: false },
    },
    select: {
      displayName: true,
      shopId: true,
      profileImageUrl: true,
      principles: true,
    },
    take: 3,
    orderBy: { updatedAt: 'desc' },
  })

  return creators
}
