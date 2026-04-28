'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Wallet,
  ShoppingCart,
  Banknote,
  Package,
  Plus,
  ChevronRight,
  Loader2,
  Check,
  X,
  ExternalLink,
  Copy,
  Store,
  ShieldCheck,
  Gift,
  Sparkles,
  TrendingUp,
  ArrowUpRight,
  CircleDollarSign,
  BarChart3,
  Handshake,
  Clock,
  Star,
  Mail,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/i18n/config';
import { BrandBadge } from '@/components/common/BrandBadge';
import { MatchedProductsSection } from '@/components/creator/MatchedProductsSection';
import { SafeImage } from '@/components/common/SafeImage';
import { useCountUp } from '@/lib/hooks/use-count-up';
import { getShopUrl, formatEarnings } from '@/lib/utils/beauty-labels';
import {
  getCreatorSession,
  getCreatorDashboardStats,
  getPickableProducts,
  addProductToShop,
  triggerMissionCheck,
} from '@/lib/actions/creator';
import { getTrialableProducts } from '@/lib/actions/trial';
import { RevenueCard } from '@/components/creator/RevenueCard';

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

interface TrialProduct {
  id: string;
  name: string | null;
  nameKo: string | null;
  thumbnailUrl: string | null;
  imageUrl: string | null;
  images: string[];
  price: string | number | null;
  salePrice: string | number | null;
  volume: string | null;
  brand: { companyName: string | null };
  existingTrial: { id: string; status: string } | null;
}

