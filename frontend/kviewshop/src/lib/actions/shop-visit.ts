'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getOrCreateGuestCookieKey } from '@/lib/buyer/cookie';

export async function recordShopVisit(shopId: string, source?: string) {
  try {
    const session = await auth();
    let buyerId: string | null = null;
    if (session?.user?.id && session.user.role === 'buyer') {
      const buyer = await prisma.buyer.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      });
      buyerId = buyer?.id ?? null;
    }
    const cookieKey = buyerId ? null : await getOrCreateGuestCookieKey();

    // 1시간 내 중복 방문 방지
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const existing = await prisma.creatorShopVisit.findFirst({
      where: {
        shopId,
        ...(buyerId ? { buyerId } : { cookieKey }),
        visitedAt: { gte: oneHourAgo },
      },
    });
    if (existing) return;

    await prisma.creatorShopVisit.create({
      data: { buyerId, cookieKey, shopId, source },
    });
  } catch (error) {
    // 방문 기록 실패가 메인 로직에 영향 주지 않도록
    console.error('ShopVisit 기록 실패:', error);
  }
}
