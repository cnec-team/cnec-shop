'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Instagram, Share2 } from 'lucide-react';
import { ShareSheet } from '@/components/shop/ShareSheet';
import { VisitTracker } from '@/components/shop/VisitTracker';
import type {
  Creator,
  CreatorShopItem,
  Collection,
  SkinType,
  PersonalColor,
} from '@/types/database';
import {
  SKIN_TYPE_LABELS,
  PERSONAL_COLOR_LABELS,
} from '@/types/database';

// =============================================
// Props
// =============================================

interface CreatorShopPageProps {
  creator: Creator;
  shopItems: CreatorShopItem[];
  collections: Collection[];
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

function calculateDDay(endAt: string | undefined): string {
  if (!endAt) return '';
  const now = new Date();
  const end = new Date(endAt);
  const diff = end.getTime() - now.getTime();
  if (diff <= 0) return '마감';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
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

  // Group pick items by collection
  const collectionGroups = useMemo(() => {
    const groups: { collection: Collection | null; items: CreatorShopItem[] }[] = [];

    // Items in named collections
    for (const col of collections) {
      const colItems = pickItems.filter((item) => item.collection_id === col.id);
      if (colItems.length > 0) {
        groups.push({ collection: col, items: colItems });
      }
    }

    // Items not in any collection
    const collectionIds = new Set(collections.map((c) => c.id));
    const uncategorized = pickItems.filter(
      (item) => !item.collection_id || !collectionIds.has(item.collection_id)
    );
    if (uncategorized.length > 0) {
      groups.push({ collection: null, items: uncategorized });
    }

    return groups;
  }, [pickItems, collections]);

  const defaultTab = gongguItems.length > 0 ? 'gonggu' : 'pick';

  return (
    <div className="min-h-screen bg-background">
      <VisitTracker creatorId={creator.id} />

      {/* Header / Profile Section */}
      <ShopHeader creator={creator} shopUrl={shopUrl} />

      {/* Beauty Profile */}
      <BeautyProfile creator={creator} />

      {/* Social Links */}
      <SocialLinks creator={creator} />

      <Separator className="my-0" />

      {/* Tabs */}
      <div className="max-w-lg mx-auto px-4 pt-4 pb-6">
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="w-full grid grid-cols-2" variant="line">
            <TabsTrigger value="gonggu" className="text-base">
              <span className="mr-1">🔥</span> 공구
              {gongguItems.length > 0 && (
                <span className="ml-1 text-xs text-muted-foreground">
                  ({gongguItems.length})
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="pick" className="text-base">
              <span className="mr-1">💜</span> 크리에이터픽
              {pickItems.length > 0 && (
                <span className="ml-1 text-xs text-muted-foreground">
                  ({pickItems.length})
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Gonggu Tab Content */}
          <TabsContent value="gonggu" className="mt-4">
            {gongguItems.length === 0 ? (
              <EmptyState message="현재 진행 중인 공구가 없습니다." />
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
          </TabsContent>

          {/* Creator Pick Tab Content */}
          <TabsContent value="pick" className="mt-4">
            {pickItems.length === 0 ? (
              <EmptyState message="아직 추천 상품이 없습니다." />
            ) : (
              <div className="space-y-8">
                {collectionGroups.map((group) => (
                  <CollectionSection
                    key={group.collection?.id || 'all'}
                    collection={group.collection}
                    items={group.items}
                    username={username}
                    locale={locale}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Banner Section */}
      {creator.banner_image_url && (
        <BannerSection
          bannerImageUrl={creator.banner_image_url}
          bannerLink={creator.banner_link}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="max-w-lg mx-auto px-4 text-center">
          <p className="text-xs text-muted-foreground">
            Powered by CNEC Commerce
          </p>
        </div>
      </footer>
    </div>
  );
}

// Re-export for backward compatibility
export { CreatorShopPage as CreatorShop };

// =============================================
// Sub-components
// =============================================

function ShopHeader({ creator, shopUrl }: { creator: Creator; shopUrl: string }) {
  const shopDesc = creator.bio || 'K-뷰티 크리에이터 셀렉트샵';

  return (
    <div className="relative">
      {/* Cover Image */}
      <div className="h-44 sm:h-56 bg-secondary relative overflow-hidden">
        {creator.cover_image_url ? (
          <img
            src={creator.cover_image_url}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-secondary to-accent/20" />
        )}
      </div>

      {/* Profile Section */}
      <div className="max-w-lg mx-auto px-4 relative">
        {/* Profile Image */}
        <div className="absolute -top-12 left-4">
          <div className="w-24 h-24 rounded-full border-4 border-background overflow-hidden bg-secondary">
            {creator.profile_image_url ? (
              <img
                src={creator.profile_image_url}
                alt={creator.display_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-muted-foreground">
                {creator.display_name?.charAt(0) || '?'}
              </div>
            )}
          </div>
        </div>

        {/* Share Button */}
        <div className="absolute -top-12 right-4">
          <ShareSheet
            url={shopUrl}
            title={`${creator.display_name}의 셀렉트샵`}
            description={shopDesc}
            imageUrl={creator.profile_image_url || undefined}
            trigger={
              <button className="flex h-9 w-9 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm shadow-sm hover:bg-background transition-colors">
                <Share2 className="h-4 w-4" />
              </button>
            }
          />
        </div>

        {/* Name & Bio */}
        <div className="pt-16 pb-4">
          <h1 className="text-xl font-bold text-foreground">
            {creator.display_name}
          </h1>
          {creator.bio && (
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              {creator.bio}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function BeautyProfile({ creator }: { creator: Creator }) {
  const tags: { label: string; variant: 'outline' | 'secondary' }[] = [];

  if (creator.skin_type) {
    tags.push({
      label: SKIN_TYPE_LABELS[creator.skin_type],
      variant: 'secondary',
    });
  }

  if (creator.personal_color) {
    tags.push({
      label: PERSONAL_COLOR_LABELS[creator.personal_color],
      variant: 'secondary',
    });
  }

  if (creator.skin_concerns && creator.skin_concerns.length > 0) {
    creator.skin_concerns.forEach((concern) => {
      tags.push({ label: concern, variant: 'outline' });
    });
  }

  if (tags.length === 0) return null;

  return (
    <div className="max-w-lg mx-auto px-4 pb-3">
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag, idx) => (
          <Badge key={idx} variant={tag.variant} className="text-xs">
            {tag.label}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function SocialLinks({ creator }: { creator: Creator }) {
  if (!creator.instagram_handle) return null;

  return (
    <div className="max-w-lg mx-auto px-4 pb-4">
      <div className="flex gap-3">
        {creator.instagram_handle && (
          <a
            href={`https://instagram.com/${creator.instagram_handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Instagram className="w-4 h-4" />
            <span>@{creator.instagram_handle}</span>
          </a>
        )}
      </div>
    </div>
  );
}

function GongguCard({
  item,
  username,
  locale,
}: {
  item: CreatorShopItem;
  username: string;
  locale: string;
}) {
  const product = item.product;
  const campaign = item.campaign;
  const campaignProduct = item.campaign_product;

  if (!product) return null;

  const effectivePrice = campaignProduct?.campaign_price ?? product.sale_price;
  const discountPercent = calculateDiscountPercent(product.original_price, effectivePrice);
  const dDay = campaign?.end_at ? calculateDDay(campaign.end_at) : '';
  const brandName = product.brand?.brand_name || '';
  const isActive = campaign?.status === 'ACTIVE';

  return (
    <Link
      href={`/${locale}/${username}/product/${product.id}${item.campaign_id ? `?campaign=${item.campaign_id}` : ''}`}
      className="block"
    >
      <div className="flex gap-3 p-3 rounded-xl bg-card border border-border card-hover group">
        {/* Product Image */}
        <div className="relative w-28 h-28 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
              No Image
            </div>
          )}
          {/* Fire Badge + D-Day */}
          <div className="absolute top-1.5 left-1.5 flex gap-1">
            <Badge className="bg-accent text-accent-foreground text-[10px] px-1.5 py-0.5">
              🔥 공구
            </Badge>
            {dDay && isActive && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                {dDay}
              </Badge>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div>
            {brandName && (
              <p className="text-xs text-muted-foreground mb-0.5 truncate">
                {brandName}
              </p>
            )}
            <h3 className="text-sm font-medium text-foreground line-clamp-2 leading-snug">
              {product.name}
            </h3>
            {campaign?.title && (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {campaign.title}
              </p>
            )}
          </div>

          <div className="flex items-end justify-between mt-2">
            <div className="flex items-baseline gap-2">
              {discountPercent > 0 && (
                <span className="text-sm font-bold text-accent">
                  {discountPercent}%
                </span>
              )}
              <span className="text-base font-bold text-foreground">
                {formatKRW(effectivePrice)}
              </span>
              {discountPercent > 0 && (
                <span className="text-xs text-muted-foreground line-through">
                  {formatKRW(product.original_price)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function CollectionSection({
  collection,
  items,
  username,
  locale,
}: {
  collection: Collection | null;
  items: CreatorShopItem[];
  username: string;
  locale: string;
}) {
  const title = collection?.name || '전체 상품';
  const description = collection?.description;

  return (
    <div>
      {/* Section Header */}
      <div className="mb-3">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>

      {/* Horizontal Scroll Product Cards */}
      <div
        className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4"
        style={{ scrollbarWidth: 'none' }}
      >
        {items.map((item) => (
          <PickProductCard
            key={item.id}
            item={item}
            username={username}
            locale={locale}
          />
        ))}
      </div>
    </div>
  );
}

function PickProductCard({
  item,
  username,
  locale,
}: {
  item: CreatorShopItem;
  username: string;
  locale: string;
}) {
  const product = item.product;
  if (!product) return null;

  const effectivePrice = item.campaign_product?.campaign_price ?? product.sale_price;
  const discountPercent = calculateDiscountPercent(product.original_price, effectivePrice);
  const brandName = product.brand?.brand_name || '';

  return (
    <Link
      href={`/${locale}/${username}/product/${product.id}${item.campaign_id ? `?campaign=${item.campaign_id}` : ''}`}
      className="flex-shrink-0 w-36"
    >
      <div className="group">
        {/* Image */}
        <div className="w-36 h-36 rounded-lg overflow-hidden bg-secondary mb-2">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
              No Image
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {brandName && (
            <p className="text-[11px] text-muted-foreground truncate">
              {brandName}
            </p>
          )}
          <h4 className="text-xs font-medium text-foreground line-clamp-2 leading-snug mt-0.5">
            {product.name}
          </h4>
          <div className="flex items-baseline gap-1 mt-1">
            {discountPercent > 0 && (
              <span className="text-xs font-bold text-accent">
                {discountPercent}%
              </span>
            )}
            <span className="text-sm font-bold text-foreground">
              {formatKRW(effectivePrice)}
            </span>
          </div>
          {discountPercent > 0 && (
            <span className="text-[11px] text-muted-foreground line-through">
              {formatKRW(product.original_price)}
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
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="rounded-xl overflow-hidden">
        <img
          src={bannerImageUrl}
          alt="Banner"
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

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-16 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
