'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getAllRecentViews, clearAllRecentViews } from '@/lib/actions/recent-view';
import { Clock, ArrowLeft, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { ChevronLeft, ShoppingBag, User } from 'lucide-react';

interface RecentViewProduct {
  id: string;
  name: string | null;
  nameKo: string | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  images: string[];
  price: number | null;
  originalPrice: number | null;
  salePrice: number | null;
  brand: {
    id: string;
    brandName: string | null;
    logoUrl: string | null;
  } | null;
}

interface RecentViewCreator {
  id: string;
  username: string;
  displayName: string | null;
  profileImage: string | null;
}

interface RecentViewItem {
  id: string;
  productId: string;
  shopId: string;
  viewedAt: string;
  product: RecentViewProduct;
  creator: RecentViewCreator;
}

function formatKRW(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    minimumFractionDigits: 0,
  }).format(amount);
}

function getDiscountPercent(original: number, sale: number): number {
  if (original <= 0) return 0;
  return Math.round(((original - sale) / original) * 100);
}

function getProductImage(product: RecentViewProduct): string | null {
  return product.thumbnailUrl || product.imageUrl || product.images?.[0] || null;
}

export default function GlobalRecentViewsPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;

  const [items, setItems] = useState<RecentViewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearing, setIsClearing] = useState(false);
  const fetchedRef = useRef(false);

  const loadRecentViews = useCallback(async () => {
    try {
      const data = await getAllRecentViews(50);
      setItems(data as unknown as RecentViewItem[]);
    } catch (error) {
      console.error('최근 본 상품 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    loadRecentViews();
  }, [loadRecentViews]);

  const handleClearAll = async () => {
    setIsClearing(true);
    try {
      await clearAllRecentViews();
      setItems([]);
      toast.success('최근 본 상품을 모두 삭제했습니다');
    } catch {
      toast.error('삭제에 실패했습니다');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white sticky top-0 z-10 border-b border-gray-100">
          <div className="flex items-center h-12 px-4">
            <button onClick={() => router.back()} className="p-1 -ml-1 mr-2">
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <h1 className="text-base font-semibold text-gray-900 flex-1">
              최근 본 상품{' '}
              {items.length > 0 && (
                <span className="text-gray-400 font-normal">({items.length})</span>
              )}
            </h1>
            {items.length > 0 && (
              <button
                onClick={handleClearAll}
                disabled={isClearing}
                className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isClearing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                전체 지우기
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <Clock className="h-16 w-16 text-gray-200 mb-4" />
            <p className="text-base font-semibold text-gray-700 mb-1">최근 본 상품이 없어요</p>
            <p className="text-sm text-gray-400 mb-6">상품을 둘러보면 여기에 기록됩니다</p>
            <Link
              href={`/${locale}`}
              className="inline-flex items-center gap-1.5 h-10 px-5 bg-gray-900 text-white rounded-lg text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              쇼핑하러 가기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-gray-100">
            {items.map((item) => {
              const product = item.product;
              const imgSrc = getProductImage(product);
              const displayPrice = product.salePrice ?? product.price;
              const hasDiscount =
                product.originalPrice != null &&
                product.salePrice != null &&
                product.originalPrice > product.salePrice;
              const discountPercent = hasDiscount
                ? getDiscountPercent(product.originalPrice!, product.salePrice!)
                : 0;

              return (
                <div key={item.id} className="bg-white relative">
                  {/* Creator badge */}
                  <Link
                    href={`/${locale}/${item.creator.username}`}
                    className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-white/95 backdrop-blur rounded-full px-2 py-1 text-[10px] shadow-sm"
                  >
                    {item.creator.profileImage ? (
                      <div className="w-4 h-4 rounded-full overflow-hidden relative">
                        <Image src={item.creator.profileImage} alt="" fill sizes="16px" className="object-cover" />
                      </div>
                    ) : (
                      <User className="w-3 h-3 text-gray-400" />
                    )}
                    <span className="font-medium text-gray-700">{item.creator.displayName || item.creator.username}</span>
                  </Link>

                  {/* Product Image */}
                  <Link href={`/${locale}/${item.creator.username}/products/${product.id}`}>
                    <div className="aspect-square relative bg-gray-100">
                      {imgSrc ? (
                        <Image
                          src={imgSrc}
                          alt={product.nameKo || product.name || '상품'}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-8 h-8 text-gray-300" />
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="p-3">
                    {product.brand && (
                      <p className="text-xs text-gray-400 mb-0.5 truncate">{product.brand.brandName}</p>
                    )}
                    <Link href={`/${locale}/${item.creator.username}/products/${product.id}`}>
                      <p className="text-sm text-gray-900 line-clamp-2 leading-snug mb-1.5">
                        {product.nameKo || product.name || '상품명 없음'}
                      </p>
                    </Link>
                    <div className="flex items-baseline gap-1.5">
                      {hasDiscount && (
                        <span className="text-sm font-bold text-red-500">{discountPercent}%</span>
                      )}
                      {displayPrice != null && (
                        <span className="text-sm font-bold text-gray-900">{formatKRW(displayPrice)}</span>
                      )}
                    </div>
                    {hasDiscount && product.originalPrice != null && (
                      <span className="text-xs text-gray-400 line-through">{formatKRW(product.originalPrice)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