export default function CreatorDashboardPage() {
  const params = useParams();
  const locale = params.locale as string;

  const [creator, setCreator] = useState<{ id: string; displayName?: string | null; shopId?: string | null } | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recommendedProducts, setRecommendedProducts] = useState<RecommendedProduct[]>([]);
  const [trialProducts, setTrialProducts] = useState<TrialProduct[]>([]);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showCsBanner, setShowCsBanner] = useState(false);

  const shopUrl = creator?.shopId ? getShopUrl(creator.shopId) : '';

  useEffect(() => {
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
        const [dashboardStats, productsData, trialData] = await Promise.all([
          getCreatorDashboardStats(creatorData.id),
          getPickableProducts(creatorData.id),
          getTrialableProducts({ limit: 4 }),
        ]);

        if (cancelled) return;
        setStats(dashboardStats);
        setRecommendedProducts(
          (productsData.products as unknown as RecommendedProduct[]).slice(0, 6)
        );
        setTrialProducts(trialData.products as TrialProduct[]);
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
      toast.success('내 팔로워에게 추천할 상품을 담았어요');
      setRecommendedProducts((prev) => prev.filter((p) => p.id !== product.id));
      try { await triggerMissionCheck('FIRST_PRODUCT'); } catch {}
    } catch (error: any) {
      if (error?.message?.includes('Unique')) {
        toast.error('이미 담긴 상품이에요');
        setRecommendedProducts((prev) => prev.filter((p) => p.id !== product.id));
      } else {
        toast.error('추가하지 못했어요');
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
    toast.success('내 샵 링크가 복사됐어요');
    setTimeout(() => setCopied(false), 2000);
  };

  const today = new Date();
  const dateStr = `${today.getMonth() + 1}월 ${today.getDate()}일`;

  const monthlyEarnings = stats?.totalEarnings ?? 0;
  const todayEarnings = (stats as any)?.todayEarnings ?? 0;
  const monthlyOrders = stats?.totalOrders ?? 0;
  const pendingSettlement = stats?.pendingSettlement ?? 0;
  const nextSettlementDate = (stats as any)?.nextSettlementDate ?? null;

  const animatedMonthly = useCountUp(monthlyEarnings, 800);
  const animatedToday = useCountUp(todayEarnings, 600);

  // Calculate yesterday comparison (mock for now, can be wired to real data)
  const yesterdayEarnings = (stats as any)?.yesterdayEarnings ?? 0;
  const earningsDiff = todayEarnings - yesterdayEarnings;
  const earningsPercent = yesterdayEarnings > 0 ? Math.round((earningsDiff / yesterdayEarnings) * 100) : 0;

  // Matching stats
  const activeGonggu = stats?.activeGonggu ?? 0;
  const activePicks = stats?.activePicks ?? 0;
  const matchingTotal = activeGonggu + activePicks;

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Section 1: Greeting + Date */}
      <div>
        <p className="text-sm text-muted-foreground">
          {dateStr} · 안녕하세요, {(creator as any)?.displayName || '크리에이터'}님
        </p>
      </div>

      {/* Section 2: Big Revenue Number */}
      <div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold font-price">
            {formatCurrency(animatedToday, 'KRW')}
          </span>
          {earningsPercent > 0 && (
            <span className="bg-emerald-50 text-emerald-700 rounded-full px-2 py-0.5 text-xs font-medium">
              <ArrowUpRight className="inline h-3 w-3 -mt-0.5" />+{earningsPercent}%
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          오늘 번 수익
          {earningsDiff > 0 && (
            <span> · 어제보다 {formatCurrency(earningsDiff, 'KRW')} 더 벌었어요</span>
          )}
        </p>
      </div>

      {/* Section 3: Three Metric Cards */}
      <div className="grid grid-cols-3 gap-3">
        {/* 이번달 수익 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="bg-gray-100 rounded-xl w-8 h-8 flex items-center justify-center mb-2">
            <CircleDollarSign className="h-4 w-4 text-gray-600" />
          </div>
          <p className="text-lg font-bold font-price">{formatCurrency(animatedMonthly, 'KRW')}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">이번 달 수익</p>
        </div>

        {/* 이번 달 매출 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="bg-gray-100 rounded-xl w-8 h-8 flex items-center justify-center mb-2">
            <BarChart3 className="h-4 w-4 text-gray-600" />
          </div>
          <p className="text-lg font-bold font-price">{monthlyOrders.toLocaleString()}<span className="text-xs font-normal text-muted-foreground">건</span></p>
          <p className="text-[11px] text-muted-foreground mt-0.5">이번 달 매출</p>
        </div>

        {/* 견적 매칭 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="bg-gray-100 rounded-xl w-8 h-8 flex items-center justify-center mb-2">
            <Handshake className="h-4 w-4 text-gray-600" />
          </div>
          <p className="text-lg font-bold font-price">{activeGonggu}/{matchingTotal > 0 ? matchingTotal : 20}</p>
          <p className="text-xs text-muted-foreground">{formatCurrency(pendingSettlement, 'KRW')}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">견적 매칭</p>
        </div>
      </div>

      {/* Section 4: MY SHOP LINK */}
      {creator?.shopId && (
        <div className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3">
          <span className="text-xs font-semibold text-emerald-600 shrink-0">MY SHOP LINK</span>
          <span className="text-sm text-muted-foreground truncate flex-1">{shopUrl}</span>
          <button
            onClick={copyShopUrl}
            className="shrink-0 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-600" />
            ) : (
              <Copy className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        </div>
      )}

      {/* Section 5: 오늘 할 일 */}
      <div>
        <div className="mb-3">
          <h2 className="text-base font-bold">오늘 할 일</h2>
          <p className="text-xs text-muted-foreground mt-0.5">3가지를 끝내면 수익이 올라가요</p>
        </div>

        <div className="space-y-3">
          {/* 공구 마감 임박 */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-start gap-3 p-4 border-l-4 border-red-500">
              <div className="flex-1 min-w-0">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 mb-1">
                  <Clock className="h-3 w-3" />
                  공구 마감 임박
                </span>
                <p className="text-sm font-medium">누씨오 선로션 공구</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  마감 1시간 전 / 현재 8명 · 10명 달성 시 {formatCurrency(21000, 'KRW')} 추가
                </p>
              </div>
              <Button
                size="sm"
                className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs h-8 px-3"
              >
                지금 공유
              </Button>
            </div>
          </div>

          {/* 체험 도착 */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-start gap-3 p-4 border-l-4 border-purple-500">
              <div className="flex-1 min-w-0">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 mb-1">
                  <Gift className="h-3 w-3" />
                  체험 도착
                </span>
                <p className="text-sm font-medium">유스킨 더마 체험 리뷰 작성하기</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  리뷰 작성 시 +1,500 포인트
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 rounded-xl text-xs h-8 px-3"
              >
                리뷰 쓰기
              </Button>
            </div>
          </div>

          {/* 새 제안 */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-start gap-3 p-4 border-l-4 border-blue-500">
              <div className="flex-1 min-w-0">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 mb-1">
                  <Mail className="h-3 w-3" />
                  새 제안
                </span>
                <p className="text-sm font-medium">누씨오에서 공구 단독 제안이 왔어요</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  예상 수익 {formatCurrency(9800, 'KRW')} · 24시간 내 응답
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 rounded-xl text-xs h-8 px-3"
              >
                제안 보기
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* PPM 매칭 상품 피드 */}
      <MatchedProductsSection locale={locale} />

      {/* 추천 상품 -- 가로 스크롤 */}
      {recommendedProducts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold">추천 상품</h2>
            <Link
              href={`/${locale}/creator/products`}
              className="text-xs text-muted-foreground font-medium flex items-center gap-0.5 hover:text-foreground transition-colors"
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
                    <Link href={`/${locale}/creator/products/${product.id}`} className="block">
                      <div className="aspect-square bg-gray-50 relative overflow-hidden">
                        <SafeImage
                          src={product.images?.[0]}
                          alt={product.name}
                          fill
                          className="object-cover"
                          fallbackClassName="w-full h-full"
                          sizes="160px"
                        />
                      </div>
                      <div className="p-3 pb-0">
                        {product.brand && (
                          <BrandBadge brandName={product.brand.brandName} size="sm" />
                        )}
                        <p className="text-xs font-medium line-clamp-2 mt-0.5 leading-tight min-h-[32px]">{product.name}</p>
                        <p className="text-sm font-price mt-1">{formatCurrency(Number(product.salePrice), 'KRW')}</p>
                        <p className="text-xs text-earnings font-bold mt-0.5">
                          내 수익 ₩{earnings.toLocaleString()}
                        </p>
                      </div>
                    </Link>
                    <div className="p-3 pt-2">
                      <Button
                        className="w-full h-9 text-xs bg-foreground text-white hover:bg-foreground/90 rounded-xl"
                        onClick={() => handleQuickAdd(product)}
                        disabled={addingId === product.id}
                      >
                        {addingId === product.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <>
                            <Plus className="h-3.5 w-3.5 mr-1" />
                            내 샵에 담기
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

      {/* 무료 체험 상품 */}
      {trialProducts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-trust" />
              <h2 className="text-base font-bold">무료 체험 상품</h2>
            </div>
            <Link
              href={`/${locale}/creator/trial`}
              className="text-xs text-muted-foreground font-medium flex items-center gap-0.5 hover:text-foreground transition-colors"
            >
              전체보기 <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {trialProducts.map((product) => {
              const imgSrc = product.thumbnailUrl || product.imageUrl || product.images?.[0];
              const price = product.salePrice ?? product.price;
              const priceNum = price ? Number(price) : 0;
              return (
                <Link
                  key={product.id}
                  href={`/${locale}/creator/trial`}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                >
                  <div className="aspect-[4/3] bg-gray-50 relative overflow-hidden">
                    <SafeImage
                      src={imgSrc}
                      alt={product.nameKo || product.name || ''}
                      fill
                      className="object-cover"
                      fallbackClassName="w-full h-full"
                      sizes="(max-width: 768px) 50vw, 200px"
                    />
                    {product.existingTrial && (
                      <span className="absolute top-2 left-2 chip chip-trust text-[10px]">
                        {product.existingTrial.status === 'pending' ? '신청중' : '진행중'}
                      </span>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-[10px] text-muted-foreground">{product.brand.companyName}</p>
                    <p className="text-xs font-medium line-clamp-1 mt-0.5">{product.nameKo || product.name}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {priceNum > 0 && (
                        <span className="text-xs font-price">
                          {formatCurrency(priceNum, 'KRW')}
                        </span>
                      )}
                      {product.volume && (
                        <span className="text-[10px] text-muted-foreground">{product.volume}</span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* CS Zero 배너 */}
      {showCsBanner && (
        <div className="bg-muted rounded-2xl border border-gray-100 p-5 relative">
          <button
            onClick={dismissCsBanner}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-start gap-3">
            <div className="bg-trust/10 rounded-xl p-2 shrink-0">
              <ShieldCheck className="h-5 w-5 text-trust" />
            </div>
            <div>
              <p className="text-sm font-bold">추천만 하세요. CS는 크넥이 관리해요</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                배송·교환·환불 모두 브랜드가 직접 처리. 크리에이터님은 추천에만 집중하세요.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
