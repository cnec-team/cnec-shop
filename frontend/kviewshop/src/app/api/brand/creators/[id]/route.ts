import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getAuthUser()
  if (!authUser || authUser.role !== 'brand_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const brand = await prisma.brand.findFirst({
    where: { userId: authUser.id },
    select: { id: true },
  })
  if (!brand) {
    return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
  }

  const { id } = await params

  const creator = await prisma.creator.findUnique({ where: { id } })
  if (!creator) {
    return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
  }

  const participations = await prisma.campaignParticipation.findMany({
    where: { creatorId: id },
    include: {
      campaign: {
        include: { products: { include: { product: true } } },
      },
    },
    orderBy: { appliedAt: 'desc' },
  })

  const campaigns = await Promise.all(
    participations.map(async (p) => {
      const campaign = p.campaign
      let totalSales = 0
      let orders = 0

      if (campaign) {
        const orderAgg = await prisma.order.aggregate({
          where: {
            creatorId: id,
            status: { in: ['PAID', 'PREPARING', 'SHIPPING', 'DELIVERED', 'CONFIRMED'] },
            createdAt: {
              ...(campaign.startAt ? { gte: campaign.startAt } : {}),
              ...(campaign.endAt ? { lte: campaign.endAt } : {}),
            },
          },
          _sum: { totalAmount: true },
          _count: true,
        })
        totalSales = Number(orderAgg._sum.totalAmount ?? 0)
        orders = orderAgg._count
      }

      return {
        id: campaign?.id,
        title: campaign?.title ?? '',
        startAt: campaign?.startAt,
        endAt: campaign?.endAt,
        status: campaign?.status,
        totalSales,
        orders,
      }
    })
  )

  return NextResponse.json({
    creator: {
      ...creator,
      igEngagementRate: creator.igEngagementRate ? Number(creator.igEngagementRate) : null,
      totalSales: Number(creator.totalSales),
      totalEarnings: Number(creator.totalEarnings),
      totalRevenue: Number(creator.totalRevenue),
    },
    campaigns,
  })
}
