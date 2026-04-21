import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const [
    totalMatches,
    avgResult,
    highMatches,
    creatorsWithVector,
    productsWithVector,
  ] = await Promise.all([
    prisma.matchScore.count(),
    prisma.matchScore.aggregate({ _avg: { score: true } }),
    prisma.matchScore.count({
      where: { score: { gte: 0.7 } },
    }),
    prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(*) as count FROM creators WHERE pain_point_vector IS NOT NULL`
    ),
    prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(*) as count FROM products WHERE target_pain_vector IS NOT NULL`
    ),
  ]);

  // Score distribution
  const ranges = [
    { min: 0.0, max: 0.2, label: "0-20%" },
    { min: 0.2, max: 0.4, label: "20-40%" },
    { min: 0.4, max: 0.6, label: "40-60%" },
    { min: 0.6, max: 0.8, label: "60-80%" },
    { min: 0.8, max: 1.01, label: "80-100%" },
  ];

  const distribution = await Promise.all(
    ranges.map(async (r) => {
      const count = await prisma.matchScore.count({
        where: {
          score: { gte: r.min, lt: r.max },
        },
      });
      return { range: r.label, count };
    })
  );

  return NextResponse.json({
    totalMatches,
    avgScore: avgResult._avg.score ? Number(avgResult._avg.score) : 0,
    highMatches,
    creatorsWithVector: Number(creatorsWithVector[0]?.count ?? 0),
    productsWithVector: Number(productsWithVector[0]?.count ?? 0),
    scoreDistribution: distribution,
  });
}
