import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth-helpers';
import { generateGonguTips } from '@/lib/ai/gonggu-advisor';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== 'creator') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { productId } = await params;

  const creator = await prisma.creator.findFirst({
    where: { userId: authUser.id },
    select: { id: true },
  });

  try {
    const result = await generateGonguTips(productId, creator?.id);

    if (!result) {
      return NextResponse.json(
        { error: '준비 중인 기능이에요', code: 'NOT_CONFIGURED' },
        { status: 503 }
      );
    }

    return NextResponse.json({
      tips: result.tips.map((t) => ({
        strategy: t.strategy,
        hook: t.hook,
        target: t.target,
        estimatedCvr: t.estimated_cvr,
        caption: t.caption,
        hashtags: t.hashtags,
        reasoning: t.reasoning,
      })),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '';
    if (message === 'RATE_LIMITED') {
      return NextResponse.json(
        { error: '24시간 후 다시 시도해주세요', code: 'RATE_LIMITED' },
        { status: 429 }
      );
    }
    console.error('AI tip generation failed:', err);
    return NextResponse.json(
      { error: '팁 생성에 실패했어요. 잠시 후 다시 시도해주세요' },
      { status: 500 }
    );
  }
}
