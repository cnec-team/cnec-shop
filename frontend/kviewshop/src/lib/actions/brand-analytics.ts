'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

async function requireBrand() {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')
  const brand = await prisma.brand.findFirst({
    where: { userId: session.user.id },
  })
  if (!brand) throw new Error('Brand not found')
  return brand
}

export interface CampaignROI {
  id: string
  title: string
  type: string
  status: string
  startAt: string | null
  endAt: string | null
  revenue: number
  orderCount: number
  creatorCount: number
  avgOrderValue: number
}

export interface CreatorPerformance {
  creatorId: string
  displayName: string
  profileImageUrl: string | null
  followerCount: number
  revenue: number
  orderCount: number
  conversionRate: number
}

export interface SeedingFunnel {
  totalSent: number
  received: number
  proceeded: number
  conversionRate: number
  proceedRevenue: number
}

export interface MonthlyTrend {
  month: string
  revenue: number
  orders: number
}

export interface BrandROIDashboardData {
  summary: {
    totalRevenue: number
    totalInvestment: number
    roas: number
    activeCampaigns: number
    activeCreators: number
  }
  campaigns: CampaignROI[]
  topCreators: CreatorPerformance[]
  seedingFunnel: SeedingFunnel
  monthlyTrend: MonthlyTrend[]
}

/**
 * 브랜드 ROI 대시보드 데이터
 */
export async function getBrandROIDashboard(): Promise<BrandROIDashboardData> {
  const brand = await requireBrand()

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  // 1. 이번 달 매출 요약
  const [revenueResult, activeCampaigns, activeCreators, investmentResult] = await Promise.all([
    prisma.order.aggregate({
      where: {
        brandId: brand.id,
        status: { in: ['PAID', 'PREPARING', 'SHIPPING', 'DELIVERED', 'CONFIRMED'] },
        createdAt: { gte: thisMonthStart },
      },
      _sum: { totalAmount: true },
    }),
    prisma.campaign.count({
      where: { brandId: brand.id, status: { in: ['ACTIVE', 'RECRUITING'] } },
    }),
    prisma.campaignParticipation.findMany({
      where: {
        campaign: { brandId: brand.id, status: 'ACTIVE' },
        status: 'APPROVED',
      },
      select: { creatorId: true },
      distinct: ['creatorId'],
    }),
    // 투자 비용 = 구독료 + 캠페인 차감
    prisma.billingPayment.aggregate({
      where: {
        brandId: brand.id,
        status: { in: ['CONFIRMED', 'WEBHOOK_CONFIRMED'] },
        createdAt: { gte: thisMonthStart },
      },
      _sum: { amount: true },
    }),
  ])

  const totalRevenue = Number(revenueResult._sum.totalAmount || 0)
  const totalInvestment = Number(investmentResult?._sum?.amount || 0) || 1 // avoid division by zero

  // 2. 캠페인별 ROI (최근 10개)
  const campaigns = await prisma.campaign.findMany({
    where: { brandId: brand.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      title: true,
      type: true,
      status: true,
      startAt: true,
      endAt: true,
      participations: {
        where: { status: 'APPROVED' },
        select: { creatorId: true },
      },
    },
  })

  const campaignROIs: CampaignROI[] = await Promise.all(
    campaigns.map(async (c) => {
      const orders = await prisma.order.aggregate({
        where: {
          brandId: brand.id,
          items: { some: { campaignId: c.id } },
          status: { in: ['PAID', 'PREPARING', 'SHIPPING', 'DELIVERED', 'CONFIRMED'] },
        },
        _sum: { totalAmount: true },
        _count: true,
      })

      const revenue = Number(orders._sum.totalAmount || 0)
      const orderCount = orders._count

      return {
        id: c.id,
        title: c.title,
        type: c.type,
        status: c.status,
        startAt: c.startAt?.toISOString() || null,
        endAt: c.endAt?.toISOString() || null,
        revenue,
        orderCount,
        creatorCount: c.participations.length,
        avgOrderValue: orderCount > 0 ? Math.round(revenue / orderCount) : 0,
      }
    })
  )

  // 3. 크리에이터별 성과 (TOP 10)
  const conversions = await prisma.conversion.groupBy({
    by: ['creatorId'],
    where: {
      order: { brandId: brand.id },
      status: { in: ['PENDING', 'CONFIRMED'] },
    },
    _sum: { orderAmount: true },
    _count: true,
    orderBy: { _sum: { orderAmount: 'desc' } },
    take: 10,
  })

  const creatorIds = conversions.map((c) => c.creatorId)
  const [creatorsData, followerCounts] = await Promise.all([
    prisma.creator.findMany({
      where: { id: { in: creatorIds } },
      select: { id: true, displayName: true, profileImageUrl: true },
    }),
    prisma.follow.groupBy({
      by: ['creatorId'],
      where: { creatorId: { in: creatorIds } },
      _count: true,
    }),
  ])

  const creatorMap = new Map(creatorsData.map((c) => [c.id, c]))
  const followerMap = new Map(followerCounts.map((f) => [f.creatorId, f._count]))

  const topCreators: CreatorPerformance[] = conversions.map((c) => {
    const creator = creatorMap.get(c.creatorId)
    return {
      creatorId: c.creatorId,
      displayName: creator?.displayName || '크리에이터',
      profileImageUrl: creator?.profileImageUrl || null,
      followerCount: followerMap.get(c.creatorId) ?? 0,
      revenue: Number(c._sum.orderAmount || 0),
      orderCount: c._count,
      conversionRate: 0, // TODO: 팔로워 대비 구매 전환율
    }
  })

  // 4. 시딩→공구 전환 퍼널
  const [totalSent, received, proceeded] = await Promise.all([
    prisma.sampleRequest.count({
      where: { brandId: brand.id, status: { not: 'pending' } },
    }),
    prisma.sampleRequest.count({
      where: { brandId: brand.id, status: 'received' },
    }),
    prisma.sampleRequest.count({
      where: { brandId: brand.id, status: 'decided' },
    }),
  ])

  // 5. 월별 매출 추이 (최근 6개월)
  const monthlyOrders = await prisma.order.findMany({
    where: {
      brandId: brand.id,
      status: { in: ['PAID', 'PREPARING', 'SHIPPING', 'DELIVERED', 'CONFIRMED'] },
      createdAt: { gte: sixMonthsAgo },
    },
    select: {
      totalAmount: true,
      createdAt: true,
    },
  })

  const trendMap = new Map<string, { revenue: number; orders: number }>()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`
    trendMap.set(key, { revenue: 0, orders: 0 })
  }

  for (const order of monthlyOrders) {
    const d = new Date(order.createdAt)
    const key = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`
    const entry = trendMap.get(key)
    if (entry) {
      entry.revenue += Number(order.totalAmount || 0)
      entry.orders += 1
    }
  }

  const monthlyTrend: MonthlyTrend[] = Array.from(trendMap.entries()).map(([month, data]) => ({
    month,
    ...data,
  }))

  return {
    summary: {
      totalRevenue,
      totalInvestment,
      roas: totalRevenue / totalInvestment,
      activeCampaigns,
      activeCreators: activeCreators.length,
    },
    campaigns: campaignROIs,
    topCreators,
    seedingFunnel: {
      totalSent,
      received,
      proceeded,
      conversionRate: totalSent > 0 ? Math.round((proceeded / totalSent) * 100) : 0,
      proceedRevenue: 0, // TODO: 전환된 공구 매출
    },
    monthlyTrend,
  }
}
