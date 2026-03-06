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
import { getClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/auth';
import { formatCurrency } from '@/lib/i18n/config';
import type {
  Product,
  Brand,
  Campaign,
  CampaignProduct,
  ProductCategory,
} from '@/types/database';
import { PRODUCT_CATEGORY_LABELS } from '@/types/database';

interface ProductWithCampaign extends Product {
  brand?: Brand;
  active_campaign?: Campaign & { campaign_product?: CampaignProduct };
}

type SortOption = 'commission_desc' | 'commission_asc' | 'price_asc' | 'price_desc' | 'name';

export default function CreatorProductsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const { creator, isLoading: authLoading } = useAuthStore();

  const [products, setProducts] = useState<ProductWithCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [myShopItemIds, setMyShopItemIds] = useState<Set<string>>(new Set());

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('commission_desc');

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;

    async function fetchData() {
      try {
        const supabase = getClient();

        // Fetch products with brands, active campaigns, and creator's shop items in parallel
        const [productsRes, brandsRes, campaignsRes, campaignProductsRes, shopItemsRes] =
          await Promise.all([
            supabase
              .from('products')
              .select('*')
              .eq('status', 'ACTIVE')
              .eq('allow_creator_pick', true),
            supabase.from('brands').select('*'),
            supabase
              .from('campaigns')
              .select('*')
              .in('status', ['RECRUITING', 'ACTIVE']),
            supabase.from('campaign_products').select('*, product:products(*)'),
            creator
              ? supabase
                  .from('creator_shop_items')
                  .select('product_id')
                  .eq('creator_id', creator.id)
              : Promise.resolve({ data: [] }),
          ]);

        if (cancelled) return;

        // Build brand map
        const brandMap: Record<string, Brand> = {};
        for (const b of brandsRes.data ?? []) {
          brandMap[b.id] = b;
        }

        // Build campaign map: product_id -> campaign + campaign_product
        const campaignMap: Record<string, Campaign & { campaign_product?: CampaignProduct }> = {};
        for (const cp of campaignProductsRes.data ?? []) {
          const campaign = (campaignsRes.data ?? []).find((c) => c.id === cp.campaign_id);
          if (campaign) {
            campaignMap[cp.product_id] = { ...campaign, campaign_product: cp };
          }
        }

        // Build my shop item set
        const itemIds = new Set<string>();
        for (const item of shopItemsRes.data ?? []) {
          itemIds.add(item.product_id);
        }

        // Combine
        const combined: ProductWithCampaign[] = (productsRes.data ?? []).map((p) => ({
          ...p,
          brand: brandMap[p.brand_id],
          active_campaign: campaignMap[p.id],
        }));

        setProducts(combined);
        setMyShopItemIds(itemIds);
      } catch (error) {
        console.error('Failed to load products:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [authLoading, creator]);

  const filteredProducts = useMemo(() => {
    let result = products;

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.brand?.brand_name ?? '').toLowerCase().includes(q)
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter((p) => p.category === categoryFilter);
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'commission_desc':
          return (
            (b.active_campaign?.commission_rate ?? b.default_commission_rate) -
            (a.active_campaign?.commission_rate ?? a.default_commission_rate)
          );
        case 'commission_asc':
          return (
            (a.active_campaign?.commission_rate ?? a.default_commission_rate) -
            (b.active_campaign?.commission_rate ?? b.default_commission_rate)
          );
        case 'price_asc':
          return a.sale_price - b.sale_price;
        case 'price_desc':
          return b.sale_price - a.sale_price;
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
      const supabase = getClient();

      const { error } = await supabase.from('creator_shop_items').insert({
        creator_id: creator.id,
        product_id: product.id,
        type: 'PICK' as const,
        display_order: 0,
        is_visible: true,
      });

      if (error) {
        if (error.code === '23505') {
          toast.error('이미 추가된 상품입니다');
        } else {
          toast.error('추가에 실패했습니다');
          console.error('Add error:', error);
        }
      } else {
        toast.success('내 샵에 추가되었습니다');
        setMyShopItemIds((prev) => new Set([...prev, product.id]));

        // Trigger mission check for FIRST_PRODUCT point award (₩1,000)
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await fetch('/api/creator/missions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ missionKey: 'FIRST_PRODUCT' }),
            });
          }
        } catch {
          // Non-critical: mission check failure shouldn't block the flow
        }
      }
    } catch (error) {
      toast.error('추가에 실패했습니다');
    } finally {
      setAddingId(null);
    }
  };

  const handleApplyGonggu = async (product: ProductWithCampaign) => {
    if (!creator || !product.active_campaign) return;

    setAddingId(product.id);

    try {
      const supabase = getClient();

      // Create campaign participation
      const { error: partError } = await supabase.from('campaign_participations').insert({
        campaign_id: product.active_campaign.id,
        creator_id: creator.id,
        status: product.active_campaign.recruitment_type === 'OPEN' ? 'APPROVED' : 'PENDING',
      });

      if (partError) {
        if (partError.code === '23505') {
          toast.error('이미 참여 신청한 공구입니다');
        } else {
          toast.error('신청에 실패했습니다');
        }
        return;
      }

      // If OPEN type, also add to shop items
      if (product.active_campaign.recruitment_type === 'OPEN') {
        await supabase.from('creator_shop_items').insert({
          creator_id: creator.id,
          product_id: product.id,
          campaign_id: product.active_campaign.id,
          type: 'GONGGU' as const,
          display_order: 0,
          is_visible: true,
        });
        setMyShopItemIds((prev) => new Set([...prev, product.id]));
      }

      toast.success(
        product.active_campaign.recruitment_type === 'OPEN'
          ? '공구 참여가 완료되었습니다'
          : '공구 참여 신청이 완료되었습니다'
      );
    } catch (error) {
      toast.error('신청에 실패했습니다');
    } finally {
      setAddingId(null);
    }
  };

  const getDiscountRate = (product: Product) => {
    if (product.original_price > product.sale_price) {
      return Math.round(
        ((product.original_price - product.sale_price) / product.original_price) * 100
      );
    }
    return 0;
  };

  const getCommissionInfo = (product: ProductWithCampaign) => {
    const campaign = product.active_campaign;
    if (campaign) {
      const rate = campaign.commission_rate * 100;
      const amount = Math.round(
        (campaign.campaign_product?.campaign_price ?? product.sale_price) * campaign.commission_rate
      );
      return {
        type: campaign.type === 'GONGGU' ? '공구' : '상시',
        rate,
        amount,
        label: `${campaign.type === 'GONGGU' ? '공구' : '상시'} ${rate}%`,
        amountLabel: formatCurrency(amount, 'KRW'),
      };
    }
    const rate = product.default_commission_rate * 100;
    const amount = Math.round(product.sale_price * product.default_commission_rate);
    return {
      type: '상시',
      rate,
      amount,
      label: `상시 ${rate}%`,
      amountLabel: formatCurrency(amount, 'KRW'),
    };
  };

  if (authLoading || loading) {
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
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">상품 둘러보기</h1>
        <p className="text-sm text-muted-foreground">
          내 샵에 추가할 상품을 찾아보세요
        </p>
      </div>

      {/* Search & Filters */}
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

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        총 {filteredProducts.length}개 상품
      </p>

      {/* Product Grid */}
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
            const isGonggu = product.active_campaign?.type === 'GONGGU';

            return (
              <Card key={product.id} className="overflow-hidden flex flex-col">
                {/* Thumbnail */}
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
                  {/* Commission Badge */}
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
                    {/* Brand */}
                    {product.brand && (
                      <p className="text-xs text-muted-foreground">
                        {product.brand.brand_name}
                      </p>
                    )}
                    {/* Name */}
                    <p className="font-medium line-clamp-2 mt-1">{product.name}</p>
                    {/* Price */}
                    <div className="flex items-center gap-2 mt-2">
                      {discount > 0 && (
                        <span className="text-sm font-bold text-destructive">{discount}%</span>
                      )}
                      <span className="text-lg font-bold">
                        {formatCurrency(product.sale_price, 'KRW')}
                      </span>
                    </div>
                    {discount > 0 && (
                      <p className="text-xs text-muted-foreground line-through">
                        {formatCurrency(product.original_price, 'KRW')}
                      </p>
                    )}
                  </div>

                  {/* Action Button */}
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
