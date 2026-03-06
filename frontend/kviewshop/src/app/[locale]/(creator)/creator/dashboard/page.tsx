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
import { useAuthStore } from '@/lib/store/auth';
import { getClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/i18n/config';
import type { CreatorDashboardStats, CreatorGrade } from '@/types/database';
import { GRADE_LABELS } from '@/types/database';
import { MissionWidget } from '@/components/creator/MissionWidget';

export default function CreatorDashboardPage() {
  const params = useParams();
  const locale = params.locale as string;
  const { creator, isLoading: authLoading } = useAuthStore();

  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<CreatorDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [pointBalance, setPointBalance] = useState(0);
  const [grade, setGrade] = useState<CreatorGrade>('ROOKIE');

  const shopUrl = creator?.shop_id ? `https://shop.cnec.kr/${creator.shop_id}` : '';

  useEffect(() => {
    if (authLoading) return;
    if (!creator) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchStats() {
      try {
        const supabase = getClient();

        // Fetch aggregated stats for the creator
        const [visitsRes, conversionsRes, settlementsRes] = await Promise.all([
          supabase
            .from('shop_visits')
            .select('id', { count: 'exact', head: true })
            .eq('creator_id', creator!.id),
          supabase
            .from('conversions')
            .select('*')
            .eq('creator_id', creator!.id)
            .eq('status', 'CONFIRMED'),
          supabase
            .from('settlements')
            .select('*')
            .eq('creator_id', creator!.id)
            .eq('status', 'PENDING'),
        ]);

        if (cancelled) return;

        const totalVisits = visitsRes.count ?? 0;
        const conversions = conversionsRes.data ?? [];
        const pendingSettlements = settlementsRes.data ?? [];

        const totalOrders = conversions.length;
        const totalRevenue = conversions.reduce((sum, c) => sum + c.order_amount, 0);
        const totalEarnings = conversions.reduce((sum, c) => sum + c.commission_amount, 0);
        const conversionRate = totalVisits > 0 ? (totalOrders / totalVisits) * 100 : 0;
        const pendingSettlement = pendingSettlements.reduce((sum, s) => sum + s.net_amount, 0);

        setStats({
          total_visits: totalVisits,
          total_orders: totalOrders,
          total_revenue: totalRevenue,
          total_earnings: totalEarnings,
          conversion_rate: conversionRate,
          pending_settlement: pendingSettlement,
          active_gonggu: 0,
          active_picks: 0,
        });
        // Fetch points and grade in parallel
        const { data: { session } } = await supabase.auth.getSession();
        if (session && !cancelled) {
          const [pointsRes, gradeRes] = await Promise.all([
            fetch('/api/creator/points?limit=1', { headers: { 'Authorization': `Bearer ${session.access_token}` } }),
            fetch('/api/creator/grade', { headers: { 'Authorization': `Bearer ${session.access_token}` } }),
          ]);
          if (pointsRes.ok) {
            const pd = await pointsRes.json();
            if (!cancelled) setPointBalance(pd.balance ?? 0);
          }
          if (gradeRes.ok) {
            const gd = await gradeRes.json();
            if (!cancelled) setGrade(gd.grade ?? 'ROOKIE');
          }
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchStats();
    return () => { cancelled = true; };
  }, [authLoading, creator]);

  const copyShopUrl = () => {
    if (!shopUrl) return;
    navigator.clipboard.writeText(shopUrl);
    setCopied(true);
    toast.success('링크가 복사되었습니다');
    setTimeout(() => setCopied(false), 2000);
  };

  if (authLoading || loading) {
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
      {creator?.shop_id && (
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
                <p className="text-lg font-bold">{formatCurrency(pointBalance, locale)}</p>
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
              {(stats?.total_visits ?? 0).toLocaleString()}
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
              {(stats?.total_orders ?? 0).toLocaleString()}
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
              {(stats?.conversion_rate ?? 0).toFixed(1)}%
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
              {formatCurrency(stats?.total_revenue ?? 0, 'KRW')}
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
              {formatCurrency(stats?.pending_settlement ?? 0, 'KRW')}
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
