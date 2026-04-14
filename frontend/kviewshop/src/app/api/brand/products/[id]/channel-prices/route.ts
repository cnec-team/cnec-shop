import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth-helpers';

interface ChannelInput {
  name: string;
  price: number;
  url?: string;
}

interface RequestBody {
  channels: ChannelInput[];
  isExclusive: boolean;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== 'brand_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: productId } = await params;

  const brand = await prisma.brand.findFirst({
    where: { userId: authUser.id },
    select: { id: true },
  });
  if (!brand) {
    return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
  }

  const product = await prisma.product.findFirst({
    where: { id: productId, brandId: brand.id },
    select: { id: true, salePrice: true, price: true },
  });
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  const body: RequestBody = await request.json();
  const { channels, isExclusive } = body;

  // Filter channels with valid prices
  const validChannels = channels.filter((c) => c.name && c.price > 0);

  // Delete existing brand-input price data for this product
  await prisma.productPriceData.deleteMany({
    where: { productId, channel: 'BRAND_INPUT' },
  });

  // Insert new channel prices
  if (validChannels.length > 0) {
    await prisma.productPriceData.createMany({
      data: validChannels.map((c) => ({
        productId,
        channel: 'BRAND_INPUT' as const,
        channelName: c.name,
        price: c.price,
        url: c.url || null,
        isLowest: false,
      })),
    });
  }

  // Calculate badge
  const cnecPrice = Number(product.salePrice ?? product.price ?? 0);
  let badgeType: 'LOWEST' | 'EXCLUSIVE' | 'CAUTION' | 'UNKNOWN';
  let message: string | null = null;

  if (isExclusive) {
    badgeType = 'EXCLUSIVE';
    message = '크넥샵 독점 구성';
  } else if (validChannels.length === 0) {
    badgeType = 'UNKNOWN';
    message = null;
  } else {
    const lowestChannelPrice = Math.min(...validChannels.map((c) => c.price));
    if (cnecPrice > 0 && cnecPrice < lowestChannelPrice) {
      badgeType = 'LOWEST';
      message = `시중 대비 ₩${(lowestChannelPrice - cnecPrice).toLocaleString()} 혜택`;
    } else {
      badgeType = 'CAUTION';
      message = '다른 채널에서 더 낮은 가격이 있어요';
    }
  }

  // Update lowest flags
  if (validChannels.length > 0) {
    const lowestPrice = Math.min(...validChannels.map((c) => c.price));
    const allPriceData = await prisma.productPriceData.findMany({
      where: { productId },
    });
    for (const pd of allPriceData) {
      const isLowest = Number(pd.price) === lowestPrice;
      if (pd.isLowest !== isLowest) {
        await prisma.productPriceData.update({
          where: { id: pd.id },
          data: { isLowest },
        });
      }
    }
  }

  // Upsert badge
  await prisma.priceBadge.upsert({
    where: { productId },
    create: { productId, badgeType, message },
    update: { badgeType, message },
  });

  return NextResponse.json({ success: true, badgeType, message });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getAuthUser();
  if (!authUser || authUser.role !== 'brand_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: productId } = await params;

  const brand = await prisma.brand.findFirst({
    where: { userId: authUser.id },
    select: { id: true },
  });
  if (!brand) {
    return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
  }

  const product = await prisma.product.findFirst({
    where: { id: productId, brandId: brand.id },
    select: { id: true },
  });
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  const [priceData, badge] = await Promise.all([
    prisma.productPriceData.findMany({
      where: { productId, channel: 'BRAND_INPUT' },
      orderBy: { price: 'asc' },
    }),
    prisma.priceBadge.findUnique({ where: { productId } }),
  ]);

  return NextResponse.json({
    channels: priceData.map((p) => ({
      name: p.channelName,
      price: Number(p.price),
      url: p.url,
    })),
    isExclusive: badge?.badgeType === 'EXCLUSIVE',
    badge: badge ? { type: badge.badgeType, message: badge.message } : null,
  });
}
