'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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

export default function CreatorDashboardPage() {
  const params = useParams();
  const locale = params.locale as string;

  const [creator, setCreator] = useState<{ id: string; shopId?: string | null } | null>(null);
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [pointBalance, setPointBalance] = useState(0);
  const [grade, setGrade] = useState<CreatorGrade>('ROOKIE');

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
        const [dashboardStats, balance, gradeData] = await Promise.all([
          getCreatorDashboardStats(creatorData.id),
          getCreatorPointBalance(),
          getCreatorGradeData(),
        ]);

        if (cancelled) return;

        setStats(dashboardStats);
        setPointBalance(balance);
        setGrade((gradeData.grade as CreatorGrade) ?? 'ROOKIE');
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">크리에이터 대시보드</h1>
        <p className="text-sm text-muted-foreground">내 샵의 현황을 한눈에 확인하세요</p>
      </div>

      {/* Shop URL Banner */}
      {creator?.shopId && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Store className="h-6 w-6 sm:h-8 sm:w-8 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground">내 샵 링크</p>
                  <p className="font-mono text-xs sm:text-sm text-primary truncate">{shopUrl}</p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={copyShopUrl} className="text-xs">
                  {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                  링크 복사
                </Button>
                <Button variant="outline" size="sm" asChild className="text-xs">
                  <a href={shopUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    샵 보기
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Points & Grade */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Link href={`/${locale}/creator/points`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <Coins className="h-6 w-6 text-primary shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">포인트 잔액</p>
                <p className="text-lg font-bold">{formatCurrency(pointBalance, 'KRW')}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href={`/${locale}/creator/grade`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <Medal className="h-6 w-6 text-amber-500 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">내 등급</p>
                <p className="text-lg font-bold">{GRADE_LABELS[grade]}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Mission Widget */}
      <MissionWidget />

      {/* Stats Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-6 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">방문수</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold">
              {(stats?.totalVisits ?? 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-6 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">판매건수</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold">
              {(stats?.totalOrders ?? 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-6 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">전환율</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold">
              {(stats?.conversionRate ?? 0).toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-6 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">판매금액</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold text-primary">
              {formatCurrency(stats?.totalRevenue ?? 0, 'KRW')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-6 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">정산 예정 금액</CardTitle>
            <Wallet className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold text-warning">
              {formatCurrency(stats?.pendingSettlement ?? 0, 'KRW')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
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
