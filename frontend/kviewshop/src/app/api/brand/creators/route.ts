import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'
import type { Prisma } from '@/generated/prisma/client'

export async function GET(request: NextRequest) {
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

  const sp = request.nextUrl.searchParams
  const tier = sp.get('tier') || undefined
  const categoryParam = sp.get('category') || ''
  const categories = categoryParam ? categoryParam.split(',').map(c => c.trim()).filter(Boolean) : []
  const minEngagement = sp.get('minEngagement') ? parseFloat(sp.get('minEngagement')!) : undefined
  const maxEngagement = sp.get('maxEngagement') ? parseFloat(sp.get('maxEngagement')!) : undefined
  const verified = sp.get('verified') || undefined
  const includeKeywordsParam = sp.get('includeKeywords') || ''
  const includeKeywords = includeKeywordsParam ? includeKeywordsParam.split(',').map(k => k.trim()).filter(Boolean).slice(0, 3) : []
  const keywordOperator = sp.get('keywordOperator') === 'AND' ? 'AND' : 'OR'
  const excludeKeywordsParam = sp.get('excludeKeywords') || ''
  const excludeKeywords = excludeKeywordsParam ? excludeKeywordsParam.split(',').map(k => k.trim()).filter(Boolean) : []
  const searchScope = sp.get('searchScope') === 'bio' ? 'bio' : 'all'
  const cnecPartnerOnly = sp.get('cnecPartnerOnly') === 'true'
  const sort = sp.get('sort') || 'followers'
  const page = Math.max(1, parseInt(sp.get('page') || '1', 10))
  const limit = Math.min(50, Math.max(1, parseInt(sp.get('limit') || '20', 10)))

  const where: Prisma.CreatorWhereInput = {
    igFollowers: { not: null },
  }

  if (tier) {
    where.igTier = tier
  }

  const andConditions: Prisma.CreatorWhereInput[] = []

  if (categories.length > 0) {
    andConditions.push({
      OR: categories.map(cat => ({
        igCategory: { contains: cat, mode: 'insensitive' as const },
      })),
    })
  }

  if (minEngagement !== undefined || maxEngagement !== undefined) {
    const erFilter: Prisma.DecimalNullableFilter = {}
    if (minEngagement !== undefined) erFilter.gte = minEngagement
    if (maxEngagement !== undefined) erFilter.lte = maxEngagement
    where.igEngagementRate = erFilter
  }

  if (verified === 'true') where.igVerified = true
  if (verified === 'false') where.igVerified = false

  if (cnecPartnerOnly) where.cnecIsPartner = true

  if (includeKeywords.length > 0) {
    const keywordConditions = includeKeywords.map(kw => {
      if (searchScope === 'bio') {
        return { igBio: { contains: kw, mode: 'insensitive' as const } }
      }
      return {
        OR: [
          { igBio: { contains: kw, mode: 'insensitive' as const } },
          { displayName: { contains: kw, mode: 'insensitive' as const } },
          { instagramHandle: { contains: kw, mode: 'insensitive' as const } },
        ],
      }
    })

    if (keywordOperator === 'AND') {
      andConditions.push(...keywordConditions)
    } else {
      andConditions.push({ OR: keywordConditions })
    }
  }

  if (excludeKeywords.length > 0) {
    for (const kw of excludeKeywords) {
      andConditions.push({
        NOT: {
          OR: [
            { igBio: { contains: kw, mode: 'insensitive' as const } },
            { displayName: { contains: kw, mode: 'insensitive' as const } },
            { instagramHandle: { contains: kw, mode: 'insensitive' as const } },
          ],
        },
      })
    }
  }

  if (andConditions.length > 0) {
    where.AND = andConditions
  }

  const orderBy: Prisma.CreatorOrderByWithRelationInput =
    sort === 'engagement'
      ? { igEngagementRate: 'desc' }
      : sort === 'recent'
        ? { igDataImportedAt: 'desc' }
        : { igFollowers: 'desc' }

  const skip = (page - 1) * limit

  const [creators, total] = await Promise.all([
    prisma.creator.findMany({ where, orderBy, skip, take: limit }),
    prisma.creator.count({ where }),
  ])

  const serialized = creators.map(c => ({
    ...c,
    igEngagementRate: c.igEngagementRate ? Number(c.igEngagementRate) : null,
    cnecReliabilityScore: c.cnecReliabilityScore ? Number(c.cnecReliabilityScore) : null,
    totalSales: Number(c.totalSales),
    totalEarnings: Number(c.totalEarnings),
    totalRevenue: Number(c.totalRevenue),
  }))

  return NextResponse.json({
    creators: serialized,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  })
}
