import { prisma } from '@/lib/db';
import { searchNaverPrice } from './naver-shopping';

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function updateProductPrices(productId: string): Promise<boolean> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      name: true,
      salePrice: true,
      price: true,
      brand: { select: { brandName: true } },
      priceBadge: { select: { badgeType: true } },
    },
  });

  if (!product || !product.name) return false;

  const naverResult = await searchNaverPrice(
    product.name,
    product.brand?.brandName ?? undefined
  );

  if (!naverResult) return false;

  // Upsert NAVER_API price data (keep only one per product)
  const existing = await prisma.productPriceData.findFirst({
    where: { productId, channel: 'NAVER_API' },
  });

  if (existing) {
    await prisma.productPriceData.update({
      where: { id: existing.id },
      data: {
        price: naverResult.lowestPrice,
        channelName: `네이버 쇼핑 (${naverResult.mallName})`,
        url: naverResult.productUrl,
        crawledAt: new Date(),
        isLowest: false,
      },
    });
  } else {
    await prisma.productPriceData.create({
      data: {
        productId,
        channel: 'NAVER_API',
        channelName: `네이버 쇼핑 (${naverResult.mallName})`,
        price: naverResult.lowestPrice,
        url: naverResult.productUrl,
        isLowest: false,
      },
    });
  }

  // Recalculate badge using ALL price data
  await recalculateBadge(productId);

  return true;
}

async function recalculateBadge(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { salePrice: true, price: true },
  });
  if (!product) return;

  const currentBadge = await prisma.priceBadge.findUnique({
    where: { productId },
  });

  // If EXCLUSIVE, keep it (brand explicitly set)
  if (currentBadge?.badgeType === 'EXCLUSIVE') return;

  const allPrices = await prisma.productPriceData.findMany({
    where: { productId },
    select: { price: true, id: true },
  });

  if (allPrices.length === 0) {
    await prisma.priceBadge.upsert({
      where: { productId },
      create: { productId, badgeType: 'UNKNOWN', message: null },
      update: { badgeType: 'UNKNOWN', message: null },
    });
    return;
  }

  const cnecPrice = Number(product.salePrice ?? product.price ?? 0);
  const channelPrices = allPrices.map((p) => Number(p.price));
  const lowestChannel = Math.min(...channelPrices);

  let badgeType: 'LOWEST' | 'CAUTION' | 'UNKNOWN';
  let message: string | null = null;

  if (cnecPrice > 0 && cnecPrice < lowestChannel) {
    badgeType = 'LOWEST';
    message = `시중 대비 ₩${(lowestChannel - cnecPrice).toLocaleString()} 혜택`;
  } else {
    badgeType = 'CAUTION';
    message = '다른 채널에서 더 낮은 가격이 있어요';
  }

  // Update isLowest flags
  for (const pd of allPrices) {
    const isLowest = Number(pd.price) === lowestChannel;
    await prisma.productPriceData.update({
      where: { id: pd.id },
      data: { isLowest },
    });
  }

  await prisma.priceBadge.upsert({
    where: { productId },
    create: { productId, badgeType, message },
    update: { badgeType, message },
  });
}

interface UpdateResult {
  total: number;
  updated: number;
  failed: number;
  skipped: number;
}

export async function updateAllProductPrices(): Promise<UpdateResult> {
  const products = await prisma.product.findMany({
    where: { isActive: true, name: { not: null } },
    select: { id: true },
  });

  const result: UpdateResult = { total: products.length, updated: 0, failed: 0, skipped: 0 };

  for (const product of products) {
    try {
      const updated = await updateProductPrices(product.id);
      if (updated) {
        result.updated++;
      } else {
        result.skipped++;
      }
    } catch (err) {
      console.error(`Price update failed for ${product.id}:`, err);
      result.failed++;
    }

    // Rate limit: 500ms between calls
    await delay(500);
  }

  return result;
}
