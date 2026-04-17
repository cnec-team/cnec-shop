'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Share2,
  Clock,
  ShoppingBag,
  Instagram,
  CalendarDays,
  Package,
  User,
  UserPlus,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { ShareSheet } from '@/components/shop/ShareSheet';
import { VisitTracker } from '@/components/shop/VisitTracker';
import { useAuthStore } from '@/lib/store/auth';
import {
  calculateDDay,
  calculateDDayUntilStart,
  getDDayLabel,
  getDDayStartLabel,
  formatCampaignPeriod,
  hasCampaignStarted,
} from '@/lib/utils/date';

// =============================================
// Types matching Prisma camelCase output
// =============================================

export interface ShopCreator {
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

export interface ShopProduct {
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

export interface ShopCampaign {
  id: string;
  title?: string | null;
  status?: string;
  startAt?: Date | string | null;
  endAt?: Date | string | null;
  totalStock?: number | null;
  soldCount?: number | null;
  commissionRate?: number | null;
}

export interface ShopCampaignProduct {
  campaignPrice?: number | null;
}

export interface ShopItem {
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

export interface ShopCollection {
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

function calculateDiscountPercent(original: number, sale: number): number {
  if (original <= 0) return 0;
  return Math.round(((original - sale) / original) * 100);
}

type BadgeVariant = 'red' | 'red-pulse' | 'blue' | 'gray';

function getGongguBadge(campaign: ShopCampaign): { label: string; variant: BadgeVariant } | null {
  const totalStock = Number(campaign.totalStock ?? 0);
  const soldCount = Number(campaign.soldCount ?? 0);

  if (totalStock > 0 && soldCount >= totalStock) {
    return { label: 'SOLD OUT', variant: 'gray' };
  }

  if (!hasCampaignStarted(campaign.startAt)) {
    const daysToStart = calculateDDayUntilStart(campaign.startAt);
    return { label: getDDayStartLabel(daysToStart), variant: 'blue' };
  }

  const daysLeft = calculateDDay(campaign.endAt);
  if (daysLeft <= 0) return { label: '마감', variant: 'gray' };

  const stockLow = totalStock > 0 && (totalStock - soldCount) / totalStock < 0.2;
  if (stockLow) return { label: '마감 임박', variant: 'red-pulse' };
  if (daysLeft <= 3) return { label: getDDayLabel(daysLeft), variant: 'red-pulse' };

  return { label: getDDayLabel(daysLeft), variant: 'red' };
}

const BADGE_STYLES: Record<BadgeVariant, string> = {
  red: 'bg-red-500 text-white',
  'red-pulse': 'bg-red-500 text-white animate-pulse',
  blue: 'bg-blue-500 text-white',
  gray: 'bg-gray-400 text-white',
};

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
  const router = useRouter();
  const username = params.username as string;
  const shopUrl = `https://www.cnecshop.com/${username}`;
  const shopDesc = creator.bio || 'K-뷰티 크리에이터 셀렉트샵';
  const buyer = useAuthStore((s) => s.buyer);

  const [isFollowing, setIsFollowing] = useState(false);
  const [bioExpanded, setBioExpanded] = useState(false);

  // Separate items by type
  const gongguItems = useMemo(
    () => shopItems.filter((item) => item.type === 'GONGGU'),
    [shopItems],
  );

  const pickItems = useMemo(
    () => shopItems.filter((item) => item.type === 'PICK'),
    [shopItems],
  );

  const defaultTab = gongguItems.length > 0 ? 'gonggu' : 'pick';
  const [activeTab, setActiveTab] = useState(defaultTab);

  // Beauty profile data
  const hasSkinType = !!creator.skinType;
  const hasSkinConcerns = creator.skinConcerns && creator.skinConcerns.length > 0;
  const hasBeautyProfile = hasSkinType || hasSkinConcerns;

  // First gonggu item for calendar widget
  const firstGonggu = gongguItems[0] ?? null;

