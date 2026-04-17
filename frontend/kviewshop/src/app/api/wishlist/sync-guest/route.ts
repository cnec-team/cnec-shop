import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { syncGuestWishlistToUser } from '@/lib/actions/wishlist';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'buyer') {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const buyer = await prisma.buyer.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!buyer) {
      return NextResponse.json({ error: '구매자 정보 없음' }, { status: 404 });
    }

    const body = await req.json();
    const items = body.items as { shopId: string; productId: string }[];
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Invalid items' }, { status: 400 });
    }

    const result = await syncGuestWishlistToUser(buyer.id, items);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Guest wishlist sync error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
