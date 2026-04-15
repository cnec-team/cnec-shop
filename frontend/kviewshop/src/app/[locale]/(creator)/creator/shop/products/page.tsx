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
import { Package, AlertCircle, Plus } from 'lucide-react';
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
        <CreatorProductGrid>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </CreatorProductGrid>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">내가 고른 상품</h1>
          <p className="text-sm text-gray-400 mt-0.5">내 셀렉트샵에 담긴 상품을 관리하세요</p>
        </div>
        <Link href={`/${locale}/creator/products`}>
          <Button variant="outline" className="rounded-xl gap-1.5">
            <Plus className="h-4 w-4" />
            상품 추가
          </Button>
        </Link>
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
        <CreatorProductGrid>
          {items.map((item) => {
            const product = item.product;
            const campaignInactive = item.campaign && item.campaign.status !== 'ACTIVE';
            const productInactive = product.status && product.status !== 'ACTIVE';
            const hiddenFromShop = campaignInactive || productInactive;

            return (
              <div key={item.id} className={!item.isVisible ? 'opacity-60' : ''}>
                <CreatorProductCard
                  product={{
                    id: item.productId,
                    name: product.name,
                    imageUrl: product.imageUrl,
                    images: product.images,
                    salePrice: Number(product.salePrice ?? 0),
                    originalPrice: Number(product.originalPrice ?? 0),
                    brand: product.brand ? { brandName: product.brand.brandName } : null,
                  }}
                  badge={item.type === 'GONGGU' ? 'gonggu' : null}
                  showRemove={item.type === 'PICK'}
                  isRemoving={removingId === item.id}
                  onRemove={() => setRemoveTarget(item)}
                  href={`/${locale}/creator/products/${item.productId}`}
                />
                {hiddenFromShop && item.isVisible && (
                  <div className="flex items-center gap-1 mt-1.5 px-3 pb-2 text-orange-600">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span className="text-[10px] leading-tight">
                      {productInactive ? '상품 비활성 상태로 샵에 미노출' : '캠페인 종료/대기 중으로 샵에 미노출'}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </CreatorProductGrid>
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
