import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'
import {
  canSendAlimtalk,
  canSendEmail,
  scoreToStarValue,
  shouldShowStarRating,
} from '@/lib/creator/reliability'
import type { Prisma } from '@/generated/prisma/client'
import { getCategorySearchTerms } from '@/lib/utils/beauty-labels'
import { batchCalculateMatchScores } from '@/lib/creator-match/calculate-score'

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
  const tierParam = sp.get('tier') || ''
  const tierList = tierParam ? tierParam.split(',').map(t => t.trim()).filter(Boolean) : []
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
  const limit = Math.min(50, Math.max(1, parseInt(sp.get('limit') || '24', 10)))
  const updatedWithinDays = sp.get('updatedWithinDays') ? parseInt(sp.get('updatedWithinDays')!) : undefined

  const where: Prisma.CreatorWhereInput = {
    igFollowers: { not: null },
  }

  if (tierList.length === 1) {
    where.igTier = tierList[0]
  } else if (tierList.length > 1) {
    where.igTier = { in: tierList }
  }

  const andConditions: Prisma.CreatorWhereInput[] = []

  if (categories.length > 0) {
    const categoryConditions = categories.flatMap(cat =>
      getCategorySearchTerms(cat).map(term => ({
        igCategory: { contains: term, mode: 'insensitive' as const },
      }))
    )
    andConditions.push({ OR: categoryConditions })
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

  if (updatedWithinDays) {
    const cutoff = new Date(Date.now() - updatedWithinDays * 24 * 60 * 60 * 1000)
    where.igDataImportedAt = { gte: cutoff }
  }

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

  // matchScore 정렬 시 더 많이 가져와서 정렬 후 페이지네이션
  const isMatchSort = sort === 'matchScore'
  const fetchLimit = isMatchSort ? 500 : limit
  const fetchSkip = isMatchSort ? 0 : (page - 1) * limit

  const orderBy: Prisma.CreatorOrderByWithRelationInput =
    sort === 'engagement'
      ? { igEngagementRate: 'desc' }
      : sort === 'recent'
        ? { igDataImportedAt: 'desc' }
        : { igFollowers: 'desc' }

  const [creators, total, totalAll, recentUpdatedCount] = await Promise.all([
    prisma.creator.findMany({ where, orderBy, skip: fetchSkip, take: fetchLimit }),
    prisma.creator.count({ where }),
    prisma.creator.count({ where: { igFollowers: { not: null } } }),
    prisma.creator.count({
      where: {
        igFollowers: { not: null },
        igDataImportedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
  ])

  // 매칭 스코어 배치 계산
  const scoreMap = await batchCalculateMatchScores(
    creators.map(c => c.id),
    brand.id
  )

  let enriched = creators.map(c => {
    const reliabilityScore = c.cnecReliabilityScore ? Number(c.cnecReliabilityScore) : null
    const s = scoreMap.get(c.id)

    return {
      ...c,
      igEngagementRate: c.igEngagementRate ? Number(c.igEngagementRate) : null,
      igEstimatedCPRDecimal: c.igEstimatedCPRDecimal ? Number(c.igEstimatedCPRDecimal) : null,
      igEstimatedAdFee: c.igEstimatedAdFee ? Number(c.igEstimatedAdFee) : null,
      cnecReliabilityScore: reliabilityScore,
      totalSales: Number(c.totalSales),
      totalEarnings: Number(c.totalEarnings),
      totalRevenue: Number(c.totalRevenue),
      canSendAlimtalk: canSendAlimtalk(c.cnecPhone, c.cnecVerificationStatus),
      canSendEmail: canSendEmail(c.cnecEmail1, c.cnecEmail2, c.cnecEmail3),
      starRating: scoreToStarValue(reliabilityScore),
      showStarRating: shouldShowStarRating(c.cnecIsPartner, c.cnecTotalTrials, c.cnecCompletedPayments),
      matchScore: s?.totalScore ?? 0,
      matchBreakdown: s ? {
        audienceFit: s.audienceFit,
        contentQuality: s.contentQuality,
        brandTone: s.brandTone,
        costEfficiency: s.costEfficiency,
      } : null,
      estimatedAdCost: s?.estimatedAdCost.toString() ?? '0',
      estimatedCpm: s?.estimatedCpm ?? 0,
      expectedReach: s?.expectedReach ?? 0,
      effectiveFollowerRate: c.igValidFollowers && c.igFollowers
        ? Math.round((c.igValidFollowers / c.igFollowers) * 100)
        : c.igEngagementRate
          ? Math.min(95, Math.round(Number(c.igEngagementRate) * 1000 * 0.9))
          : null,
    }
  })

  // matchScore 정렬
  if (isMatchSort) {
    enriched.sort((a, b) => b.matchScore - a.matchScore)
    enriched = enriched.slice((page - 1) * limit, page * limit)
  }

  // KPI 집계
  const avgMatchScore = enriched.length > 0
    ? Math.round(enriched.reduce((sum, c) => sum + c.matchScore, 0) / enriched.length)
    : 0

  const avgEr = enriched.length > 0
    ? Math.round(
        enriched.reduce((sum, c) => sum + (c.igEngagementRate ?? 0), 0) / enriched.length * 100
      ) / 100
    : 0

  return NextResponse.json({
    creators: enriched,
    total,
    totalAll,
    page,
    totalPages: Math.ceil(total / limit),
    kpi: {
      avgMatchScore,
      recentUpdatedCount,
      avgEr,
    },
  })
}
