import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth-helpers';
import { updateProductPrices } from '@/lib/price/price-updater';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== 'creator') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { productId } = await params;

  // Rate limit: 1 hour per product
  const recentUpdate = await prisma.productPriceData.findFirst({
    where: {
      productId,
      channel: 'NAVER_API',
      crawledAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
    },
    select: { id: true },
  });

  if (recentUpdate) {
    return NextResponse.json(
      { error: '1시간 후 다시 시도해주세요' },
      { status: 429 }
    );
  }

  try {
    const updated = await updateProductPrices(productId);

    if (!updated) {
      return NextResponse.json(
        { error: '네이버 쇼핑 검색 결과가 없습니다', updated: false },
        { status: 200 }
      );
    }

    return NextResponse.json({ success: true, updated: true });
  } catch (err) {
    console.error('Price refresh failed:', err);
    return NextResponse.json(
      { error: '가격 업데이트에 실패했어요' },
      { status: 500 }
    );
  }
}
