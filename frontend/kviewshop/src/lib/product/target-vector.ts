import { prisma } from "@/lib/db";

/**
 * 상품의 heroIngredients 기반으로 target_pain_vector를 자동 계산
 */
export async function calculateAndSaveProductVector(
  productId: string
): Promise<number[]> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      heroIngredients: true,
      targetPainPoints: true,
      productIngredients: {
        where: { isHero: true },
        include: { ingredient: true },
      },
    },
  });

  if (!product) return [0, 0, 0, 0, 0, 0, 0, 0];

  const ingredients = product.productIngredients.map((pi) => pi.ingredient);

  if (ingredients.length === 0) return [0, 0, 0, 0, 0, 0, 0, 0];

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
  for (let i = 0; i < 8; i++) {
    avgVector[i] = Math.round((avgVector[i] / ingredients.length) * 100) / 100;
  }

  // targetPainPoints가 명시적으로 선택된 경우 부스트
  const codes = ["P01", "P02", "P03", "P04", "P05", "P06", "P07", "P08"];
  for (const tp of product.targetPainPoints) {
    const idx = codes.indexOf(tp);
    if (idx >= 0) {
      avgVector[idx] = Math.min(1, avgVector[idx] * 1.2 + 0.1);
    }
  }

  const vectorStr = `[${avgVector.join(",")}]`;
  await prisma.$executeRawUnsafe(
    `UPDATE products SET target_pain_vector = $1::vector WHERE id = $2`,
    vectorStr,
    productId
  );

  return avgVector;
}
