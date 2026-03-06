import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CreatorShopPage } from '@/components/shop/creator-shop';
import { OrganizationJsonLd } from '@/components/seo/JsonLd';
import type { Metadata } from 'next';
import type {
  Creator,
  CreatorShopItem,
  Collection,
  Product,
  Campaign,
  CampaignProduct,
} from '@/types/database';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shop.cnec.kr';

interface ShopPageProps {
  params: Promise<{
    locale: string;
    username: string;
  }>;
}

async function getCreatorByShopId(shopId: string) {
  const supabase = await createClient();

  const { data: creator, error } = await supabase
    .from('creators')
    .select('*')
    .ilike('shop_id', shopId)
    .maybeSingle();

  if (error || !creator) {
    return null;
  }

  return creator as Creator;
}

async function getShopItems(creatorId: string) {
  const supabase = await createClient();

  const { data: items, error } = await supabase
    .from('creator_shop_items')
    .select(`
      *,
      product:products (
        *,
        brand:brands (
          id,
          brand_name,
          logo_url
        )
      ),
      campaign:campaigns (
        *
      ),
      campaign_product:campaign_products (
        *
      )
    `)
    .eq('creator_id', creatorId)
    .eq('is_visible', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching shop items:', error);
    return [];
  }

  return (items || []) as CreatorShopItem[];
}

async function getCollections(creatorId: string) {
  const supabase = await createClient();

  const { data: collections, error } = await supabase
    .from('collections')
    .select('*')
    .eq('creator_id', creatorId)
    .eq('is_visible', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Error fetching collections:', error);
    return [];
  }

  return (collections || []) as Collection[];
}

export async function generateMetadata({ params }: ShopPageProps): Promise<Metadata> {
  const { username } = await params;
  const creator = await getCreatorByShopId(username);

  if (!creator) {
    return {
      title: 'Shop Not Found',
    };
  }

  const displayName = creator.display_name || creator.shop_id;

  const shopDesc = creator.bio || `${displayName}이(가) 추천하는 뷰티 아이템을 만나보세요`;
  const ogImage = creator.cover_image_url || creator.profile_image_url;

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
        name={creator.display_name || creator.shop_id}
        url={shopUrl}
        imageUrl={creator.profile_image_url || undefined}
        description={creator.bio || undefined}
      />
      <CreatorShopPage
        creator={creator}
        shopItems={shopItems}
        collections={collections}
        locale={locale}
      />
    </>
  );
}