  const handleFollow = () => {
    setIsFollowing((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-white">
      <VisitTracker creatorId={creator.id} />

      {/* A. Sticky Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#E5E5EA]">
        <div className="max-w-[480px] mx-auto h-14 flex items-center justify-between px-4">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center -ml-1.5 rounded-full hover:bg-[#F5F5F5] transition-colors"
            aria-label="뒤로가기"
          >
            <ChevronLeft className="h-5 w-5 text-[#1A1A1A]" />
          </button>

          <h1 className="text-[16px] font-semibold text-[#1A1A1A] truncate max-w-[200px]">
            {creator.displayName || creator.shopId}
          </h1>

          <div className="flex items-center gap-0.5">
            <Link
              href={`/${locale}/${username}/orders`}
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#F5F5F5] transition-colors"
              aria-label="주문조회"
            >
              <Package className="h-[18px] w-[18px] text-[#1A1A1A]" />
            </Link>
            {buyer ? (
              <Link
                href={`/${locale}/${username}/me`}
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#F5F5F5] transition-colors"
                aria-label="마이페이지"
              >
                <User className="h-[18px] w-[18px] text-[#1A1A1A]" />
              </Link>
            ) : (
              <Link
                href={`/${locale}/buyer/login?returnUrl=${encodeURIComponent(`/${locale}/${username}`)}`}
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#F5F5F5] transition-colors"
                aria-label="로그인"
              >
                <UserPlus className="h-[18px] w-[18px] text-[#1A1A1A]" />
              </Link>
            )}
            <ShareSheet
              url={shopUrl}
              title={`${creator.displayName}의 셀렉트샵`}
              description={shopDesc}
              imageUrl={creator.profileImageUrl || undefined}
              trigger={
                <button
                  className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#F5F5F5] transition-colors"
                  aria-label="공유하기"
                >
                  <Share2 className="h-[18px] w-[18px] text-[#1A1A1A]" />
                </button>
              }
            />
          </div>
        </div>
      </header>

      <div className="max-w-[480px] mx-auto">
        {/* B. Profile Section */}
        <section className="px-4 py-5">
          <div className="flex items-start gap-4">
            {/* Profile image with Instagram badge */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-white shadow-md bg-[#F5F5F5]">
                {creator.profileImageUrl ? (
                  <img
                    src={creator.profileImageUrl}
                    alt={creator.displayName ?? ''}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl font-bold text-[#8E8E93]">
                    {creator.displayName?.charAt(0) || '?'}
                  </div>
                )}
              </div>
              {creator.instagramHandle && (
                <a
                  href={`https://instagram.com/${creator.instagramHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute -bottom-0.5 -right-0.5 w-7 h-7 bg-white rounded-full shadow flex items-center justify-center hover:scale-105 transition-transform"
                  aria-label="인스타그램"
                >
                  <Instagram className="w-4 h-4 text-[#E4405F]" />
                </a>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 pt-1">
              <h2 className="text-[18px] font-bold text-[#1A1A1A] leading-tight">
                {creator.displayName}
              </h2>
              <p className="text-[14px] text-[#8E8E93] mt-0.5">
                @{creator.shopId || username}
              </p>
            </div>
          </div>

          {/* Bio */}
          {shopDesc && (
            <div className="mt-3">
              <p
                className={`text-sm text-[#8E8E93] leading-relaxed ${
                  !bioExpanded ? 'line-clamp-2' : ''
                }`}
              >
                {shopDesc}
              </p>
              {shopDesc.length > 60 && !bioExpanded && (
                <button
                  onClick={() => setBioExpanded(true)}
                  className="text-sm text-[#1A1A1A] font-medium mt-0.5 hover:underline"
                >
                  더보기
                </button>
              )}
            </div>
          )}

          {/* Follow Button */}
          <button
            onClick={handleFollow}
            className={`w-full h-11 rounded-full text-[15px] font-semibold mt-4 border transition-colors ${
              isFollowing
                ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                : 'bg-white text-[#1A1A1A] border-[#1A1A1A] hover:bg-[#F5F5F5]'
            }`}
          >
            {isFollowing ? '팔로우 중' : '팔로우'}
          </button>
        </section>

        {/* C. Gonggu Calendar Widget */}
        {firstGonggu && firstGonggu.campaign && (
          <GongguCalendarWidget
            item={firstGonggu}
            totalCount={gongguItems.length}
            username={username}
            locale={locale}
          />
        )}

        {/* D. Tab Bar */}
        <div className="sticky top-14 z-40 bg-white border-b border-[#E5E5EA]">
          <div className="flex">
            <button
              onClick={() => setActiveTab('gonggu')}
              className={`flex-1 py-3.5 text-[14px] text-center relative transition-colors ${
                activeTab === 'gonggu'
                  ? 'font-bold text-[#1A1A1A]'
                  : 'font-medium text-[#8E8E93]'
              }`}
            >
              공구
              {activeTab === 'gonggu' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1A1A1A]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('pick')}
              className={`flex-1 py-3.5 text-[14px] text-center relative transition-colors ${
                activeTab === 'pick'
                  ? 'font-bold text-[#1A1A1A]'
                  : 'font-medium text-[#8E8E93]'
              }`}
            >
              추천
              {activeTab === 'pick' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1A1A1A]" />
              )}
            </button>
          </div>
        </div>

        {/* E. Beauty Profile Card */}
        {hasBeautyProfile && (
          <section className="mx-4 mt-4">
            <div className="rounded-xl bg-[#F5F5F5] p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <Sparkles className="h-4 w-4 text-[#1A1A1A]" />
                <h3 className="text-[15px] font-bold text-[#1A1A1A]">
                  크리에이터 뷰티 정보
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {creator.skinType && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-white text-[13px] text-[#1A1A1A] font-medium">
                    {creator.skinType}
                  </span>
                )}
                {creator.skinConcerns?.map((concern) => (
                  <span
                    key={concern}
                    className="inline-flex items-center px-3 py-1.5 rounded-full bg-white text-[13px] text-[#8E8E93]"
                  >
                    {concern}
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* F. Product Grid */}
        <div className="px-4 mt-4 pb-8">
          {activeTab === 'gonggu' && (
            <>
              {gongguItems.length === 0 ? (
                <EmptyState
                  icon={<Clock className="h-10 w-10 text-[#D1D1D6]" />}
                  title="아직 등록된 상품이 없어요"
                  subtitle="새 공구가 시작되면 알려드릴게요"
                />
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
                <EmptyState
                  icon={<ShoppingBag className="h-10 w-10 text-[#D1D1D6]" />}
                  title="아직 등록된 상품이 없어요"
                  subtitle="곧 멋진 상품이 추가될 거예요"
                />
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
        <div className="border-t border-[#E5E5EA] py-4 px-4">
          <p className="text-[12px] text-[#8E8E93] text-center">
            추천만 하세요. 배송·CS는 크넥이 관리합니다
          </p>
        </div>
      </div>
    </div>
  );
}

// Re-export for backward compatibility
export { CreatorShopPage as CreatorShop };

// =============================================
// Sub-components
// =============================================

function GongguCalendarWidget({
  item,
  totalCount,
  username,
  locale,
}: {
  item: ShopItem;
  totalCount: number;
  username: string;
  locale: string;
}) {
  const campaign = item.campaign;
  const product = item.product;
  if (!campaign || !product) return null;

  const badge = getGongguBadge(campaign);

  return (
    <section className="px-4 pb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[15px] font-bold text-[#1A1A1A]">공구 일정</h3>
        {totalCount > 1 && (
          <span className="text-[13px] text-[#8E8E93]">
            +{totalCount - 1}개 더보기
          </span>
        )}
      </div>
      <Link
        href={`/${locale}/${username}/product/${product.id}${item.campaignId ? `?campaign=${item.campaignId}` : ''}`}
        className="block"
      >
        <div className="rounded-xl bg-[#F5F5F5] p-3 flex items-center gap-3">
          {/* Thumbnail */}
          <div className="w-14 h-14 rounded-lg overflow-hidden bg-white shrink-0">
            {product.images?.[0] ? (
              <img
                src={product.images[0]}
                alt={product.name ?? ''}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#8E8E93] text-xs">
                <CalendarDays className="h-5 w-5" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {badge && (
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${BADGE_STYLES[badge.variant]}`}
                >
                  {badge.label}
                </span>
              )}
            </div>
            <p className="text-[14px] font-medium text-[#1A1A1A] line-clamp-1 mt-1">
              {campaign.title || product.name}
            </p>
            {campaign.startAt && campaign.endAt && (
              <p className="text-[12px] text-[#8E8E93] mt-0.5">
                {formatCampaignPeriod(campaign.startAt, campaign.endAt)}
              </p>
            )}
          </div>

          <ChevronDown className="h-4 w-4 text-[#8E8E93] shrink-0 -rotate-90" />
        </div>
      </Link>
    </section>
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

  const productOriginalPrice = Number(product.originalPrice ?? 0);
  const productSalePrice = Number(product.salePrice ?? 0);
  const effectivePrice = Number(campaignProduct?.campaignPrice ?? productSalePrice);
  const discountPercent = calculateDiscountPercent(productOriginalPrice, effectivePrice);
  const brandName = product.brand?.brandName || '';
  const badge = campaign ? getGongguBadge(campaign) : null;

  return (
    <Link
      href={`/${locale}/${username}/product/${product.id}${item.campaignId ? `?campaign=${item.campaignId}` : ''}`}
      className="block"
    >
      <div className="group">
        {/* Image */}
        <div className="aspect-square rounded-lg overflow-hidden bg-[#F5F5F5] relative">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name ?? ''}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#8E8E93] text-xs">
              이미지 없음
            </div>
          )}
          {/* D-Day badge top-left */}
          {badge && (
            <span
              className={`absolute top-2 left-2 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${BADGE_STYLES[badge.variant]}`}
            >
              {badge.label}
            </span>
          )}
        </div>

        {/* Product info */}
        <div className="mt-2.5">
          {brandName && (
            <p className="text-[12px] text-[#8E8E93] truncate">{brandName}</p>
          )}
          <h4 className="text-[14px] text-[#1A1A1A] line-clamp-2 leading-snug mt-0.5">
            {product.name}
          </h4>

          {/* Price */}
          <div className="flex items-baseline gap-1.5 mt-1.5">
            {discountPercent > 0 && (
              <span className="text-[14px] font-bold text-red-500">
                {discountPercent}%
              </span>
            )}
            <span className="text-[15px] font-bold text-[#1A1A1A]">
              {formatWon(effectivePrice)}
            </span>
          </div>
          {discountPercent > 0 && (
            <span className="text-[12px] text-[#8E8E93] line-through">
              {formatWon(productOriginalPrice)}
            </span>
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
        <div className="aspect-square rounded-lg overflow-hidden bg-[#F5F5F5]">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name ?? ''}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#8E8E93] text-xs">
              이미지 없음
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-2.5">
          {brandName && (
            <p className="text-[12px] text-[#8E8E93] truncate">{brandName}</p>
          )}
          <h4 className="text-[14px] text-[#1A1A1A] line-clamp-2 leading-snug mt-0.5">
            {product.name}
          </h4>
          <div className="flex items-baseline gap-1.5 mt-1.5">
            {discountPercent > 0 && (
              <span className="text-[14px] font-bold text-red-500">
                {discountPercent}%
              </span>
            )}
            <span className="text-[15px] font-bold text-[#1A1A1A]">
              {formatWon(effectivePrice)}
            </span>
          </div>
          {discountPercent > 0 && (
            <span className="text-[12px] text-[#8E8E93] line-through">
              {formatWon(productOriginalPrice)}
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
    <div className="px-4 py-4">
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

function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="py-20 text-center">
      <div className="mx-auto mb-3 flex justify-center">{icon}</div>
      <p className="text-[14px] font-medium text-[#8E8E93]">{title}</p>
      <p className="text-[12px] text-[#D1D1D6] mt-1">{subtitle}</p>
    </div>
  );
}
