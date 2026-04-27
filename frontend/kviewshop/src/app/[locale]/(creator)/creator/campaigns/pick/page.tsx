'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, Loader2, X, Info, ArrowRight, ShoppingBag, Eye, Zap, AlertCircle } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { BrandBadge } from '@/components/common/BrandBadge';
import { SafeImage } from '@/components/common/SafeImage';
import { formatCurrency } from '@/lib/i18n/config';
import { getCreatorSession, getCreatorCollections } from '@/lib/actions/creator';

interface ShopItemProduct {
  id: string;
  name: string | null;
  images: string[];
  imageUrl: string | null;
  salePrice: unknown;
  originalPrice: unknown;
  brand?: { brandName: string } | null;
}

interface ShopItem {
  id: string;
  productId: string;
  product: ShopItemProduct;
  campaign?: { id: string; status: string; title: string } | null;
  type: string;
  isVisible: boolean;
  displayOrder: number;
}

export default function CreatorPickPage() {
  const params = useParams();
  const locale = params.locale as string;
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removeTarget, setRemoveTarget] = useState<ShopItem | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'visible' | 'hidden' | 'ended'>('visible');

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const creator = await getCreatorSession();
        if (!creator || cancelled) { setLoading(false); return; }
        const data = await getCreatorCollections(creator.id);
        if (!cancelled) {
          // Only PICK type items
          const pickItems = (data.allItems as unknown as ShopItem[])
            .filter((item) => item.type === 'PICK' && item.product)
            .sort((a, b) => a.displayOrder - b.displayOrder);
          setItems(pickItems);
        }
      } catch (error) {
        console.error('Failed to load:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => { cancelled = true; };
  }, []);

  const handleRemoveItem = async (item: ShopItem) => {
    setRemoveTarget(null);
    setRemovingId(item.id);
    try {
      const res = await fetch(`/api/creator/shop-items/${item.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || '상품이 제거되었습니다');
        setItems((prev) => prev.filter((i) => i.id !== item.id));
      } else {
        toast.error(data.error || '삭제에 실패했습니다');
      }
    } catch {
      toast.error('삭제에 실패했습니다');
    } finally {
      setRemovingId(null);
    }
  };

  const visibleItems = useMemo(() => items.filter((i) => i.isVisible), [items]);
  const hiddenItems = useMemo(() => items.filter((i) => !i.isVisible), [items]);
  const endedItems = useMemo(() => items.filter((i) => i.campaign?.status === 'ENDED'), [items]);

  const displayItems = activeTab === 'visible' ? visibleItems : activeTab === 'hidden' ? hiddenItems : endedItems;

  // Rough monthly revenue estimate (placeholder calculation)
  const monthlyRevenue = useMemo(() => {
    const total = visibleItems.reduce((sum, item) => sum + Number(item.product.salePrice ?? 0) * 0.1, 0);
    if (total >= 1000) return `₩${Math.round(total / 1000)}K`;
    return `₩${Math.round(total).toLocaleString()}`;
  }, [visibleItems]);

  if (loading) {
    return (
      <div className="space-y-4 max-w-3xl">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">상시 판매</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {items.length}개 상품 · 이번 달 매출 {monthlyRevenue}
        </p>
      </div>

      {/* Pill Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('visible')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeTab === 'visible'
              ? 'bg-foreground text-white'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          판매중 {visibleItems.length}
        </button>
        <button
          onClick={() => setActiveTab('hidden')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeTab === 'hidden'
              ? 'bg-foreground text-white'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          숨김 {hiddenItems.length}
        </button>
        <button
          onClick={() => setActiveTab('ended')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeTab === 'ended'
              ? 'bg-foreground text-white'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          종료 {endedItems.length}
        </button>
      </div>

      {/* Product Cards */}
      {displayItems.length === 0 ? (
        <div className="text-center py-16">
          <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mx-auto">
            <Package className="h-7 w-7 text-muted-foreground/40" />
          </div>
          <p className="mt-4 font-bold text-gray-900">
            {activeTab === 'visible' && '상시 판매 중인 상품이 없어요'}
            {activeTab === 'hidden' && '숨김 처리한 상품이 없어요'}
            {activeTab === 'ended' && '종료된 상품이 없어요'}
          </p>
          <p className="text-xs text-gray-400 mt-1">상품을 둘러보고 내 샵에 추가해보세요</p>
          {activeTab === 'visible' && (
            <Link href={`/${locale}/creator/products`}>
              <Button variant="outline" className="mt-3 rounded-xl">상품 둘러보기</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayItems.map((item) => {
            const product = item.product;
            const price = Number(product.salePrice ?? 0);
            const earnings = Math.round(price * 0.1);
            const imgSrc = product.images?.[0] || product.imageUrl;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 relative"
              >
                {/* Remove button */}
                <button
                  onClick={() => setRemoveTarget(item)}
                  disabled={removingId === item.id}
                  className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-gray-100/90 hover:bg-red-100 flex items-center justify-center transition-colors"
                >
                  {removingId === item.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-500" />
                  ) : (
                    <X className="h-3.5 w-3.5 text-gray-500" />
                  )}
                </button>

                <Link href={`/${locale}/creator/products/${product.id}`} className="flex gap-3">
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-xl bg-gray-50 overflow-hidden shrink-0 relative">
                    <SafeImage
                      src={imgSrc}
                      alt={product.name || ''}
                      fill
                      className="object-cover"
                      fallbackClassName="w-full h-full"
                      sizes="64px"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 pr-6">
                    {product.brand && (
                      <BrandBadge brandName={product.brand.brandName} size="sm" />
                    )}
                    <p className="text-sm font-bold text-gray-900 line-clamp-1 mt-0.5">
                      {product.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-sm font-bold text-gray-900">
                        {formatCurrency(price, 'KRW')}
                      </span>
                      {earnings > 0 && (
                        <span className="text-xs font-semibold text-emerald-600">
                          +₩{earnings.toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Mini stats row */}
                    <div className="flex items-center gap-2 mt-2 text-[11px] text-gray-400">
                      <span className="flex items-center gap-0.5">
                        <ShoppingBag className="h-3 w-3" />
                        판매 0건
                      </span>
                      <span className="text-gray-200">|</span>
                      <span className="flex items-center gap-0.5">
                        <Eye className="h-3 w-3" />
                        조회 0
                      </span>
                      <span className="text-gray-200">|</span>
                      <span className="flex items-center gap-0.5">
                        <Zap className="h-3 w-3" />
                        바로 0%
                      </span>
                      <span className="text-gray-200">|</span>
                      <span className="flex items-center gap-0.5">
                        <AlertCircle className="h-3 w-3" />
                        누출 0건
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom Info Section */}
      {activeTab === 'visible' && (
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
          <div className="flex items-center gap-1.5 mb-1">
            <Info className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-bold text-gray-900">상시 판매는 꾸준한 매출이 쌓여요</span>
          </div>
          <p className="text-xs font-medium text-gray-500 mb-2">공구보다 꾸준함이 더 강해요</p>
          <p className="text-xs text-gray-400 leading-relaxed">
            내 상시 상품 5개 이상 등록한 크리에이터는 평균 월 ₩320K 추가 수익이 발생했어요.
          </p>
          <Link href={`/${locale}/creator/products`}>
            <Button
              variant="ghost"
              className="mt-3 px-0 h-auto text-sm font-semibold text-gray-700 hover:text-gray-900 hover:bg-transparent flex items-center gap-1"
            >
              상품 더 담으러 가기
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      )}

      {/* Remove Confirmation */}
      <AlertDialog open={!!removeTarget} onOpenChange={() => setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>상시 판매에서 빼기</AlertDialogTitle>
            <AlertDialogDescription>
              이 상품을 내 샵에서 뺄까요? 언제든 다시 추가할 수 있어요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (removeTarget) handleRemoveItem(removeTarget); }}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              빼기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
