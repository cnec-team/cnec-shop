'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getOrCreateGuestCookieKey, getGuestCookieKey } from '@/lib/buyer/cookie';
import { revalidatePath } from 'next/cache';

async function getCartOwner() {
  const session = await auth();
  if (session?.user?.id && session.user.role === 'buyer') {
    // buyerId는 User.id가 아닌 Buyer.id
    const buyer = await prisma.buyer.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (buyer) {
      return { buyerId: buyer.id, cookieKey: null };
    }
  }
  const cookieKey = await getOrCreateGuestCookieKey();
  return { buyerId: null, cookieKey };
}

function getCartWhere(buyerId: string | null, cookieKey: string | null, shopId: string) {
  if (buyerId) {
    return { buyerId_shopId: { buyerId, shopId } };
  }
  return { cookieKey_shopId: { cookieKey: cookieKey!, shopId } };
}

export async function getCart(shopId: string) {
  const { buyerId, cookieKey } = await getCartOwner();
  const where = getCartWhere(buyerId, cookieKey, shopId);

  return prisma.cart.findUnique({
    where,
    include: {
      items: {
        include: {
          product: {
            include: {
              brand: {
                select: { id: true, brandName: true, logoUrl: true },
              },
            },
          },
          campaign: true,
        },
        orderBy: { addedAt: 'desc' },
      },
    },
  });
}

export async function getCartItemCount(shopId: string): Promise<number> {
  const { buyerId, cookieKey } = await getCartOwner();
  const where = getCartWhere(buyerId, cookieKey, shopId);

  const cart = await prisma.cart.findUnique({
    where,
    include: {
      items: { select: { quantity: true } },
    },
  });

  if (!cart) return 0;
  return cart.items.reduce((sum, item) => sum + item.quantity, 0);
}

export async function addToCart(input: {
  shopId: string;
  productId: string;
  campaignId?: string;
  quantity: number;
}) {
  const { buyerId, cookieKey } = await getCartOwner();
  const where = getCartWhere(buyerId, cookieKey, input.shopId);

  // Cart upsert
  const cart = await prisma.cart.upsert({
    where,
    create: {
      buyerId,
      cookieKey,
      shopId: input.shopId,
    },
    update: {},
  });

  // CartItem upsert — campaignId가 null인 경우 처리
  const campaignId = input.campaignId || null;

  // Prisma compound unique에서 null이 포함되면 upsert가 불안정하므로 find+create/update 패턴 사용
  const existing = await prisma.cartItem.findFirst({
    where: {
      cartId: cart.id,
      productId: input.productId,
      campaignId,
    },
  });

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: { increment: input.quantity } },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: input.productId,
        campaignId,
        quantity: input.quantity,
      },
    });
  }

  revalidatePath(`/`);
  return { success: true, cartId: cart.id };
}

export async function updateCartItem(itemId: string, updates: {
  quantity?: number;
  selected?: boolean;
}) {
  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: true },
  });
  if (!item) return { success: false };

  // 소유권 검증
  const { buyerId, cookieKey } = await getCartOwner();
  const isOwner =
    (buyerId && item.cart.buyerId === buyerId) ||
    (cookieKey && item.cart.cookieKey === cookieKey);
  if (!isOwner) return { success: false };

  await prisma.cartItem.update({
    where: { id: itemId },
    data: updates,
  });

  revalidatePath(`/`);
  return { success: true };
}

export async function removeCartItem(itemId: string) {
  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: true },
  });
  if (!item) return { success: false };

  const { buyerId, cookieKey } = await getCartOwner();
  const isOwner =
    (buyerId && item.cart.buyerId === buyerId) ||
    (cookieKey && item.cart.cookieKey === cookieKey);
  if (!isOwner) return { success: false };

  await prisma.cartItem.delete({ where: { id: itemId } });

  revalidatePath(`/`);
  return { success: true };
}

export async function clearCart(shopId: string) {
  const { buyerId, cookieKey } = await getCartOwner();
  const where = getCartWhere(buyerId, cookieKey, shopId);

  const cart = await prisma.cart.findUnique({ where });
  if (!cart) return { success: true };

  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  return { success: true };
}

export async function toggleCartItemSelection(itemIds: string[], selected: boolean) {
  const { buyerId, cookieKey } = await getCartOwner();

  // 소유권 검증을 위해 items를 가져옴
  const items = await prisma.cartItem.findMany({
    where: { id: { in: itemIds } },
    include: { cart: true },
  });

  const ownedItemIds = items
    .filter((item) => {
      return (
        (buyerId && item.cart.buyerId === buyerId) ||
        (cookieKey && item.cart.cookieKey === cookieKey)
      );
    })
    .map((item) => item.id);

  if (ownedItemIds.length === 0) return { success: false };

  await prisma.cartItem.updateMany({
    where: { id: { in: ownedItemIds } },
    data: { selected },
  });

  revalidatePath(`/`);
  return { success: true };
}

export async function syncGuestCartToUser(buyerId: string) {
  const cookieKey = await getGuestCookieKey();
  if (!cookieKey) return { merged: 0 };

  const guestCarts = await prisma.cart.findMany({
    where: { cookieKey },
    include: { items: true },
  });

  let merged = 0;

  for (const guestCart of guestCarts) {
    const userCart = await prisma.cart.upsert({
      where: { buyerId_shopId: { buyerId, shopId: guestCart.shopId } },
      create: { buyerId, shopId: guestCart.shopId },
      update: {},
    });

    for (const item of guestCart.items) {
      const existing = await prisma.cartItem.findFirst({
        where: {
          cartId: userCart.id,
          productId: item.productId,
          campaignId: item.campaignId,
        },
      });

      if (existing) {
        await prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: { increment: item.quantity } },
        });
      } else {
        await prisma.cartItem.create({
          data: {
            cartId: userCart.id,
            productId: item.productId,
            campaignId: item.campaignId,
            quantity: item.quantity,
            selected: item.selected,
          },
        });
      }
      merged++;
    }

    await prisma.cart.delete({ where: { id: guestCart.id } });
  }

  return { merged };
}
