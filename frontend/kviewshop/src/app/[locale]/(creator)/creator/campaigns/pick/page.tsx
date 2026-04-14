'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, Plus, Loader2, X } from 'lucide-react';
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">상시 판매</h1>
          <p className="text-sm text-gray-400 mt-0.5">내가 고른 상품의 판매 현황을 확인하세요</p>
        </div>
        <Link href={`/${locale}/creator/products`}>
          <Button size="sm" className="rounded-xl bg-gray-900 text-white hover:bg-gray-800">
            <Plus className="h-4 w-4 mr-1" />
            상품 추가하기
          </Button>
        </Link>
      </div>

      <p className="text-xs text-gray-400">총 {items.length}개 상품</p>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <Package className="mx-auto h-12 w-12 text-gray-200" />
          <p className="mt-4 text-sm text-gray-400">상시 판매 중인 상품이 없어요</p>
          <p className="text-xs text-gray-300 mt-1">상품을 둘러보고 내 샵에 추가해보세요!</p>
          <Link href={`/${locale}/creator/products`}>
            <Button variant="outline" className="mt-3 rounded-xl">상품 둘러보기</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const product = item.product;
            const price = Number(product.salePrice ?? 0);
            const imgSrc = product.images?.[0] || product.imageUrl;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative"
              >
                {/* Delete button */}
                <button
                  onClick={() => setRemoveTarget(item)}
                  disabled={removingId === item.id}
                  className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-gray-100/90 hover:bg-red-100 flex items-center justify-center transition-colors"
                >
                  {removingId === item.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-500" />
                  ) : (
                    <X className="h-3.5 w-3.5 text-gray-500" />
                  )}
                </button>

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
                  </div>
                  <div className="p-3">
                    {product.brand && (
                      <BrandBadge brandName={product.brand.brandName} size="sm" />
                    )}
                    <p className="text-xs font-medium text-gray-900 line-clamp-2 mt-0.5 leading-tight">
                      {product.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-sm font-bold text-gray-900">
                        {formatCurrency(price, 'KRW')}
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
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
