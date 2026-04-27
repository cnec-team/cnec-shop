import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'
import { getOrCalculateMatchScore } from '@/lib/creator-match/calculate-score'
import {
  canSendAlimtalk,
  canSendEmail,
  canSendDM,
  scoreToStarValue,
  shouldShowStarRating,
} from '@/lib/creator/reliability'
import { checkRapidDetailView } from '@/lib/pricing/v3/abuse-detection'
import { chargeDetailView } from '@/lib/pricing/v3/charge-detail-view'
import { PricingLimitError } from '@/lib/pricing/v3/limits'
import { isUpsellError, pricingLimitToUpsellContext } from '@/lib/pricing/v3/errors'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  // 1. 악용 탐지 (50회/시간)
  try {
    await checkRapidDetailView(brandId)
  } catch (err) {
    if (err instanceof PricingLimitError && err.code === 'RAPID_DETAIL_VIEW') {
      return NextResponse.json({ error: 'RATE_LIMITED', message: err.message }, { status: 429 })
    }
    throw err
  }

  const { id } = await params

  // 2. v3 상세 조회 제한 + 카운터 증가
  try {
    await chargeDetailView(brandId, id)
  } catch (err) {
    if (isUpsellError(err)) {
      return NextResponse.json({ error: 'UPSELL_REQUIRED', upsell: err.toJSON() }, { status: 402 })
    }
    if (err instanceof PricingLimitError) {
      const upsellCtx = pricingLimitToUpsellContext(err.code, err.message)
      if (upsellCtx) {
        return NextResponse.json({ error: 'UPSELL_REQUIRED', upsell: upsellCtx, message: err.message }, { status: 402 })
      }
      return NextResponse.json({ error: err.code, message: err.message }, { status: 400 })
    }
    throw err
  }

  const creator = await prisma.creator.findUnique({ where: { id } })
  if (!creator) {
    return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
  }

  // 매칭 스코어 계산
  const matchScore = await getOrCalculateMatchScore(id, brandId)

  // 캠페인 이력
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

  const reliabilityScore = creator.cnecReliabilityScore ? Number(creator.cnecReliabilityScore) : null

  // 콘텐츠 성과 (실제 DB 필드 우선, 없으면 추정)
  const followers = creator.igFollowers ?? 0
  // DB에 ER은 퍼센트로 저장 (2.3 = 2.3%), 계산용으로 비율 변환
  const erRatio = creator.igEngagementRate ? Number(creator.igEngagementRate) / 100 : 0.02
  const hasRealData = !!(creator.igAvgFeedLikes || creator.igAvgLikes || creator.igAvgReelViews || creator.igAvgVideoViews)
  const contentPerformance = {
    avgFeedLikes: creator.igAvgFeedLikes ?? creator.igAvgLikes ?? Math.round(followers * erRatio * 0.7),
    avgFeedComments: creator.igAvgFeedComments ?? creator.igAvgComments ?? Math.round(followers * erRatio * 0.02),
    avgReelsViews: creator.igAvgReelViews ?? creator.igAvgVideoViews ?? Math.round(followers * 0.43),
    avgReelsLikes: creator.igAvgReelLikes ?? creator.igAvgVideoLikes ?? Math.round(followers * erRatio * 1.2),
    lastSyncedAt: creator.igLastSyncedAt ?? creator.igDataImportedAt,
    dataSource: creator.igDataSource ?? (hasRealData ? 'Phase 1' : '추정치'),
    isEstimated: !hasRealData,
  }

  // 팔로워 인사이트 (실제 데이터 우선)
  const genderRatio = creator.audienceGenderRatio as Record<string, number> | null
  const ageRatio = creator.audienceAgeRatio as Record<string, number> | null

  const audienceInsights = {
    genderFemale: genderRatio?.['female'] ?? genderRatio?.['FEMALE'] ?? 82,
    genderMale: genderRatio?.['male'] ?? genderRatio?.['MALE'] ?? 18,
    ageDistribution: ageRatio
      ? Object.entries(ageRatio).map(([label, value]) => ({ label, value }))
      : [
          { label: '18-24', value: 44 },
          { label: '25-34', value: 25 },
          { label: '35-44', value: 8 },
          { label: '45+', value: 5 },
        ],
    primaryAudience: creator.igAudienceGender && creator.igAudienceAge
      ? `${creator.igAudienceGender} · ${creator.igAudienceAge}`
      : '여성 · 18-24세',
    dataSource: genderRatio ? '실제 데이터' : 'Phase 1 추정치',
  }

  const erNum = creator.igEngagementRate ? Number(creator.igEngagementRate) : null

  return NextResponse.json({
    creator: {
      id: creator.id,
      userId: creator.userId,
      displayName: creator.displayName,
      instagramHandle: creator.instagramHandle,
      igUsername: creator.igUsername,
      igFollowers: creator.igFollowers,
      igFollowing: creator.igFollowing,
      igPostsCount: creator.igPostsCount,
      igBio: creator.igBio,
      igCategory: creator.igCategory,
      igVerified: creator.igVerified,
      igExternalUrl: creator.igExternalUrl,
      igIsBusinessAccount: creator.igIsBusinessAccount,
      igDataImportedAt: creator.igDataImportedAt,
      igProfileImageR2Url: creator.igProfileImageR2Url,
      igProfilePicUrl: creator.igProfilePicUrl,
      igTier: creator.igTier,
      igRecentPostThumbnails: creator.igRecentPostThumbnails,
      igFullName: creator.igFullName,
      igFollowersEffective: creator.igFollowersEffective,
      igValidFollowers: creator.igValidFollowers,
      igAvgReach: creator.igAvgReach,
      igAvgLikes: creator.igAvgLikes,
      igAvgComments: creator.igAvgComments,
      igAvgVideoViews: creator.igAvgVideoViews,
      igAvgVideoLikes: creator.igAvgVideoLikes,
      igAvgFeedLikes: creator.igAvgFeedLikes,
      igAvgFeedComments: creator.igAvgFeedComments,
      igAvgReelViews: creator.igAvgReelViews,
      igAvgReelLikes: creator.igAvgReelLikes,
      igEstimatedReach: creator.igEstimatedReach,
      igAudienceGender: creator.igAudienceGender,
      igAudienceAge: creator.igAudienceAge,
      igEstimatedCPR: creator.igEstimatedCPR,
      igEstimatedAdCost: creator.igEstimatedAdCost,
      igLastPostAt: creator.igLastPostAt,
      igLastSyncedAt: creator.igLastSyncedAt,
      igDataSource: creator.igDataSource,
      igPrimaryLanguage: creator.igPrimaryLanguage,
      igLanguage: creator.igLanguage,
      profileImage: creator.profileImage,
      profileImageUrl: creator.profileImageUrl,
      cnecIsPartner: creator.cnecIsPartner,
      cnecTotalTrials: creator.cnecTotalTrials,
      cnecCompletedPayments: creator.cnecCompletedPayments,
      // Decimal → Number 변환
      igEngagementRate: erNum,
      igEstimatedCPRDecimal: creator.igEstimatedCPRDecimal ? Number(creator.igEstimatedCPRDecimal) : null,
      igEstimatedAdFee: creator.igEstimatedAdFee ? Number(creator.igEstimatedAdFee) : null,
      cnecReliabilityScore: reliabilityScore,
      totalSales: Number(creator.totalSales),
      totalEarnings: Number(creator.totalEarnings),
      totalRevenue: Number(creator.totalRevenue),
      // 파생 필드
      canSendDM: canSendDM(creator.igUsername),
      canSendAlimtalk: canSendAlimtalk(creator.cnecPhone, creator.cnecVerificationStatus),
      canSendEmail: canSendEmail(creator.cnecEmail1, creator.cnecEmail2, creator.cnecEmail3),
      isContactable: canSendDM(creator.igUsername) || canSendEmail(creator.cnecEmail1, creator.cnecEmail2, creator.cnecEmail3) || canSendAlimtalk(creator.cnecPhone, creator.cnecVerificationStatus),
      isVerifiedPartner: Boolean(creator.cnecIsPartner) && (creator.cnecCompletedPayments ?? 0) > 0,
      starRating: scoreToStarValue(reliabilityScore),
      showStarRating: shouldShowStarRating(creator.cnecIsPartner, creator.cnecTotalTrials, creator.cnecCompletedPayments),
      // igValidFollowers가 있으면 실제 비율, 없으면 ER 기반 추정 (ER은 퍼센트 저장)
      effectiveFollowerRate: creator.igValidFollowers && creator.igFollowers
        ? Math.round((creator.igValidFollowers / creator.igFollowers) * 100)
        : erNum
          ? Math.min(95, Math.round(erNum * 9))
          : null,
    },
    matchScore: {
      audienceFit: matchScore.audienceFit,
      contentQuality: matchScore.contentQuality,
      brandTone: matchScore.brandTone,
      costEfficiency: matchScore.costEfficiency,
      totalScore: matchScore.totalScore,
      estimatedCpm: matchScore.estimatedCpm,
      estimatedAdCost: matchScore.estimatedAdCost.toString(),
      expectedReach: matchScore.expectedReach,
    },
    contentPerformance,
    audienceInsights,
    campaigns,
  })
}
