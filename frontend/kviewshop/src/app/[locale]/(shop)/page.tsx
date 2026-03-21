import Link from 'next/link';
import { prisma } from '@/lib/db';
import { ArrowRight, Users, Flame } from 'lucide-react';
import type { Metadata } from 'next';

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

  if (creators.length === 0) {
    creators = await prisma.creator.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });
  }

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
        const sorted = [...products].sort(
          (a, b) => (salesMap[b.id] || 0) - (salesMap[a.id] || 0)
        );
        return sorted;
      }
    }
  }

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

function formatKRW(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function GongguCardServer({ campaign, locale }: { campaign: any; locale: string }) {
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

  const effectivePrice = Number(campaignProduct?.campaignPrice ?? product.salePrice ?? 0);
  const originalPrice = Number(product.originalPrice ?? 0);
  const discount =
    originalPrice > 0
      ? Math.round(((originalPrice - effectivePrice) / originalPrice) * 100)
      : 0;

  const imageUrl = product.thumbnailUrl || product.images?.[0];

  return (
    <div className="flex-shrink-0 w-56 snap-start">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
        <div className="relative aspect-square bg-gray-100 overflow-hidden">
          {imageUrl ? (
            <img src={imageUrl} alt={product.name} className="object-cover w-full h-full" />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400 text-sm">
              이미지 없음
            </div>
          )}
          <div className="absolute top-2.5 left-2.5 flex gap-1">
            {dDayLabel && (
              <span className="bg-red-500 text-white rounded-full px-2 py-0.5 text-xs font-bold">
                {dDayLabel}
              </span>
            )}
          </div>
        </div>
        <div className="p-3">
          <h3 className="text-sm font-medium text-gray-900 line-clamp-1">{product.name}</h3>
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{campaign.title}</p>
          <div className="flex items-baseline gap-1.5 mt-1.5">
            {discount > 0 && (
              <span className="text-sm font-bold text-red-500">{discount}%</span>
            )}
            <span className="text-sm font-bold text-gray-900">
              {formatKRW(effectivePrice)}
            </span>
          </div>
          {discount > 0 && (
            <span className="text-xs text-gray-300 line-through">
              {formatKRW(originalPrice)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductCardServer({ product, locale }: { product: any; locale: string }) {
  const originalPrice = Number(product.originalPrice ?? 0);
  const salePrice = Number(product.salePrice ?? 0);
  const discount = originalPrice > 0 && salePrice < originalPrice
    ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
    : 0;
  const imageUrl = product.thumbnailUrl || product.images?.[0];
  const brandName = product.brand?.brandName || '';

  return (
    <Link
      href={`/${locale}/products/${product.id}`}
      className="block group"
    >
      <div className="aspect-square rounded-xl overflow-hidden bg-gray-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400 text-sm">
            이미지 없음
          </div>
        )}
      </div>
      <div className="mt-2">
        {brandName && (
          <p className="text-xs text-gray-400 truncate">{brandName}</p>
        )}
        <h3 className="text-sm text-gray-900 line-clamp-2 leading-snug mt-0.5">{product.name}</h3>
        <div className="flex items-baseline gap-1 mt-1">
          {discount > 0 && (
            <span className="text-sm font-bold text-red-500">{discount}%</span>
          )}
          <span className="text-base font-bold text-gray-900">{formatKRW(salePrice)}</span>
        </div>
        {discount > 0 && (
          <span className="text-xs text-gray-300 line-through">{formatKRW(originalPrice)}</span>
        )}
      </div>
    </Link>
  );
}

function CreatorCardServer({ creator, locale }: { creator: any; locale: string }) {
  const displayName = creator.displayName || creator.shopId || '';
  const initials = displayName.slice(0, 1);
  const productCount = creator.product_count || 0;

  return (
    <Link
      href={`/${locale}/${creator.shopId}`}
      className="flex-shrink-0 w-24 snap-start text-center group"
    >
      <div className="w-20 h-20 mx-auto rounded-full overflow-hidden bg-gray-100 ring-2 ring-gray-100 group-hover:ring-gray-300 transition-all">
        {creator.profileImageUrl ? (
          <img
            src={creator.profileImageUrl}
            alt={displayName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-lg font-bold text-gray-400">
            {initials}
          </div>
        )}
      </div>
      <p className="text-xs font-medium text-gray-900 mt-2 line-clamp-1">{displayName}</p>
      <p className="text-[10px] text-gray-400">상품 {productCount}개</p>
    </Link>
  );
}

export default async function DiscoveryPage({ params }: PageProps) {
  const { locale } = await params;

  const [gongguCampaigns, topCreators, topProducts] = await Promise.all([
    getActiveGonggu(),
    getTopCreators(),
    getTopProducts(),
  ]);

  const hasContent = gongguCampaigns.length > 0 || topCreators.length > 0 || topProducts.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 h-12 flex items-center">
          <h1 className="text-lg font-bold text-gray-900">CNEC</h1>
        </div>
      </header>

      {!hasContent ? (
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <Users className="h-10 w-10 mx-auto text-gray-300 mb-3" />
          <p className="text-sm font-medium text-gray-500">아직 크리에이터가 없어요</p>
          <p className="text-xs text-gray-400 mt-1 mb-6">첫 번째 크리에이터가 되어보세요</p>
          <Link
            href={`/${locale}/creators`}
            className="inline-flex items-center justify-center h-11 px-6 bg-gray-900 text-white rounded-xl text-sm font-medium"
          >
            크리에이터 되기
          </Link>
        </div>
      ) : (
        <div className="max-w-lg mx-auto">
          {/* Active Gonggu Section */}
          {gongguCampaigns.length > 0 && (
            <section className="py-6">
              <div className="px-4 flex items-center gap-2 mb-4">
                <Flame className="h-5 w-5 text-orange-500" />
                <h2 className="text-lg font-bold text-gray-900">진행중인 공구</h2>
              </div>
              <div
                className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 px-4"
                style={{ scrollbarWidth: 'none' }}
              >
                {gongguCampaigns.map((campaign) => (
                  <GongguCardServer key={campaign.id} campaign={campaign} locale={locale} />
                ))}
              </div>
            </section>
          )}

          {/* Top Creators Section */}
          {topCreators.length > 0 && (
            <section className="py-6 bg-white">
              <div className="px-4 flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">인기 크리에이터</h2>
                <Link
                  href={`/${locale}/creators`}
                  className="text-xs text-gray-400 flex items-center gap-0.5 hover:text-gray-600"
                >
                  전체보기 <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div
                className="flex gap-4 overflow-x-auto px-4 pb-2"
                style={{ scrollbarWidth: 'none' }}
              >
                {topCreators.map((creator) => (
                  <CreatorCardServer
                    key={creator.id}
                    creator={creator}
                    locale={locale}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Top Products Section */}
          {topProducts.length > 0 && (
            <section className="py-6">
              <div className="px-4 flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">전체 상품</h2>
                <Link
                  href={`/${locale}/products`}
                  className="text-xs text-gray-400 flex items-center gap-0.5 hover:text-gray-600"
                >
                  전체보기 <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="px-4 grid grid-cols-2 gap-3">
                {topProducts.map((product) => (
                  <ProductCardServer key={product.id} product={product} locale={locale} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="max-w-lg mx-auto border-t border-gray-100 py-4 px-4 mt-4">
        <p className="text-xs text-gray-400 text-center">
          크넥이 안전하게 관리하는 K-뷰티 플랫폼
        </p>
      </div>
    </div>
  );
}
