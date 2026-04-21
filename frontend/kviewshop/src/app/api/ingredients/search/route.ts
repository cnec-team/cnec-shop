import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() || "";
  if (q.length < 1) return NextResponse.json({ items: [] });

  const items = await prisma.ingredientMaster.findMany({
    where: {
      OR: [
        { koName: { contains: q, mode: "insensitive" } },
        { enName: { contains: q, mode: "insensitive" } },
      ],
    },
    orderBy: [{ tier: "asc" }, { trendScore: "desc" }],
    take: 10,
    select: {
      id: true,
      koName: true,
      enName: true,
      category: true,
      tier: true,
      trendScore: true,
      description: true,
      efficacyP01: true,
      efficacyP02: true,
      efficacyP03: true,
      efficacyP04: true,
      efficacyP05: true,
      efficacyP06: true,
      efficacyP07: true,
      efficacyP08: true,
    },
  });

  const serialized = items.map((item) => ({
    ...item,
    efficacyP01: Number(item.efficacyP01),
    efficacyP02: Number(item.efficacyP02),
    efficacyP03: Number(item.efficacyP03),
    efficacyP04: Number(item.efficacyP04),
    efficacyP05: Number(item.efficacyP05),
    efficacyP06: Number(item.efficacyP06),
    efficacyP07: Number(item.efficacyP07),
    efficacyP08: Number(item.efficacyP08),
  }));

  return NextResponse.json({ items: serialized });
}
