import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'
import type { Prisma } from '@/generated/prisma/client'

export async function GET(request: NextRequest) {
  const authUser = await getAuthUser()
  if (!authUser || authUser.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sp = request.nextUrl.searchParams
  const search = sp.get('search') || ''
  const tier = sp.get('tier') || ''
  const hasIgData = sp.get('hasIgData') || ''
  const sort = sp.get('sort') || 'recent'
  const page = Math.max(1, parseInt(sp.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(sp.get('limit') || '50', 10)))

  const where: Prisma.CreatorWhereInput = {}

  if (hasIgData === 'true') where.igFollowers = { not: null }
  if (hasIgData === 'false') where.igFollowers = null
  if (tier && tier !== 'all') where.igTier = tier
  if (search) {
    where.OR = [
      { instagramHandle: { contains: search, mode: 'insensitive' } },
      { displayName: { contains: search, mode: 'insensitive' } },
    ]
  }

  const orderBy: Prisma.CreatorOrderByWithRelationInput =
    sort === 'followers' ? { igFollowers: 'desc' }
    : sort === 'engagement' ? { igEngagementRate: 'desc' }
    : sort === 'name' ? { displayName: 'asc' }
    : { igDataImportedAt: 'desc' }

  const [creators, total, totalWithIg, totalWithoutIg, lastImport] = await Promise.all([
    prisma.creator.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.creator.count({ where }),
    prisma.creator.count({ where: { igFollowers: { not: null } } }),
    prisma.creator.count({ where: { igFollowers: null } }),
    prisma.creator.findFirst({
      where: { igDataImportedAt: { not: null } },
      orderBy: { igDataImportedAt: 'desc' },
      select: { igDataImportedAt: true },
    }),
  ])

  // 티어별 분포
  const tierCounts = await Promise.all(
    ['MEGA', 'MACRO', 'MICRO', 'NANO', 'UNDER_1K'].map(async t => ({
      tier: t,
      count: await prisma.creator.count({ where: { igTier: t } }),
    }))
  )

  const serialized = creators.map(c => ({
    ...c,
    igEngagementRate: c.igEngagementRate ? Number(c.igEngagementRate) : null,
    totalSales: Number(c.totalSales),
    totalEarnings: Number(c.totalEarnings),
    totalRevenue: Number(c.totalRevenue),
  }))

  return NextResponse.json({
    creators: serialized,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    stats: {
      totalWithIg,
      totalWithoutIg,
      lastImportAt: lastImport?.igDataImportedAt ?? null,
    },
    tierDistribution: tierCounts,
  })
}
