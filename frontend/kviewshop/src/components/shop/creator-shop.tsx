'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
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
  Heart,
  Bell,
  BellOff,
  Home,
  LayoutGrid,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { ShareSheet } from '@/components/shop/ShareSheet';
import { VisitTracker } from '@/components/shop/VisitTracker';
import { ProductCardActions } from '@/components/shop/ProductCardActions';
import { useAuthStore } from '@/lib/store/auth';
import { toggleFollow, getFollowInfo } from '@/lib/actions/follow';
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
  wishlistedProductIds?: string[];
  isLoggedIn?: boolean;
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
    return { label: '마감', variant: 'gray' };
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
  wishlistedProductIds = [],
  isLoggedIn = false,
}: CreatorShopPageProps) {
  const wishlistedSet = useMemo(() => new Set(wishlistedProductIds), [wishlistedProductIds]);
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  const shopUrl = `https://www.cnecshop.com/${username}`;
  const shopDesc = creator.bio || 'K-뷰티 크리에이터 셀렉트샵';
  const buyer = useAuthStore((s) => s.buyer);

  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [bioExpanded, setBioExpanded] = useState(false);

  // 팔로우 상태 + 팔로워 수 서버에서 조회
  useEffect(() => {
    getFollowInfo(creator.id).then((info) => {
      setIsFollowing(info.isFollowing);
      setFollowerCount(info.followerCount);
    });
  }, [creator.id]);

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

  const handleFollow = async () => {
    if (!isLoggedIn) {
      toast.error('로그인 후 팔로우할 수 있어요');
      router.push(`/${locale}/buyer/login?returnUrl=${encodeURIComponent(`/${locale}/${username}`)}`);
      return;
    }
    setIsFollowLoading(true);
    try {
      const result = await toggleFollow(creator.id);
      if (result.success) {
        setIsFollowing(result.isFollowing);
        setFollowerCount((prev) => result.isFollowing ? prev + 1 : prev - 1);
        toast.success(result.isFollowing ? '팔로우했어요! 새 공구 알림을 받아볼 수 있어���.' : '팔로우를 취소했어요.');
      } else {
        toast.error(result.error || '오류가 발생했습니다');
      }
    } catch {
      toast.error('팔로우 처리 중 ���류가 발생했습니다');
    } finally {
      setIsFollowLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <VisitTracker creatorId={creator.id} />

      {/* A. Sticky Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[480px] mx-auto h-12 flex items-center justify-between px-4">
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center -ml-1.5 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="뒤로가기"
          >
            <ChevronLeft className="h-5 w-5 text-gray-900" />
          </button>

          <h1 className="text-[15px] font-semibold text-gray-900 truncate max-w-[200px]">
            {creator.displayName || creator.shopId}
          </h1>

          <div className="flex items-center gap-0.5">
            <ShareSheet
              url={shopUrl}
              title={`${creator.displayName}의 셀렉트샵`}
              description={shopDesc}
              imageUrl={creator.profileImageUrl || undefined}
              trigger={
                <button
                  className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="공유하기"
                >
                  <Share2 className="h-[18px] w-[18px] text-gray-900" />
                </button>
              }
            />
            <Link
              href={`/${locale}/${username}/checkout`}
              className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              aria-label="장바구니"
            >
              <ShoppingBag className="h-[18px] w-[18px] text-gray-900" />
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-[480px] mx-auto">
        {/* B. Hero Profile Section */}
        <section className="relative">
          {/* Cover image / gradient background */}
          <div className="relative h-48 overflow-hidden">
            {creator.coverImageUrl ? (
              <img
                src={creator.coverImageUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700" />
            )}
            <div className="absolute inset-0 bg-black/30" />
          </div>

          {/* Profile content overlaid */}
          <div className="relative px-4 -mt-12 pb-5">
            {/* Profile photo */}
            <div className="relative inline-block">
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100">
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

            {/* Badge */}
            <div className="mt-3">
              <span className="inline-flex items-center bg-emerald-50 text-emerald-700 rounded-full px-3 py-1 text-xs font-medium border border-emerald-200">
                CNEC 인증 크리에이터
              </span>
            </div>

            {/* Name & handle */}
            <h2 className="text-xl font-bold text-gray-900 mt-2 leading-tight">
              {creator.displayName}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              @{creator.shopId || username}
            </p>

            {/* Bio */}
            {shopDesc && (
              <div className="mt-2">
                <p
                  className={`text-sm text-gray-500 leading-relaxed ${
                    !bioExpanded ? 'line-clamp-2' : ''
                  }`}
                >
                  {shopDesc}
                </p>
                {shopDesc.length > 60 && !bioExpanded && (
                  <button
                    onClick={() => setBioExpanded(true)}
                    className="text-sm text-gray-900 font-medium mt-0.5 hover:underline"
                  >
                    더보기
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        {/* C. Navigation Tab Icons */}
        <div className="border-b border-gray-100">
          <div className="grid grid-cols-4 px-4">
            <button
              onClick={() => setActiveTab('gonggu')}
              className="flex flex-col items-center gap-1 py-3 text-gray-900"
            >
              <Home className="h-5 w-5" />
              <span className="text-[11px] font-medium">피드</span>
            </button>
            <button
              onClick={() => setActiveTab('pick')}
              className="flex flex-col items-center gap-1 py-3 text-gray-500"
            >
              <LayoutGrid className="h-5 w-5" />
              <span className="text-[11px] font-medium">카테고리</span>
            </button>
            <Link
              href={`/${locale}/${username}/checkout`}
              className="flex flex-col items-center gap-1 py-3 text-gray-500"
            >
              <ShoppingBag className="h-5 w-5" />
              <span className="text-[11px] font-medium">장바구니</span>
            </Link>
            {buyer ? (
              <Link
                href={`/${locale}/my`}
                className="flex flex-col items-center gap-1 py-3 text-gray-500"
              >
                <User className="h-5 w-5" />
                <span className="text-[11px] font-medium">MY</span>
              </Link>
            ) : (
              <Link
                href={`/${locale}/buyer/login?returnUrl=${encodeURIComponent(`/${locale}/${username}`)}`}
                className="flex flex-col items-center gap-1 py-3 text-gray-500"
              >
                <User className="h-5 w-5" />
                <span className="text-[11px] font-medium">MY</span>
              </Link>
            )}
          </div>
        </div>

        {/* D. Follow CTA */}
        <div className="px-4 pt-4">
          <button
            onClick={handleFollow}
            disabled={isFollowLoading}
            className={`w-full h-12 rounded-full text-[15px] font-semibold flex items-center justify-center gap-2 transition-all ${
              isFollowing
                ? 'bg-gray-100 text-gray-700 border border-gray-200'
                : 'bg-gray-900 text-white hover:bg-gray-800'
            } disabled:opacity-60`}
          >
            {isFollowLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isFollowing ? (
              <Bell className="h-4 w-4 text-gray-600" />
            ) : (
              <Heart className="h-4 w-4" />
            )}
            {isFollowing ? '팔로우 중' : '팔로우하고 공구 알림 받기'}
          </button>
          {followerCount > 0 && (
            <p className="text-center text-xs text-gray-400 mt-2">
              {followerCount.toLocaleString()}명이 팔로우하고 있어요
            </p>
          )}
        </div>

        {/* E. Beauty Profile Card */}
        {hasBeautyProfile && (
          <section className="mx-4 mt-5">
            <div className="rounded-xl bg-gray-50 p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <Sparkles className="h-4 w-4 text-gray-900" />
                <h3 className="text-[15px] font-bold text-gray-900">
                  크리에이터 뷰티 정보
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {creator.skinType && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-white text-[13px] text-gray-900 font-medium">
                    {creator.skinType}
                  </span>
                )}
                {creator.skinConcerns?.map((concern) => (
                  <span
                    key={concern}
                    className="inline-flex items-center px-3 py-1.5 rounded-full bg-white text-[13px] text-gray-500"
                  >
                    {concern}
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* F. LIVE 공구 Section */}
        {gongguItems.length > 0 && (
          <section className="mt-6 px-4">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900">LIVE 공구</h3>
              <p className="text-sm text-gray-500 mt-0.5">지금 이 가격, 마감 임박</p>
            </div>
            <div className="space-y-4">
              {gongguItems.map((item) => (
                <GongguCard
                  key={item.id}
                  item={item}
                  username={username}
                  locale={locale}
                  creatorId={creator.id}
                  isLoggedIn={isLoggedIn}
                  isWishlisted={wishlistedSet.has(item.productId)}
                />
              ))}
            </div>
          </section>
        )}

        {/* G. 추천 Products Section */}
        {pickItems.length > 0 && (
          <section className="mt-8 px-4">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900">추천</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {pickItems.map((item) => (
                <PickProductCard
                  key={item.id}
                  item={item}
                  username={username}
                  locale={locale}
                  creatorId={creator.id}
                  isLoggedIn={isLoggedIn}
                  isWishlisted={wishlistedSet.has(item.productId)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty states when no items at all */}
        {gongguItems.length === 0 && pickItems.length === 0 && (
          <div className="px-4 mt-4 pb-8">
            <EmptyState
              icon={<Clock className="h-10 w-10 text-gray-300" />}
              title="아직 등록된 상품이 없어요"
              subtitle="새 공구가 시작되면 알려드릴게요"
            />
          </div>
        )}

        {/* Banner Section */}
        {creator.bannerImageUrl && (
          <BannerSection
            bannerImageUrl={creator.bannerImageUrl}
            bannerLink={creator.bannerLink ?? undefined}
          />
        )}

        {/* Footer */}
        <div className="border-t border-gray-100 py-4 px-4 mt-8">
          <p className="text-[12px] text-gray-400 text-center">
            추천만 하세요. 배송/CS는 크넥이 관리합니다
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

function GongguCard({
  item,
  username,
  locale,
  creatorId,
  isLoggedIn,
  isWishlisted,
}: {
  item: ShopItem;
  username: string;
  locale: string;
  creatorId: string;
  isLoggedIn: boolean;
  isWishlisted: boolean;
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
  const totalStock = Number(campaign?.totalStock ?? 0);
  const soldCount = Number(campaign?.soldCount ?? 0);
  const remaining = totalStock > 0 ? totalStock - soldCount : 0;
  const progressPercent = totalStock > 0 ? Math.min(Math.round((soldCount / totalStock) * 100), 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      <Link
        href={`/${locale}/${username}/product/${product.id}${item.campaignId ? `?campaign=${item.campaignId}` : ''}`}
        className="block"
      >
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name ?? ''}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
              이미지 없음
            </div>
          )}
          {/* Countdown badge */}
          {badge && (
            <span
              className={`absolute top-3 left-3 rounded-full px-3 py-1 text-[11px] font-bold ${
                badge.variant === 'gray'
                  ? 'bg-gray-400 text-white'
                  : 'bg-red-500 text-white'
              } ${badge.variant === 'red-pulse' ? 'animate-pulse' : ''}`}
            >
              {badge.label}
            </span>
          )}
        </div>

        {/* Product info */}
        <div className="p-3.5">
          {brandName && (
            <p className="text-[12px] text-gray-500 truncate">{brandName}</p>
          )}
          <h4 className="text-[14px] text-gray-900 font-medium line-clamp-2 leading-snug mt-0.5">
            {product.name}
          </h4>

          {/* Price */}
          <div className="flex items-baseline gap-1.5 mt-2">
            {discountPercent > 0 && (
              <span className="text-[15px] font-bold text-red-500">
                {discountPercent}%
              </span>
            )}
            <span className="text-[16px] font-bold text-gray-900">
              {formatWon(effectivePrice)}
            </span>
          </div>
          {discountPercent > 0 && (
            <span className="text-[12px] text-gray-400 line-through">
              {formatWon(productOriginalPrice)}
            </span>
          )}

          {/* Progress bar */}
          {totalStock > 0 && (
            <div className="mt-3">
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-1.5">
                {soldCount}/{totalStock}명 참여 중
              </p>
              {remaining > 0 && remaining <= 5 && (
                <p className="text-[11px] text-red-500 font-medium mt-0.5">
                  {remaining}명만 더 모이면 달성 확인
                </p>
              )}
            </div>
          )}
        </div>
      </Link>

      {/* CTA Button */}
      <div className="px-3.5 pb-3.5">
        <Link
          href={`/${locale}/${username}/product/${product.id}${item.campaignId ? `?campaign=${item.campaignId}` : ''}`}
          className="flex items-center justify-center w-full h-10 bg-gray-900 text-white text-[13px] font-semibold rounded-xl hover:bg-gray-800 transition-colors"
        >
          지금 공구 참여하기
          <ChevronRight className="h-4 w-4 ml-0.5" />
        </Link>
      </div>
    </div>
  );
}

function PickProductCard({
  item,
  username,
  locale,
  creatorId,
  isLoggedIn,
  isWishlisted,
}: {
  item: ShopItem;
  username: string;
  locale: string;
  creatorId: string;
  isLoggedIn: boolean;
  isWishlisted: boolean;
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
        <div className="aspect-square rounded-xl overflow-hidden bg-gray-50">
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
        <div className="mt-2.5">
          {brandName && (
            <p className="text-[12px] text-gray-500 truncate">{brandName}</p>
          )}
          <h4 className="text-[14px] text-gray-900 line-clamp-2 leading-snug mt-0.5">
            {product.name}
          </h4>
          <div className="flex items-baseline gap-1.5 mt-1.5">
            {discountPercent > 0 && (
              <span className="text-[14px] font-bold text-red-500">
                {discountPercent}%
              </span>
            )}
            <span className="text-[15px] font-bold text-gray-900">
              {formatWon(effectivePrice)}
            </span>
          </div>
          {discountPercent > 0 && (
            <span className="text-[12px] text-gray-400 line-through">
              {formatWon(productOriginalPrice)}
            </span>
          )}

          <ProductCardActions
            creatorId={creatorId}
            productId={product.id}
            campaignId={item.campaignId}
            isWishlisted={isWishlisted}
            isLoggedIn={isLoggedIn}
            className="mt-2"
          />
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
      <p className="text-[14px] font-medium text-gray-500">{title}</p>
      <p className="text-[12px] text-gray-300 mt-1">{subtitle}</p>
    </div>
  );
}
