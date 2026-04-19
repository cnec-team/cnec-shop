'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useUser } from '@/lib/hooks/use-user';
import { getAllWishlist, removeWishlistItems, moveWishlistToCart } from '@/lib/actions/wishlist';
import {
  Heart,
  Trash2,
  ShoppingBag,
  ArrowLeft,
  Loader2,
  Check,
  ChevronLeft,
  User,
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

interface WishlistCreator {
  id: string;
  username: string;
  displayName: string | null;
  profileImage: string | null;
}

interface WishlistItem {
  id: string;
  productId: string;
  creatorId: string;
  product: WishlistProduct;
  creator: WishlistCreator;
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

export default function GlobalWishlistPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = params.locale as string;
  const creatorFilter = searchParams.get('creator');
  const { user, isLoading: isUserLoading } = useUser();

  const [allItems, setAllItems] = useState<WishlistItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isActioning, setIsActioning] = useState(false);
  const fetchedRef = useRef(false);

  const loadWishlist = useCallback(async () => {
    try {
      const data = await getAllWishlist();
      setAllItems(data as unknown as WishlistItem[]);
    } catch (error) {
      console.error('찜 목록 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isUserLoading || !user || fetchedRef.current) return;
    fetchedRef.current = true;
    loadWishlist();
  }, [isUserLoading, user, loadWishlist]);

  // Filter items by creator
  const items = creatorFilter
    ? allItems.filter(item => item.creator.username === creatorFilter)
    : allItems;

  // Compute creator filter options
  const creatorGroups = allItems.reduce<Record<string, { creator: WishlistCreator; count: number }>>((acc, item) => {
    const key = item.creator.username;
    if (!acc[key]) {
      acc[key] = { creator: item.creator, count: 0 };
    }
    acc[key].count++;
    return acc;
  }, {});
  const filterOptions = Object.values(creatorGroups);

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
      if (next.has(id)) next.delete(id);
      else next.add(id);
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
      setAllItems((prev) => prev.filter((item) => !selectedIds.has(item.id)));
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
      setAllItems((prev) => prev.filter((item) => !selectedIds.has(item.id)));
      setSelectedIds(new Set());
      toast.success(`${result.moved}개 상품을 장바구니에 담았습니다`);
    } catch {
      toast.error('장바구니 담기에 실패했습니다');
    } finally {
      setIsActioning(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <Heart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h1 className="text-lg font-bold text-gray-900 mb-2">로그인이 필요해요</h1>
          <p className="text-sm text-gray-400 mb-6">찜한 상품을 확인하려면 로그인하세요</p>
          <Link
            href={`/${locale}/buyer/login?returnUrl=${encodeURIComponent(`/${locale}/my/wishlist`)}`}
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
            <button onClick={() => router.back()} className="p-1 -ml-1 mr-2">
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <h1 className="text-base font-semibold text-gray-900 flex-1">
              찜한 상품 {allItems.length > 0 && <span className="text-gray-400 font-normal">({allItems.length})</span>}
            </h1>
          </div>
        </div>

        {/* Creator filter tabs */}
        {filterOptions.length > 1 && (
          <div className="bg-white border-b px-4 py-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              <Link
                href={`/${locale}/my/wishlist`}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
                  !creatorFilter ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                전체 ({allItems.length})
              </Link>
              {filterOptions.map(opt => (
                <Link
                  key={opt.creator.id}
                  href={`/${locale}/my/wishlist?creator=${opt.creator.username}`}
                  className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${
                    creatorFilter === opt.creator.username ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {opt.creator.displayName || opt.creator.username} ({opt.count})
                </Link>
              ))}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <Heart className="h-16 w-16 text-gray-200 mb-4" />
            <p className="text-base font-semibold text-gray-700 mb-1">찜한 상품이 없어요</p>
            <p className="text-sm text-gray-400 mb-6">마음에 드는 상품을 찜해보세요</p>
            <Link
              href={`/${locale}`}
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
              <button onClick={toggleSelectAll} className="flex items-center gap-2 text-sm text-gray-600">
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                  allSelected ? 'bg-gray-900 border-gray-900' : 'border-gray-300 bg-white'
                }`}>
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
                    <button onClick={() => toggleSelect(item.id)} className="absolute top-2 left-2 z-10">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-gray-900 border-gray-900' : 'border-gray-300 bg-white/80 backdrop-blur-sm'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                    </button>

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
                          <Image src={imgSrc} alt={product.nameKo || product.name || '상품'} fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" />
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
          </>
        )}
      </div>
    </div>
  );
}
