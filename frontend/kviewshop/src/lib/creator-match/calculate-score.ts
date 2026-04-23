import { prisma } from '@/lib/db'
import type { Brand, Creator } from '@/generated/prisma/client'

/**
 * 크리에이터-브랜드 매칭 점수 v1 (규칙 기반)
 *
 * 4대 지표 가중치:
 * - 시청자 정합(30%): 브랜드 타겟 ↔ 크리에이터 시청자 데이터
 * - 콘텐츠 품질(25%): ER, 팔로워, 업로드 활발도
 * - 브랜드 톤(25%): 카테고리 + 키워드 매칭
 * - 가성비(20%): CPM 역산
 */

export interface MatchScoreBreakdown {
  audienceFit: number
  contentQuality: number
  brandTone: number
  costEfficiency: number
  totalScore: number
  estimatedCpm: number
  estimatedAdCost: bigint
  expectedReach: number
}

const WEIGHTS = {
  audienceFit: 0.30,
  contentQuality: 0.25,
  brandTone: 0.25,
  costEfficiency: 0.20,
} as const

const TIER_BASE_CPM: Record<string, number> = {
  MEGA: 65_000,
  MACRO: 55_000,
  MICRO: 45_000,
  NANO: 35_000,
}

function getTier(followers: number): string {
  if (followers >= 1_000_000) return 'MEGA'
  if (followers >= 100_000) return 'MACRO'
  if (followers >= 10_000) return 'MICRO'
  return 'NANO'
}

function clamp(val: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, val))
}

/** 1. 시청자 정합 (30%) — 실제 audienceGenderRatio/audienceAgeRatio 사용 */
function scoreAudienceFit(creator: Creator, brand: Brand): number {
  let score = 50

  // 실제 시청자 성별 데이터가 있으면 활용
  const genderRatio = creator.audienceGenderRatio as Record<string, number> | null
  if (genderRatio && brand.targetGender) {
    const femaleRatio = genderRatio['female'] ?? genderRatio['FEMALE'] ?? 0
    const maleRatio = genderRatio['male'] ?? genderRatio['MALE'] ?? 0
    if (brand.targetGender === 'FEMALE' && femaleRatio > 60) score += 25
    else if (brand.targetGender === 'MALE' && maleRatio > 60) score += 25
    else if (brand.targetGender === 'ALL') score += 15
  }

  // 실제 시청자 연령 데이터
  const ageRatio = creator.audienceAgeRatio as Record<string, number> | null
  if (ageRatio && brand.targetAgeMin && brand.targetAgeMax) {
    const targetRange = `${brand.targetAgeMin}-${brand.targetAgeMax}`
    // 타겟 연령대와 겹치는 비율 합산
    let matchedPercent = 0
    for (const [ageKey, pct] of Object.entries(ageRatio)) {
      const match = ageKey.match(/(\d+)/)
      if (match) {
        const age = parseInt(match[1])
        if (age >= brand.targetAgeMin && age <= brand.targetAgeMax) {
          matchedPercent += pct
        }
      }
    }
    if (matchedPercent > 50) score += 15
    else if (matchedPercent > 30) score += 10
  }

  // 뷰티 카테고리 보정
  if (creator.igCategory) {
    if (/beauty|cosmetic|makeup|skin|뷰티|메이크업|스킨|코스메/i.test(creator.igCategory)) {
      score += 10
    }
  }

  if (creator.igVerified) score += 5

  return clamp(score)
}

/** 2. 콘텐츠 품질 (25%) */
function scoreContentQuality(creator: Creator): number {
  const er = creator.igEngagementRate ? Number(creator.igEngagementRate) : 0
  let erScore = 0
  if (er >= 5) erScore = 100
  else if (er >= 3) erScore = 80
  else if (er >= 2) erScore = 60
  else if (er >= 1) erScore = 40
  else erScore = 20

  // 최근 업로드 활발도
  let recencyScore = 50
  const lastPost = creator.igLastPostAt ?? creator.igDataImportedAt
  if (lastPost) {
    const daysSince = Math.floor((Date.now() - lastPost.getTime()) / (1000 * 60 * 60 * 24))
    if (daysSince <= 7) recencyScore = 100
    else if (daysSince <= 30) recencyScore = 80
    else if (daysSince <= 90) recencyScore = 50
    else recencyScore = 20
  }

  // 게시물 수 보정
  const posts = creator.igPostsCount ?? 0
  let postScore = 50
  if (posts >= 500) postScore = 100
  else if (posts >= 100) postScore = 80
  else if (posts >= 30) postScore = 60
  else postScore = 30

  return Math.round(erScore * 0.5 + recencyScore * 0.3 + postScore * 0.2)
}

