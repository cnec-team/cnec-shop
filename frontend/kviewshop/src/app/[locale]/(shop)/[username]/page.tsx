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
    const gongguItems = items.filter((item) => item.campaignId && item.type === 'GONGGU');

    let campaignProductMap: Record<string, number | null> = {};

    if (gongguItems.length > 0) {
      const campaignProducts = await prisma.campaignProduct.findMany({
        where: {
          OR: gongguItems.map((item) => ({
            campaignId: item.campaignId!,
            productId: item.productId,
          })),
        },
      });

      for (const cp of campaignProducts) {
        campaignProductMap[`${cp.campaignId}-${cp.productId}`] = cp.campaignPrice
          ? Number(cp.campaignPrice)
          : null;
      }
    }

    // Serialize: convert Decimal→number, Date→string for client component
    return items.map((item) => {
      const product = item.product;
      const campaign = item.campaign;

      return {
        id: item.id,
        creatorId: item.creatorId,
        productId: item.productId,
        campaignId: item.campaignId,
        type: item.type,
        collectionId: item.collectionId,
        displayOrder: item.displayOrder,
        isVisible: item.isVisible,
        product: product
          ? {
              id: product.id,
              name: product.name,
              nameKo: product.nameKo,
              nameEn: product.nameEn,
              originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
              salePrice: product.salePrice ? Number(product.salePrice) : null,
              images: product.images,
              imageUrl: product.imageUrl,
              brand: product.brand
                ? { id: product.brand.id, brandName: product.brand.brandName, logoUrl: product.brand.logoUrl }
                : null,
            }
          : null,
        campaign: campaign
          ? {
              id: campaign.id,
              title: campaign.title,
              status: campaign.status,
              endAt: campaign.endAt?.toISOString() ?? null,
              commissionRate: Number(campaign.commissionRate),
            }
          : null,
        campaignProduct: item.campaignId
          ? { campaignPrice: campaignProductMap[`${item.campaignId}-${item.productId}`] ?? null }
          : null,
      };
    });
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

    // Serialize: strip Date fields for client component
    return collections.map((col) => ({
      id: col.id,
      name: col.name,
      description: col.description,
      isVisible: col.isVisible,
      displayOrder: col.displayOrder,
    }));
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

  // Serialize creator: convert Decimal/Date to plain types for client component
  const serializedCreator = {
    id: creator.id,
    shopId: creator.shopId,
    displayName: creator.displayName,
    bio: creator.bio,
    profileImageUrl: creator.profileImageUrl,
    coverImageUrl: creator.coverImageUrl,
    bannerImageUrl: creator.bannerImageUrl,
    bannerLink: creator.bannerLink,
    instagramHandle: creator.instagramHandle,
    youtubeHandle: creator.youtubeHandle,
    tiktokHandle: creator.tiktokHandle,
    skinType: creator.skinType,
    personalColor: creator.personalColor,
    skinConcerns: creator.skinConcerns,
    scalpConcerns: creator.scalpConcerns,
  };

  return (
    <>
      <OrganizationJsonLd
        name={creator.displayName || creator.shopId || ''}
        url={shopUrl}
        imageUrl={creator.profileImageUrl || undefined}
        description={creator.bio || undefined}
      />
      <CreatorShopPage
        creator={serializedCreator}
        shopItems={shopItems}
        collections={collections}
        locale={locale}
      />
    </>
  );
}
