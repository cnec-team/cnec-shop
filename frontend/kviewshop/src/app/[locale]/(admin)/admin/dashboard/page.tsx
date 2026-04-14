'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Building2, Users, DollarSign, ShoppingCart, Megaphone, TrendingUp,
  ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { getAdminDashboardStats, getAdminDashboardCharts } from '@/lib/actions/admin';
import dynamic from 'next/dynamic';

const DashboardCharts = dynamic(() => import('@/components/admin/DashboardCharts'), { ssr: false });

type Period = '7d' | '30d' | '90d';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalBrands: 0,
    totalCreators: 0,
    totalOrders: 0,
    totalGMV: 0,
    activeCampaigns: 0,
    pendingSettlements: 0,
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('30d');
  const [comparison, setComparison] = useState<{ prevGMV: number; prevOrderCount: number; currentGMV: number; currentOrderCount: number } | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [data, chartData] = await Promise.all([
          getAdminDashboardStats(),
          getAdminDashboardCharts(period),
        ]);
        setStats(data);
        setComparison((chartData as { comparison: typeof comparison }).comparison);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
      setLoading(false);
    }
    fetchStats();
  }, [period]);

  const formatKRW = (amount: number) =>
    new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', minimumFractionDigits: 0 }).format(amount);

  function getChange(current: number, previous: number): { value: string; positive: boolean } | null {
    if (previous === 0) return current > 0 ? { value: '+100%', positive: true } : null;
    const change = ((current - previous) / previous) * 100;
    return { value: `${change >= 0 ? '+' : ''}${change.toFixed(0)}%`, positive: change >= 0 };
  }

  const gmvChange = comparison ? getChange(comparison.currentGMV, comparison.prevGMV) : null;
  const orderChange = comparison ? getChange(comparison.currentOrderCount, comparison.prevOrderCount) : null;

  const statCards = [
    { label: '총 거래액 (GMV)', value: formatKRW(stats.totalGMV), icon: DollarSign, desc: '전체 누적 매출', change: gmvChange },
    { label: '총 주문', value: stats.totalOrders.toString(), icon: ShoppingCart, desc: '전체 주문 건수', change: orderChange },
    { label: '입점 브랜드', value: stats.totalBrands.toString(), icon: Building2, desc: '등록된 브랜드', change: null },
    { label: '활성 크리에이터', value: stats.totalCreators.toString(), icon: Users, desc: '등록된 크리에이터', change: null },
    { label: '진행 중 캠페인', value: stats.activeCampaigns.toString(), icon: Megaphone, desc: '모집중 + 진행중', change: null },
    { label: '미정산 건', value: stats.pendingSettlements.toString(), icon: TrendingUp, desc: '정산 대기 중', change: null },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold">크넥 어드민</h1>
        <p className="text-muted-foreground">플랫폼 전체 현황을 확인합니다</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map(card => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{card.value}</span>
                    {card.change && (
                      <span className={`flex items-center text-xs font-medium ${card.change.positive ? 'text-green-600' : 'text-red-500'}`}>
                        {card.change.positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {card.change.value}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{card.desc}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Period Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">기간:</span>
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {([['7d', '7일'], ['30d', '30일'], ['90d', '90일']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${period === key ? 'bg-background text-foreground shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Charts */}
      <DashboardCharts period={period} />
    </div>
  );
}
