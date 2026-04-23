import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

/**
 * 성분 마스터 전체 목록 반환 (카테고리 탭 브라우징용)
 * tier, efficacy 필드는 클라이언트로 전달하지 않음 (보안 + 월권 방지)
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ingredients = await prisma.ingredientMaster.findMany({
      orderBy: [{ tier: 'asc' }, { koName: 'asc' }],
      select: {
        id: true,
        koName: true,
        enName: true,
        category: true,
      },
    });

    return NextResponse.json({ items: ingredients });
  } catch (error) {
    console.error('[ingredients] error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
