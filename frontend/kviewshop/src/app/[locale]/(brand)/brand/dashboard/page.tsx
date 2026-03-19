'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getBrandDashboardData, getBrandSession } from '@/lib/actions/brand';
import { CAMPAIGN_STATUS_LABELS } from '@/types/database';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Megaphone,
  Users,
  Package,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';

interface DashboardData {
  stats: {
    totalVisits: number;
    totalOrders: number;
    totalRevenue: number;
    totalCommission: number;
    conversionRate: number;
    activeCampaigns: number;
    activeCreators: number;
    productCount: number;
  };
  activeGonggu: {
    title: string;
    status: string;
    soldCount: number;
    totalStock: number | null;
    endAt: string | null;
    targetParticipants: number | null;
  } | null;
  creatorRankings: Array<{
    creator: { id: string; displayName: string | null };
    totalSales: number;
    orderCount: number;
  }>;
}

function formatNumber(num: number): string {
  return num.toLocaleString('ko-KR');
}

function formatCurrency(num: number): string {
  if (num >= 10000) {
    return `${(num / 10000).toFixed(1)}만원`;
  }
  return `${formatNumber(num)}원`;
}

function formatCurrencyFull(num: number): string {
  return `${formatNumber(num)}원`;
}

function OnboardingChecklist({ stats }: { stats: DashboardData['stats'] }) {
  const steps = [
    { label: '계정 생성 완료', done: true, href: '#' },
    { label: '브랜드 정보 입력', done: true, href: '../brand/settings', cta: '설정하기' },
    { label: '첫 상품 등록', done: stats.productCount > 0, href: '../brand/products/new', cta: '상품 등록' },
    { label: '첫 캠페인 생성', done: stats.activeCampaigns > 0, href: '../brand/campaigns/new', cta: '캠페인 만들기' },
    { label: '크리에이터 첫 승인', done: stats.activeCreators > 0, href: '../brand/creators/pending', cta: '확인하기' },
  ];
  const completed = steps.filter((s) => s.done).length;
  const progressPercent = (completed / steps.length) * 100;

  if (completed >= steps.length) return null;

  return (
    <Card className="border-primary/20 bg-primary/[0.02]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">시작 가이드</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {completed}/{steps.length} 완료
          </Badge>
        </div>
        <CardDescription>
          모두 완료하면 크리에이터에게 상품이 노출됩니다
        </CardDescription>
        <Progress value={progressPercent} className="mt-2 h-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {steps.map((step, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-accent/50"
            >
              <div className="flex items-center gap-3">
                {step.done ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-muted-foreground/30 text-[10px] text-muted-foreground">
                    {i + 1}
                  </div>
                )}
                <span className={step.done ? 'text-sm text-muted-foreground line-through' : 'text-sm font-medium'}>
                  {step.label}
                </span>
              </div>
              {!step.done && step.cta && (
                <Link href={step.href}>
                  <Button size="sm" variant="outline" className="h-7 text-xs">
                    {step.cta}
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function StatsCardSkeleton() {
  return (
    <Card className="bg-white">
      <CardContent className="p-5">
        <Skeleton className="h-4 w-20 mb-3" />
        <Skeleton className="h-8 w-28" />
      </CardContent>
    </Card>
  );
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

export default function BrandDashboardPage() {
  const [brand, setBrand] = useState<{ id: string; brandName?: string | null } | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const brandData = await getBrandSession();
        if (!brandData) {
          setIsLoading(false);
          return;
        }
        setBrand(brandData as any);

        const dashboardData = await getBrandDashboardData(brandData.id);
        setData(dashboardData as any);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, []);

  if (!isLoading && !brand?.id) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">대시보드</h1>
        <Card className="bg-white">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">브랜드 정보를 불러올 수 없습니다.</p>
            <p className="mt-2 text-sm text-muted-foreground">로그인 상태를 확인해주세요.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatsCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="bg-white">
            <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
            <CardContent><TableSkeleton rows={5} /></CardContent>
          </Card>
          <Card className="bg-white">
            <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
            <CardContent><TableSkeleton rows={5} /></CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const stats = data?.stats;
  const activeGonggu = data?.activeGonggu;
  const creatorRankings = data?.creatorRankings ?? [];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">대시보드</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {brand?.brandName ?? '브랜드'}의 운영 현황을 한눈에 확인하세요
          </p>
        </div>
      </div>

      {/* Onboarding checklist - only show when products = 0 */}
      {stats && stats.productCount === 0 && (
        <OnboardingChecklist stats={stats} />
      )}

      {/* Key metrics - 2x2 grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground font-medium">오늘 주문</p>
              <ShoppingCart className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold tracking-tight">
              {formatNumber(stats?.totalOrders ?? 0)}
              <span className="text-sm font-normal text-muted-foreground ml-1">건</span>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground font-medium">이번 달 매출</p>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold tracking-tight">
              {formatCurrency(stats?.totalRevenue ?? 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground font-medium">진행중 캠페인</p>
              <Megaphone className="h-4 w-4 text-purple-500" />
            </div>
            <p className="text-2xl font-bold tracking-tight">
              {formatNumber(stats?.activeCampaigns ?? 0)}
              <span className="text-sm font-normal text-muted-foreground ml-1">개</span>
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground font-medium">활성 크리에이터</p>
              <Users className="h-4 w-4 text-orange-500" />
            </div>
            <p className="text-2xl font-bold tracking-tight">
              {formatNumber(stats?.activeCreators ?? 0)}
              <span className="text-sm font-normal text-muted-foreground ml-1">명</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Middle section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Real-time Gonggu */}
        <Card className="bg-white rounded-xl border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">실시간 공구 현황</CardTitle>
              <Link href="campaigns/gonggu">
                <Button variant="ghost" size="sm" className="text-xs h-7">
                  전체 보기 <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {activeGonggu ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold">{activeGonggu.title}</p>
                    <Badge
                      className={
                        activeGonggu.status === 'ACTIVE'
                          ? 'bg-green-500/10 text-green-600 border-green-200'
                          : activeGonggu.status === 'RECRUITING'
                            ? 'bg-blue-500/10 text-blue-600 border-blue-200'
                            : ''
                      }
                      variant="outline"
                    >
                      {CAMPAIGN_STATUS_LABELS[activeGonggu.status as keyof typeof CAMPAIGN_STATUS_LABELS]}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">판매 진행률</span>
                    <span className="font-medium">
                      {formatNumber(activeGonggu.soldCount)} / {formatNumber(activeGonggu.totalStock ?? 0)}
                    </span>
                  </div>
                  <Progress
                    value={activeGonggu.totalStock ? (activeGonggu.soldCount / activeGonggu.totalStock) * 100 : 0}
                    className="h-2"
                  />
                </div>

                {activeGonggu.endAt && (
                  <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2">
                    <span className="text-xs text-muted-foreground">종료</span>
                    <span className="text-xs font-medium">
                      {new Date(activeGonggu.endAt).toLocaleDateString('ko-KR', {
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Megaphone className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground mb-1">
                  진행 중인 공구 캠페인이 없어요
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  공구 캠페인으로 크리에이터와 함께 판매해보세요
                </p>
                <Link href="campaigns/new">
                  <Button size="sm" variant="outline">
                    캠페인 만들기
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Creator Rankings TOP 5 */}
        <Card className="bg-white rounded-xl border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">크리에이터 TOP 5</CardTitle>
              <Link href="creators">
                <Button variant="ghost" size="sm" className="text-xs h-7">
                  전체 보기 <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
            <CardDescription className="text-xs">누적 매출 기준</CardDescription>
          </CardHeader>
          <CardContent>
            {creatorRankings.length > 0 ? (
              <div className="space-y-3">
                {creatorRankings.slice(0, 5).map((ranking, index) => (
                  <div key={ranking.creator.id} className="flex items-center gap-3">
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-100 text-gray-600' :
                      index === 2 ? 'bg-orange-50 text-orange-600' :
                      'bg-gray-50 text-gray-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{ranking.creator.displayName}</p>
                      <p className="text-xs text-muted-foreground">{formatNumber(ranking.orderCount)}건</p>
                    </div>
                    <p className="text-sm font-semibold">{formatCurrencyFull(ranking.totalSales)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <Users className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">
                  아직 매출 데이터가 없습니다
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom section - additional stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="bg-white rounded-xl border shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">방문수</p>
            <p className="text-lg font-bold">{formatNumber(stats?.totalVisits ?? 0)}</p>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl border shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">전환율</p>
            <p className="text-lg font-bold">{stats?.conversionRate ?? 0}%</p>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl border shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">수수료</p>
            <p className="text-lg font-bold">{formatCurrency(stats?.totalCommission ?? 0)}</p>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl border shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">등록 상품</p>
            <p className="text-lg font-bold">{formatNumber(stats?.productCount ?? 0)}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