/** 3. 브랜드 톤 (25%) */
function scoreBrandTone(creator: Creator, brand: Brand): number {
  let score = 40

  if (brand.targetCategories.length > 0 && creator.igCategory) {
    const matchCount = brand.targetCategories.filter(cat =>
      creator.igCategory!.toLowerCase().includes(cat.toLowerCase())
    ).length
    score += Math.min(40, matchCount * 20)
  } else {
    score += 20
  }

  if (brand.brandToneKeywords.length > 0 && creator.igBio) {
    const bio = creator.igBio.toLowerCase()
    const matchCount = brand.brandToneKeywords.filter(kw =>
      bio.includes(kw.toLowerCase())
    ).length
    score += Math.min(20, matchCount * 10)
  }

  return clamp(score)
}

/** 4. 가성비 (20%) — 실제 igEstimatedAdCost/igEstimatedCPR 활용 */
function scoreCostEfficiency(creator: Creator): {
  score: number
  estimatedCpm: number
  expectedReach: number
  estimatedAdCost: bigint
} {
  const followers = creator.igFollowers ?? 0
  const er = creator.igEngagementRate ? Number(creator.igEngagementRate) : 2

  // 실제 데이터가 있으면 사용
  const realAdCost = creator.igEstimatedAdCost ?? (creator.igEstimatedAdFee ? Number(creator.igEstimatedAdFee) : null)
  const realReach = creator.igEstimatedReach ?? creator.igAvgReach ?? Math.round(followers * 0.35)
  const realCpm = creator.igEstimatedCPR ?? null

  let estimatedCpm: number
  let expectedReach: number
  let estimatedAdCost: bigint

  if (realCpm && realCpm > 0) {
    estimatedCpm = realCpm
    expectedReach = realReach
    estimatedAdCost = realAdCost ? BigInt(realAdCost) : BigInt(Math.round((expectedReach / 1000) * estimatedCpm))
  } else {
    // 폴백: Tier 기반 추정
    const tier = creator.igTier ?? getTier(followers)
    const baseCpm = TIER_BASE_CPM[tier] ?? 45_000
    const erAdjust = Math.max(0.7, Math.min(1.3, 2.4 / Math.max(er, 0.5)))
    estimatedCpm = Math.round(baseCpm * erAdjust)
    const reachRate = tier === 'MEGA' ? 0.25 : tier === 'MACRO' ? 0.35 : 0.45
    expectedReach = Math.round(followers * reachRate)
    estimatedAdCost = BigInt(Math.round((expectedReach / 1000) * estimatedCpm))
  }

  // 가성비 점수
  let score: number
  if (estimatedCpm <= 40_000) score = 100
  else if (estimatedCpm <= 50_000) score = 80
  else if (estimatedCpm <= 60_000) score = 60
  else if (estimatedCpm <= 70_000) score = 40
  else score = 25

  return { score, estimatedCpm, expectedReach, estimatedAdCost }
}

/** 전체 매칭 점수 계산 */
export function calculateMatchScore(creator: Creator, brand: Brand): MatchScoreBreakdown {
  const audienceFit = scoreAudienceFit(creator, brand)
  const contentQuality = scoreContentQuality(creator)
  const brandTone = scoreBrandTone(creator, brand)
  const { score: costEfficiency, estimatedCpm, expectedReach, estimatedAdCost } = scoreCostEfficiency(creator)

  const totalScore = Math.round(
    audienceFit * WEIGHTS.audienceFit +
    contentQuality * WEIGHTS.contentQuality +
    brandTone * WEIGHTS.brandTone +
    costEfficiency * WEIGHTS.costEfficiency
  )

  return { audienceFit, contentQuality, brandTone, costEfficiency, totalScore, estimatedCpm, estimatedAdCost, expectedReach }
}

