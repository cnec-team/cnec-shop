import { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cnecshop.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/ko/no-shop-context`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/ko/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${BASE_URL}/ko/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${BASE_URL}/ko/refund-policy`, lastModified: now, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${BASE_URL}/ko/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/ko/support`, lastModified: now, changeFrequency: 'yearly', priority: 0.5 },
  ];

  try {
    const creators = await prisma.creator.findMany({
      where: {
        status: 'ACTIVE',
        shopId: { not: null },
      },
      select: { shopId: true, updatedAt: true },
    });

    for (const creator of creators) {
      entries.push({
        url: `${BASE_URL}/ko/${creator.shopId}`,
        lastModified: creator.updatedAt ? new Date(creator.updatedAt) : now,
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }

    const shopItems = await prisma.creatorShopItem.findMany({
      where: { isVisible: true },
      select: { productId: true, creatorId: true },
      take: 1000,
    });

    if (shopItems.length > 0) {
      const creatorIds = [...new Set(shopItems.map(item => item.creatorId))];
      const productIds = [...new Set(shopItems.map(item => item.productId))];

      const [creatorsData, productsData] = await Promise.all([
        prisma.creator.findMany({
          where: { id: { in: creatorIds } },
          select: { id: true, shopId: true },
        }),
        prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, updatedAt: true },
        }),
      ]);

      const creatorMap = new Map(creatorsData.map(c => [c.id, c.shopId]));
      const productMap = new Map(productsData.map(p => [p.id, p.updatedAt]));

      const seen = new Set<string>();
      for (const item of shopItems) {
        const shopId = creatorMap.get(item.creatorId);
        const productUpdated = productMap.get(item.productId);
        if (!shopId || !item.productId) continue;

        const key = `${shopId}/${item.productId}`;
        if (seen.has(key)) continue;
        seen.add(key);

        entries.push({
          url: `${BASE_URL}/ko/${shopId}/product/${item.productId}`,
          lastModified: productUpdated ? new Date(productUpdated) : now,
          changeFrequency: 'daily',
          priority: 0.7,
        });
      }
    }
  } catch (error) {
    console.error('Error generating sitemap:', error);
  }

  return entries;
}
