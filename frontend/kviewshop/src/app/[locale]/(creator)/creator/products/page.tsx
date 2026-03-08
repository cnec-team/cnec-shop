'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Package,
  Plus,
  ShoppingBag,
  ArrowUpDown,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/i18n/config';
import { PRODUCT_CATEGORY_LABELS } from '@/types/database';
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

type ProductCategory = 'SKINCARE' | 'MAKEUP' | 'HAIRCARE' | 'BODYCARE' | 'FRAGRANCE' | 'TOOLS' | 'SUPPLEMENT' | 'OTHER';
type SortOption = 'commission_desc' | 'commission_asc' | 'price_asc' | 'price_desc' | 'name';

export default function CreatorProductsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const [creator, setCreator] = useState<{ id: string } | null>(null);
  const [products, setProducts] = useState<ProductWithCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [myShopItemIds, setMyShopItemIds] = useState<Set<string>>(new Set());

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('commission_desc');

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
          setProducts(data.products as unknown as ProductWithCampaign[]);
          setMyShopItemIds(new Set(data.myShopItemProductIds));
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
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.brand?.brandName ?? '').toLowerCase().includes(q)
      );
    }

    if (categoryFilter !== 'all') {
      result = result.filter((p) => p.category === categoryFilter);
    }

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'commission_desc':
          return (
            (b.activeCampaign?.commissionRate ?? b.defaultCommissionRate) -
            (a.activeCampaign?.commissionRate ?? a.defaultCommissionRate)
          );
        case 'commission_asc':
          return (
            (a.activeCampaign?.commissionRate ?? a.defaultCommissionRate) -
            (b.activeCampaign?.commissionRate ?? b.defaultCommissionRate)
          );
        case 'price_asc':
          return a.salePrice - b.salePrice;
        case 'price_desc':
          return b.salePrice - a.salePrice;
        case 'name':
          return a.name.localeCompare(b.name, 'ko');
        default:
          return 0;
      }
    });

    return result;
  }, [products, search, categoryFilter, sortBy]);

  const handleAddToShop = async (product: ProductWithCampaign) => {
    if (!creator) {
      toast.error('로그인이 필요합니다');
      return;
    }

    setAddingId(product.id);

    try {
      await addProductToShop(product.id);
      toast.success('내 샵에 추가되었습니다');
      setMyShopItemIds((prev) => new Set([...prev, product.id]));

      try {
        await triggerMissionCheck('FIRST_PRODUCT');
      } catch {
        // Non-critical
      }
    } catch (error: any) {
      if (error?.message?.includes('Unique')) {
        toast.error('이미 추가된 상품입니다');
      } else {
        toast.error('추가에 실패했습니다');
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

      if (result.isOpen) {
        setMyShopItemIds((prev) => new Set([...prev, product.id]));
      }

      toast.success(
        result.isOpen
          ? '공구 참여가 완료되었습니다'
          : '공구 참여 신청이 완료되었습니다'
      );
    } catch (error: any) {
      if (error?.message?.includes('Unique')) {
        toast.error('이미 참여 신청한 공구입니다');
      } else {
        toast.error('신청에 실패했습니다');
      }
    } finally {
      setAddingId(null);
    }
  };

  const getDiscountRate = (product: ProductWithCampaign) => {
    if (product.originalPrice > product.salePrice) {
      return Math.round(
        ((product.originalPrice - product.salePrice) / product.originalPrice) * 100
      );
    }
    return 0;
  };

  const getCommissionInfo = (product: ProductWithCampaign) => {
    const campaign = product.activeCampaign;
    if (campaign) {
      const rate = campaign.commissionRate * 100;
      const amount = Math.round(
        (campaign.campaignProduct?.campaignPrice ?? product.salePrice) * campaign.commissionRate
      );
      return {
        type: campaign.type === 'GONGGU' ? '공구' : '상시',
        rate,
        amount,
        label: `${campaign.type === 'GONGGU' ? '공구' : '상시'} ${rate}%`,
        amountLabel: formatCurrency(amount, 'KRW'),
      };
    }
    const rate = product.defaultCommissionRate * 100;
    const amount = Math.round(product.salePrice * product.defaultCommissionRate);
    return {
      type: '상시',
      rate,
      amount,
      label: `상시 ${rate}%`,
      amountLabel: formatCurrency(amount, 'KRW'),
    };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">상품 둘러보기</h1>
        <p className="text-sm text-muted-foreground">
          내 샵에 추가할 상품을 찾아보세요
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="상품명, 브랜드명 검색"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="카테고리" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 카테고리</SelectItem>
                {(Object.entries(PRODUCT_CATEGORY_LABELS) as [ProductCategory, string][]).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <ArrowUpDown className="h-4 w-4 mr-2" />
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
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        총 {filteredProducts.length}개 상품
      </p>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-16">
          <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">검색 결과가 없습니다</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => {
            const discount = getDiscountRate(product);
            const commission = getCommissionInfo(product);
            const isAdded = myShopItemIds.has(product.id);
            const isGonggu = product.activeCampaign?.type === 'GONGGU';

            return (
              <Card key={product.id} className="overflow-hidden flex flex-col">
                <div className="aspect-square bg-muted relative">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <Badge
                      className={
                        isGonggu
                          ? 'bg-orange-500 text-white'
                          : 'bg-blue-500 text-white'
                      }
                    >
                      {commission.label} &rarr; {commission.amountLabel}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-4 flex-1 flex flex-col">
                  <div className="flex-1">
                    {product.brand && (
                      <p className="text-xs text-muted-foreground">
                        {product.brand.brandName}
                      </p>
                    )}
                    <p className="font-medium line-clamp-2 mt-1">{product.name}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {discount > 0 && (
                        <span className="text-sm font-bold text-destructive">{discount}%</span>
                      )}
                      <span className="text-lg font-bold">
                        {formatCurrency(product.salePrice, 'KRW')}
                      </span>
                    </div>
                    {discount > 0 && (
                      <p className="text-xs text-muted-foreground line-through">
                        {formatCurrency(product.originalPrice, 'KRW')}
                      </p>
                    )}
                  </div>

                  <div className="mt-4">
                    {isAdded ? (
                      <Button variant="outline" size="sm" className="w-full" disabled>
                        <Package className="h-4 w-4 mr-1" />
                        추가됨
                      </Button>
                    ) : isGonggu ? (
                      <Button
                        size="sm"
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                        onClick={() => handleApplyGonggu(product)}
                        disabled={addingId === product.id}
                      >
                        {addingId === product.id ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <ShoppingBag className="h-4 w-4 mr-1" />
                        )}
                        공구 참여 신청
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => handleAddToShop(product)}
                        disabled={addingId === product.id}
                      >
                        {addingId === product.id ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4 mr-1" />
                        )}
                        내 샵에 추가
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
