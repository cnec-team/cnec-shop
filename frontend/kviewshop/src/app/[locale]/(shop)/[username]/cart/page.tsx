'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  ShoppingBag,
  Minus,
  Plus,
  Trash2,
  Heart,
  Loader2,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  toggleCartItemSelection,
} from '@/lib/actions/cart';
import { toggleWishlist } from '@/lib/actions/wishlist';
import { resolveCreatorId } from '@/lib/actions/shop-resolve';

function formatKRW(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface CartData {
  id: string;
  items: CartItemData[];
}

interface CartItemData {
  id: string;
  productId: string;
  campaignId: string | null;
  quantity: number;
  selected: boolean;
  product: {
    id: string;
    name: string | null;
    images: string[];
    salePrice: any;
    originalPrice: any;
    stock: number;
    shippingFeeType: string;
    shippingFee: any;
    freeShippingThreshold: any;
    brand?: { id: string; brandName: string | null; logoUrl: string | null } | null;
  };
  campaign?: {
    id: string;
    type: string;
    title: string;
    status: string;
    endAt: string | null;
  } | null;
}

export default function CartPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const username = params.username as string;

  const [cart, setCart] = useState<CartData | null>(null);
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

  const loadCart = useCallback(async () => {
    try {
      const resolved = await resolveCreatorId(username);
      if (!resolved) {
        setIsLoading(false);
        return;
      }
      setCreatorId(resolved);
      const result = await getCart(resolved);
      setCart(result as unknown as CartData | null);
    } catch (error) {
      console.error('장바구니 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  }, [username]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const items = cart?.items ?? [];
  const gongguItems = items.filter((item) => item.campaign?.type === 'GONGGU');
  const pickItems = items.filter((item) => !item.campaign || item.campaign.type !== 'GONGGU');

  const selectedItems = items.filter((item) => item.selected);
  const allSelected = items.length > 0 && items.every((item) => item.selected);

  const handleToggleAll = async () => {
    const newSelected = !allSelected;
    const itemIds = items.map((item) => item.id);
    await toggleCartItemSelection(itemIds, newSelected);
    setCart((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map((item) => ({ ...item, selected: newSelected })),
      };
    });
  };

  const handleToggleItem = async (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    const newSelected = !item.selected;
    await toggleCartItemSelection([itemId], newSelected);
    setCart((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map((i) =>
          i.id === itemId ? { ...i, selected: newSelected } : i
        ),
      };
    });
  };

  const handleQuantityChange = (itemId: string, newQty: number) => {
    if (newQty < 1) return;

    // 즉시 UI 반영
    setCart((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map((i) =>
          i.id === itemId ? { ...i, quantity: newQty } : i
        ),
      };
    });

    // Debounce 300ms
    if (debounceTimers.current[itemId]) {
      clearTimeout(debounceTimers.current[itemId]);
    }
    debounceTimers.current[itemId] = setTimeout(async () => {
      await updateCartItem(itemId, { quantity: newQty });
    }, 300);
  };

  const handleRemove = async (itemId: string) => {
    await removeCartItem(itemId);
    setCart((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.filter((i) => i.id !== itemId),
      };
    });
    toast.success('상품이 삭제되었습니다');
  };

  const handleMoveToWishlist = async (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item || !creatorId) return;
    try {
      await toggleWishlist({ shopId: creatorId, productId: item.productId });
      await removeCartItem(itemId);
      setCart((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.filter((i) => i.id !== itemId),
        };
      });
      toast.success('찜 목록으로 이동했습니다');
    } catch {
      toast.error('로그인이 필요합니다');
    }
  };

  const handleClearAll = async () => {
    if (!creatorId) return;
    await clearCart(creatorId);
    setCart((prev) => (prev ? { ...prev, items: [] } : prev));
    toast.success('장바구니를 비웠습니다');
  };

  // 총액 계산
  const productAmount = selectedItems.reduce((sum, item) => {
    const price = Number(item.product.salePrice ?? 0);
    return sum + price * item.quantity;
  }, 0);

  const shippingFee = (() => {
    let maxFee = 0;
    for (const item of selectedItems) {
      const feeType = item.product.shippingFeeType || 'FREE';
      if (feeType === 'PAID') {
        maxFee = Math.max(maxFee, Number(item.product.shippingFee || 0));
      } else if (feeType === 'CONDITIONAL_FREE') {
        const threshold = Number(item.product.freeShippingThreshold || 0);
        if (productAmount < threshold) {
          maxFee = Math.max(maxFee, Number(item.product.shippingFee || 0));
        }
      }
    }
    return maxFee;
  })();

  const totalAmount = productAmount + shippingFee;

  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      toast.error('주문할 상품을 선택해주세요');
      return;
    }
    router.push(`/${locale}/${username}/checkout`);
  };

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Empty
  if (!cart || items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
          <div className="max-w-lg mx-auto flex items-center h-12 px-4">
            <Link
              href={`/${locale}/${username}`}
              className="flex items-center gap-1 text-gray-500"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="flex-1 text-center text-base font-semibold text-gray-900 pr-5">
              장바구니
            </h1>
          </div>
        </header>
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <ShoppingBag className="h-12 w-12 text-gray-300 mb-4" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">장바구니가 비었습니다</h2>
          <p className="text-sm text-gray-400 mb-6">마음에 드는 상품을 담아보세요</p>
          <Link
            href={`/${locale}/${username}`}
            className="h-11 px-8 bg-gray-900 text-white rounded-xl font-medium text-sm inline-flex items-center"
          >
            쇼핑 계속하기
          </Link>
        </div>
      </div>
    );
  }

  const renderCartItem = (item: CartItemData) => {
    const price = Number(item.product.salePrice ?? 0);
    const originalPrice = Number(item.product.originalPrice ?? 0);
    const discount =
      originalPrice > price
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : 0;
    const imageUrl = item.product.images?.[0];

    return (
      <div key={item.id} className="flex gap-3 py-4 border-b border-gray-100 last:border-0">
        {/* 체크박스 */}
        <button
          onClick={() => handleToggleItem(item.id)}
          className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-1 flex items-center justify-center transition-colors ${
            item.selected
              ? 'bg-gray-900 border-gray-900'
              : 'border-gray-300 bg-white'
          }`}
        >
          {item.selected && <Check className="w-3 h-3 text-white" />}
        </button>

        {/* 이미지 */}
        <Link
          href={`/${locale}/${username}/product/${item.productId}`}
          className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0"
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={item.product.name || ''}
              width={80}
              height={80}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-gray-300" />
            </div>
          )}
        </Link>

        {/* 정보 */}
        <div className="flex-1 min-w-0">
          <Link
            href={`/${locale}/${username}/product/${item.productId}`}
            className="text-sm text-gray-900 line-clamp-2 leading-snug hover:underline"
          >
            {item.product.name || '상품'}
          </Link>
          {item.product.brand?.brandName && (
            <p className="text-xs text-gray-400 mt-0.5">{item.product.brand.brandName}</p>
          )}

          <div className="flex items-baseline gap-1 mt-1">
            {discount > 0 && (
              <span className="text-xs font-bold text-red-500">{discount}%</span>
            )}
            <span className="text-sm font-bold text-gray-900">{formatKRW(price)}</span>
            {discount > 0 && (
              <span className="text-xs text-gray-300 line-through">{formatKRW(originalPrice)}</span>
            )}
          </div>

          {/* 수량 + 액션 */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-0">
              <button
                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                disabled={item.quantity <= 1}
                className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded-l-lg hover:bg-gray-50 disabled:opacity-30"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-8 h-7 flex items-center justify-center border-y border-gray-200 text-xs font-medium">
                {item.quantity}
              </span>
              <button
                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded-r-lg hover:bg-gray-50"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleMoveToWishlist(item.id)}
                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                title="찜으로 이동"
              >
                <Heart className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleRemove(item.id)}
                className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                title="삭제"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-40">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-lg mx-auto flex items-center h-12 px-4">
          <Link
            href={`/${locale}/${username}`}
            className="flex items-center gap-1 text-gray-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="flex-1 text-center text-base font-semibold text-gray-900">
            장바구니 ({items.length})
          </h1>
          <button
            onClick={handleClearAll}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            전체삭제
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-3 space-y-3">
        {/* 전체 선택 */}
        <div className="flex items-center gap-2 py-2">
          <button
            onClick={handleToggleAll}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              allSelected
                ? 'bg-gray-900 border-gray-900'
                : 'border-gray-300 bg-white'
            }`}
          >
            {allSelected && <Check className="w-3 h-3 text-white" />}
          </button>
          <span className="text-sm text-gray-700">
            전체 선택 ({selectedItems.length}/{items.length})
          </span>
        </div>

        {/* 공구 상품 섹션 */}
        {gongguItems.length > 0 && (
          <div className="bg-white rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-red-500 mb-3">
              공구 상품
            </h2>
            {gongguItems.map(renderCartItem)}
          </div>
        )}

        {/* 크리에이터픽 상품 섹션 */}
        {pickItems.length > 0 && (
          <div className="bg-white rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">
              {gongguItems.length > 0 ? '크리에이터픽 상품' : '장바구니 상품'}
            </h2>
            {pickItems.map(renderCartItem)}
          </div>
        )}
      </div>

      {/* Sticky Bottom */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-lg"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="space-y-1.5 mb-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">상품금액</span>
              <span className="text-gray-900">{formatKRW(productAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">배송비</span>
              <span className={shippingFee === 0 ? 'text-emerald-500' : 'text-gray-900'}>
                {shippingFee === 0 ? '무료' : formatKRW(shippingFee)}
              </span>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-900">결제예정</span>
              <span className="text-lg font-bold text-gray-900">{formatKRW(totalAmount)}</span>
            </div>
          </div>
          <button
            onClick={handleCheckout}
            disabled={selectedItems.length === 0}
            className="w-full h-14 bg-gray-900 text-white rounded-xl font-semibold text-base disabled:opacity-40 disabled:cursor-not-allowed"
          >
            선택 상품 주문하기 ({selectedItems.length})
          </button>
        </div>
      </div>
    </div>
  );
}
