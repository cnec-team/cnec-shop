import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ shopId: string; productId: string }> }
) {
  try {
    const { shopId, productId } = await params;

    const creator = await prisma.creator.findFirst({
      where: {
        shopId: { equals: shopId, mode: 'insensitive' },
      },
      select: { id: true },
    });

    if (!creator) {
      return NextResponse.json({ error: '크리에이터를 찾을 수 없습니다' }, { status: 404 });
    }

    const contents = await prisma.creatorProductContent.findMany({
      where: {
        creatorId: creator.id,
        productId,
        isActive: true,
      },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        type: true,
        url: true,
        embedUrl: true,
        caption: true,
        sortOrder: true,
      },
    });

    return NextResponse.json(contents);
  } catch (error) {
    console.error('Failed to fetch shop product contents:', error);
    return NextResponse.json({ error: '조회에 실패했습니다' }, { status: 500 });
  }
}
