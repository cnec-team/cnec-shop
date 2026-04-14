import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth-helpers';

export async function GET() {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== 'creator') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const creator = await prisma.creator.findFirst({
    where: { userId: authUser.id },
    select: { id: true },
  });
  if (!creator) {
    return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
  }

  const shopItems = await prisma.creatorShopItem.findMany({
    where: { creatorId: creator.id },
    select: { productId: true },
  });

  const productIds = shopItems.map((s) => s.productId);
  if (productIds.length === 0) {
    return NextResponse.json({ products: [] });
  }

  const badges = await prisma.priceBadge.findMany({
    where: { productId: { in: productIds } },
  });

  const badgeMap: Record<string, { type: string; message: string | null }> = {};
  for (const b of badges) {
    badgeMap[b.productId] = { type: b.badgeType, message: b.message };
  }

  const result = productIds.map((pid) => ({
    productId: pid,
    badge: badgeMap[pid] ?? { type: 'UNKNOWN', message: null },
  }));

  return NextResponse.json({ products: result });
}
