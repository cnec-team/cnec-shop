'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Flame, Heart, Clock, ShoppingBag, Instagram, Share2 } from 'lucide-react';
import { ShareSheet } from '@/components/shop/ShareSheet';
import { VisitTracker } from '@/components/shop/VisitTracker';
import {
  getSkinTypeLabel,
  getSkinConcernLabel,
  getPersonalColorLabel,
} from '@/lib/utils/beauty-labels';

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

function formatKRW(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

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
      <ShopHeader creator={creator} shopUrl={shopUrl} />

      {/* Tab Navigation */}
      <div className="max-w-lg mx-auto bg-white border-b border-gray-100">
        <div className="flex">
          <button
            onClick={() => setActiveTab('gonggu')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'gonggu'
                ? 'text-gray-900'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Flame className={`h-4 w-4 ${activeTab === 'gonggu' ? 'text-orange-500' : ''}`} />
            <span>공구</span>
            {gongguItems.length > 0 && (
              <span className="text-xs text-gray-400">({gongguItems.length})</span>
            )}
            {activeTab === 'gonggu' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('pick')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'pick'
                ? 'text-gray-900'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Heart className={`h-4 w-4 ${activeTab === 'pick' ? 'text-purple-500' : ''}`} />
            <span>크리에이터픽</span>
            {pickItems.length > 0 && (
              <span className="text-xs text-gray-400">({pickItems.length})</span>
            )}
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
              <div className="space-y-4">
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
          배송/CS는 브랜드가 직접 처리합니다 | 크넥이 안전하게 관리해요
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

function ShopHeader({ creator, shopUrl }: { creator: ShopCreator; shopUrl: string }) {
  const shopDesc = creator.bio || 'K-뷰티 크리에이터 셀렉트샵';

  // Collect beauty tags
  const beautyTags: string[] = [];
  if (creator.skinType) beautyTags.push(getSkinTypeLabel(creator.skinType));
  if (creator.personalColor) beautyTags.push(getPersonalColorLabel(creator.personalColor));

  return (
    <div className="relative bg-white">
      {/* Cover Image */}
      <div className="h-48 relative overflow-hidden">
        {creator.coverImageUrl ? (
          <img
            src={creator.coverImageUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-100 to-purple-100" />
        )}
      </div>

      {/* Profile Section */}
      <div className="max-w-lg mx-auto px-4 relative">
        {/* Profile Image */}
        <div className="absolute -top-10 left-4">
          <div className="w-20 h-20 rounded-full border-4 border-white overflow-hidden bg-gray-200 shadow-sm">
            {creator.profileImageUrl ? (
              <img
                src={creator.profileImageUrl}
                alt={creator.displayName ?? ''}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl font-bold text-gray-400">
                {creator.displayName?.charAt(0) || '?'}
              </div>
            )}
          </div>
        </div>

        {/* Share Button */}
        <div className="absolute -top-10 right-4">
          <ShareSheet
            url={shopUrl}
            title={`${creator.displayName}의 셀렉트샵`}
            description={shopDesc}
            imageUrl={creator.profileImageUrl || undefined}
            trigger={
              <button className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white transition-colors">
                <Share2 className="h-4 w-4 text-gray-600" />
              </button>
            }
          />
        </div>

        {/* Name & Info */}
        <div className="pt-14 pb-4">
          <h1 className="text-xl font-bold text-gray-900">
            {creator.displayName}의 샵
          </h1>

          {/* Beauty Tags */}
          {beautyTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {beautyTags.map((tag, idx) => (
                <span
                  key={idx}
                  className="bg-gray-100 rounded-full px-3 py-1 text-xs text-gray-600"
                >
                  {tag}
                </span>
              ))}
              {creator.skinConcerns?.map((concern, idx) => (
                <span
                  key={`concern-${idx}`}
                  className="bg-gray-100 rounded-full px-3 py-1 text-xs text-gray-600"
                >
                  {getSkinConcernLabel(concern)}
                </span>
              ))}
            </div>
          )}

          {/* Instagram */}
          {creator.instagramHandle && (
            <a
              href={`https://instagram.com/${creator.instagramHandle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
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
  const isUrgent = dDayNum >= 0 && dDayNum <= 1;

  // Progress bar
  const totalStock = Number(campaign?.totalStock ?? 0);
  const soldCount = Number(campaign?.soldCount ?? 0);
  const progressPercent = totalStock > 0 ? Math.min(Math.round((soldCount / totalStock) * 100), 100) : 0;

  return (
    <Link
      href={`/${locale}/${username}/product/${product.id}${item.campaignId ? `?campaign=${item.campaignId}` : ''}`}
      className="block"
    >
      <div className={`bg-white rounded-2xl overflow-hidden shadow-sm ${isUrgent ? 'ring-2 ring-red-200' : ''}`}>
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name ?? ''}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-sm">
              이미지 없음
            </div>
          )}
          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-1.5">
            {dDayLabel && isActive && (
              <span className="bg-red-500 text-white rounded-full px-2 py-0.5 text-xs font-bold">
                {dDayLabel} 남음
              </span>
            )}
            {isUrgent && (
              <span className="bg-red-500 text-white rounded-full px-2 py-0.5 text-xs font-bold animate-pulse">
                마감 임박
              </span>
            )}
          </div>
          {totalStock > 0 && (
            <div className="absolute top-3 right-3">
              <span className="bg-black/50 text-white rounded-full px-2 py-0.5 text-xs">
                한정 {totalStock}개
              </span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4">
          <h3 className="font-medium text-gray-900 line-clamp-1">
            {product.name}
          </h3>
          {brandName && (
            <p className="text-xs text-gray-400 mt-0.5">{brandName}</p>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-2 mt-2">
            {discountPercent > 0 && (
              <span className="text-lg font-bold text-red-500">
                {discountPercent}%
              </span>
            )}
            <span className="text-lg font-bold text-gray-900">
              {formatKRW(effectivePrice)}
            </span>
          </div>
          {discountPercent > 0 && (
            <span className="text-xs text-gray-300 line-through">
              {formatKRW(productOriginalPrice)}
            </span>
          )}

          {/* Progress Bar */}
          {totalStock > 0 && (
            <div className="mt-3">
              <div className="w-full h-2 bg-orange-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">{progressPercent}% 판매</p>
            </div>
          )}

          {/* Buy Button */}
          <button className="w-full mt-3 bg-orange-500 text-white rounded-xl h-12 font-semibold text-sm hover:bg-orange-600 transition-colors">
            구매하기
          </button>
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
          <div className="flex items-baseline gap-1 mt-1.5">
            {discountPercent > 0 && (
              <span className="text-sm font-bold text-red-500">
                {discountPercent}%
              </span>
            )}
            <span className="text-base font-bold text-gray-900">
              {formatKRW(effectivePrice)}
            </span>
          </div>
          {discountPercent > 0 && (
            <span className="text-xs text-gray-300 line-through">
              {formatKRW(productOriginalPrice)}
            </span>
          )}
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
