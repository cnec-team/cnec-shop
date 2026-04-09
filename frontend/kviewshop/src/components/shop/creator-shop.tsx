'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Clock, ShoppingBag, Instagram, Share2, User, UserPlus } from 'lucide-react';
import { ShareSheet } from '@/components/shop/ShareSheet';
import { VisitTracker } from '@/components/shop/VisitTracker';
import { useAuthStore } from '@/lib/store/auth';

// =============================================
// Types matching Prisma camelCase output
// =============================================

interface ShopCreator {
  id: string;
  shopId?: string | null;
  displayName?: string | null;
  bio?: string | null;
  profileImageUrl?: string | null;
  coverImageUrl?: string | null;
  bannerImageUrl?: string | null;
  bannerLink?: string | null;
  instagramHandle?: string | null;
  youtubeHandle?: string | null;
  tiktokHandle?: string | null;
  skinType?: string | null;
  personalColor?: string | null;
  skinConcerns?: string[];
  scalpConcerns?: string[];
}

interface ShopProduct {
  id: string;
  name?: string | null;
  nameKo?: string | null;
  nameEn?: string | null;
  originalPrice?: number | null;
  salePrice?: number | null;
  images?: string[];
  imageUrl?: string | null;
  stock?: number | null;
  brand?: { id: string; brandName?: string | null; logoUrl?: string | null } | null;
}

interface ShopCampaign {
  id: string;
  title?: string | null;
  status?: string;
  endAt?: Date | string | null;
  totalStock?: number | null;
  soldCount?: number | null;
  commissionRate?: number | null;
}

interface ShopCampaignProduct {
  campaignPrice?: number | null;
}

interface ShopItem {
  id: string;
  creatorId: string;
  productId: string;
  campaignId?: string | null;
  type: string;
  collectionId?: string | null;
  displayOrder: number;
  isVisible: boolean;
  product?: ShopProduct | null;
  campaign?: ShopCampaign | null;
  campaignProduct?: ShopCampaignProduct | null;
}

interface ShopCollection {
  id: string;
  name: string;
  description?: string | null;
  isVisible: boolean;
  displayOrder: number;
}

// =============================================
// Props
// =============================================

interface CreatorShopPageProps {
  creator: ShopCreator;
  shopItems: ShopItem[];
  collections: ShopCollection[];
  locale: string;
}

// =============================================
// Helpers
// =============================================

