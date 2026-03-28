'use client';

import { useState, useEffect, useMemo } from 'react';
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
} from 'lucide-react';
import { toast } from 'sonner';
import { BrandBadge } from '@/components/common/BrandBadge';
import { formatCurrency } from '@/lib/i18n/config';
import { PRODUCT_CATEGORY_LABELS } from '@/types/database';
import { formatEarnings } from '@/lib/utils/beauty-labels';
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
  brand: { brandName: string } | null;
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

          // Build category → brandName map from existing shop items
          const catMap = new Map<string, string>();
          for (const p of prods) {
            if (shopIds.has(p.id) && p.category && p.brand?.brandName) {
              catMap.set(p.category, p.brand.brandName);
            }
          }
          setMyShopCategories(catMap);
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
      toast.success('내 샵에 추가되었습니다');
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

  if (loading) {
    return (
      <div className="space-y-4 max-w-4xl">
        <Skeleton className="h-10 w-full rounded-xl" />
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Header */}
      <div className="hidden md:block">
        <h1 className="text-xl font-bold text-gray-900">상품 둘러보기</h1>
        <p className="text-sm text-gray-400 mt-0.5">내 샵에 추가할 상품을 찾아보세요</p>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="어떤 상품을 찾고 있나요?"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 rounded-xl"
          />
        </div>
        <Button
          variant={showFilters ? 'default' : 'outline'}
          size="icon"
          className="h-10 w-10 shrink-0 md:hidden rounded-xl"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </div>

      <div className={`flex flex-col sm:flex-row gap-2 ${showFilters ? 'block' : 'hidden md:flex'}`}>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[160px] h-9 rounded-xl">
            <SelectValue placeholder="카테고리" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 카테고리</SelectItem>
            {Object.entries(PRODUCT_CATEGORY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-full sm:w-[180px] h-9 rounded-xl">
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

      <p className="text-xs text-gray-400">총 {filteredProducts.length}개 상품</p>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-16">
          <Package className="mx-auto h-12 w-12 text-gray-200" />
          <p className="mt-4 text-gray-400">검색 결과가 없습니다</p>
          <Button variant="outline" className="mt-3 rounded-xl" onClick={() => { setSearch(''); setCategoryFilter('all'); }}>
            필터 초기화
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => {
            const discount = getDiscountRate(product);
            const earnings = getEarnings(product);
            const isAdded = myShopItemIds.has(product.id);
            const isGonggu = product.activeCampaign?.type === 'GONGGU';

            return (
              <div key={product.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                <div className="aspect-square bg-gray-50 relative overflow-hidden">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-10 w-10 text-gray-200" />
                    </div>
                  )}
                  {isGonggu && (
                    <span className="absolute top-2 left-2 bg-blue-50 text-blue-700 text-[10px] font-medium px-2 py-0.5 rounded-full">
                      공구
                    </span>
                  )}
                </div>

                <div className="p-3 flex-1 flex flex-col">
                  <div className="flex-1">
                    {product.brand && (
                      <BrandBadge brandName={product.brand.brandName} />
                    )}
                    <p className="text-xs font-medium text-gray-900 line-clamp-2 mt-0.5 leading-tight">{product.name}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {discount > 0 && (
                        <span className="text-xs font-bold text-red-500">{discount}%</span>
                      )}
                      <span className="text-sm font-bold text-gray-900">
                        {formatCurrency(Number(product.salePrice), 'KRW')}
                      </span>
                    </div>
                    {discount > 0 && (
                      <span className="text-[10px] text-gray-400 line-through">
                        {formatCurrency(Number(product.originalPrice), 'KRW')}
                      </span>
                    )}
                    <p className="text-xs text-earnings font-semibold mt-1">
                      팔면 ₩{earnings.toLocaleString()}
                    </p>
                  </div>

                  <div className="mt-2.5">
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
                        className="w-full h-9 text-xs bg-gray-900 text-white hover:bg-gray-800 rounded-xl"
                        onClick={() => handleAddToShop(product)}
                        disabled={addingId === product.id}
                      >
                        {addingId === product.id ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                        ) : (
                          <Plus className="h-3.5 w-3.5 mr-1" />
                        )}
                        내 샵에 추가
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
              className="flex-1 bg-gray-900 text-white hover:bg-gray-800 rounded-xl h-12"
            >
              그래도 추가
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
