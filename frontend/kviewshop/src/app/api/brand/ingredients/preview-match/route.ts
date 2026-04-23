import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

/**
 * 선택된 성분 ID 배열 → 예상 매칭 점수 8차원 반환
 * 기존 target-vector.ts 로직을 재활용, 실시간 프리뷰용
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ingredientIds } = await req.json();

    if (!Array.isArray(ingredientIds) || ingredientIds.length === 0) {
      return NextResponse.json({
        scores: { p01: 0, p02: 0, p03: 0, p04: 0, p05: 0, p06: 0, p07: 0, p08: 0 },
      });
    }

    const ingredients = await prisma.ingredientMaster.findMany({
      where: { id: { in: ingredientIds } },
      select: {
        id: true,
        efficacyP01: true,
        efficacyP02: true,
        efficacyP03: true,
        efficacyP04: true,
        efficacyP05: true,
        efficacyP06: true,
        efficacyP07: true,
        efficacyP08: true,
        tier: true,
      },
    });

    if (ingredients.length === 0) {
      return NextResponse.json({
        scores: { p01: 0, p02: 0, p03: 0, p04: 0, p05: 0, p06: 0, p07: 0, p08: 0 },
      });
    }

    // Tier 가중치 (내부 계산에만 사용, UI 노출 X)
    const tierWeight = (tier: string) => {
      if (tier === 'S') return 1.2;
      if (tier === 'A') return 1.0;
      return 0.85;
    };

    const axes = ['P01', 'P02', 'P03', 'P04', 'P05', 'P06', 'P07', 'P08'] as const;
    const scores: Record<string, number> = {};

    for (const axis of axes) {
      const key = `efficacy${axis}` as keyof typeof ingredients[0];
      let weightedSum = 0;
      let weightTotal = 0;

      for (const ing of ingredients) {
        const value = Number(ing[key]);
        const w = tierWeight(ing.tier);
        weightedSum += value * w;
        weightTotal += w;
      }

      const avg = weightTotal > 0 ? weightedSum / weightTotal : 0;
      scores[axis.toLowerCase()] = Math.round(avg * 100);
    }

    return NextResponse.json({ scores });
  } catch (error) {
    console.error('[preview-match] error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
