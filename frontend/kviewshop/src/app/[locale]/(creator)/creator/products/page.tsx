'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  Package,
  Plus,
  ShoppingBag,
  ArrowUpDown,
  Loader2,
  SlidersHorizontal,
  Check,
  AlertTriangle,
  Gift,
  Play,
  Trash2,
  ChevronRight,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { BrandBadge } from '@/components/common/BrandBadge';
import { SafeImage } from '@/components/common/SafeImage';
import { formatCurrency } from '@/lib/i18n/config';
import { PRODUCT_CATEGORY_LABELS } from '@/types/database';
import { formatEarnings } from '@/lib/utils/beauty-labels';
import { PriceBadgeTag, PriceScoutSheet } from '@/components/creator/PriceScout';
import { AiGonguTipButton } from '@/components/creator/AiGonguTipCard';
import {
  getCreatorSession,
  getPickableProducts,
  addProductToShop,
  applyGongguProduct,
  triggerMissionCheck,
} from '@/lib/actions/creator';

interface ProductWithCampaign {
  id: string;
  name: string;
  nameKo: string | null;
  nameEn: string | null;
  originalPrice: number;
  salePrice: number;
  images: string[] | null;
  imageUrl: string | null;
  category: string | null;
  defaultCommissionRate: number;
  brandId: string;
  brand: { brandName: string; logoUrl?: string | null } | null;
  allowTrial: boolean;
  activeCampaign: {
    id: string;
    type: string;
    commissionRate: number;
    recruitmentType?: string;
    campaignProduct?: { campaignPrice: number };
  } | null;
}

type SortOption = 'commission_desc' | 'commission_asc' | 'price_asc' | 'price_desc' | 'name';

