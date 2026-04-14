import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    // Find the creator for this user
    const creator = await prisma.creator.findFirst({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!creator) {
      return NextResponse.json({ error: '크리에이터 정보를 찾을 수 없습니다' }, { status: 403 });
    }

    const { itemId } = await params;

    // Find the shop item
    const shopItem = await prisma.creatorShopItem.findUnique({
      where: { id: itemId },
      select: { id: true, creatorId: true, type: true, productId: true },
    });

    if (!shopItem) {
      return NextResponse.json({ error: '상품을 찾을 수 없습니다' }, { status: 404 });
    }

    // Verify ownership
    if (shopItem.creatorId !== creator.id) {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 });
    }

    // GONGGU items cannot be manually deleted
    if (shopItem.type === 'GONGGU') {
      return NextResponse.json(
        { error: '공구 상품은 캠페인 종료 후 자동으로 제거됩니다' },
        { status: 400 },
      );
    }

    // Hard delete the PICK item
    await prisma.creatorShopItem.delete({
      where: { id: itemId },
    });

    return NextResponse.json({
      success: true,
      message: '상품이 내 샵에서 제거되었습니다',
      productId: shopItem.productId,
    });
  } catch (error) {
    console.error('Shop item delete error:', error);
    return NextResponse.json(
      { error: '삭제 중 오류가 발생했습니다' },
      { status: 500 },
    );
  }
}
