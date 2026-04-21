import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const PP_NAMES: Record<string, string> = {
  P01: "여드름·트러블",
  P02: "모공",
  P03: "기미·잡티·색소침착",
  P04: "주름·탄력",
  P05: "건조·보습",
  P06: "민감·자극",
  P07: "장벽 손상",
  P08: "유분·블랙헤드",
};

export async function GET() {
  const [
    totalMatches,
    avgResult,
    highMatches,
    totalCreators,
    creatorsWithPPResult,
    totalProducts,
    productsWithIngResult,
    painPointCounts,
    topIngredients,
  ] = await Promise.all([
    prisma.matchScore.count(),
    prisma.matchScore.aggregate({ _avg: { score: true } }),
    prisma.matchScore.count({ where: { score: { gte: 0.7 } } }),
    prisma.creator.count(),
    prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(*) as count FROM creators WHERE pain_point_vector IS NOT NULL`
    ),
    prisma.product.count({ where: { isActive: true } }),
    prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(*) as count FROM products WHERE target_pain_vector IS NOT NULL`
    ),
    prisma.creatorPainPoint.groupBy({
      by: ["painPointCode"],
      _count: true,
      orderBy: { _count: { painPointCode: "desc" } },
    }),
    prisma.productIngredient.groupBy({
      by: ["ingredientId"],
      _count: true,
      orderBy: { _count: { ingredientId: "desc" } },
      take: 5,
    }),
  ]);

  // Enrich top ingredients
  const ingredientIds = topIngredients.map((t) => t.ingredientId);
  const ingredients = ingredientIds.length > 0
    ? await prisma.ingredientMaster.findMany({
        where: { id: { in: ingredientIds } },
        select: { id: true, koName: true, tier: true },
      })
    : [];

  const creatorsWithPainPoints = Number(creatorsWithPPResult[0]?.count ?? 0);
  const productsWithIngredients = Number(productsWithIngResult[0]?.count ?? 0);

  return NextResponse.json({
    totalMatches,
    avgScore: avgResult._avg.score ? Number(avgResult._avg.score) : 0,
    highMatchRate: totalMatches > 0 ? highMatches / totalMatches : 0,
    creatorsWithPainPoints,
    totalCreators,
    painPointInputRate: totalCreators > 0 ? creatorsWithPainPoints / totalCreators : 0,
    productsWithIngredients,
    totalProducts,
    ingredientInputRate: totalProducts > 0 ? productsWithIngredients / totalProducts : 0,
    topPainPoints: painPointCounts.map((pc) => ({
      code: pc.painPointCode,
      name: PP_NAMES[pc.painPointCode] || pc.painPointCode,
      count: pc._count,
    })),
    topIngredients: topIngredients.map((ti) => {
      const ing = ingredients.find((i) => i.id === ti.ingredientId);
      return {
        name: ing?.koName || "Unknown",
        tier: ing?.tier || "?",
        productCount: ti._count,
      };
    }),
  });
}
