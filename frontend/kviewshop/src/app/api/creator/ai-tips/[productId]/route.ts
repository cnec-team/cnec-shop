import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth-helpers';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== 'creator') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { productId } = await params;

  const tips = await prisma.aiGonguTip.findMany({
    where: { productId },
    orderBy: { generatedAt: 'desc' },
    take: 3,
  });

  return NextResponse.json({
    tips: tips.map((t) => ({
      id: t.id,
      strategy: t.strategy,
      hook: t.hook,
      target: t.targetMessage,
      estimatedCvr: t.estimatedCvr,
      caption: t.caption,
      hashtags: t.hashtags,
      reasoning: t.reasoning,
      generatedAt: t.generatedAt.toISOString(),
    })),
  });
}
