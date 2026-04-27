import { prisma } from "@/lib/db";

/**
 * 크리에이터의 CreatorPainPoint 레코드를 8차원 벡터로 변환하고 DB에 저장
 * 공식: vector[i] = primary면 severity/5, secondary면 severity/5 * 0.6
 */
export async function calculateAndSaveCreatorVector(
  creatorId: string
): Promise<number[]> {
  const points = await prisma.creatorPainPoint.findMany({
    where: { creatorId },
  });

  const codes = ["P01", "P02", "P03", "P04", "P05", "P06", "P07", "P08"];
  const vector = codes.map((code) => {
    const p = points.find((x) => x.painPointCode === code);
    if (!p) return 0;
    const base = p.severity / 5;
    return p.priority === "primary"
      ? Math.round(base * 100) / 100
      : Math.round(base * 0.6 * 100) / 100;
  });

  const vectorStr = `[${vector.join(",")}]`;
  await prisma.$executeRawUnsafe(
    `UPDATE creators SET pain_point_vector = $1::vector, pain_point_vector_updated_at = NOW() WHERE id = $2`,
    vectorStr,
    creatorId
  );

  return vector;
}
