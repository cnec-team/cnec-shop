'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/store/auth';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Minus,
  Plus,
  Truck,
  RotateCcw,
  Share2,
  ShoppingBag,
  Flame,
} from 'lucide-react';
import { ShareSheet } from '@/components/shop/ShareSheet';
import { BrandBadge } from '@/components/common/BrandBadge';
import type {
  Product,
  CampaignProduct,
  Creator,
  Campaign,
} from '@/types/database';

// =============================================
// Props
// =============================================

interface ProductDetailPageProps {
  product: Product;
  campaignProduct: CampaignProduct | null;
  creator: Creator;
  locale: string;
  username: string;
  otherProducts?: { id: string; name: string; images?: string[]; salePrice?: number; originalPrice?: number }[];
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

function calculateDiscountPercent(original: number, sale: number): number {
  if (original <= 0) return 0;
  return Math.round(((original - sale) / original) * 100);
}

// =============================================
// Main Component
// =============================================

export function ProductDetailPage({
  product,
  campaignProduct,
  creator,
  locale,
  username,
  otherProducts,
}: ProductDetailPageProps) {
  const router = useRouter();
  const { addItem } = useCartStore();
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [shippingOpen, setShippingOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);

  const campaign = campaignProduct?.campaign as Campaign | undefined;
  const isGonggu = !!campaignProduct && campaign?.type === 'GONGGU';
  const effectivePrice = Number(campaignProduct?.campaign_price ?? product.sale_price ?? 0);
  const originalPrice = Number(product.original_price ?? 0);
  const discountPercent = calculateDiscountPercent(originalPrice, effectivePrice);
  const brandName = product.brand?.brand_name || '';
  const images = product.images && product.images.length > 0 ? product.images : [];
  const productUrl = `https://shop.cnec.kr/${username}/product/${product.id}${campaignProduct?.campaign_id ? `?campaign=${campaignProduct.campaign_id}` : ''}`;
  const ogTitle = `${product.name}${discountPercent > 0 ? ` ${discountPercent}% OFF` : ''}`;
  const ogDesc = `${brandName} | ${formatKRW(effectivePrice)}`;

  // Gonggu progress
  const totalStock = Number((campaign as any)?.total_stock ?? (campaign as any)?.totalStock ?? 0);
  const soldCount = Number((campaign as any)?.sold_count ?? (campaign as any)?.soldCount ?? 0);
  const progressPercent = totalStock > 0 ? Math.min(Math.round((soldCount / totalStock) * 100), 100) : 0;

  // D-day calculation
  const endAt = campaign?.end_at ?? (campaign as any)?.endAt;
  const dDayNum = (() => {
    if (!endAt) return -1;
    const diff = new Date(endAt).getTime() - Date.now();
    if (diff <= 0) return 0;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  })();

  // Countdown timer for gonggu
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    if (!isGonggu || !endAt) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const end = new Date(endAt).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setCountdown('마감되었습니다');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const pad = (n: number) => n.toString().padStart(2, '0');
      setCountdown(
        `${days > 0 ? `${days}일 ` : ''}${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [isGonggu, endAt]);

  const handlePrevImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const handleNextImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      campaignId: campaignProduct?.campaign_id,
      quantity,
      creatorId: creator.id,
      unitPrice: effectivePrice,
    });
  };

  const handleBuy = () => {
    handleAddToCart();
    router.push(`/${locale}/${username}/checkout`);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Top Navigation - sticky */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur">
        <div className="max-w-lg mx-auto flex items-center justify-between h-12 px-4">
          <Link
            href={`/${locale}/${username}`}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">돌아가기</span>
          </Link>
          <ShareSheet
            url={productUrl}
            title={ogTitle}
            description={ogDesc}
            imageUrl={product.thumbnail_url || images[0]}
            trigger={
              <button className="flex items-center gap-1 text-gray-500 hover:text-gray-900 transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
            }
          />
        </div>
      </header>

      <div className="max-w-lg mx-auto">
        {/* Image Slider - full width */}
        {images.length > 0 ? (
          <div className="relative bg-white">
            <div className="aspect-square relative overflow-hidden">
              <img
                src={images[currentImageIndex]}
                alt={`${product.name} - ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
              />

              {images.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/70 flex items-center justify-center hover:bg-white/90 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-700" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/70 flex items-center justify-center hover:bg-white/90 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-700" />
                  </button>
                </>
              )}

              {images.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        idx === currentImageIndex ? 'bg-gray-900' : 'bg-gray-900/30'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="aspect-square bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
            이미지 없음
          </div>
        )}

        {/* Product Info Section */}
        <div className="bg-white px-4 pt-4 pb-5">
          {brandName && (
            <>
              <BrandBadge brandName={brandName} size="md" />
              <p className="text-xs text-gray-400 mt-1">크넥 인증 브랜드</p>
            </>
          )}
          <h1 className="text-xl font-bold text-gray-900 leading-snug mt-1">
            {product.name}
          </h1>

          {product.volume && (
            <p className="text-sm text-gray-400 mt-1">{product.volume}</p>
          )}
        </div>

