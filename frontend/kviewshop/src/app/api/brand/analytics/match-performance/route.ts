import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const brand = await prisma.brand.findFirst({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!brand) {
    return NextResponse.json({ error: "Not a brand" }, { status: 403 });
  }

  // 브랜드 상품들의 매칭 현황
  const products = await prisma.product.findMany({
    where: { brandId: brand.id, isActive: true },
    select: { id: true, name: true, targetPainPoints: true },
  });

  const productIds = products.map((p) => p.id);

  if (productIds.length === 0) {
    return NextResponse.json({
      avgScore: 0,
      totalMatches: 0,
      products: [],
      topCreators: [],
    });
  }

  const [avgResult, totalMatches, topCreators] = await Promise.all([
    prisma.matchScore.aggregate({
      where: { productId: { in: productIds } },
      _avg: { score: true },
    }),
    prisma.matchScore.count({
      where: { productId: { in: productIds } },
    }),
    prisma.matchScore.findMany({
      where: { productId: { in: productIds } },
      orderBy: { score: "desc" },
      take: 10,
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profileImageUrl: true,
            igFollowers: true,
          },
        },
        product: {
          select: { name: true },
        },
      },
    }),
  ]);

  // 상품별 매칭 통계
  const productStats = await Promise.all(
    products.map(async (p) => {
      const stats = await prisma.matchScore.aggregate({
        where: { productId: p.id },
        _avg: { score: true },
        _count: true,
      });
      const highCount = await prisma.matchScore.count({
        where: { productId: p.id, score: { gte: 0.7 } },
      });
      return {
        id: p.id,
        name: p.name,
        avgScore: stats._avg.score ? Number(stats._avg.score) : 0,
        totalMatches: stats._count,
        highMatches: highCount,
        targetPainPoints: p.targetPainPoints,
      };
    })
  );

  return NextResponse.json({
    avgScore: avgResult._avg.score ? Number(avgResult._avg.score) : 0,
    totalMatches,
    products: productStats.sort((a, b) => b.avgScore - a.avgScore),
    topCreators: topCreators.map((tc) => ({
      score: Number(tc.score),
      reasons: tc.matchReasons,
      productName: tc.product.name,
      creator: {
        id: tc.creator.id,
        username: tc.creator.username,
        displayName: tc.creator.displayName,
        profileImageUrl: tc.creator.profileImageUrl,
        igFollowers: tc.creator.igFollowers,
      },
    })),
  });
}
