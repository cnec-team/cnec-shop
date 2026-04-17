'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { revalidatePath } from 'next/cache';

async function requireBuyer(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'buyer') {
    throw new Error('로그인이 필요합니다');
  }
  const buyer = await prisma.buyer.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!buyer) throw new Error('구매자 정보를 찾을 수 없습니다');
  return buyer.id;
}

export async function toggleWishlist(input: { shopId: string; productId: string }) {
  const buyerId = await requireBuyer();

  const existing = await prisma.buyerWishlist.findUnique({
    where: {
      buyerId_productId_creatorId: {
        buyerId,
        productId: input.productId,
        creatorId: input.shopId,
      },
    },
  });

  if (existing) {
    await prisma.buyerWishlist.delete({ where: { id: existing.id } });
    revalidatePath(`/`);
    return { wishlisted: false };
  }

  await prisma.buyerWishlist.create({
    data: {
      buyerId,
      productId: input.productId,
      creatorId: input.shopId,
    },
  });
  revalidatePath(`/`);
  return { wishlisted: true };
}

export async function getWishlist(shopId: string) {
  const buyerId = await requireBuyer();
  const items = await prisma.buyerWishlist.findMany({
    where: { buyerId, creatorId: shopId },
    include: {
      product: {
        include: {
          brand: {
            select: { id: true, brandName: true, logoUrl: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return items.map((item) => ({
    ...item,
    product: {
      ...item.product,
      price: item.product.price ? Number(item.product.price) : null,
      originalPrice: item.product.originalPrice ? Number(item.product.originalPrice) : null,
      salePrice: item.product.salePrice ? Number(item.product.salePrice) : null,
      shippingFee: Number(item.product.shippingFee),
    },
  }));
}

export async function getWishlistCount(shopId: string): Promise<number> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'buyer') return 0;
  const buyer = await prisma.buyer.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!buyer) return 0;

  return prisma.buyerWishlist.count({
    where: { buyerId: buyer.id, creatorId: shopId },
  });
}

export async function isProductWishlisted(shopId: string, productId: string): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'buyer') return false;
  const buyer = await prisma.buyer.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!buyer) return false;

  const exists = await prisma.buyerWishlist.findUnique({
    where: {
      buyerId_productId_creatorId: {
        buyerId: buyer.id,
        productId,
        creatorId: shopId,
      },
    },
    select: { id: true },
  });

  return !!exists;
}

export async function removeFromWishlist(wishlistId: string) {
  const buyerId = await requireBuyer();
  const item = await prisma.buyerWishlist.findUnique({
    where: { id: wishlistId },
    select: { buyerId: true },
  });
  if (!item || item.buyerId !== buyerId) return { success: false };

  await prisma.buyerWishlist.delete({ where: { id: wishlistId } });
  revalidatePath(`/`);
  return { success: true };
}

export async function removeWishlistItems(wishlistIds: string[]) {
  const buyerId = await requireBuyer();
  await prisma.buyerWishlist.deleteMany({
    where: {
      id: { in: wishlistIds },
      buyerId,
    },
  });
  revalidatePath(`/`);
  return { success: true };
}

export async function moveWishlistToCart(wishlistIds: string[]) {
  const buyerId = await requireBuyer();

  const items = await prisma.buyerWishlist.findMany({
    where: { id: { in: wishlistIds }, buyerId },
    include: { product: true },
  });

  let moved = 0;
  for (const item of items) {
    // Cart upsert
    const cart = await prisma.cart.upsert({
      where: { buyerId_shopId: { buyerId, shopId: item.creatorId } },
      create: { buyerId, shopId: item.creatorId },
      update: {},
    });

    // CartItem upsert
    const existingCartItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: item.productId,
        campaignId: null,
      },
    });

    if (!existingCartItem) {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: item.productId,
          quantity: 1,
        },
      });
    }
    moved++;
  }

  // 찜에서 제거
  await prisma.buyerWishlist.deleteMany({
    where: { id: { in: wishlistIds }, buyerId },
  });

  revalidatePath(`/`);
  return { moved };
}

export async function syncGuestWishlistToUser(
  buyerId: string,
  items: { shopId: string; productId: string }[]
) {
  let added = 0;
  for (const item of items) {
    try {
      await prisma.buyerWishlist.create({
        data: {
          buyerId,
          productId: item.productId,
          creatorId: item.shopId,
        },
      });
      added++;
    } catch {
      // 이미 있으면 무시 (unique constraint)
    }
  }
  return { added };
}