/** 캐시 조회 + 갱신 (24시간 캐시) */
export async function getOrCalculateMatchScore(
  creatorId: string,
  brandId: string
): Promise<MatchScoreBreakdown> {
  const cached = await prisma.creatorMatchScore.findUnique({
    where: { brandId_creatorId: { brandId, creatorId } },
  })

  const DAY_MS = 24 * 60 * 60 * 1000
  if (cached && Date.now() - cached.calculatedAt.getTime() < DAY_MS) {
    return {
      audienceFit: cached.audienceFit,
      contentQuality: cached.contentQuality,
      brandTone: cached.brandTone,
      costEfficiency: cached.costEfficiency,
      totalScore: cached.totalScore,
      estimatedCpm: cached.estimatedCpm,
      estimatedAdCost: cached.estimatedAdCost,
      expectedReach: cached.expectedReach,
    }
  }

  const [creator, brand] = await Promise.all([
    prisma.creator.findUnique({ where: { id: creatorId } }),
    prisma.brand.findUnique({ where: { id: brandId } }),
  ])

  if (!creator || !brand) throw new Error('Creator or Brand not found')

  const result = calculateMatchScore(creator, brand)

  await prisma.creatorMatchScore.upsert({
    where: { brandId_creatorId: { brandId, creatorId } },
    create: {
      brandId, creatorId,
      audienceFit: result.audienceFit,
      contentQuality: result.contentQuality,
      brandTone: result.brandTone,
      costEfficiency: result.costEfficiency,
      totalScore: result.totalScore,
      estimatedCpm: result.estimatedCpm,
      estimatedAdCost: result.estimatedAdCost,
      expectedReach: result.expectedReach,
    },
    update: {
      audienceFit: result.audienceFit,
      contentQuality: result.contentQuality,
      brandTone: result.brandTone,
      costEfficiency: result.costEfficiency,
      totalScore: result.totalScore,
      estimatedCpm: result.estimatedCpm,
      estimatedAdCost: result.estimatedAdCost,
      expectedReach: result.expectedReach,
      calculatedAt: new Date(),
    },
  })

  return result
}

/** 리스트용 배치 계산 (N+1 방지) */
export async function batchCalculateMatchScores(
  creatorIds: string[],
  brandId: string
): Promise<Map<string, MatchScoreBreakdown>> {
  if (creatorIds.length === 0) return new Map()

  const brand = await prisma.brand.findUnique({ where: { id: brandId } })
  if (!brand) throw new Error('Brand not found')

  const DAY_MS = 24 * 60 * 60 * 1000
  const cachedScores = await prisma.creatorMatchScore.findMany({
    where: {
      brandId,
      creatorId: { in: creatorIds },
      calculatedAt: { gte: new Date(Date.now() - DAY_MS) },
    },
  })

  const cachedMap = new Map(cachedScores.map(s => [s.creatorId, s]))
  const uncachedIds = creatorIds.filter(id => !cachedMap.has(id))

  const results = new Map<string, MatchScoreBreakdown>()

  for (const s of cachedScores) {
    results.set(s.creatorId, {
      audienceFit: s.audienceFit,
      contentQuality: s.contentQuality,
      brandTone: s.brandTone,
      costEfficiency: s.costEfficiency,
      totalScore: s.totalScore,
      estimatedCpm: s.estimatedCpm,
      estimatedAdCost: s.estimatedAdCost,
      expectedReach: s.expectedReach,
    })
  }

  if (uncachedIds.length > 0) {
    const creators = await prisma.creator.findMany({ where: { id: { in: uncachedIds } } })
    const newOnes = creators.map(c => ({
      creatorId: c.id,
      result: calculateMatchScore(c, brand),
    }))

    if (newOnes.length > 0) {
      await prisma.$transaction(
        newOnes.map(({ creatorId, result }) =>
          prisma.creatorMatchScore.upsert({
            where: { brandId_creatorId: { brandId, creatorId } },
            create: {
              brandId, creatorId,
              audienceFit: result.audienceFit,
              contentQuality: result.contentQuality,
              brandTone: result.brandTone,
              costEfficiency: result.costEfficiency,
              totalScore: result.totalScore,
              estimatedCpm: result.estimatedCpm,
              estimatedAdCost: result.estimatedAdCost,
              expectedReach: result.expectedReach,
            },
            update: {
              audienceFit: result.audienceFit,
              contentQuality: result.contentQuality,
              brandTone: result.brandTone,
              costEfficiency: result.costEfficiency,
              totalScore: result.totalScore,
              estimatedCpm: result.estimatedCpm,
              estimatedAdCost: result.estimatedAdCost,
              expectedReach: result.expectedReach,
              calculatedAt: new Date(),
            },
          })
        )
      )

      for (const { creatorId, result } of newOnes) {
        results.set(creatorId, result)
      }
    }
  }

  return results
}
