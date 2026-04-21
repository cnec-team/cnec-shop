import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { ingredientIds } = (await req.json()) as {
    ingredientIds: string[];
  };
  if (!ingredientIds?.length)
    return NextResponse.json({ recommendations: [] });

  const ingredients = await prisma.ingredientMaster.findMany({
    where: { id: { in: ingredientIds } },
    select: {
      koName: true,
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

  if (!ingredients.length)
    return NextResponse.json({ recommendations: [] });

  // 성분들의 평균 효능 벡터 계산
  const avgVector = [0, 0, 0, 0, 0, 0, 0, 0];
  for (const ing of ingredients) {
    avgVector[0] += Number(ing.efficacyP01);
    avgVector[1] += Number(ing.efficacyP02);
    avgVector[2] += Number(ing.efficacyP03);
    avgVector[3] += Number(ing.efficacyP04);
    avgVector[4] += Number(ing.efficacyP05);
    avgVector[5] += Number(ing.efficacyP06);
    avgVector[6] += Number(ing.efficacyP07);
    avgVector[7] += Number(ing.efficacyP08);
  }
  for (let i = 0; i < 8; i++) avgVector[i] /= ingredients.length;

  const codes = ["P01", "P02", "P03", "P04", "P05", "P06", "P07", "P08"];
  const filtered = codes
    .map((code, i) => ({ code, strength: Math.round(avgVector[i] * 100) / 100 }))
    .filter((r) => r.strength >= 0.4)
    .sort((a, b) => b.strength - a.strength);

  const painPoints = await prisma.painPointMaster.findMany({
    where: { code: { in: filtered.map((r) => r.code) } },
  });

  const recommendations = filtered.map((r) => {
    const pp = painPoints.find((p) => p.code === r.code);
    return {
      ...r,
      koName: pp?.koName ?? "",
      shortName: pp?.shortName ?? "",
      iconName: pp?.iconName ?? "",
      strengthLabel:
        r.strength >= 0.8
          ? "매우 강함"
          : r.strength >= 0.6
            ? "강함"
            : r.strength >= 0.4
              ? "보통"
              : "",
    };
  });

  return NextResponse.json({ recommendations });
}
