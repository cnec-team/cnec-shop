'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Package, AlertCircle, Plus, X, Loader2, ArrowDownUp } from 'lucide-react';
import { toast } from 'sonner';
import { SafeImage } from '@/components/common/SafeImage';
import { formatCurrency } from '@/lib/i18n/config';
import {
  getCreatorSession,
  getCreatorCollections,
  toggleShopItemVisibility,
} from '@/lib/actions/creator';

interface ShopItemProduct {
  id: string;
  name: string | null;
  images: string[];
  imageUrl: string | null;
  salePrice: unknown;
  originalPrice: unknown;
  status?: string;
  brand?: { brandName: string } | null;
}

interface ShopItem {
  id: string;
  productId: string;
  product: ShopItemProduct;
  campaign?: { id: string; status: string; title: string; startAt?: string; endAt?: string } | null;
  type: string;
  isVisible: boolean;
  displayOrder: number;
}

export default function MyShopProductsPage() {
  const params = useParams();
  const locale = params.locale as string;

  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'GONGGU' | 'PICK'>('all');

  // Remove item
  const [removeTarget, setRemoveTarget] = useState<ShopItem | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemoveItem = async (item: ShopItem) => {
    setRemoveTarget(null);
    setRemovingId(item.id);
    try {
      const res = await fetch(`/api/creator/shop-items/${item.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || '상품이 내 샵에서 제거되었습니다');
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

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const creator = await getCreatorSession();
        if (!creator || cancelled) {
          setLoading(false);
          return;
        }

        const data = await getCreatorCollections(creator.id);
        if (!cancelled) {
          const allItems = (data.allItems as unknown as ShopItem[])
            .filter((item) => item.product)
            .sort((a, b) => a.displayOrder - b.displayOrder);
          setItems(allItems);
        }
      } catch (error) {
        console.error('Failed to load shop items:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => { cancelled = true; };
  }, []);

  const handleToggleVisibility = async (item: ShopItem) => {
    setTogglingId(item.id);
    try {
      await toggleShopItemVisibility(item.id, !item.isVisible);
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isVisible: !i.isVisible } : i))
      );
      toast.success(item.isVisible ? '숨김 처리되었습니다' : '다시 표시됩니다');
    } catch {
      toast.error('변경에 실패했습니다');
    } finally {
      setTogglingId(null);
    }
  };

  const filteredItems = items.filter((item) => {
    if (filterType === 'all') return true;
    return item.type === filterType;
  });

  const gongguCount = items.filter((i) => i.type === 'GONGGU').length;
  const pickCount = items.filter((i) => i.type === 'PICK').length;

  const getDDay = (dateStr: string) => {
    const target = new Date(dateStr);
    const now = new Date();
    const diffMs = target.getTime() - now.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  const tabs = [
    { key: 'all' as const, label: '전체', count: items.length },
    { key: 'GONGGU' as const, label: '공구', count: gongguCount },
    { key: 'PICK' as const, label: '상시', count: pickCount },
  ];

  if (loading) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-64" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">내가 고른 상품</h1>
        <Link href={`/${locale}/creator/products`}>
          <Button className="rounded-xl gap-1.5 bg-foreground text-white hover:bg-foreground/90">
            <Plus className="h-4 w-4" />
            상품 추가
          </Button>
        </Link>
      </div>

      {/* Subtitle */}
      <p className="text-sm text-muted-foreground">
        내 셀렉트샵에 담긴 상품을 관리하세요 <span className="text-gray-300">|</span> 총 {items.length}개 상품
      </p>

      {/* Pill Tabs */}
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterType(tab.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
              filterType === tab.key
                ? 'bg-foreground text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
              filterType === tab.key
                ? 'bg-white/20 text-white'
                : 'bg-gray-200 text-gray-500'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Sort Label */}
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowDownUp className="h-3.5 w-3.5" />
        <span>담은 순서대로</span>
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center py-16">
          <Package className="mx-auto h-12 w-12 text-gray-200" />
          <p className="mt-4 text-sm text-gray-400">
            {filterType === 'all'
              ? '아직 고른 상품이 없어요. 둘러볼까요?'
              : filterType === 'GONGGU'
                ? '공구 상품이 없어요'
                : '상시 상품이 없어요'}
          </p>
          {filterType === 'all' && (
            <Link href={`/${locale}/creator/products`}>
              <Button variant="outline" className="mt-3 rounded-xl">
                상품 둘러보기
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const product = item.product;
            const campaignInactive = item.campaign && item.campaign.status !== 'ACTIVE';
            const productInactive = product.status && product.status !== 'ACTIVE';
            const hiddenFromShop = campaignInactive || productInactive;
            const isGongguLive = item.type === 'GONGGU' && item.campaign?.status === 'ACTIVE';

            const imgSrc = product.imageUrl || product.images?.[0] || null;
            const salePrice = Number(product.salePrice ?? 0);
            const originalPrice = Number(product.originalPrice ?? 0);
            const discount = originalPrice > salePrice && originalPrice > 0
              ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
              : 0;
            const earnings = originalPrice > salePrice ? originalPrice - salePrice : 0;

            const campaignDDay = item.campaign?.endAt ? getDDay(item.campaign.endAt) : null;
            const campaignStartDate = item.campaign?.startAt
              ? new Date(item.campaign.startAt).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })
              : null;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-4 relative ${
                  !item.isVisible ? 'opacity-60' : ''
                }`}
              >
                {/* Remove (X) button top-right */}
                {item.type === 'PICK' && (
                  <button
                    onClick={(e) => { e.preventDefault(); setRemoveTarget(item); }}
                    disabled={removingId === item.id}
                    className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-gray-100/90 hover:bg-red-100 flex items-center justify-center transition-colors"
                  >
                    {removingId === item.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-500" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-gray-500" />
                    )}
                  </button>
                )}

                <div className="flex gap-3">
                  {/* Product Image */}
                  <Link href={`/${locale}/creator/products/${item.productId}`} className="shrink-0">
                    <div className="w-20 h-20 rounded-xl bg-gray-50 relative overflow-hidden">
                      <SafeImage
                        src={imgSrc}
                        alt={product.name || ''}
                        fill
                        className="object-cover"
                        fallbackClassName="w-full h-full"
                        sizes="80px"
                      />
                      {/* Badge overlay on image */}
                      {isGongguLive && (
                        <span className="absolute bottom-1 left-1 text-[9px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded-full animate-pulse">
                          LIVE
                        </span>
                      )}
                    </div>
                  </Link>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    {/* Type badge */}
                    <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full mb-1 ${
                      item.type === 'GONGGU'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {item.type === 'GONGGU' ? '공구' : '상시'}
                    </span>

                    {/* Product name */}
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">
                      {product.name}
                    </p>

                    {/* Price row */}
                    <div className="flex items-center gap-1.5 mt-1">
                      {discount > 0 && (
                        <span className="text-xs font-bold text-red-500">{discount}%</span>
                      )}
                      <span className="text-sm font-bold text-gray-900">
                        {formatCurrency(salePrice, 'KRW')}
                      </span>
                      {earnings > 0 && (
                        <span className="text-xs font-semibold text-emerald-600">
                          +{formatCurrency(earnings, 'KRW')}
                        </span>
                      )}
                    </div>

                    {/* Campaign date for gonggu */}
                    {item.type === 'GONGGU' && campaignStartDate && campaignDDay != null && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {campaignStartDate}
                        {campaignDDay > 0 && (
                          <span className="ml-1 font-medium text-red-500">
                            D-{campaignDDay}
                          </span>
                        )}
                        {campaignDDay === 0 && (
                          <span className="ml-1 font-medium text-red-500">
                            D-Day
                          </span>
                        )}
                      </p>
                    )}

                    {/* Hidden warning */}
                    {hiddenFromShop && item.isVisible && (
                      <div className="flex items-center gap-1 mt-1.5 text-orange-600">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span className="text-[10px] leading-tight">
                          {productInactive ? '상품 비활성 상태로 샵에 미노출' : '캠페인 종료/대기 중으로 샵에 미노출'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom: Earnings row */}
                {earnings > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-50">
                    <p className="text-xs text-emerald-600 font-medium">
                      +{formatCurrency(earnings, 'KRW')} 예상 수익
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={!!removeTarget} onOpenChange={() => setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>내 샵에서 빼기</AlertDialogTitle>
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
