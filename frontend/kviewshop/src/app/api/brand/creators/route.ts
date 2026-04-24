import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'
import {
  canSendAlimtalk,
  canSendEmail,
  canSendDM,
  scoreToStarValue,
  shouldShowStarRating,
} from '@/lib/creator/reliability'
import type { Prisma } from '@/generated/prisma/client'
import { buildCategoryWhereClause } from '@/lib/creator-match/category-keywords'
import { batchCalculateMatchScores } from '@/lib/creator-match/calculate-score'
import { checkDailyDbLimit, incrementDailyDbView, PricingLimitError } from '@/lib/pricing/v3/limits'
import { isUpsellError, pricingLimitToUpsellContext } from '@/lib/pricing/v3/errors'

export async function GET(request: NextRequest) {
  const authUser = await getAuthUser()

  let brandId: string | undefined

  if (authUser?.role === 'brand_admin') {
    const brand = await prisma.brand.findFirst({
      where: { userId: authUser.id },
      select: { id: true },
    })
    brandId = brand?.id
  }

  // dev fallback
  if (!brandId && process.env.NODE_ENV === 'development') {
    const firstBrand = await prisma.brand.findFirst({ select: { id: true } })
    brandId = firstBrand?.id
    if (brandId) console.log('[dev fallback] using first brand:', brandId)
  }

  if (!brandId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // v3 일일 DB 열람 제한 체크
  try {
    await checkDailyDbLimit(brandId)
  } catch (err) {
    if (isUpsellError(err)) {
      return NextResponse.json({ error: 'UPSELL_REQUIRED', upsell: (err as any).toJSON() }, { status: 402 })
    }
    if (err instanceof PricingLimitError) {
      const upsellCtx = pricingLimitToUpsellContext(err.code, err.message)
      if (upsellCtx) {
        return NextResponse.json({ error: 'UPSELL_REQUIRED', upsell: upsellCtx, message: err.message }, { status: 402 })
      }
      return NextResponse.json({ error: err.code, message: err.message }, { status: 403 })
    }
    throw err
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
  const canSendDMFilter = sp.get('canSendDM') === 'true'
  const canSendEmailFilter = sp.get('canSendEmail') === 'true'
  const canSendAlimtalkFilter = sp.get('canSendAlimtalk') === 'true'
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
    const catClause = buildCategoryWhereClause(categories)
    if (catClause) andConditions.push(catClause)
  }

  if (minEngagement !== undefined || maxEngagement !== undefined) {
    const erFilter: Prisma.DecimalNullableFilter = {}
    if (minEngagement !== undefined) erFilter.gte = minEngagement
    if (maxEngagement !== undefined) erFilter.lte = maxEngagement
    where.igEngagementRate = erFilter
  }

  if (verified === 'true') where.igVerified = true
  if (verified === 'false') where.igVerified = false

  if (cnecPartnerOnly) {
    andConditions.push({ cnecIsPartner: true, cnecCompletedPayments: { gt: 0 } })
  }

  if (canSendDMFilter) {
    andConditions.push({ igUsername: { not: null } })
  }
  if (canSendEmailFilter) {
    andConditions.push({
      OR: [
        { cnecEmail1: { not: null } },
        { cnecEmail2: { not: null } },
        { cnecEmail3: { not: null } },
      ],
    })
  }
  if (canSendAlimtalkFilter) {
    andConditions.push({
      cnecPhone: { not: null },
      cnecVerificationStatus: { in: ['VERIFIED', 'COMPLETED'] },
    })
  }

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
    brandId
  )

  let enriched = creators.map(c => {
    const reliabilityScore = c.cnecReliabilityScore ? Number(c.cnecReliabilityScore) : null
    const s = scoreMap.get(c.id)
    const erNum = c.igEngagementRate ? Number(c.igEngagementRate) : null

    return {
      // 직렬화 안전 필드만 명시적으로 포함 (Decimal/BigInt 제외)
      id: c.id,
      userId: c.userId,
      displayName: c.displayName,
      instagramHandle: c.instagramHandle,
      igUsername: c.igUsername,
      igFollowers: c.igFollowers,
      igFollowing: c.igFollowing,
      igPostsCount: c.igPostsCount,
      igBio: c.igBio,
      igCategory: c.igCategory,
      igVerified: c.igVerified,
      igExternalUrl: c.igExternalUrl,
      igIsBusinessAccount: c.igIsBusinessAccount,
      igDataImportedAt: c.igDataImportedAt,
      igProfileImageR2Url: c.igProfileImageR2Url,
      igProfilePicUrl: c.igProfilePicUrl,
      igTier: c.igTier,
      igRecentPostThumbnails: c.igRecentPostThumbnails,
      igFullName: c.igFullName,
      igFollowersEffective: c.igFollowersEffective,
      igValidFollowers: c.igValidFollowers,
      igAvgReach: c.igAvgReach,
      igAvgLikes: c.igAvgLikes,
      igAvgComments: c.igAvgComments,
      igAvgVideoViews: c.igAvgVideoViews,
      igAvgVideoLikes: c.igAvgVideoLikes,
      igAudienceGender: c.igAudienceGender,
      igAudienceAge: c.igAudienceAge,
      igEstimatedCPR: c.igEstimatedCPR,
      igEstimatedAdCost: c.igEstimatedAdCost,
      igLastPostAt: c.igLastPostAt,
      igDataSource: c.igDataSource,
      profileImage: c.profileImage,
      profileImageUrl: c.profileImageUrl,
      cnecIsPartner: c.cnecIsPartner,
      cnecTotalTrials: c.cnecTotalTrials,
      cnecCompletedPayments: c.cnecCompletedPayments,
      cnecPhone: c.cnecPhone,
      cnecVerificationStatus: c.cnecVerificationStatus,
      cnecEmail1: c.cnecEmail1,
      cnecEmail2: c.cnecEmail2,
      cnecEmail3: c.cnecEmail3,
      hasPhone: c.hasPhone,
      phoneForAlimtalk: c.phoneForAlimtalk,
      // Decimal → Number 변환
      igEngagementRate: erNum,
      igEstimatedCPRDecimal: c.igEstimatedCPRDecimal ? Number(c.igEstimatedCPRDecimal) : null,
      igEstimatedAdFee: c.igEstimatedAdFee ? Number(c.igEstimatedAdFee) : null,
      cnecReliabilityScore: reliabilityScore,
      totalSales: Number(c.totalSales),
      totalEarnings: Number(c.totalEarnings),
      totalRevenue: Number(c.totalRevenue),
      // 파생 필드
      canSendDM: canSendDM(c.igUsername),
      canSendAlimtalk: canSendAlimtalk(c.cnecPhone, c.cnecVerificationStatus),
      canSendEmail: canSendEmail(c.cnecEmail1, c.cnecEmail2, c.cnecEmail3),
      isContactable: canSendDM(c.igUsername) || canSendEmail(c.cnecEmail1, c.cnecEmail2, c.cnecEmail3) || canSendAlimtalk(c.cnecPhone, c.cnecVerificationStatus),
      isVerifiedPartner: Boolean(c.cnecIsPartner) && (c.cnecCompletedPayments ?? 0) > 0,
      starRating: scoreToStarValue(reliabilityScore),
      showStarRating: shouldShowStarRating(c.cnecIsPartner, c.cnecTotalTrials, c.cnecCompletedPayments),
      // 매칭 스코어
      matchScore: s?.totalScore ?? 0,
      matchBreakdown: s ? {
        audienceFit: s.audienceFit,
        contentQuality: s.contentQuality,
        brandTone: s.brandTone,
        costEfficiency: s.costEfficiency,
      } : null,
      estimatedAdCost: s?.estimatedAdCost?.toString() ?? '0',
      estimatedCpm: s?.estimatedCpm ?? 0,
      expectedReach: s?.expectedReach ?? 0,
      effectiveFollowerRate: c.igValidFollowers && c.igFollowers
        ? Math.round((c.igValidFollowers / c.igFollowers) * 100)
        : erNum
          ? Math.min(95, Math.round(erNum * 1000 * 0.9))
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


  // v3 일일 DB 열람 횟수 증가 (비동기)
  incrementDailyDbView(brandId).catch(err => console.error('[incrementDailyDbView]', err))
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