        {/* Gonggu Banner */}
        {isGonggu && (
          <div className="bg-orange-50 border-y border-orange-100 px-4 py-4">
            <div className="max-w-lg mx-auto">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-semibold text-gray-900">공구 진행중</span>
                {dDayNum >= 0 && (
                  <span className="bg-red-500 text-white rounded-full px-2 py-0.5 text-xs font-bold">
                    D-{dDayNum} 남음
                  </span>
                )}
              </div>
              {totalStock > 0 && (
                <>
                  <p className="text-xs text-gray-500 mb-2">
                    한정 {totalStock}개 중 {soldCount}개 판매
                  </p>
                  <div className="w-full h-2 bg-orange-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1 text-right">{progressPercent}%</p>
                </>
              )}
              {countdown && (
                <p className="text-xs text-orange-600 mt-1">마감까지: {countdown}</p>
              )}
            </div>
          </div>
        )}

        {/* Price Section */}
        <div className="bg-white px-4 py-4 mt-2">
          <div className="flex items-baseline gap-2">
            {discountPercent > 0 && (
              <span className="text-2xl font-bold text-red-500">
                {discountPercent}%
              </span>
            )}
            <span className="text-2xl font-bold text-gray-900">
              {formatKRW(effectivePrice)}
            </span>
          </div>
          {discountPercent > 0 && (
            <p className="text-sm text-gray-300 line-through mt-0.5">
              {formatKRW(originalPrice)}
            </p>
          )}
        </div>

        {/* Quantity Selector */}
        <div className="bg-white px-4 py-4 mt-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900">수량</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4 text-gray-600" />
              </button>
              <span className="w-8 text-center font-medium text-gray-900">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                disabled={quantity >= product.stock}
              >
                <Plus className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Product Description Accordion */}
        {product.description && (
          <div className="bg-white mt-2">
            <button
              onClick={() => setDescriptionOpen(!descriptionOpen)}
              className="w-full px-4 py-4 flex items-center justify-between text-left"
            >
              <span className="text-sm font-medium text-gray-900">상품 상세</span>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform ${
                  descriptionOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {descriptionOpen && (
              <div className="px-4 pb-4">
                <div
                  className="text-sm text-gray-600 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            )}
          </div>
        )}

        {/* Shipping Info Accordion */}
        <div className="bg-white mt-2">
          <button
            onClick={() => setShippingOpen(!shippingOpen)}
            className="w-full px-4 py-4 flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-900">배송 안내</span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform ${
                shippingOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
          {shippingOpen && (
            <div className="px-4 pb-4 text-sm text-gray-500 space-y-2">
              {(product as any).shipping_info ? (
                <p>{(product as any).shipping_info}</p>
              ) : (
                <>
                  <p>배송비: {(product as any).shipping_fee_type === 'FREE' ? '무료배송' : (product as any).shipping_fee_type === 'CONDITIONAL_FREE' ? `${formatKRW(Number((product as any).free_shipping_threshold) || 50000)} 이상 무료배송 (기본 ${formatKRW(Number((product as any).shipping_fee) || 3000)})` : `${formatKRW(Number((product as any).shipping_fee) || 3000)}`}</p>
                  <p>배송기간: 결제 후 2~5일 이내 배송</p>
                  <p>제주/도서산간 지역은 추가 배송비가 발생할 수 있습니다.</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Return/Exchange Info Accordion */}
        <div className="bg-white mt-2">
          <button
            onClick={() => setReturnOpen(!returnOpen)}
            className="w-full px-4 py-4 flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-900">교환/환불 안내</span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform ${
                returnOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
          {returnOpen && (
            <div className="px-4 pb-4 text-sm text-gray-500 space-y-2">
              {(product as any).return_policy ? (
                <p>{(product as any).return_policy}</p>
              ) : (
                <>
                  <p>수령 후 7일 이내 교환/환불 가능</p>
                  <p>고객 변심에 의한 반품 시 왕복 배송비 부담</p>
                  <p>상품 하자 시 배송비 포함 100% 환불</p>
                  <p>사용 또는 개봉한 상품은 교환/환불이 불가합니다.</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Other Products from this Creator */}
        {otherProducts && otherProducts.length > 0 && (
          <div className="bg-white mt-2 py-5">
            <h2 className="px-4 text-base font-semibold text-gray-900 mb-3">
              이 크리에이터의 다른 상품
            </h2>
            <div
              className="flex gap-3 overflow-x-auto px-4 pb-2"
              style={{ scrollbarWidth: 'none' }}
            >
              {otherProducts.map((p) => (
                <Link
                  key={p.id}
                  href={`/${locale}/${username}/product/${p.id}`}
                  className="flex-shrink-0 w-32"
                >
                  <div className="w-32 h-32 rounded-xl overflow-hidden bg-gray-100">
                    {p.images?.[0] ? (
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        이미지 없음
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-900 line-clamp-1 mt-1.5">{p.name}</p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">
                    {formatKRW(Number(p.salePrice ?? 0))}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CS Notice */}
        <div className="py-4 px-4">
          <p className="text-xs text-center text-gray-400">
            배송/CS는 브랜드가 직접 처리합니다 | 크넥이 안전하게 관리해요
          </p>
        </div>
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-100 shadow-lg" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="max-w-lg mx-auto flex items-center gap-3 px-4 py-3">
          <button
            onClick={handleAddToCart}
            className="w-14 h-14 flex items-center justify-center border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <ShoppingBag className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={handleBuy}
            disabled={product.stock === 0}
            className={`flex-1 h-14 rounded-xl font-semibold text-lg text-white transition-colors ${
              isGonggu
                ? 'bg-orange-500 hover:bg-orange-600'
                : 'bg-gray-900 hover:bg-gray-800'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {product.stock === 0 ? '품절' : `구매하기 ${formatKRW(effectivePrice * quantity)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
