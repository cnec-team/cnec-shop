import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const creator = await prisma.creator.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!creator) {
    return NextResponse.json({ matches: [] });
  }

  const matches = await prisma.matchScore.findMany({
    where: { creatorId: creator.id },
    orderBy: { score: "desc" },
    take: 20,
    include: {
      product: {
        select: {
          id: true,
          name: true,
          images: true,
          salePrice: true,
          originalPrice: true,
          targetPainPoints: true,
          defaultCommissionRate: true,
          allowTrial: true,
          brand: {
            select: {
              id: true,
              companyName: true,
            },
          },
          productIngredients: {
            where: { isHero: true },
            include: {
              ingredient: {
                select: {
                  koName: true,
                  tier: true,
                  category: true,
                },
              },
            },
            take: 3,
          },
        },
      },
    },
  });

  return NextResponse.json({
    matches: matches.map((m) => ({
      productId: m.productId,
      score: Number(m.score),
      reasons: m.matchReasons,
      product: {
        id: m.product.id,
        name: m.product.name,
        image: m.product.images[0] ?? null,
        salePrice: m.product.salePrice ? Number(m.product.salePrice) : null,
        originalPrice: m.product.originalPrice
          ? Number(m.product.originalPrice)
          : null,
        commissionRate: m.product.defaultCommissionRate
          ? Number(m.product.defaultCommissionRate)
          : 0,
        targetPainPoints: m.product.targetPainPoints,
        allowTrial: m.product.allowTrial,
        brandName: m.product.brand.companyName,
        heroIngredients: m.product.productIngredients.map((pi) => ({
          name: pi.ingredient.koName,
          tier: pi.ingredient.tier,
          category: pi.ingredient.category,
        })),
      },
    })),
  });
}
