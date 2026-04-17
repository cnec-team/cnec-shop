'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useUser } from '@/lib/hooks/use-user';
import { getWishlist, removeWishlistItems, moveWishlistToCart } from '@/lib/actions/wishlist';
import { resolveCreatorId } from '@/lib/actions/shop-resolve';
import {
  Heart,
  Trash2,
  ShoppingBag,
  ArrowLeft,
  Loader2,
  Check,
  ChevronLeft,
} from 'lucide-react';
import { toast } from 'sonner';

interface WishlistProduct {
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

interface WishlistItem {
  id: string;
  productId: string;
  product: WishlistProduct;
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

function getProductImage(product: WishlistProduct): string | null {
  return product.thumbnailUrl || product.imageUrl || product.images?.[0] || null;
}

export default function WishlistPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const username = params.username as string;
  const { user, isLoading: isUserLoading } = useUser();

  const [items, setItems] = useState<WishlistItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isActioning, setIsActioning] = useState(false);
  const fetchedRef = useRef(false);

  const loadWishlist = useCallback(async () => {
    try {
      const shopId = await resolveCreatorId(username);
      if (!shopId) return;
      const data = await getWishlist(shopId);
      setItems(data as unknown as WishlistItem[]);
    } catch (error) {
      console.error('찜 목록 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  }, [username]);

  useEffect(() => {
    if (isUserLoading || !user || fetchedRef.current) return;
    fetchedRef.current = true;
    loadWishlist();
  }, [isUserLoading, user, loadWishlist]);

  const allSelected = items.length > 0 && selectedIds.size === items.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((item) => item.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleRemoveSelected = async () => {
    if (selectedIds.size === 0) {
      toast.error('삭제할 상품을 선택하세요');
      return;
    }
    setIsActioning(true);
    try {
      await removeWishlistItems(Array.from(selectedIds));
      setItems((prev) => prev.filter((item) => !selectedIds.has(item.id)));
      setSelectedIds(new Set());
      toast.success('선택한 상품을 삭제했습니다');
    } catch {
      toast.error('삭제에 실패했습니다');
    } finally {
      setIsActioning(false);
    }
  };

  const handleMoveToCart = async () => {
    if (selectedIds.size === 0) {
      toast.error('장바구니에 담을 상품을 선택하세요');
      return;
    }
    setIsActioning(true);
    try {
      const result = await moveWishlistToCart(Array.from(selectedIds));
      setItems((prev) => prev.filter((item) => !selectedIds.has(item.id)));
      setSelectedIds(new Set());
      toast.success(`${result.moved}개 상품을 장바구니에 담았습니다`);
    } catch {
      toast.error('장바구니 담기에 실패했습니다');
    } finally {
      setIsActioning(false);
    }
  };

  // Loading state
  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <Heart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h1 className="text-lg font-bold text-gray-900 mb-2">로그인이 필요해요</h1>
          <p className="text-sm text-gray-400 mb-6">
            찜한 상품을 확인하려면 로그인하세요
          </p>
          <Link
            href={`/${locale}/buyer/login?returnUrl=${encodeURIComponent(`/${locale}/${username}/me/wishlist`)}`}
            className="inline-flex items-center justify-center h-12 px-8 bg-gray-900 text-white rounded-xl font-semibold text-sm"
          >
            로그인
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white sticky top-0 z-10 border-b border-gray-100">
          <div className="flex items-center h-12 px-4">
            <button
              onClick={() => router.back()}
              className="p-1 -ml-1 mr-2"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <h1 className="text-base font-semibold text-gray-900 flex-1">
              찜한 상품 {items.length > 0 && <span className="text-gray-400 font-normal">({items.length})</span>}
            </h1>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : items.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <Heart className="h-16 w-16 text-gray-200 mb-4" />
            <p className="text-base font-semibold text-gray-700 mb-1">찜한 상품이 없어요</p>
            <p className="text-sm text-gray-400 mb-6">마음에 드는 상품을 찜해보세요</p>
            <Link
              href={`/${locale}/${username}`}
              className="inline-flex items-center gap-1.5 h-10 px-5 bg-gray-900 text-white rounded-lg text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              쇼핑하러 가기
            </Link>
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="bg-white px-4 py-3 flex items-center gap-3 border-b border-gray-100">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-sm text-gray-600"
              >
                <div
                  className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                    allSelected
                      ? 'bg-gray-900 border-gray-900'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  {allSelected && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                전체 선택
              </button>

              <div className="flex-1" />

              <button
                onClick={handleMoveToCart}
                disabled={isActioning || selectedIds.size === 0}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ShoppingBag className="w-4 h-4" />
                카트로
              </button>

              <button
                onClick={handleRemoveSelected}
                disabled={isActioning || selectedIds.size === 0}
                className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                삭제
              </button>
            </div>

            {/* Grid */}
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
                const isSelected = selectedIds.has(item.id);

                return (
                  <div key={item.id} className="bg-white relative">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleSelect(item.id)}
                      className="absolute top-2 left-2 z-10"
                    >
                      <div
                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-gray-900 border-gray-900'
                            : 'border-gray-300 bg-white/80 backdrop-blur-sm'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                    </button>

                    {/* Product Image */}
                    <Link href={`/${locale}/${username}/product/${product.id}`}>
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
                        <p className="text-xs text-gray-400 mb-0.5 truncate">
                          {product.brand.brandName}
                        </p>
                      )}
                      <Link href={`/${locale}/${username}/product/${product.id}`}>
                        <p className="text-sm text-gray-900 line-clamp-2 leading-snug mb-1.5">
                          {product.nameKo || product.name || '상품명 없음'}
                        </p>
                      </Link>
                      <div className="flex items-baseline gap-1.5">
                        {hasDiscount && (
                          <span className="text-sm font-bold text-red-500">
                            {discountPercent}%
                          </span>
                        )}
                        {displayPrice != null && (
                          <span className="text-sm font-bold text-gray-900">
                            {formatKRW(displayPrice)}
                          </span>
                        )}
                      </div>
                      {hasDiscount && product.originalPrice != null && (
                        <span className="text-xs text-gray-400 line-through">
                          {formatKRW(product.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
