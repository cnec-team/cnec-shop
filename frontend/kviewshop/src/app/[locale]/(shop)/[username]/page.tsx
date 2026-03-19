import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { CreatorShopPage } from '@/components/shop/creator-shop';
import { OrganizationJsonLd } from '@/components/seo/JsonLd';
import type { Metadata } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shop.cnec.kr';

interface ShopPageProps {
  params: Promise<{
    locale: string;
    username: string;
  }>;
}

async function getCreatorByShopId(shopId: string) {
  const creator = await prisma.creator.findFirst({
    where: {
      shopId: {
        equals: shopId,
        mode: 'insensitive',
      },
    },
  });

  return creator;
}

async function getShopItems(creatorId: string) {
  try {
    const items = await prisma.creatorShopItem.findMany({
      where: {
        creatorId,
        isVisible: true,
      },
      include: {
        product: {
          include: {
            brand: {
              select: {
                id: true,
                brandName: true,
                logoUrl: true,
              },
            },
          },
        },
        campaign: true,
      },
      orderBy: {
        displayOrder: 'asc',
      },
    });

    // Fetch campaign product prices for GONGGU items
    const campaignProductIds = items
      .filter((item) => item.campaignId && item.type === 'GONGGU')
      .map((item) => ({ campaignId: item.campaignId!, productId: item.productId }));

    let campaignProductMap: Record<string, { campaignPrice: number | null }> = {};

    if (campaignProductIds.length > 0) {
      const campaignProducts = await prisma.campaignProduct.findMany({
        where: {
          OR: campaignProductIds.map((cp) => ({
            campaignId: cp.campaignId,
            productId: cp.productId,
          })),
        },
      });

      for (const cp of campaignProducts) {
        campaignProductMap[`${cp.campaignId}-${cp.productId}`] = {
          campaignPrice: cp.campaignPrice ? Number(cp.campaignPrice) : null,
        };
      }
    }

    // Attach campaignProduct data to each item
    return items.map((item) => ({
      ...item,
      campaignProduct: item.campaignId
        ? campaignProductMap[`${item.campaignId}-${item.productId}`] ?? null
        : null,
    }));
  } catch (error) {
    console.error('Error fetching shop items:', error);
    return [];
  }
}

async function getCollections(creatorId: string) {
  try {
    const collections = await prisma.collection.findMany({
      where: {
        creatorId,
        isVisible: true,
      },
      orderBy: {
        displayOrder: 'asc',
      },
    });

    return collections;
  } catch (error) {
    console.error('Error fetching collections:', error);
    return [];
  }
}

export async function generateMetadata({ params }: ShopPageProps): Promise<Metadata> {
  const { username } = await params;
  const creator = await getCreatorByShopId(username);

  if (!creator) {
    return {
      title: 'Shop Not Found',
    };
  }

  const displayName = creator.displayName || creator.shopId;

  const shopDesc = creator.bio || `${displayName}이(가) 추천하는 뷰티 아이템을 만나보세요`;
  const ogImage = creator.coverImageUrl || creator.profileImageUrl;

  const canonicalUrl = `${BASE_URL}/${username}`;

  return {
    title: `${displayName}의 셀렉트샵 — CNEC`,
    description: shopDesc,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${displayName}의 셀렉트샵 — CNEC`,
      description: shopDesc,
      url: canonicalUrl,
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : [],
      type: 'website',
      siteName: 'CNEC Commerce',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${displayName}의 셀렉트샵 — CNEC`,
      description: shopDesc,
      images: ogImage ? [ogImage] : [],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function ShopPage({ params }: ShopPageProps) {
  const { username, locale } = await params;
  const creator = await getCreatorByShopId(username);

  if (!creator) {
    notFound();
  }

  const [shopItems, collections] = await Promise.all([
    getShopItems(creator.id),
    getCollections(creator.id),
  ]);

  const shopUrl = `${BASE_URL}/${username}`;

  return (
    <>
      <OrganizationJsonLd
        name={creator.displayName || creator.shopId || ''}
        url={shopUrl}
        imageUrl={creator.profileImageUrl || undefined}
        description={creator.bio || undefined}
      />
      <CreatorShopPage
        creator={creator as any}
        shopItems={shopItems as any}
        collections={collections as any}
        locale={locale}
      />
    </>
  );
}
