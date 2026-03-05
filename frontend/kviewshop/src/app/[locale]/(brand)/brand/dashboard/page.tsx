'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/auth';
import type {
  BrandDashboardStats,
  Campaign,
  Creator,
} from '@/types/database';
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

interface CreatorRanking {
  creator: Creator;
  totalSales: number;
  orderCount: number;
}

function formatNumber(num: number): string {
  return num.toLocaleString('ko-KR');
}

function formatCurrency(num: number): string {
  return `${formatNumber(num)}원`;
}

function StatsCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-20" />
      </CardHeader>
      <CardContent>
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
  const { brand, isLoading: authLoading } = useAuthStore();
  const [stats, setStats] = useState<BrandDashboardStats | null>(null);
  const [activeGonggu, setActiveGonggu] = useState<Campaign | null>(null);
  const [creatorRankings, setCreatorRankings] = useState<CreatorRanking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!brand?.id) {
      if (!authLoading) {
        setIsLoading(false);
      }
      return;
    }

    async function fetchDashboardData() {
      const supabase = getClient();
      const brandId = brand!.id;

      try {
        // 1. Get brand's campaign IDs
        const { data: brandCampaigns } = await supabase
          .from('campaigns')
          .select('id, type, status, title, description, start_at, end_at, sold_count, total_stock, target_participants, commission_rate, recruitment_type, brand_id, created_at')
          .eq('brand_id', brandId);

        const campaignIds = (brandCampaigns ?? []).map((c) => c.id);

        // 2. Get brand's order IDs
        const { data: brandOrders } = await supabase
          .from('orders')
          .select('id, total_amount, status, creator_id')
          .eq('brand_id', brandId);

        const orders = brandOrders ?? [];
        const orderIds = orders.map((o) => o.id);

        // 3. Get products count
        const { count: productCount } = await supabase
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('brand_id', brandId)
          .eq('status', 'ACTIVE');

        // 4. Get active participations (unique creators)
        const { data: participations } = await supabase
          .from('campaign_participations')
          .select('creator_id')
          .eq('status', 'APPROVED')
          .in('campaign_id', campaignIds.length > 0 ? campaignIds : ['__none__']);

        const uniqueCreatorIds = new Set(
          (participations ?? []).map((p) => p.creator_id)
        );

        // 5. Get total commission
        const { data: conversions } = await supabase
          .from('conversions')
          .select('commission_amount')
          .eq('status', 'CONFIRMED')
          .in('order_id', orderIds.length > 0 ? orderIds : ['__none__']);

        const totalCommission = (conversions ?? []).reduce(
          (sum, c) => sum + (c.commission_amount || 0),
          0
        );

        // 6. Get visits count for creators associated with this brand's campaigns
        const creatorIdArr = Array.from(uniqueCreatorIds);
        let totalVisits = 0;
        if (creatorIdArr.length > 0) {
          const { count } = await supabase
            .from('shop_visits')
            .select('id', { count: 'exact', head: true })
            .in('creator_id', creatorIdArr);
          totalVisits = count ?? 0;
        }

        // Calculate stats
        const totalRevenue = orders
          .filter((o) => o.status !== 'CANCELLED')
          .reduce((sum, o) => sum + (o.total_amount || 0), 0);
        const totalOrders = orders.filter((o) => o.status !== 'CANCELLED').length;
        const activeCampaigns = (brandCampaigns ?? []).filter(
          (c) => c.status === 'ACTIVE' || c.status === 'RECRUITING'
        ).length;

        setStats({
          total_visits: totalVisits,
          total_orders: totalOrders,
          total_revenue: totalRevenue,
          total_commission: totalCommission,
          conversion_rate:
            totalVisits > 0
              ? Math.round((totalOrders / totalVisits) * 10000) / 100
              : 0,
          active_campaigns: activeCampaigns,
          active_creators: uniqueCreatorIds.size,
          product_count: productCount ?? 0,
        });

        // Active gonggu campaign
        const gongguCampaign = (brandCampaigns ?? []).find(
          (c) => c.type === 'GONGGU' && c.status === 'ACTIVE'
        );
        if (gongguCampaign) {
          setActiveGonggu(gongguCampaign as Campaign);
        }

        // Creator sales ranking from orders
        const creatorSalesMap = new Map<
          string,
          { totalSales: number; orderCount: number }
        >();
        for (const order of orders) {
          if (order.status !== 'CANCELLED' && order.creator_id) {
            const existing = creatorSalesMap.get(order.creator_id) ?? {
              totalSales: 0,
              orderCount: 0,
            };
            existing.totalSales += order.total_amount || 0;
            existing.orderCount += 1;
            creatorSalesMap.set(order.creator_id, existing);
          }
        }

        const topCreatorIds = Array.from(creatorSalesMap.entries())
          .sort((a, b) => b[1].totalSales - a[1].totalSales)
          .slice(0, 10)
          .map(([id]) => id);

        if (topCreatorIds.length > 0) {
          const { data: creators } = await supabase
            .from('creators')
            .select('*')
            .in('id', topCreatorIds);

          const rankings: CreatorRanking[] = (creators ?? [])
            .map((creator) => ({
              creator: creator as Creator,
              ...(creatorSalesMap.get(creator.id) ?? {
                totalSales: 0,
                orderCount: 0,
              }),
            }))
            .sort((a, b) => b.totalSales - a.totalSales);

          setCreatorRankings(rankings);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, [brand?.id, authLoading]);

  if (!isLoading && !brand?.id) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">대시보드</h1>
        <Card>
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
        <h1 className="text-2xl font-bold">대시보드</h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <StatsCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent>
              <TableSkeleton rows={5} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent>
              <TableSkeleton rows={5} />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">대시보드</h1>
        <p className="text-sm text-muted-foreground">
          {brand?.brand_name ?? '브랜드'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>방문수</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatNumber(stats?.total_visits ?? 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>주문수</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatNumber(stats?.total_orders ?? 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>전환율</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {stats?.conversion_rate ?? 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>매출</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(stats?.total_revenue ?? 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>커미션</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(stats?.total_commission ?? 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>진행중 캠페인</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatNumber(stats?.active_campaigns ?? 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>활동 크리에이터</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatNumber(stats?.active_creators ?? 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>등록 상품</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatNumber(stats?.product_count ?? 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Real-time Gonggu Dashboard */}
        <Card>
          <CardHeader>
            <CardTitle>실시간 공구 현황</CardTitle>
            <CardDescription>
              현재 진행 중인 공구 캠페인의 실시간 상태
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeGonggu ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold">{activeGonggu.title}</p>
                    <Badge variant="secondary">
                      {CAMPAIGN_STATUS_LABELS[activeGonggu.status]}
                    </Badge>
                  </div>
                  <Link href="campaigns/gonggu">
                    <Button variant="outline" size="sm">
                      상세보기
                    </Button>
                  </Link>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>판매 진행률</span>
                    <span>
                      {formatNumber(activeGonggu.sold_count)} /{' '}
                      {formatNumber(activeGonggu.total_stock ?? 0)}
                    </span>
                  </div>
                  <Progress
                    value={
                      activeGonggu.total_stock
                        ? (activeGonggu.sold_count / activeGonggu.total_stock) *
                          100
                        : 0
                    }
                  />
                </div>

                {activeGonggu.end_at && (
                  <div className="text-sm text-muted-foreground">
                    종료:{' '}
                    {new Date(activeGonggu.end_at).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                )}

                {activeGonggu.target_participants && (
                  <div className="text-sm text-muted-foreground">
                    목표 참여 크리에이터:{' '}
                    {formatNumber(activeGonggu.target_participants)}명
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-muted-foreground">
                  현재 진행 중인 공구 캠페인이 없습니다.
                </p>
                <Link href="campaigns/new" className="mt-4">
                  <Button variant="outline" size="sm">
                    새 캠페인 만들기
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Creator Sales Ranking */}
        <Card>
          <CardHeader>
            <CardTitle>크리에이터 매출 랭킹</CardTitle>
            <CardDescription>
              누적 매출 기준 상위 크리에이터
            </CardDescription>
          </CardHeader>
          <CardContent>
            {creatorRankings.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">순위</TableHead>
                    <TableHead>크리에이터</TableHead>
                    <TableHead className="text-right">주문수</TableHead>
                    <TableHead className="text-right">매출</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {creatorRankings.map((ranking, index) => (
                    <TableRow key={ranking.creator.id}>
                      <TableCell className="font-medium">
                        {index + 1}
                      </TableCell>
                      <TableCell>{ranking.creator.display_name}</TableCell>
                      <TableCell className="text-right">
                        {formatNumber(ranking.orderCount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(ranking.totalSales)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">
                  아직 매출 데이터가 없습니다.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
