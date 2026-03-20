'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Eye,
  ShoppingCart,
  TrendingUp,
  Package,
  Plus,
  ChevronRight,
  Loader2,
  Check,
  X,
  ExternalLink,
  Copy,
  Store,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/i18n/config';
import { MissionWidget } from '@/components/creator/MissionWidget';
import { getShopUrl, formatEarnings } from '@/lib/utils/beauty-labels';
import {
  getCreatorSession,
  getCreatorDashboardStats,
  getPickableProducts,
  addProductToShop,
  triggerMissionCheck,
} from '@/lib/actions/creator';

interface DashboardStats {
  totalVisits: number;
  totalOrders: number;
  totalRevenue: number;
  totalEarnings: number;
  conversionRate: number;
  pendingSettlement: number;
  activeGonggu: number;
  activePicks: number;
}

interface RecommendedProduct {
  id: string;
  name: string;
  salePrice: number;
  images: string[] | null;
  defaultCommissionRate: number;
  brand: { brandName: string } | null;
}

export default function CreatorDashboardPage() {
  const params = useParams();
  const locale = params.locale as string;

  const [creator, setCreator] = useState<{ id: string; displayName?: string | null; shopId?: string | null } | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recommendedProducts, setRecommendedProducts] = useState<RecommendedProduct[]>([]);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showCsBanner, setShowCsBanner] = useState(false);

  const shopUrl = creator?.shopId ? getShopUrl(creator.shopId) : '';

  useEffect(() => {
    // Check CS banner dismiss state
    const dismissed = localStorage.getItem('cnec_cs_banner_dismissed');
    if (!dismissed) setShowCsBanner(true);

    let cancelled = false;
    async function init() {
      const creatorData = await getCreatorSession();
      if (!creatorData || cancelled) {
        if (!cancelled) setLoading(false);
        return;
      }
      setCreator(creatorData as any);

      try {
        const [dashboardStats, productsData] = await Promise.all([
          getCreatorDashboardStats(creatorData.id),
          getPickableProducts(creatorData.id),
        ]);

        if (cancelled) return;
        setStats(dashboardStats);
        setRecommendedProducts(
          (productsData.products as unknown as RecommendedProduct[]).slice(0, 6)
        );
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  const handleQuickAdd = async (product: RecommendedProduct) => {
    if (!creator) return;
    setAddingId(product.id);
    try {
      await addProductToShop(product.id);
      toast.success('내 샵에 추가되었습니다');
      setRecommendedProducts((prev) => prev.filter((p) => p.id !== product.id));
      try { await triggerMissionCheck('FIRST_PRODUCT'); } catch {}
    } catch (error: any) {
      if (error?.message?.includes('Unique')) {
        toast.error('이미 추가된 상품입니다');
        setRecommendedProducts((prev) => prev.filter((p) => p.id !== product.id));
      } else {
        toast.error('추가에 실패했습니다');
      }
    } finally {
      setAddingId(null);
    }
  };

  const dismissCsBanner = () => {
    setShowCsBanner(false);
    localStorage.setItem('cnec_cs_banner_dismissed', 'true');
  };

  const copyShopUrl = () => {
    if (!shopUrl) return;
    navigator.clipboard.writeText(shopUrl);
    setCopied(true);
    toast.success('링크가 복사되었습니다');
    setTimeout(() => setCopied(false), 2000);
  };

  const today = new Date();
  const dateStr = `${today.getMonth() + 1}월 ${today.getDate()}일`;

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  const monthlyEarnings = stats?.totalEarnings ?? 0;
  const todayVisits = stats?.totalVisits ?? 0;
  const monthlyOrders = stats?.totalOrders ?? 0;
  const conversionRate = stats?.conversionRate ?? 0;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Greeting */}
      <div>
        <p className="text-gray-400 text-sm">{dateStr}</p>
        <h1 className="text-xl font-bold text-gray-900 mt-0.5">
          안녕하세요, {(creator as any)?.displayName || '크리에이터'}님
        </h1>
      </div>

      {/* Hero: This month's earnings — one big number */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <p className="text-sm text-gray-500">이번 달 수익</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">
          {formatCurrency(monthlyEarnings, 'KRW')}
        </p>

        {/* Shop URL inline */}
        {creator?.shopId && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-50">
            <Store className="h-4 w-4 text-gray-400 shrink-0" />
            <span className="text-xs text-gray-400 truncate flex-1">{shopUrl}</span>
            <button
              onClick={copyShopUrl}
              className="text-xs text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? '복사됨' : '복사'}
            </button>
            <a
              href={shopUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>

      {/* 3 Small Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <Eye className="h-4 w-4 text-gray-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-900">{todayVisits.toLocaleString()}</p>
          <p className="text-[11px] text-gray-400">오늘 방문</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <ShoppingCart className="h-4 w-4 text-gray-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-900">{monthlyOrders.toLocaleString()}</p>
          <p className="text-[11px] text-gray-400">이번 달 주문</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <TrendingUp className="h-4 w-4 text-gray-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-gray-900">{conversionRate.toFixed(1)}%</p>
          <p className="text-[11px] text-gray-400">전환율</p>
        </div>
      </div>

      {/* Mission Widget */}
      <MissionWidget />

      {/* Recommended Products — horizontal scroll */}
      {recommendedProducts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900">추천 상품</h2>
            <Link
              href={`/${locale}/creator/products`}
              className="text-xs text-gray-400 font-medium flex items-center gap-0.5 hover:text-gray-600 transition-colors"
            >
              전체보기 <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-3 md:overflow-x-visible scrollbar-hide">
            {recommendedProducts.map((product) => {
              const earnings = Math.round(Number(product.salePrice) * Number(product.defaultCommissionRate));
              return (
                <div key={product.id} className="flex-shrink-0 w-[160px] md:w-auto">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="aspect-square bg-gray-50 relative">
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-8 w-8 text-gray-200" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      {product.brand && (
                        <p className="text-[10px] text-gray-400 truncate">{product.brand.brandName}</p>
                      )}
                      <p className="text-xs font-medium text-gray-900 line-clamp-2 mt-0.5 leading-tight min-h-[32px]">{product.name}</p>
                      <p className="text-sm font-bold text-gray-900 mt-1">{formatCurrency(Number(product.salePrice), 'KRW')}</p>
                      <p className="text-xs text-emerald-600 font-semibold mt-0.5">
                        팔면 ₩{earnings.toLocaleString()}
                      </p>
                      <Button
                        className="w-full mt-2 h-9 text-xs bg-gray-900 text-white hover:bg-gray-800 rounded-xl"
                        onClick={() => handleQuickAdd(product)}
                        disabled={addingId === product.id}
                      >
                        {addingId === product.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            내 샵에 추가
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CS Zero Banner */}
      {showCsBanner && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 relative">
          <button
            onClick={dismissCsBanner}
            className="absolute top-3 right-3 text-gray-300 hover:text-gray-500 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          <p className="text-sm font-semibold text-gray-900">CS 걱정 제로</p>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            크넥에서 판매하면 CS 걱정 제로 — 배송·교환·환불 모두 브랜드가 처리해요
          </p>
        </div>
      )}
    </div>
  );
}