function calculateDDay(endAt: string | Date | undefined | null): number {
  if (!endAt) return -1;
  const now = new Date();
  const end = new Date(endAt);
  const diff = end.getTime() - now.getTime();
  if (diff <= 0) return 0;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function getDDayLabel(days: number): string {
  if (days < 0) return '';
  if (days === 0) return 'D-Day';
  return `D-${days}`;
}

function calculateDiscountPercent(original: number, sale: number): number {
  if (original <= 0) return 0;
  return Math.round(((original - sale) / original) * 100);
}

function formatWon(amount: number): string {
  return new Intl.NumberFormat('ko-KR').format(amount) + '원';
}

// =============================================
// Main Component
// =============================================

export function CreatorShopPage({
  creator,
  shopItems,
  collections,
  locale,
}: CreatorShopPageProps) {
  const params = useParams();
  const username = params.username as string;
  const shopUrl = `https://shop.cnec.kr/${username}`;

  // Separate items by type
  const gongguItems = useMemo(
    () => shopItems.filter((item) => item.type === 'GONGGU'),
    [shopItems]
  );

  const pickItems = useMemo(
    () => shopItems.filter((item) => item.type === 'PICK'),
    [shopItems]
  );

  const defaultTab = gongguItems.length > 0 ? 'gonggu' : 'pick';
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <div className="min-h-screen bg-gray-50">
      <VisitTracker creatorId={creator.id} />

      {/* Header / Profile Section */}
      <ShopHeader creator={creator} shopUrl={shopUrl} locale={locale} />

      {/* Tab Navigation */}
      <div className="max-w-lg mx-auto bg-white border-b border-gray-100">
        <div className="flex">
          <button
            onClick={() => setActiveTab('gonggu')}
            className={`flex-1 py-3 text-sm font-medium text-center transition-colors relative ${
              activeTab === 'gonggu'
                ? 'text-gray-900'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            공구 {gongguItems.length}
            {activeTab === 'gonggu' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('pick')}
            className={`flex-1 py-3 text-sm font-medium text-center transition-colors relative ${
              activeTab === 'pick'
                ? 'text-gray-900'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            추천 {pickItems.length}
            {activeTab === 'pick' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-lg mx-auto px-4 pt-5 pb-8">
        {activeTab === 'gonggu' && (
          <>
            {gongguItems.length === 0 ? (
              <EmptyGonggu />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {gongguItems.map((item) => (
                  <GongguCard
                    key={item.id}
                    item={item}
                    username={username}
                    locale={locale}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'pick' && (
          <>
            {pickItems.length === 0 ? (
              <EmptyPick />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {pickItems.map((item) => (
                  <PickProductCard
                    key={item.id}
                    item={item}
                    username={username}
                    locale={locale}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Banner Section */}
      {creator.bannerImageUrl && (
        <BannerSection
          bannerImageUrl={creator.bannerImageUrl}
          bannerLink={creator.bannerLink ?? undefined}
        />
      )}

      {/* Footer */}
      <div className="max-w-lg mx-auto border-t border-gray-100 py-3 px-4">
        <p className="text-xs text-gray-400 text-center">
          추천만 하세요. 배송·CS는 크넥이 관리합니다
        </p>
      </div>
    </div>
  );
}

// Re-export for backward compatibility
export { CreatorShopPage as CreatorShop };

// =============================================
// Sub-components
// =============================================

function ShopHeader({ creator, shopUrl, locale }: { creator: ShopCreator; shopUrl: string; locale: string }) {
  const shopDesc = creator.bio || 'K-뷰티 크리에이터 셀렉트샵';
  const buyer = useAuthStore((s) => s.buyer);

  return (
    <div className="bg-white">
      {/* Top bar: page title + share */}
      <div className="max-w-lg mx-auto px-4 pt-4 pb-2 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">
          {creator.displayName}
        </h1>
        <div className="flex items-center gap-1">
          {buyer ? (
            <Link
              href={`/${locale}/buyer/dashboard`}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <User className="h-4 w-4 text-gray-500" />
            </Link>
          ) : (
            <Link
              href={`/${locale}/buyer/login`}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <UserPlus className="h-4 w-4 text-gray-500" />
            </Link>
          )}
          <ShareSheet
            url={shopUrl}
            title={`${creator.displayName}의 셀렉트샵`}
            description={shopDesc}
            imageUrl={creator.profileImageUrl || undefined}
            trigger={
              <button className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                <Share2 className="h-4 w-4 text-gray-500" />
              </button>
            }
          />
        </div>
      </div>

      {/* Horizontal profile: photo left + text right */}
      <div className="max-w-lg mx-auto px-4 pb-4 flex items-start gap-3">
        <div className="w-16 h-16 shrink-0 rounded-full overflow-hidden bg-gray-200">
          {creator.profileImageUrl ? (
            <img
              src={creator.profileImageUrl}
              alt={creator.displayName ?? ''}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-lg font-bold text-gray-400">
              {creator.displayName?.charAt(0) || '?'}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900">{creator.displayName}</p>
          <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{shopDesc}</p>
          {creator.instagramHandle && (
            <a
              href={`https://instagram.com/${creator.instagramHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Instagram className="w-3.5 h-3.5" />
              <span>@{creator.instagramHandle}</span>
            </a>
          )}
        </div>
      </div>

      {/* Separator */}
      <div className="max-w-lg mx-auto">
        <div className="h-px bg-gray-100" />
      </div>
    </div>
  );
}

function GongguCard({
  item,
  username,
  locale,
}: {
  item: ShopItem;
  username: string;
  locale: string;
}) {
  const product = item.product;
  const campaign = item.campaign;
  const campaignProduct = item.campaignProduct;

  if (!product) return null;

  const productSalePrice = Number(product.salePrice ?? 0);
  const productOriginalPrice = Number(product.originalPrice ?? 0);
  const effectivePrice = Number(campaignProduct?.campaignPrice ?? productSalePrice);
  const discountPercent = calculateDiscountPercent(productOriginalPrice, effectivePrice);
  const dDayNum = campaign?.endAt ? calculateDDay(campaign.endAt) : -1;
  const dDayLabel = getDDayLabel(dDayNum);
  const brandName = product.brand?.brandName || '';
  const isActive = campaign?.status === 'ACTIVE';
  const soldCount = Number(campaign?.soldCount ?? 0);

  return (
    <Link
      href={`/${locale}/${username}/product/${product.id}${item.campaignId ? `?campaign=${item.campaignId}` : ''}`}
      className="block"
    >
      <div className="group">
        {/* Image with badges */}
        <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 relative">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name ?? ''}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
              이미지 없음
            </div>
          )}
          {/* D-Day badge: red pill, top-left */}
          {dDayLabel && isActive && (
            <span className="absolute top-2 left-2 bg-red-500 text-white rounded-full px-2.5 py-0.5 text-[11px] font-bold">
              {dDayLabel}
            </span>
          )}
          {/* Discount badge: yellow pill, top-right */}
          {discountPercent > 0 && (
            <span className="absolute top-2 right-2 bg-yellow-300 text-gray-900 rounded-full px-2 py-0.5 text-[11px] font-bold">
              {discountPercent}%
            </span>
          )}
        </div>

        {/* Product info */}
        <div className="mt-2">
          {brandName && (
            <p className="text-xs text-gray-400 truncate">{brandName}</p>
          )}
          <h4 className="text-sm text-gray-900 line-clamp-2 leading-snug mt-0.5">
            {product.name}
          </h4>
          <div className="flex items-baseline gap-1.5 mt-1.5">
            <span className="text-base font-bold text-gray-900">
              {formatWon(effectivePrice)}
            </span>
            {discountPercent > 0 && (
              <span className="text-xs text-gray-400 line-through">
                {formatWon(productOriginalPrice)}
              </span>
            )}
          </div>
          {soldCount > 0 && (
            <p className="text-xs text-red-500 font-medium mt-1">
              {soldCount.toLocaleString()}명 참여중
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

function PickProductCard({
  item,
  username,
  locale,
}: {
  item: ShopItem;
  username: string;
  locale: string;
}) {
  const product = item.product;
  if (!product) return null;

  const productSalePrice = Number(product.salePrice ?? 0);
  const productOriginalPrice = Number(product.originalPrice ?? 0);
  const effectivePrice = Number(item.campaignProduct?.campaignPrice ?? productSalePrice);
  const discountPercent = calculateDiscountPercent(productOriginalPrice, effectivePrice);
  const brandName = product.brand?.brandName || '';

  return (
    <Link
      href={`/${locale}/${username}/product/${product.id}${item.campaignId ? `?campaign=${item.campaignId}` : ''}`}
      className="block"
    >
      <div className="group">
        {/* Image */}
        <div className="aspect-square rounded-xl overflow-hidden bg-gray-100">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name ?? ''}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
              이미지 없음
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-2">
          {brandName && (
            <p className="text-xs text-gray-400 truncate">{brandName}</p>
          )}
          <h4 className="text-sm text-gray-900 line-clamp-2 leading-snug mt-0.5">
            {product.name}
          </h4>
          <div className="flex items-baseline gap-1.5 mt-1.5">
            <span className="text-base font-bold text-gray-900">
              {formatWon(effectivePrice)}
            </span>
            {discountPercent > 0 && (
              <span className="text-xs text-gray-400 line-through">
                {formatWon(productOriginalPrice)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function BannerSection({
  bannerImageUrl,
  bannerLink,
}: {
  bannerImageUrl: string;
  bannerLink?: string;
}) {
  const content = (
    <div className="max-w-lg mx-auto px-4 py-4">
      <div className="rounded-xl overflow-hidden">
        <img
          src={bannerImageUrl}
          alt=""
          className="w-full h-auto object-cover"
        />
      </div>
    </div>
  );

  if (bannerLink) {
    return (
      <a href={bannerLink} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return content;
}

function EmptyGonggu() {
  return (
    <div className="py-20 text-center">
      <Clock className="h-10 w-10 mx-auto text-gray-300 mb-3" />
      <p className="text-sm font-medium text-gray-500">
        아직 진행 중인 공구가 없어요
      </p>
      <p className="text-xs text-gray-400 mt-1">
        새 공구가 시작되면 알려드릴게요
      </p>
    </div>
  );
}

function EmptyPick() {
  return (
    <div className="py-20 text-center">
      <ShoppingBag className="h-10 w-10 mx-auto text-gray-300 mb-3" />
      <p className="text-sm font-medium text-gray-500">
        아직 추천 상품이 없어요
      </p>
      <p className="text-xs text-gray-400 mt-1">
        곧 멋진 상품이 추가될 거예요
      </p>
    </div>
  );
}