export default function CreatorProductsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const [creator, setCreator] = useState<{ id: string } | null>(null);
  const [products, setProducts] = useState<ProductWithCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [myShopItemIds, setMyShopItemIds] = useState<Set<string>>(new Set());
  const [myShopCategories, setMyShopCategories] = useState<Map<string, string>>(new Map());
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('commission_desc');

  // Category overlap warning
  const [overlapWarning, setOverlapWarning] = useState<{ product: ProductWithCampaign; existingBrand: string } | null>(null);

  // Content (reels) modal
  interface ContentItem {
    id: string;
    type: string;
    url: string;
    embedUrl: string | null;
    caption: string | null;
    sortOrder: number;
  }
  const [contentModalProduct, setContentModalProduct] = useState<ProductWithCampaign | null>(null);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [contentUrl, setContentUrl] = useState('');
  const [contentCaption, setContentCaption] = useState('');
  const [contentSubmitting, setContentSubmitting] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);
  const [deletingContentId, setDeletingContentId] = useState<string | null>(null);

  // Price Scout
  const [priceBadges, setPriceBadges] = useState<Record<string, { type: string; message: string | null }>>({});
  const [priceSheetProductId, setPriceSheetProductId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      const creatorData = await getCreatorSession();
      if (!creatorData || cancelled) {
        if (!cancelled) setLoading(false);
        return;
      }
      setCreator(creatorData as any);

      try {
        const data = await getPickableProducts(creatorData.id);
        if (!cancelled) {
          const prods = data.products as unknown as ProductWithCampaign[];
          setProducts(prods);
          const shopIds = new Set(data.myShopItemProductIds as unknown as string[]);
          setMyShopItemIds(shopIds);

          // Build category -> brandName map from existing shop items
          const catMap = new Map<string, string>();
          for (const p of prods) {
            if (shopIds.has(p.id) && p.category && p.brand?.brandName) {
              catMap.set(p.category, p.brand.brandName);
            }
          }
          setMyShopCategories(catMap);

          // Load price badges
          try {
            const badgeRes = await fetch('/api/creator/price-scout');
            if (badgeRes.ok) {
              const badgeData = await badgeRes.json();
              const map: Record<string, { type: string; message: string | null }> = {};
              for (const item of badgeData.products ?? []) {
                map[item.productId] = item.badge;
              }
              if (!cancelled) setPriceBadges(map);
            }
          } catch { /* price badges optional */ }
        }
      } catch (error) {
        console.error('Failed to load products:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, []);

  const filteredProducts = useMemo(() => {
    let result = products;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || (p.brand?.brandName ?? '').toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== 'all') {
      result = result.filter((p) => p.category === categoryFilter);
    }
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'commission_desc':
          return (b.activeCampaign?.commissionRate ?? b.defaultCommissionRate) - (a.activeCampaign?.commissionRate ?? a.defaultCommissionRate);
        case 'commission_asc':
          return (a.activeCampaign?.commissionRate ?? a.defaultCommissionRate) - (b.activeCampaign?.commissionRate ?? b.defaultCommissionRate);
        case 'price_asc':
          return Number(a.salePrice) - Number(b.salePrice);
        case 'price_desc':
          return Number(b.salePrice) - Number(a.salePrice);
        case 'name':
          return a.name.localeCompare(b.name, 'ko');
        default:
          return 0;
      }
    });
    return result;
  }, [products, search, categoryFilter, sortBy]);

  const checkCategoryOverlap = (product: ProductWithCampaign): boolean => {
    if (!product.category || !product.brand?.brandName) return false;
    const existingBrand = myShopCategories.get(product.category);
    if (existingBrand && existingBrand !== product.brand.brandName) {
      setOverlapWarning({ product, existingBrand });
      return true;
    }
    return false;
  };

  const handleAddToShop = async (product: ProductWithCampaign, force = false) => {
    if (!creator) { toast.error('로그인이 필요합니다'); return; }
    if (!force && checkCategoryOverlap(product)) return;

    setOverlapWarning(null);
    setAddingId(product.id);
    try {
      await addProductToShop(product.id);
      toast.success('내 팔로워에게 추천할 상품을 담았어요');
      setMyShopItemIds((prev) => new Set([...prev, product.id]));
      if (product.category && product.brand?.brandName) {
        setMyShopCategories((prev) => new Map(prev).set(product.category!, product.brand!.brandName));
      }
      try { await triggerMissionCheck('FIRST_PRODUCT'); } catch {}
    } catch (error: any) {
      if (error?.message?.includes('Unique')) {
        toast.error('이미 추가된 상품입니다');
      } else {
        toast.error('추가하지 못했어요');
      }
    } finally {
      setAddingId(null);
    }
  };

  const handleApplyGonggu = async (product: ProductWithCampaign) => {
    if (!creator || !product.activeCampaign) return;
    setAddingId(product.id);
    try {
      const result = await applyGongguProduct({
        productId: product.id,
        campaignId: product.activeCampaign.id,
        recruitmentType: product.activeCampaign.recruitmentType ?? 'APPROVAL',
      });
      if (result.isOpen) setMyShopItemIds((prev) => new Set([...prev, product.id]));
      toast.success(result.isOpen ? '공구 참여가 완료되었습니다' : '공구 참여 신청이 완료되었습니다');
    } catch (error: any) {
      if (error?.message?.includes('Unique')) toast.error('이미 참여 신청한 공구입니다');
      else toast.error('신청에 실패했습니다');
    } finally {
      setAddingId(null);
    }
  };

  const getDiscountRate = (product: ProductWithCampaign) => {
    const orig = Number(product.originalPrice);
    const sale = Number(product.salePrice);
    if (orig > sale) return Math.round(((orig - sale) / orig) * 100);
    return 0;
  };

  const getEarnings = (product: ProductWithCampaign) => {
    const campaign = product.activeCampaign;
    if (campaign) {
      const price = Number(campaign.campaignProduct?.campaignPrice ?? product.salePrice);
      return Math.round(price * Number(campaign.commissionRate));
    }
    return Math.round(Number(product.salePrice) * Number(product.defaultCommissionRate));
  };

  const fetchContents = async (productId: string) => {
    setContentLoading(true);
    try {
      const res = await fetch(`/api/creator/products/${productId}/content`);
      if (res.ok) {
        const data = await res.json();
        setContents(data);
      }
    } catch {
      // ignore
    } finally {
      setContentLoading(false);
    }
  };

  const openContentModal = (product: ProductWithCampaign) => {
    setContentModalProduct(product);
    setContentUrl('');
    setContentCaption('');
    setContents([]);
    fetchContents(product.id);
  };

  const handleContentSubmit = async () => {
    if (!contentModalProduct || !contentUrl.trim()) {
      toast.error('URL을 입력해주세요');
      return;
    }
    setContentSubmitting(true);
    try {
      const res = await fetch(`/api/creator/products/${contentModalProduct.id}/content`, {
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
        fetchContents(contentModalProduct.id);
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
    if (!contentModalProduct) return;
    setDeletingContentId(contentId);
    try {
      const res = await fetch(`/api/creator/products/${contentModalProduct.id}/content/${contentId}`, {
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
        <Skeleton className="h-10 w-full rounded-xl" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-full shrink-0" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Search Bar as Header */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="어떤 상품을 찾고 있나요?"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-11 rounded-xl bg-gray-50 border-0 focus-visible:ring-1 focus-visible:ring-gray-200"
        />
      </div>

      {/* Category Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            categoryFilter === 'all'
              ? 'bg-foreground text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          전체
        </button>
        {Object.entries(PRODUCT_CATEGORY_LABELS).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setCategoryFilter(value)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              categoryFilter === value
                ? 'bg-foreground text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Count + Sort Row */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-900">
          {filteredProducts.length}개 상품
        </p>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          {sortBy === 'commission_desc' ? '내 수익 높은 순' :
           sortBy === 'commission_asc' ? '내 수익 낮은 순' :
           sortBy === 'price_asc' ? '가격 낮은 순' :
           sortBy === 'price_desc' ? '가격 높은 순' : '이름 순'}
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Sort dropdown (shown when toggled) */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-2">
          <Select value={sortBy} onValueChange={(v) => { setSortBy(v as SortOption); setShowFilters(false); }}>
            <SelectTrigger className="w-full h-9 rounded-xl border-0 bg-gray-50">
              <ArrowUpDown className="h-3.5 w-3.5 mr-2" />
              <SelectValue placeholder="정렬" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="commission_desc">내 수익 높은 순</SelectItem>
              <SelectItem value="commission_asc">내 수익 낮은 순</SelectItem>
              <SelectItem value="price_asc">가격 낮은 순</SelectItem>
              <SelectItem value="price_desc">가격 높은 순</SelectItem>
              <SelectItem value="name">이름 순</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {filteredProducts.length === 0 ? (
        <div className="text-center py-16">
          <Package className="mx-auto h-12 w-12 text-gray-200" />
          <p className="mt-4 text-gray-400">검색 결과가 없습니다</p>
          <Button variant="outline" className="mt-3 rounded-xl" onClick={() => { setSearch(''); setCategoryFilter('all'); }}>
            필터 초기화
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filteredProducts.map((product) => {
            const discount = getDiscountRate(product);
            const earnings = getEarnings(product);
            const isAdded = myShopItemIds.has(product.id);
            const isGonggu = product.activeCampaign?.type === 'GONGGU';

            return (
              <div key={product.id} className="rounded-2xl overflow-hidden flex flex-col">
                {/* Product Image */}
                <Link href={`/${locale}/creator/products/${product.id}`} className="block">
                  <div className="aspect-square bg-gray-50 relative overflow-hidden rounded-xl">
                    <SafeImage
                      src={product.images?.[0] || product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover"
                      fallbackClassName="w-full h-full"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                    {isGonggu && (
                      <span className="absolute top-2 left-2 bg-blue-100 text-blue-700 text-[10px] font-medium px-2 py-0.5 rounded-full">
                        공구
                      </span>
                    )}
                    {product.allowTrial && (
                      <span className="absolute top-2 right-2 bg-purple-100 text-purple-700 text-[10px] font-medium px-2 py-0.5 rounded-full">
                        체험
                      </span>
                    )}
                  </div>
                </Link>

                {/* Product Info */}
                <div className="pt-2.5 pb-1 flex flex-col flex-1">
                  <Link href={`/${locale}/creator/products/${product.id}`} className="block">
                    {product.brand && (
                      <div className="flex items-center gap-1 mb-0.5">
                        {product.brand.logoUrl && (
                          <img
                            src={product.brand.logoUrl}
                            alt={product.brand.brandName}
                            className="h-3.5 w-3.5 rounded-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        )}
                        <BrandBadge brandName={product.brand.brandName} />
                      </div>
                    )}
                    <p className="text-xs text-gray-700 line-clamp-2 leading-tight mt-0.5">{product.name}</p>

                    {/* Price Row */}
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {discount > 0 && (
                        <span className="text-sm font-bold text-red-500">{discount}%</span>
                      )}
                      <span className="text-sm font-bold text-gray-900">
                        {formatCurrency(Number(product.salePrice), 'KRW')}
                      </span>
                    </div>

                    {/* Earnings */}
                    <p className="text-xs font-semibold text-emerald-600 mt-1">
                      내 수익 {formatCurrency(earnings, 'KRW')}
                    </p>
                  </Link>

                  {/* Badges row */}
                  <div className="flex flex-wrap items-center gap-1 mt-1.5">
                    {priceBadges[product.id] && (
                      <button
                        onClick={(e) => { e.preventDefault(); setPriceSheetProductId(product.id); }}
                      >
                        <PriceBadgeTag badge={priceBadges[product.id]} />
                      </button>
                    )}
                    <AiGonguTipButton productId={product.id} />
                  </div>

                  {/* Action Button */}
                  <div className="mt-2.5 space-y-1.5 flex-1 flex flex-col justify-end">
                    {isAdded ? (
                      <Button variant="outline" size="sm" className="w-full h-9 text-xs rounded-xl" disabled>
                        <Check className="h-3.5 w-3.5 mr-1" /> 추가됨
                      </Button>
                    ) : isGonggu ? (
                      <Button
                        size="sm"
                        className="w-full h-9 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl border-0"
                        onClick={() => handleApplyGonggu(product)}
                        disabled={addingId === product.id}
                      >
                        {addingId === product.id ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                        ) : (
                          <ShoppingBag className="h-3.5 w-3.5 mr-1" />
                        )}
                        공구 참여
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="w-full h-9 text-xs bg-foreground text-white hover:bg-foreground/90 rounded-xl"
                        onClick={() => handleAddToShop(product)}
                        disabled={addingId === product.id}
                      >
                        {addingId === product.id ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                        ) : (
                          <Plus className="h-3.5 w-3.5 mr-1" />
                        )}
                        내 샵에 담기
                      </Button>
                    )}
                    {product.allowTrial && !isAdded && (
                      <Link href={`/${locale}/creator/products/${product.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full h-9 text-xs rounded-xl text-purple-700 border-purple-200 hover:bg-purple-50"
                        >
                          <Gift className="h-3.5 w-3.5 mr-1" />
                          샘플 신청
                        </Button>
                      </Link>
                    )}
                    {isAdded && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-9 text-xs rounded-xl text-gray-600 border-gray-200 hover:bg-gray-50"
                        onClick={() => openContentModal(product)}
                      >
                        <Play className="h-3.5 w-3.5 mr-1" />
                        리뷰 영상
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Category Overlap Warning Dialog */}
      <Dialog open={!!overlapWarning} onOpenChange={() => setOverlapWarning(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              카테고리 겹침 안내
            </DialogTitle>
            <DialogDescription>
              이미 {PRODUCT_CATEGORY_LABELS[(overlapWarning?.product?.category ?? '') as keyof typeof PRODUCT_CATEGORY_LABELS] ?? overlapWarning?.product?.category}에서{' '}
              <strong>{overlapWarning?.existingBrand}</strong>를 판매 중이에요.
              같은 카테고리에 여러 브랜드를 추천하면 팔로워 신뢰도가 떨어질 수 있어요.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" onClick={() => setOverlapWarning(null)} className="flex-1 rounded-xl h-12">
              취소
            </Button>
            <Button
              onClick={() => overlapWarning && handleAddToShop(overlapWarning.product, true)}
              className="flex-1 bg-foreground text-white hover:bg-foreground/90 rounded-xl h-12"
            >
              그래도 추가
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Price Scout Sheet */}
      {priceSheetProductId && (
        <PriceScoutSheet
          productId={priceSheetProductId}
          open={!!priceSheetProductId}
          onOpenChange={(open) => { if (!open) setPriceSheetProductId(null); }}
        />
      )}

      {/* Creator Content (Reels) Modal */}
      <Dialog open={!!contentModalProduct} onOpenChange={() => setContentModalProduct(null)}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-gray-600" />
              리뷰 영상 관리
            </DialogTitle>
            <DialogDescription>
              {contentModalProduct?.name} — 인스타그램 릴스나 틱톡 영상을 등록하세요 (최대 5개)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Add new content */}
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
                className="w-full bg-foreground text-white rounded-xl h-10 font-medium text-sm"
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
