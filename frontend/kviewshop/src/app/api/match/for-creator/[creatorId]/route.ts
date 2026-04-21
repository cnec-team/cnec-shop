import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ creatorId: string }> }
) {
  const { creatorId } = await params;

  const matches = await prisma.matchScore.findMany({
    where: { creatorId },
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
          brand: {
            select: {
              id: true,
              companyName: true,
            },
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
      computedAt: m.computedAt,
      product: {
        id: m.product.id,
        name: m.product.name,
        image: m.product.images[0] ?? null,
        salePrice: m.product.salePrice ? Number(m.product.salePrice) : null,
        originalPrice: m.product.originalPrice
          ? Number(m.product.originalPrice)
          : null,
        targetPainPoints: m.product.targetPainPoints,
        brandName: m.product.brand.companyName,
      },
    })),
  });
}
