'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Building2,
  Users,
  DollarSign,
  ShoppingCart,
  Megaphone,
  TrendingUp,
} from 'lucide-react';
import { getAdminDashboardStats } from '@/lib/actions/admin';

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

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await getAdminDashboardStats();
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
      setLoading(false);
    }
    fetchStats();
  }, []);

  const formatKRW = (amount: number) =>
    new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', minimumFractionDigits: 0 }).format(amount);

  const statCards = [
    { label: '총 거래액 (GMV)', value: formatKRW(stats.totalGMV), icon: DollarSign, desc: '전체 누적 매출' },
    { label: '총 주문', value: stats.totalOrders.toString(), icon: ShoppingCart, desc: '전체 주문 건수' },
    { label: '입점 브랜드', value: stats.totalBrands.toString(), icon: Building2, desc: '등록된 브랜드' },
    { label: '활성 크리에이터', value: stats.totalCreators.toString(), icon: Users, desc: '등록된 크리에이터' },
    { label: '진행 중 캠페인', value: stats.activeCampaigns.toString(), icon: Megaphone, desc: '모집중 + 진행중' },
    { label: '미정산 건', value: stats.pendingSettlements.toString(), icon: TrendingUp, desc: '정산 대기 중' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold">크넥 어드민</h1>
        <p className="text-muted-foreground">플랫폼 전체 현황을 확인합니다</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => (
          <Card key={card.label} className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{card.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{card.desc}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Getting Started */}
      <Card>
        <CardHeader>
          <CardTitle>크넥 커머스 시작하기</CardTitle>
          <CardDescription>크리에이터 셀렉트샵 플랫폼의 운영 구조</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">1</div>
            <div>
              <p className="font-medium">브랜드 → 상품 등록 + 캠페인 생성</p>
              <p className="text-sm text-muted-foreground">브랜드가 상품을 등록하고 공구/상시 캠페인을 생성합니다</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">2</div>
            <div>
              <p className="font-medium">크리에이터 → 셀렉트샵 운영 + SNS 홍보</p>
              <p className="text-sm text-muted-foreground">크리에이터가 상품을 선택하여 내 셀렉트샵에 추가하고 팔로워에게 홍보합니다</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">3</div>
            <div>
              <p className="font-medium">팔로워 → 크리에이터 샵에서 구매</p>
              <p className="text-sm text-muted-foreground">팔로워가 크리에이터 셀렉트샵에서 상품을 구매합니다 (크넥 PG 결제)</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">4</div>
            <div>
              <p className="font-medium">크넥 → 전환 추적 + 수수료 정산</p>
              <p className="text-sm text-muted-foreground">직접 전환 + 간접 전환(3%) 추적, 매월 20일 크리에이터에게 정산합니다</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
