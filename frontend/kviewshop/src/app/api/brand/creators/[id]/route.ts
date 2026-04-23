import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'
import { getOrCalculateMatchScore } from '@/lib/creator-match/calculate-score'
import {
  canSendAlimtalk,
  canSendEmail,
  scoreToStarValue,
  shouldShowStarRating,
} from '@/lib/creator/reliability'

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

  // 매칭 스코어 계산
  const matchScore = await getOrCalculateMatchScore(id, brand.id)

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
  const er = creator.igEngagementRate ? Number(creator.igEngagementRate) : 0.02
  const contentPerformance = {
    avgFeedLikes: creator.igAvgFeedLikes ?? creator.igAvgLikes ?? Math.round(followers * er * 0.7),
    avgFeedComments: creator.igAvgFeedComments ?? creator.igAvgComments ?? Math.round(followers * er * 0.02),
    avgReelsViews: creator.igAvgReelViews ?? creator.igAvgVideoViews ?? Math.round(followers * 0.43),
    avgReelsLikes: creator.igAvgReelLikes ?? creator.igAvgVideoLikes ?? Math.round(followers * er * 1.2),
    lastSyncedAt: creator.igLastSyncedAt ?? creator.igDataImportedAt,
    dataSource: creator.igDataSource ?? 'Phase 1 추정',
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

  return NextResponse.json({
    creator: {
      ...creator,
      igEngagementRate: creator.igEngagementRate ? Number(creator.igEngagementRate) : null,
      igEstimatedCPRDecimal: creator.igEstimatedCPRDecimal ? Number(creator.igEstimatedCPRDecimal) : null,
      igEstimatedAdFee: creator.igEstimatedAdFee ? Number(creator.igEstimatedAdFee) : null,
      cnecReliabilityScore: reliabilityScore,
      totalSales: Number(creator.totalSales),
      totalEarnings: Number(creator.totalEarnings),
      totalRevenue: Number(creator.totalRevenue),
      canSendAlimtalk: canSendAlimtalk(creator.cnecPhone, creator.cnecVerificationStatus),
      canSendEmail: canSendEmail(creator.cnecEmail1, creator.cnecEmail2, creator.cnecEmail3),
      starRating: scoreToStarValue(reliabilityScore),
      showStarRating: shouldShowStarRating(creator.cnecIsPartner, creator.cnecTotalTrials, creator.cnecCompletedPayments),
      effectiveFollowerRate: creator.igValidFollowers && creator.igFollowers
        ? Math.round((creator.igValidFollowers / creator.igFollowers) * 100)
        : creator.igEngagementRate
          ? Math.min(95, Math.round(Number(creator.igEngagementRate) * 1000 * 0.9))
          : null,
    },
    matchScore: {
      ...matchScore,
      estimatedAdCost: matchScore.estimatedAdCost.toString(),
    },
    contentPerformance,
    audienceInsights,
    campaigns,
  })
}
