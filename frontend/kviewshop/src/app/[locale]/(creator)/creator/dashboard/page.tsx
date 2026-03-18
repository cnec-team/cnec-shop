'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Copy,
  Check,
  ExternalLink,
  Store,
  Eye,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Wallet,
  Package,
  Palette,
  BarChart3,
  Coins,
  Medal,
  Plus,
  ChevronRight,
  Megaphone,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/i18n/config';
import { GRADE_LABELS } from '@/types/database';
import { MissionWidget } from '@/components/creator/MissionWidget';
import {
  getCreatorSession,
  getCreatorDashboardStats,
  getCreatorPointBalance,
  getCreatorGradeData,
  getPickableProducts,
  addProductToShop,
  triggerMissionCheck,
} from '@/lib/actions/creator';

type CreatorGrade = 'ROOKIE' | 'SILVER' | 'GOLD' | 'PLATINUM';

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

  const [creator, setCreator] = useState<{ id: string; shopId?: string | null } | null>(null);
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [pointBalance, setPointBalance] = useState(0);
  const [grade, setGrade] = useState<CreatorGrade>('ROOKIE');
  const [recommendedProducts, setRecommendedProducts] = useState<RecommendedProduct[]>([]);
  const [addingId, setAddingId] = useState<string | null>(null);

  const shopUrl = creator?.shopId ? `https://shop.cnec.kr/${creator.shopId}` : '';

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const creatorData = await getCreatorSession();
      if (!creatorData || cancelled) {
        if (!cancelled) setLoading(false);
        return;
      }
      setCreator(creatorData as any);

      try {
        const [dashboardStats, balance, gradeData, productsData] = await Promise.all([
          getCreatorDashboardStats(creatorData.id),
          getCreatorPointBalance(),
          getCreatorGradeData(),
          getPickableProducts(creatorData.id),
        ]);

        if (cancelled) return;

        setStats(dashboardStats);
        setPointBalance(balance);
        setGrade((gradeData.grade as CreatorGrade) ?? 'ROOKIE');
        // Take first 6 products as recommendations
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

  const copyShopUrl = () => {
    if (!shopUrl) return;
    navigator.clipboard.writeText(shopUrl);
    setCopied(true);
    toast.success('링크가 복사되었습니다');
    setTimeout(() => setCopied(false), 2000);
  };

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

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  const statItems = [
    { label: '오늘 방문', value: (stats?.totalVisits ?? 0).toLocaleString(), icon: Eye, color: 'text-blue-500' },
    { label: '오늘 주문', value: (stats?.totalOrders ?? 0).toLocaleString(), icon: ShoppingCart, color: 'text-green-500' },
    { label: '이번 달 수익', value: formatCurrency(stats?.totalRevenue ?? 0, 'KRW'), icon: DollarSign, color: 'text-primary' },
    { label: '포인트', value: formatCurrency(pointBalance, 'KRW'), icon: Coins, color: 'text-amber-500' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Shop URL Banner - compact on mobile */}
      {creator?.shopId && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Store className="h-5 w-5 text-primary shrink-0" />
                <div className="min-w-0 hidden sm:block">
                  <p className="font-mono text-xs text-primary truncate">{shopUrl}</p>
                </div>
                <span className="text-sm font-medium text-primary sm:hidden">내 샵</span>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <Button variant="outline" size="sm" onClick={copyShopUrl} className="h-8 text-xs px-2.5">
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span className="ml-1 hidden sm:inline">링크 복사</span>
                </Button>
                <Button variant="outline" size="sm" asChild className="h-8 text-xs px-2.5">
                  <a href={shopUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span className="ml-1 hidden sm:inline">샵 보기</span>
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid - 2x2 on mobile */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
        {statItems.map((item) => (
          <Card key={item.label} className="overflow-hidden">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-1">
                <item.icon className={`h-4 w-4 ${item.color} shrink-0`} />
                <span className="text-[11px] sm:text-xs text-muted-foreground truncate">{item.label}</span>
              </div>
              <p className="text-base sm:text-xl font-bold truncate">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Grade Badge */}
      <div className="flex items-center gap-3">
        <Link href={`/${locale}/creator/grade`} className="flex items-center gap-2 px-3 py-2 rounded-full bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors">
          <Medal className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-medium">{GRADE_LABELS[grade]}</span>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        </Link>
        <Link href={`/${locale}/creator/sales`} className="flex items-center gap-2 px-3 py-2 rounded-full bg-muted hover:bg-muted/80 transition-colors">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">판매 현황</span>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        </Link>
      </div>

      {/* Active Gonggu Campaign Banner */}
      {stats?.activeGonggu && stats.activeGonggu > 0 && (
        <Link href={`/${locale}/creator/campaigns`}>
          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800 hover:shadow-md transition-shadow">
            <CardContent className="p-3 sm:p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                  <Megaphone className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold">진행중인 공구 캠페인</p>
                  <p className="text-xs text-muted-foreground">{stats.activeGonggu}개 캠페인 모집중</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Mission Widget */}
      <MissionWidget />

      {/* Recommended Products - Horizontal Scroll on mobile */}
      {recommendedProducts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base sm:text-lg font-bold">추천 상품</h2>
            <Link
              href={`/${locale}/creator/products`}
              className="text-xs text-primary font-medium flex items-center gap-0.5"
            >
              전체보기 <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 lg:grid-cols-6 sm:overflow-x-visible scrollbar-hide">
            {recommendedProducts.map((product) => (
              <div
                key={product.id}
                className="flex-shrink-0 w-[140px] sm:w-auto"
              >
                <Card className="overflow-hidden h-full">
                  <div className="aspect-square bg-muted relative">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                    )}
                    <Badge className="absolute top-1.5 left-1.5 bg-primary text-white text-[10px] px-1.5 py-0.5">
                      내 수익 {formatCurrency(Math.round(product.salePrice * product.defaultCommissionRate), 'KRW')}
                    </Badge>
                  </div>
                  <CardContent className="p-2.5">
                    {product.brand && (
                      <p className="text-[10px] text-muted-foreground truncate">{product.brand.brandName}</p>
                    )}
                    <p className="text-xs font-medium line-clamp-2 mt-0.5 leading-tight">{product.name}</p>
                    <p className="text-sm font-bold mt-1">{formatCurrency(product.salePrice, 'KRW')}</p>
                    <Button
                      size="sm"
                      className="w-full mt-2 h-8 text-xs"
                      onClick={() => handleQuickAdd(product)}
                      disabled={addingId === product.id}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      내 샵에 추가
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions - Desktop */}
      <Card className="hidden sm:block">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">빠른 작업</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 grid gap-3 grid-cols-1 sm:grid-cols-3">
          <Button variant="outline" className="justify-start h-12 text-sm" asChild>
            <Link href={`/${locale}/creator/products`}>
              <Package className="mr-3 h-5 w-5 text-primary" />
              상품 추가
            </Link>
          </Button>
          <Button variant="outline" className="justify-start h-12 text-sm" asChild>
            <Link href={`/${locale}/creator/shop`}>
              <Palette className="mr-3 h-5 w-5 text-primary" />
              샵 꾸미기
            </Link>
          </Button>
          <Button variant="outline" className="justify-start h-12 text-sm" asChild>
            <Link href={`/${locale}/creator/sales`}>
              <BarChart3 className="mr-3 h-5 w-5 text-primary" />
              수익 확인
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
