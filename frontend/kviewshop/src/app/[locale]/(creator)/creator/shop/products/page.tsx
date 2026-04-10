'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Package,
  Play,
  Trash2,
  Loader2,
  Eye,
  EyeOff,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { BrandBadge } from '@/components/common/BrandBadge';
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
  campaign?: { id: string; status: string; title: string } | null;
  type: string;
  isVisible: boolean;
  displayOrder: number;
}

interface ContentItem {
  id: string;
  type: string;
  url: string;
  embedUrl: string | null;
  caption: string | null;
  sortOrder: number;
}

export default function MyShopProductsPage() {
  const params = useParams();
  const locale = params.locale as string;

  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Content modal
  const [contentItem, setContentItem] = useState<ShopItem | null>(null);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [contentUrl, setContentUrl] = useState('');
  const [contentCaption, setContentCaption] = useState('');
  const [contentSubmitting, setContentSubmitting] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);
  const [deletingContentId, setDeletingContentId] = useState<string | null>(null);

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

  // Content management
  const fetchContents = async (productId: string) => {
    setContentLoading(true);
    try {
      const res = await fetch(`/api/creator/products/${productId}/content`);
      if (res.ok) {
        setContents(await res.json());
      }
    } catch {
      // ignore
    } finally {
      setContentLoading(false);
    }
  };

  const openContentModal = (item: ShopItem) => {
    setContentItem(item);
    setContentUrl('');
    setContentCaption('');
    setContents([]);
    fetchContents(item.productId);
  };

  const handleContentSubmit = async () => {
    if (!contentItem || !contentUrl.trim()) {
      toast.error('URL을 입력해주세요');
      return;
    }
    setContentSubmitting(true);
    try {
      const res = await fetch(`/api/creator/products/${contentItem.productId}/content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: contentUrl.trim(),
          caption: contentCaption.trim() || undefined,
        }),
      });
      if (res.ok) {
        toast.success('리뷰 영상이 등록되었습니다');
        setContentUrl('');
        setContentCaption('');
        fetchContents(contentItem.productId);
      } else {
        const data = await res.json();
        toast.error(data.error || '등록에 실패했습니다');
      }
    } catch {
      toast.error('등록에 실패했습니다');
    } finally {
      setContentSubmitting(false);
    }
  };

  const handleContentDelete = async (contentId: string) => {
    if (!contentItem) return;
    setDeletingContentId(contentId);
    try {
      const res = await fetch(`/api/creator/products/${contentItem.productId}/content/${contentId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('삭제되었습니다');
        setContents((prev) => prev.filter((c) => c.id !== contentId));
      } else {
        toast.error('삭제에 실패했습니다');
      }
    } catch {
      toast.error('삭제에 실패했습니다');
    } finally {
      setDeletingContentId(null);
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
        <h1 className="text-xl font-bold text-gray-900">내 샵 상품</h1>
        <p className="text-sm text-gray-400 mt-0.5">내 셀렉트샵에 담긴 상품을 관리하세요</p>
      </div>

      <p className="text-xs text-gray-400">총 {items.length}개 상품</p>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <Package className="mx-auto h-12 w-12 text-gray-200" />
          <p className="mt-4 text-gray-400">아직 담은 상품이 없어요</p>
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
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
                  item.isVisible ? 'border-gray-100' : 'border-gray-200 opacity-60'
                }`}
              >
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
                    <span className="absolute top-2 left-2 bg-white/80 text-[10px] font-medium px-2 py-0.5 rounded-full text-gray-600">
                      {item.type === 'GONGGU' ? '공구' : '픽'}
                    </span>
                  </div>
                  <div className="p-3 pb-0">
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

                {/* Action Buttons */}
                <div className="p-3 pt-2 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-9 text-xs rounded-xl"
                    onClick={() => openContentModal(item)}
                  >
                    <Play className="h-3.5 w-3.5 mr-1" />
                    리뷰 영상
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-3 rounded-xl"
                    onClick={() => handleToggleVisibility(item)}
                    disabled={togglingId === item.id}
                  >
                    {togglingId === item.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : item.isVisible ? (
                      <Eye className="h-3.5 w-3.5 text-gray-500" />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5 text-gray-400" />
                    )}
                  </Button>
                </div>
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
    </div>
  );
}
