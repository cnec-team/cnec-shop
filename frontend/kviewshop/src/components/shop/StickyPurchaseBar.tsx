'use client';

import { ShoppingBag } from 'lucide-react';

interface StickyPurchaseBarProps {
  originalPrice: number;
  effectivePrice: number;
  quantity: number;
  isGonggu?: boolean;
  isOutOfStock?: boolean;
  onAddToCart: () => void;
  onBuy: () => void;
}

function formatKRW(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function StickyPurchaseBar({
  originalPrice,
  effectivePrice,
  quantity,
  isGonggu = false,
  isOutOfStock = false,
  onAddToCart,
  onBuy,
}: StickyPurchaseBarProps) {
  const discountPercent = originalPrice > effectivePrice
    ? Math.round(((originalPrice - effectivePrice) / originalPrice) * 100)
    : 0;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-100 shadow-lg"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="max-w-lg mx-auto flex items-center gap-3 px-4 py-3">
        {/* Cart button */}
        <button
          onClick={onAddToCart}
          disabled={isOutOfStock}
          className="w-14 h-14 flex items-center justify-center border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ShoppingBag className="w-5 h-5 text-gray-600" />
        </button>

        {/* Price info + Buy button */}
        <div className="flex-1 flex items-center gap-3">
          {/* Price display (mobile) */}
          <div className="hidden min-[380px]:block shrink-0">
            {discountPercent > 0 && (
              <p className="text-[10px] text-gray-400 line-through">{formatKRW(originalPrice)}</p>
            )}
            <p className="text-sm font-bold text-gray-900">{formatKRW(effectivePrice)}</p>
          </div>

          {/* Buy CTA */}
          <button
            onClick={onBuy}
            disabled={isOutOfStock}
            className={`flex-1 h-14 rounded-xl font-semibold text-white transition-colors ${
              isOutOfStock
                ? 'bg-gray-300 cursor-not-allowed'
                : isGonggu
                  ? 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700'
                  : 'bg-gray-900 hover:bg-gray-800 active:bg-gray-700'
            }`}
          >
            {isOutOfStock ? '품절' : (
              <span className="text-base">
                구매하기
                <span className="text-sm font-normal opacity-80 ml-1">
                  {formatKRW(effectivePrice * quantity)}
                </span>
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
