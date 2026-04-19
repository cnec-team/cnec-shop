'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Heart, Share2, Play, Package } from 'lucide-react';
import { BottomNav } from '@/components/buyer/BottomNav';

// Types
interface ContentCreator {
  id: string;
  displayName: string | null;
  shopId: string | null;
  username: string | null;
  profileImageUrl: string | null;
  instagramHandle: string | null;
}

interface ContentProduct {
  id: string;
  name: string | null;
  nameKo: string | null;
  thumbnailUrl: string | null;
  imageUrl: string | null;
  images: string[];
  salePrice: number | null;
  originalPrice: number | null;
  category: string | null;
  brand: { brandName: string | null; logoUrl: string | null } | null;
}

interface ContentItem {
  id: string;
  type: string;
  url: string;
  caption: string | null;
  createdAt: string;
  creator: ContentCreator;
  product: ContentProduct | null;
}

const TABS = [
  { key: 'all', label: '전체' },
  { key: 'skincare', label: '스킨케어' },
  { key: 'cleansing', label: '클렌징' },
  { key: 'suncare', label: '선케어' },
  { key: 'makeup', label: '메이크업' },
];

export default function ContentFeedPage() {
  const params = useParams();
  const locale = params.locale as string;
  const [activeTab, setActiveTab] = useState('all');
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);

  const fetchContent = useCallback(async (cursor?: string) => {
    try {
      const res = await fetch(`/api/content?tab=${activeTab}${cursor ? `&cursor=${cursor}` : ''}`);
      const data = await res.json();
      if (cursor) {
        setItems(prev => [...prev, ...data.items]);
      } else {
        setItems(data.items);
      }
      setNextCursor(data.nextCursor);
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeTab]);

  useEffect(() => {
    setLoading(true);
    setItems([]);
    fetchContent();
  }, [fetchContent]);

  // Infinite scroll
  useEffect(() => {
    if (!observerRef.current || !nextCursor) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && nextCursor && !loadingMore) {
        setLoadingMore(true);
        fetchContent(nextCursor);
      }
    }, { threshold: 0.5 });
    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [nextCursor, loadingMore, fetchContent]);

  const formatPrice = (n: number) => n.toLocaleString() + '원';

  return (
    <div className="min-h-screen bg-white max-w-[480px] mx-auto pb-20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-[#E5E5EA]">
        <div className="h-14 flex items-center justify-center px-4">
          <h1 className="text-[17px] font-bold text-[#1A1A1A]">콘텐츠</h1>
        </div>
        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-3">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-[#1A1A1A] text-white'
                  : 'bg-[#F5F5F5] text-[#1A1A1A]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content feed */}
      <div className="px-4 pt-4 space-y-6">
        {loading ? (
          // Skeleton
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 rounded-xl aspect-[4/5] mb-3" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <Play className="mx-auto h-12 w-12 text-[#8E8E93] mb-4" />
            <p className="text-[15px] font-medium text-[#1A1A1A]">아직 콘텐츠가 없어요</p>
            <p className="text-[13px] text-[#8E8E93] mt-1">크리에이터들의 리뷰가 곧 올라올 거예요</p>
          </div>
        ) : (
          items.map(item => {
            const product = item.product;
            const creator = item.creator;
            const creatorSlug = creator.shopId || creator.username || creator.id;
            const productImage = product?.thumbnailUrl || product?.imageUrl || product?.images?.[0] || null;
            const contentThumbnail = productImage;
            const salePrice = product?.salePrice ?? 0;
            const originalPrice = product?.originalPrice ?? 0;
            const discount = originalPrice > salePrice && originalPrice > 0
              ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
              : 0;

            return (
              <div key={item.id} className="mb-2">
                {/* Content image/thumbnail */}
                <div className="relative rounded-xl overflow-hidden aspect-[4/5] bg-[#F5F5F5]">
                  {contentThumbnail ? (
                    <img
                      src={contentThumbnail}
                      alt={item.caption || ''}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-12 w-12 text-[#8E8E93]" />
                    </div>
                  )}

                  {/* Play button overlay for reels */}
                  {item.type === 'INSTAGRAM_REEL' && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div className="w-14 h-14 rounded-full bg-black/40 flex items-center justify-center">
                        <Play className="h-7 w-7 text-white fill-white ml-1" />
                      </div>
                    </a>
                  )}

                  {/* Bottom overlay: creator info */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-12">
                    <Link href={`/${locale}/shop/${creatorSlug}`} className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-white/20 shrink-0 relative">
                        {creator.profileImageUrl ? (
                          <Image src={creator.profileImageUrl} alt="" fill className="object-cover" sizes="36px" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                            {(creator.displayName || '?').charAt(0)}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-[14px] font-bold text-white">{creator.displayName || creator.shopId}</p>
                      </div>
                    </Link>
                  </div>

                  {/* Right side icons */}
                  <div className="absolute top-4 right-4 flex flex-col gap-3">
                    <button className="w-10 h-10 rounded-full bg-black/30 flex items-center justify-center">
                      <Heart className="h-5 w-5 text-white" />
                    </button>
                    <button className="w-10 h-10 rounded-full bg-black/30 flex items-center justify-center">
                      <Share2 className="h-5 w-5 text-white" />
                    </button>
                  </div>
                </div>

                {/* Caption */}
                {item.caption && (
                  <p className="text-[14px] text-[#1A1A1A] mt-3 line-clamp-2 leading-relaxed">{item.caption}</p>
                )}

                {/* Linked product card */}
                {product && (
                  <Link
                    href={`/${locale}/shop/${creatorSlug}/product/${product.id}`}
                    className="mt-3 flex gap-3 rounded-xl border border-[#E5E5EA] p-2.5"
                  >
                    <div className="w-[60px] h-[60px] rounded-lg overflow-hidden bg-[#F5F5F5] shrink-0 relative">
                      {productImage ? (
                        <Image src={productImage} alt="" fill className="object-cover" sizes="60px" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-5 w-5 text-[#8E8E93]" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 py-0.5">
                      {product.brand?.brandName && (
                        <p className="text-[12px] text-[#8E8E93]">{product.brand.brandName}</p>
                      )}
                      <p className="text-[13px] text-[#1A1A1A] line-clamp-1 font-medium">
                        {product.nameKo || product.name}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {discount > 0 && (
                          <span className="text-[13px] font-bold text-red-500">{discount}%</span>
                        )}
                        <span className="text-[13px] font-bold text-[#1A1A1A]">
                          {formatPrice(salePrice)}
                        </span>
                      </div>
                    </div>
                  </Link>
                )}
              </div>
            );
          })
        )}

        {/* Infinite scroll sentinel */}
        {nextCursor && (
          <div ref={observerRef} className="py-8 flex justify-center">
            <div className="w-6 h-6 border-2 border-[#8E8E93] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <BottomNav />
    </div>
  );
}
