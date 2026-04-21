import { prisma } from "@/lib/db";
// eslint-disable-next-line @typescript-eslint/no-explicit-any

const PAIN_POINT_NAMES: Record<string, string> = {
  P01: "여드름·트러블",
  P02: "모공",
  P03: "기미·잡티",
  P04: "주름·탄력",
  P05: "건조·보습",
  P06: "민감·자극",
  P07: "장벽 손상",
  P08: "유분·블랙헤드",
};

interface MatchReason {
  painPoint: string;
  painPointName: string;
  strength: number;
  reason: string;
}

interface MatchResult {
  score: number;
  reasons: MatchReason[];
}

/**
 * 단일 크리에이터-상품 매칭 점수 계산
 * Score = α×Cosine + β×HeroBoost + γ×Trend
 * α=0.6, β=0.25, γ=0.15
 */
export async function calculateMatchScore(
  creatorId: string,
  productId: string
): Promise<MatchResult> {
  // 1. 코사인 유사도 (pgvector)
  let cosine = 0;
  try {
    const rows = await prisma.$queryRawUnsafe<Array<{ cosine: number }>>(
      `SELECT 1 - (c.pain_point_vector <=> p.target_pain_vector) AS cosine
       FROM creators c, products p
       WHERE c.id = $1 AND p.id = $2
       AND c.pain_point_vector IS NOT NULL
       AND p.target_pain_vector IS NOT NULL`,
      creatorId,
      productId
    );
    cosine = rows[0]?.cosine ?? 0;
  } catch {
    cosine = 0;
  }

  // 2. Hero Ingredient Boost
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      targetPainPoints: true,
      productIngredients: {
        where: { isHero: true },
        include: {
          ingredient: {
            select: {
              koName: true,
              trendScore: true,
              efficacyP01: true,
              efficacyP02: true,
              efficacyP03: true,
              efficacyP04: true,
              efficacyP05: true,
              efficacyP06: true,
              efficacyP07: true,
              efficacyP08: true,
            },
          },
        },
      },
    },
  });

  const creatorPoints = await prisma.creatorPainPoint.findMany({
    where: { creatorId },
  });

  let heroBoost = 0;
  const reasons: MatchReason[] = [];
  const codes = ["P01", "P02", "P03", "P04", "P05", "P06", "P07", "P08"];

  if (product && creatorPoints.length > 0) {
    // 크리에이터 주요 고민과 상품 성분 매칭
    for (const cp of creatorPoints) {
      const idx = codes.indexOf(cp.painPointCode);
      if (idx < 0) continue;

      const efficacyKey = `efficacyP0${idx + 1}` as keyof typeof product.productIngredients[0]["ingredient"];

      for (const pi of product.productIngredients) {
        const eff = Number(pi.ingredient[efficacyKey] ?? 0);
        if (eff >= 0.6) {
          const strength = Math.round(eff * (cp.severity / 5) * 100) / 100;
          heroBoost += strength;
          reasons.push({
            painPoint: cp.painPointCode,
            painPointName: PAIN_POINT_NAMES[cp.painPointCode] || cp.painPointCode,
            strength,
            reason: `${pi.ingredient.koName}이(가) ${PAIN_POINT_NAMES[cp.painPointCode]}에 효과적`,
          });
        }
      }
    }
    // Normalize heroBoost to 0~1
    heroBoost = Math.min(1, heroBoost / Math.max(1, creatorPoints.length));
  }

  // 3. Trend Score (성분 트렌드 점수 평균)
  let trendNorm = 0;
  if (product?.productIngredients.length) {
    const avgTrend =
      product.productIngredients.reduce(
        (sum, pi) => sum + pi.ingredient.trendScore,
        0
      ) / product.productIngredients.length;
    trendNorm = avgTrend / 100;
  }

  // 최종 스코어
  const score = Math.round(
    (0.6 * cosine + 0.25 * heroBoost + 0.15 * trendNorm) * 1000
  ) / 1000;

  // 사유 정렬 (강도순)
  reasons.sort((a, b) => b.strength - a.strength);

  return {
    score: Math.min(1, Math.max(0, score)),
    reasons: reasons.slice(0, 3),
  };
}

/**
 * 상품 등록/수정 시 모든 크리에이터와의 매칭 점수 일괄 계산
 */
export async function batchCalculateForProduct(productId: string) {
  // 벡터가 있는 크리에이터만
  const creators = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT id FROM creators WHERE pain_point_vector IS NOT NULL LIMIT 500`
  );

  let count = 0;
  for (const creator of creators) {
    try {
      const result = await calculateMatchScore(creator.id, productId);
      if (result.score > 0.1) {
        await prisma.matchScore.upsert({
          where: {
            creatorId_productId: {
              creatorId: creator.id,
              productId,
            },
          },
          update: {
            score: result.score,
            matchReasons: JSON.parse(JSON.stringify(result.reasons)),
            computedAt: new Date(),
          },
          create: {
            creatorId: creator.id,
            productId,
            score: result.score,
            matchReasons: JSON.parse(JSON.stringify(result.reasons)),
          },
        });
        count++;
      }
    } catch {
      // 개별 실패는 무시
    }
  }

  return count;
}

/**
 * 크리에이터 페인포인트 변경 시 모든 상품과의 매칭 점수 재계산
 */
export async function batchCalculateForCreator(creatorId: string) {
  // 벡터가 있는 상품만
  const products = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT id FROM products WHERE target_pain_vector IS NOT NULL AND is_active = true LIMIT 500`
  );

  let count = 0;
  for (const product of products) {
    try {
      const result = await calculateMatchScore(creatorId, product.id);
      if (result.score > 0.1) {
        await prisma.matchScore.upsert({
          where: {
            creatorId_productId: {
              creatorId,
              productId: product.id,
            },
          },
          update: {
            score: result.score,
            matchReasons: JSON.parse(JSON.stringify(result.reasons)),
            computedAt: new Date(),
          },
          create: {
            creatorId,
            productId: product.id,
            score: result.score,
            matchReasons: JSON.parse(JSON.stringify(result.reasons)),
          },
        });
        count++;
      }
    } catch {
      // 개별 실패는 무시
    }
  }

  return count;
}
