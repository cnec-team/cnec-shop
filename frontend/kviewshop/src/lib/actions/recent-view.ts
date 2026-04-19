'use server';

import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getOrCreateGuestCookieKey } from '@/lib/buyer/cookie';

async function getViewerIdentity() {
  const session = await auth();
  if (session?.user?.id && session.user.role === 'buyer') {
    const buyer = await prisma.buyer.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (buyer) return { buyerId: buyer.id, cookieKey: null };
  }
  const cookieKey = await getOrCreateGuestCookieKey();
  return { buyerId: null, cookieKey };
}

export async function recordRecentView(shopId: string, productId: string) {
  try {
    const { buyerId, cookieKey } = await getViewerIdentity();

    // 같은 상품 재방문 시 기존 삭제 후 새로 생성 (viewedAt 갱신)
    if (buyerId) {
      await prisma.recentView.deleteMany({
        where: { buyerId, shopId, productId },
      });
      await prisma.recentView.create({
        data: { buyerId, shopId, productId },
      });

      // 20개 초과 시 오래된 것 삭제
      const old = await prisma.recentView.findMany({
        where: { buyerId, shopId },
        orderBy: { viewedAt: 'desc' },
        skip: 20,
        select: { id: true },
      });
      if (old.length > 0) {
        await prisma.recentView.deleteMany({
          where: { id: { in: old.map((v) => v.id) } },
        });
      }
    } else if (cookieKey) {
      await prisma.recentView.deleteMany({
        where: { cookieKey, shopId, productId },
      });
      await prisma.recentView.create({
        data: { cookieKey, shopId, productId },
      });

      const old = await prisma.recentView.findMany({
        where: { cookieKey, shopId },
        orderBy: { viewedAt: 'desc' },
        skip: 20,
        select: { id: true },
      });
      if (old.length > 0) {
        await prisma.recentView.deleteMany({
          where: { id: { in: old.map((v) => v.id) } },
        });
      }
    }
  } catch (error) {
    // RecentView 기록 실패가 메인 로직에 영향 주지 않도록
    console.error('RecentView 기록 실패:', error);
  }
}

export async function getRecentViews(shopId: string, limit = 20) {
  const { buyerId, cookieKey } = await getViewerIdentity();

  const views = await prisma.recentView.findMany({
    where: buyerId ? { buyerId, shopId } : { cookieKey, shopId },
    include: {
      product: {
        include: {
          brand: {
            select: { id: true, brandName: true, logoUrl: true },
          },
        },
      },
    },
    orderBy: { viewedAt: 'desc' },
    take: limit,
  });

  return views.map((view) => ({
    ...view,
    product: {
      ...view.product,
      price: view.product.price ? Number(view.product.price) : null,
      originalPrice: view.product.originalPrice ? Number(view.product.originalPrice) : null,
      salePrice: view.product.salePrice ? Number(view.product.salePrice) : null,
      shippingFee: Number(view.product.shippingFee),
    },
  }));
}

export async function getAllRecentViews(limit = 50) {
  const { buyerId, cookieKey } = await getViewerIdentity();

  const views = await prisma.recentView.findMany({
    where: buyerId ? { buyerId } : { cookieKey },
    include: {
      product: {
        include: {
          brand: {
            select: { id: true, brandName: true, logoUrl: true },
          },
        },
      },
    },
    orderBy: { viewedAt: 'desc' },
    take: limit,
  });

  // Fetch creator info for each shopId
  const shopIds = [...new Set(views.map(v => v.shopId))];
  const creators = await prisma.creator.findMany({
    where: { id: { in: shopIds } },
    select: { id: true, username: true, displayName: true, profileImage: true },
  });
  const creatorMap = new Map(creators.map(c => [c.id, c]));

  return views.map((view) => ({
    ...view,
    creator: creatorMap.get(view.shopId) || { id: view.shopId, username: view.shopId, displayName: null, profileImage: null },
    product: {
      ...view.product,
      price: view.product.price ? Number(view.product.price) : null,
      originalPrice: view.product.originalPrice ? Number(view.product.originalPrice) : null,
      salePrice: view.product.salePrice ? Number(view.product.salePrice) : null,
      shippingFee: Number(view.product.shippingFee),
    },
  }));
}

export async function clearAllRecentViews() {
  const { buyerId, cookieKey } = await getViewerIdentity();

  await prisma.recentView.deleteMany({
    where: buyerId ? { buyerId } : { cookieKey },
  });

  return { success: true };
}

export async function getRecentViewCount(shopId: string): Promise<number> {
  const { buyerId, cookieKey } = await getViewerIdentity();

  return prisma.recentView.count({
    where: buyerId ? { buyerId, shopId } : { cookieKey, shopId },
  });
}

export async function clearRecentViews(shopId: string) {
  const { buyerId, cookieKey } = await getViewerIdentity();

  await prisma.recentView.deleteMany({
    where: buyerId ? { buyerId, shopId } : { cookieKey, shopId },
  });

  return { success: true };
}
