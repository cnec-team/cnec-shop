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
import {
  Package,
  Loader2,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { CreatorProductCard } from '@/components/creator/CreatorProductCard';
import { CreatorProductGrid } from '@/components/creator/CreatorProductGrid';
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
  campaign?: { id: string; status: string; title: string } | null;
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

  if (loading) {
    return (
      <div className="space-y-4 max-w-4xl">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">내가 고른 상품</h1>
        <p className="text-sm text-gray-400 mt-0.5">내 셀렉트샵에 담긴 상품을 관리하세요</p>
      </div>

      <p className="text-xs text-gray-400">총 {items.length}개 상품</p>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <Package className="mx-auto h-12 w-12 text-gray-200" />
          <p className="mt-4 text-sm text-gray-400">아직 고른 상품이 없어요. 둘러볼까요?</p>
          <Link href={`/${locale}/creator/products`}>
            <Button variant="outline" className="mt-3 rounded-xl">
              상품 둘러보기
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const product = item.product;
            const price = Number(product.salePrice ?? 0);
            const originalPrice = Number(product.originalPrice ?? 0);
            const discount = originalPrice > price
              ? Math.round(((originalPrice - price) / originalPrice) * 100)
              : 0;
            const imgSrc = product.images?.[0] || product.imageUrl;

            // Check if item is hidden from actual shop due to campaign/product status
            const campaignInactive = item.campaign && item.campaign.status !== 'ACTIVE';
            const productInactive = product.status && product.status !== 'ACTIVE';
            const hiddenFromShop = campaignInactive || productInactive;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden relative ${
                  item.isVisible ? 'border-gray-100' : 'border-gray-200 opacity-60'
                }`}
              >
                {/* Delete button — top-right of card, PICK only */}
                {item.type === 'PICK' && (
                  <button
                    onClick={() => setRemoveTarget(item)}
                    disabled={removingId === item.id}
                    className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-gray-100/90 hover:bg-red-100 flex items-center justify-center transition-colors"
                  >
                    {removingId === item.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-500" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-gray-500 hover:text-red-500" />
                    )}
                  </button>
                )}

                <Link href={`/${locale}/creator/products/${product.id}`} className="block">
                  <div className="aspect-square bg-gray-50 relative overflow-hidden">
                    <SafeImage
                      src={imgSrc}
                      alt={product.name || ''}
                      fill
                      className="object-cover"
                      fallbackClassName="w-full h-full"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    {!item.isVisible && (
                      <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                        <span className="text-xs font-medium text-gray-500 bg-white/80 rounded-full px-3 py-1">
                          숨김
                        </span>
                      </div>
                    )}
                    {item.type === 'GONGGU' && (
                      <span className="absolute top-2 left-2 bg-blue-50/90 text-[10px] font-medium px-2 py-0.5 rounded-full text-blue-700">
                        공구
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    {product.brand && (
                      <BrandBadge brandName={product.brand.brandName} size="sm" />
                    )}
                    <p className="text-xs font-medium text-gray-900 line-clamp-2 mt-0.5 leading-tight">
                      {product.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {discount > 0 && (
                        <span className="text-xs font-bold text-red-500">{discount}%</span>
                      )}
                      <span className="text-sm font-bold text-gray-900">
                        {formatCurrency(price, 'KRW')}
                      </span>
                    </div>
                    {hiddenFromShop && item.isVisible && (
                      <div className="flex items-center gap-1 mt-1.5 text-orange-600">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span className="text-[10px] leading-tight">
                          {productInactive ? '상품 비활성 상태로 샵에 미노출' : '캠페인 종료/대기 중으로 샵에 미노출'}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* Content (Reels) Modal */}
      <Dialog open={!!contentItem} onOpenChange={() => setContentItem(null)}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-gray-600" />
              리뷰 영상 관리
            </DialogTitle>
            <DialogDescription>
              {contentItem?.product.name} — 인스타그램 릴스나 틱톡 영상을 등록하세요 (최대 5개)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Add new */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-sm">URL</Label>
                <Input
                  value={contentUrl}
                  onChange={(e) => setContentUrl(e.target.value)}
                  placeholder="인스타그램 릴스 또는 틱톡 URL을 붙여넣으세요"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">한줄 코멘트 (선택)</Label>
                <Input
                  value={contentCaption}
                  onChange={(e) => setContentCaption(e.target.value)}
                  placeholder="이 제품에 대한 한마디"
                />
              </div>
              <Button
                onClick={handleContentSubmit}
                disabled={contentSubmitting || !contentUrl.trim()}
                className="w-full bg-gray-900 text-white rounded-xl h-10 font-medium text-sm"
              >
                {contentSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : '추가'}
              </Button>
            </div>

            {/* Existing contents */}
            {contentLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : contents.length > 0 ? (
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500">등록된 영상 ({contents.length}/5)</p>
                {contents.map((c) => (
                  <div key={c.id} className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-900 truncate">{c.url}</p>
                      {c.caption && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{c.caption}</p>
                      )}
                      <span className="text-[10px] text-gray-400 bg-gray-200 rounded px-1.5 py-0.5 mt-1 inline-block">
                        {c.type === 'INSTAGRAM_REEL' ? '인스타그램' : c.type === 'TIKTOK' ? '틱톡' : c.type}
                      </span>
                    </div>
                    <button
                      onClick={() => handleContentDelete(c.id)}
                      disabled={deletingContentId === c.id}
                      className="shrink-0 p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      {deletingContentId === c.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

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
