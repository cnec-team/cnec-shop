import Link from 'next/link';
import { prisma } from '@/lib/db';
import { CreatorCard } from '@/components/shop/CreatorCard';
import { ProductCard } from '@/components/shop/ProductCard';
import { DiscoveryFilters } from './discovery-filters';
import type { Metadata } from 'next';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const revalidate = 120;

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const isKo = locale === 'ko';
  return {
    title: isKo ? '크넥 — K-뷰티 크리에이터 셀렉트샵' : 'CNEC — K-Beauty Creator Select Shop',
    description: isKo
      ? '크리에이터가 직접 고른 K-뷰티 추천템을 만나보세요'
      : 'Discover K-beauty products handpicked by creators',
    openGraph: {
      title: isKo ? '크넥 — K-뷰티 크리에이터 셀렉트샵' : 'CNEC — K-Beauty Creator Select Shop',
      description: isKo
        ? '크리에이터가 직접 고른 K-뷰티 추천템을 만나보세요'
        : 'Discover K-beauty products handpicked by creators',
      type: 'website',
      siteName: 'CNEC Commerce',
    },
  };
}

async function getActiveGonggu() {
  const campaigns = await prisma.campaign.findMany({
    where: {
      type: 'GONGGU',
      status: 'ACTIVE',
      endAt: {
        gt: new Date(),
      },
    },
    include: {
      brand: {
        select: {
          id: true,
          brandName: true,
          logoUrl: true,
        },
      },
      products: {
        include: {
          product: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  });

  return campaigns;
}

async function getTopCreators() {
  // Try by total_sales first
  let creators = await prisma.creator.findMany({
    where: {
      totalSales: {
        gt: 0,
      },
    },
    orderBy: {
      totalSales: 'desc',
    },
    take: 10,
  });

  // Fallback to newest creators
  if (creators.length === 0) {
    creators = await prisma.creator.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });
  }

  // Get product counts
  const creatorIds = creators.map((c) => c.id);
  if (creatorIds.length === 0) return [];

  const counts = await prisma.creatorShopItem.findMany({
    where: {
      creatorId: { in: creatorIds },
      isVisible: true,
    },
    select: {
      creatorId: true,
    },
  });

  const countMap: Record<string, number> = {};
  counts.forEach((item) => {
    countMap[item.creatorId] = (countMap[item.creatorId] || 0) + 1;
  });

  return creators.map((c) => ({
    ...c,
    product_count: countMap[c.id] || 0,
  }));
}

async function getTopProducts() {
  // Try to get products with orders (popular)
  const orderItems = await prisma.orderItem.findMany({
    select: {
      productId: true,
      quantity: true,
    },
    take: 200,
  });

  if (orderItems.length > 0) {
    const salesMap: Record<string, number> = {};
    orderItems.forEach((item) => {
      if (item.productId) {
        salesMap[item.productId] = (salesMap[item.productId] || 0) + item.quantity;
      }
    });

    const topIds = Object.entries(salesMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([id]) => id);

    if (topIds.length > 0) {
      const products = await prisma.product.findMany({
        where: {
          id: { in: topIds },
          status: 'ACTIVE',
        },
        include: {
          brand: {
            select: {
              id: true,
              brandName: true,
              logoUrl: true,
            },
          },
        },
      });

      if (products.length > 0) {
        // Sort by sales count
        const sorted = [...products].sort(
          (a, b) => (salesMap[b.id] || 0) - (salesMap[a.id] || 0)
        );
        return sorted;
      }
    }
  }

  // Fallback: newest products
  const products = await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
    },
    include: {
      brand: {
        select: {
          id: true,
          brandName: true,
          logoUrl: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
  });

  return products;
}

async function getNewProducts() {
  const products = await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
    },
    include: {
      brand: {
        select: {
          id: true,
          brandName: true,
          logoUrl: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 8,
  });

  return products;
}

function GongguCard({ campaign, locale }: { campaign: any; locale: string }) {
  const product = campaign.products?.[0]?.product;
  const campaignProduct = campaign.products?.[0];
  if (!product) return null;

  const endAt = campaign.endAt;
  let dDayLabel = '';
  if (endAt) {
    const diff = new Date(endAt).getTime() - Date.now();
    if (diff > 0) {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      dDayLabel = days === 0 ? 'D-Day' : `D-${days}`;
    }
  }

  const effectivePrice = campaignProduct?.campaignPrice ?? product.salePrice;
  const discount =
    product.originalPrice > 0
      ? Math.round(((product.originalPrice - effectivePrice) / product.originalPrice) * 100)
      : 0;

  const imageUrl = product.thumbnailUrl || product.images?.[0];

  return (
    <div className="flex-shrink-0 w-64 snap-start">
      <div className="rounded-xl border border-border bg-card overflow-hidden hover:border-primary/30 transition-colors">
        <div className="relative aspect-square bg-muted overflow-hidden">
          {imageUrl ? (
            <img src={imageUrl} alt={product.name} className="object-cover w-full h-full" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
              No Image
            </div>
          )}
          <div className="absolute top-2 left-2 flex gap-1">
            {discount > 0 && (
              <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0 font-bold">
                {discount}%
              </Badge>
            )}
            {dDayLabel && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-bold">
                {dDayLabel}
              </Badge>
            )}
          </div>
        </div>
        <div className="p-3 space-y-1">
          <h3 className="text-sm font-medium line-clamp-1">{product.name}</h3>
          <p className="text-xs text-muted-foreground">{campaign.title}</p>
          <div className="flex items-baseline gap-1.5">
            {discount > 0 && (
              <span className="text-xs text-muted-foreground line-through">
                {new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', minimumFractionDigits: 0 }).format(product.originalPrice)}
              </span>
            )}
            <span className="text-sm font-bold">
              {new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', minimumFractionDigits: 0 }).format(effectivePrice)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function DiscoveryPage({ params }: PageProps) {
  const { locale } = await params;
  const isKo = locale === 'ko';

  const [gongguCampaigns, topCreators, topProducts, newProducts] = await Promise.all([
    getActiveGonggu(),
    getTopCreators(),
    getTopProducts(),
    getNewProducts(),
  ]);

  const t = {
    heroTitle: isKo ? 'K-뷰티 크리에이터가 직접 고른 추천템' : 'K-Beauty picks handpicked by creators',
    searchPlaceholder: isKo ? '상품명 또는 크리에이터명으로 검색' : 'Search products or creators',
    activeGonggu: isKo ? '진행 중인 공구' : 'Active Group Buys',
    topCreators: isKo ? '인기 크리에이터' : 'Top Creators',
    topProducts: isKo ? '인기 상품 랭킹' : 'Popular Products',
    newProducts: isKo ? '신규 입점 상품' : 'New Arrivals',
    viewAll: isKo ? '전체보기' : 'View All',
    productsCount: isKo ? '상품 {count}개' : '{count} products',
    noCreators: isKo ? '등록된 크리에이터가 없습니다' : 'No creators found',
    noProducts: isKo ? '등록된 상품이 없습니다' : 'No products found',
    exploreCreators: isKo ? '크리에이터 탐색' : 'Explore Creators',
    exploreProducts: isKo ? '상품 탐색' : 'Explore Products',
    all: isKo ? '전체' : 'All',
    catSkincare: isKo ? '스킨케어' : 'Skincare',
    catMakeup: isKo ? '메이크업' : 'Makeup',
    catBody: isKo ? '바디' : 'Body',
    catHair: isKo ? '헤어' : 'Hair',
    skinDry: isKo ? '건성' : 'Dry',
    skinOily: isKo ? '지성' : 'Oily',
    skinCombination: isKo ? '복합성' : 'Combination',
    skinSensitive: isKo ? '민감성' : 'Sensitive',
  };

  const categories = [
    { value: 'skincare', label: t.catSkincare },
    { value: 'makeup', label: t.catMakeup },
    { value: 'body', label: t.catBody },
    { value: 'hair', label: t.catHair },
  ];

  const skinTypes = [
    { value: 'dry', label: t.skinDry },
    { value: 'oily', label: t.skinOily },
    { value: 'combination', label: t.skinCombination },
    { value: 'oily_sensitive', label: t.skinSensitive },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="border-b border-border/50 bg-card/30 px-4 py-12 md:py-16">
        <div className="container mx-auto max-w-4xl text-center space-y-6">
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight">{t.heroTitle}</h1>
          <div className="mx-auto max-w-lg">
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              className="w-full rounded-full border border-border bg-background px-5 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex items-center justify-center gap-3">
            <Link href={`/${locale}/creators`}>
              <Button variant="outline" size="sm">
                {t.exploreCreators}
              </Button>
            </Link>
            <Link href={`/${locale}/products`}>
              <Button variant="outline" size="sm">
                {t.exploreProducts}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Active Gonggu */}
      {gongguCampaigns.length > 0 && (
        <section className="px-4 py-10">
          <div className="container mx-auto">
            <h2 className="text-xl font-bold mb-6">{t.activeGonggu}</h2>
            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 scrollbar-hide">
              {gongguCampaigns.map((campaign) => (
                <GongguCard key={campaign.id} campaign={campaign} locale={locale} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Top Creators */}
      <section className="px-4 py-10 bg-card/30 border-y border-border/50">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">{t.topCreators}</h2>
            <Link
              href={`/${locale}/creators`}
              className="text-sm text-primary flex items-center gap-1 hover:underline"
            >
              {t.viewAll} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {topCreators.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {topCreators.map((creator) => (
                <CreatorCard
                  key={creator.id}
                  creator={creator as any}
                  locale={locale}
                  productsLabel={t.productsCount}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">{t.noCreators}</p>
          )}
        </div>
      </section>

      {/* Top Products */}
      <section className="px-4 py-10">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">{t.topProducts}</h2>
            <Link
              href={`/${locale}/products`}
              className="text-sm text-primary flex items-center gap-1 hover:underline"
            >
              {t.viewAll} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {topProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {topProducts.map((product) => (
                <ProductCard key={product.id} product={product as any} locale={locale} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">{t.noProducts}</p>
          )}
        </div>
      </section>

      {/* New Products */}
      {newProducts.length > 0 && (
        <section className="px-4 py-10 bg-card/30 border-y border-border/50">
          <div className="container mx-auto">
            <h2 className="text-xl font-bold mb-6">{t.newProducts}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {newProducts.map((product) => (
                <ProductCard key={product.id} product={product as any} locale={locale} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Filters */}
      <section className="px-4 py-10">
        <div className="container mx-auto">
          <DiscoveryFilters
            categories={categories}
            skinTypes={skinTypes}
            allLabel={t.all}
          />
        </div>
      </section>
    </div>
  );
}
