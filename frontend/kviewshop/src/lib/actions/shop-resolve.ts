'use server';

import { prisma } from '@/lib/db';

/**
 * shopId (username, creator.shopId)에서 creator.id를 resolve.
 * 캐시된 맵을 사용하지 않으므로 매 호출마다 DB 조회.
 * 사용처: cart, wishlist, recent-view 등의 server action에서 username → creatorId 변환.
 */
export async function resolveCreatorId(shopIdOrUsername: string): Promise<string | null> {
  const creator = await prisma.creator.findFirst({
    where: {
      shopId: { equals: shopIdOrUsername, mode: 'insensitive' },
    },
    select: { id: true },
  });
  return creator?.id ?? null;
}
