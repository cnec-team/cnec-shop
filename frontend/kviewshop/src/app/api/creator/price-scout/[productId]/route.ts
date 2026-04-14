import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth-helpers';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== 'creator') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { productId } = await params;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      name: true,
      salePrice: true,
      price: true,
      originalPrice: true,
      thumbnailUrl: true,
      images: true,
    },
  });

  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  const [priceData, badge] = await Promise.all([
    prisma.productPriceData.findMany({
      where: { productId },
      orderBy: { price: 'asc' },
    }),
    prisma.priceBadge.findUnique({ where: { productId } }),
  ]);

  const cnecPrice = Number(product.salePrice ?? product.price ?? 0);
  const channels = priceData.map((p) => ({
    name: p.channelName,
    price: Number(p.price),
    url: p.url,
    isLowest: p.isLowest,
  }));

  const lowestChannelPrice = channels.length > 0
    ? Math.min(...channels.map((c) => c.price))
    : 0;

  const savings = lowestChannelPrice > cnecPrice && cnecPrice > 0
    ? lowestChannelPrice - cnecPrice
    : 0;

  return NextResponse.json({
    product: {
      id: product.id,
      name: product.name,
      cnecPrice,
      originalPrice: Number(product.originalPrice ?? 0),
      thumbnailUrl: product.thumbnailUrl || product.images?.[0] || null,
    },
    channels,
    badge: badge ? { type: badge.badgeType, message: badge.message } : { type: 'UNKNOWN', message: null },
    savings,
  });
}
