import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params;

  const matches = await prisma.matchScore.findMany({
    where: { productId },
    orderBy: { score: "desc" },
    take: 20,
    include: {
      creator: {
        select: {
          id: true,
          username: true,
          displayName: true,
          profileImageUrl: true,
          igFollowers: true,
          skinType: true,
          cnecIsPartner: true,
        },
      },
    },
  });

  return NextResponse.json({
    matches: matches.map((m) => ({
      creatorId: m.creatorId,
      score: Number(m.score),
      reasons: m.matchReasons,
      computedAt: m.computedAt,
      creator: {
        id: m.creator.id,
        username: m.creator.username,
        displayName: m.creator.displayName,
        profileImageUrl: m.creator.profileImageUrl,
        igFollowers: m.creator.igFollowers,
        skinType: m.creator.skinType,
        isPartner: m.creator.cnecIsPartner,
      },
    })),
  });
}
