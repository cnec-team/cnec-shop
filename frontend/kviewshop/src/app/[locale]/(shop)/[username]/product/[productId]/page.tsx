import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProductDetailPage } from '@/components/shop/product-detail';
import { ProductJsonLd } from '@/components/seo/JsonLd';
import type { Metadata } from 'next';
import type {
  Product,
  Campaign,
  CampaignProduct,
  Creator,
} from '@/types/database';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shop.cnec.kr';

interface ProductPageProps {
  params: Promise<{
    locale: string;
    username: string;
    productId: string;
  }>;
  searchParams: Promise<{
    campaign?: string;
  }>;
}

async function getCreatorByShopId(shopId: string) {
  const supabase = await createClient();

  const { data: creator, error } = await supabase
    .from('creators')
    .select('*')
    .ilike('shop_id', shopId)
    .maybeSingle();

  if (error || !creator) return null;
  return creator as Creator;
}

async function getProduct(productId: string) {
  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from('products')
    .select(`
      *,
      brand:brands (
        id,
        brand_name,
        logo_url
      )
    `)
    .eq('id', productId)
    .maybeSingle();

  if (error || !product) return null;
  return product as Product;
}

async function getCampaignProduct(productId: string, campaignId: string) {
  const supabase = await createClient();

  const { data: campaignProduct, error } = await supabase
    .from('campaign_products')
    .select(`
      *,
      campaign:campaigns (*)
    `)
    .eq('product_id', productId)
    .eq('campaign_id', campaignId)
    .maybeSingle();

  if (error || !campaignProduct) return null;
  return campaignProduct as CampaignProduct;
}

export async function generateMetadata({ params, searchParams }: ProductPageProps): Promise<Metadata> {
  const { productId, username } = await params;
  const { campaign: campaignId } = await searchParams;
  const [product, creator] = await Promise.all([
    getProduct(productId),
    getCreatorByShopId(username),
  ]);

  if (!product) {
    return { title: 'Product Not Found' };
  }

  const brandName = product.brand?.brand_name || '';
  const shopName = creator?.display_name || username;
  const discountPercent = product.original_price > product.sale_price
    ? Math.round(((product.original_price - product.sale_price) / product.original_price) * 100)
    : 0;
  const priceText = new Intl.NumberFormat('ko-KR').format(product.sale_price);
  const ogImage = (product as any).thumbnail_url || product.images?.[0];
  const canonicalUrl = `${BASE_URL}/${username}/product/${productId}`;

  // Check if this is a gonggu campaign product
  let campaignProduct: CampaignProduct | null = null;
  if (campaignId) {
    campaignProduct = await getCampaignProduct(productId, campaignId);
  }
  const campaign = campaignProduct?.campaign as Campaign | undefined;
  const isGonggu = !!campaign && campaign.type === 'GONGGU';

  // Build gonggu-aware title
  let ogTitle: string;
  if (isGonggu && campaign?.end_at) {
    const daysLeft = Math.max(0, Math.ceil((new Date(campaign.end_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
    const campaignPrice = campaignProduct?.campaign_price ?? product.sale_price;
    const gongguDiscount = Math.round(((product.original_price - campaignPrice) / product.original_price) * 100);
    ogTitle = `D-${daysLeft} ${product.name} ${gongguDiscount}% 공구`;
  } else {
    const titleSuffix = discountPercent > 0 ? ` - ${discountPercent}% OFF` : '';
    ogTitle = `${product.name}${titleSuffix} — ${shopName}`;
  }

  const ogDesc = isGonggu
    ? `한정 수량 | ${shopName}의 셀렉트샵`
    : `${brandName} ${product.name} ${priceText}원`;

  return {
    title: `${product.name} | CNEC`,
    description: ogDesc,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: ogTitle,
      description: ogDesc,
      url: canonicalUrl,
      images: ogImage ? [{ url: ogImage, width: 1200, height: 1200 }] : [],
      type: 'website',
      siteName: 'CNEC Commerce',
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDesc,
      images: ogImage ? [ogImage] : [],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const { locale, username, productId } = await params;
  const { campaign: campaignId } = await searchParams;

  const [creator, product] = await Promise.all([
    getCreatorByShopId(username),
    getProduct(productId),
  ]);

  if (!creator || !product) {
    notFound();
  }

  let campaignProduct: CampaignProduct | null = null;
  if (campaignId) {
    campaignProduct = await getCampaignProduct(productId, campaignId);
  }

  const productUrl = `${BASE_URL}/${username}/product/${productId}`;

  return (
    <>
      <ProductJsonLd product={product} shopUrl={productUrl} />
      <ProductDetailPage
        product={product}
        campaignProduct={campaignProduct}
        creator={creator}
        locale={locale}
        username={username}
      />
    </>
  );
}
