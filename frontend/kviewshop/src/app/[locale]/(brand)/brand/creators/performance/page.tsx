'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/auth';
import type { Creator, SkinType } from '@/types/database';
import { SKIN_TYPE_LABELS } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, TrendingUp, Users, Megaphone } from 'lucide-react';

interface CreatorPerformance {
  creator: Creator;
  orderCount: number;
  totalSales: number;
  visitCount: number;
  conversionRate: number;
}

type SortField = 'totalSales' | 'orderCount' | 'conversionRate';
type PeriodFilter = 'this_month' | 'last_month' | 'all';

function formatCurrency(num: number): string {
  return `${num.toLocaleString('ko-KR')}원`;
}

function getMonthRange(period: PeriodFilter): { start: string | null; end: string | null } {
  const now = new Date();
  if (period === 'this_month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return { start: start.toISOString(), end: end.toISOString() };
  }
  if (period === 'last_month') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    return { start: start.toISOString(), end: end.toISOString() };
  }
  return { start: null, end: null };
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}

export default function CreatorPerformancePage() {
  const { brand, isLoading: authLoading } = useAuthStore();
  const [performances, setPerformances] = useState<CreatorPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('totalSales');
  const [period, setPeriod] = useState<PeriodFilter>('this_month');

  useEffect(() => {
    if (!brand?.id) {
      if (!authLoading) setIsLoading(false);
      return;
    }

    async function fetchPerformance() {
      const supabase = getClient();
      const brandId = brand!.id;
      const { start, end } = getMonthRange(period);

      try {
        // Get orders for this brand, optionally filtered by date
        let orderQuery = supabase
          .from('orders')
          .select('id, creator_id, total_amount, status')
          .eq('brand_id', brandId)
          .neq('status', 'CANCELLED');

        if (start) orderQuery = orderQuery.gte('created_at', start);
        if (end) orderQuery = orderQuery.lte('created_at', end);

        const { data: orders } = await orderQuery;

        // Group by creator
        const creatorMap = new Map<string, { count: number; total: number }>();
        for (const order of orders ?? []) {
          if (!order.creator_id) continue;
          const existing = creatorMap.get(order.creator_id) ?? { count: 0, total: 0 };
          existing.count += 1;
          existing.total += order.total_amount || 0;
          creatorMap.set(order.creator_id, existing);
        }

        const creatorIds = Array.from(creatorMap.keys());
        if (creatorIds.length === 0) {
          setPerformances([]);
          setIsLoading(false);
          return;
        }

        // Fetch creator details
        const { data: creators } = await supabase
          .from('creators')
          .select('*')
          .in('id', creatorIds);

        // Fetch visit counts per creator
        let visitQuery = supabase
          .from('shop_visits')
          .select('creator_id')
          .in('creator_id', creatorIds);

        if (start) visitQuery = visitQuery.gte('visited_at', start);
        if (end) visitQuery = visitQuery.lte('visited_at', end);

        const { data: visits } = await visitQuery;

        const visitMap = new Map<string, number>();
        for (const v of visits ?? []) {
          visitMap.set(v.creator_id, (visitMap.get(v.creator_id) ?? 0) + 1);
        }

        // Build performance data
        const performanceData: CreatorPerformance[] = (creators ?? []).map((creator) => {
          const orderData = creatorMap.get(creator.id) ?? { count: 0, total: 0 };
          const visitCount = visitMap.get(creator.id) ?? 0;
          return {
            creator: creator as Creator,
            orderCount: orderData.count,
            totalSales: orderData.total,
            visitCount,
            conversionRate: visitCount > 0
              ? Math.round((orderData.count / visitCount) * 10000) / 100
              : 0,
          };
        });

        setPerformances(performanceData);
      } catch (error) {
        console.error('Failed to fetch creator performance:', error);
      } finally {
        setIsLoading(false);
      }
    }

    setIsLoading(true);
    fetchPerformance();
  }, [brand?.id, authLoading, period]);

  const sortedPerformances = [...performances].sort((a, b) => {
    return b[sortField] - a[sortField];
  });

  const totalCreators = performances.length;
  const totalSales = performances.reduce((sum, p) => sum + p.totalSales, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="../creators">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            돌아가기
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">크리에이터 성과</h1>
          <p className="text-sm text-muted-foreground">
            내 상품을 판매한 크리에이터별 성과를 확인합니다.
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">판매 크리에이터</p>
              <p className="text-2xl font-bold">{totalCreators}명</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">크리에이터 경유 매출</p>
              <p className="text-2xl font-bold">{formatCurrency(totalSales)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">기간</span>
              <Select value={period} onValueChange={(v) => setPeriod(v as PeriodFilter)}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this_month">이번 달</SelectItem>
                  <SelectItem value="last_month">지난 달</SelectItem>
                  <SelectItem value="all">전체</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">정렬</span>
              <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="totalSales">매출순</SelectItem>
                  <SelectItem value="orderCount">판매량순</SelectItem>
                  <SelectItem value="conversionRate">전환율순</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>크리에이터 성과 테이블</CardTitle>
          <CardDescription>
            {period === 'this_month' ? '이번 달' : period === 'last_month' ? '지난 달' : '전체'} 기준
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton />
          ) : sortedPerformances.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">
                해당 기간에 판매 크리에이터가 없습니다.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>크리에이터</TableHead>
                  <TableHead>피부타입</TableHead>
                  <TableHead className="text-right">판매량</TableHead>
                  <TableHead className="text-right">매출</TableHead>
                  <TableHead className="text-right">전환율</TableHead>
                  <TableHead>액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPerformances.map((perf) => (
                  <TableRow key={perf.creator.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          {perf.creator.profile_image_url && (
                            <AvatarImage src={perf.creator.profile_image_url} />
                          )}
                          <AvatarFallback className="text-xs">
                            {perf.creator.display_name.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{perf.creator.display_name}</p>
                          <p className="text-xs text-muted-foreground">
                            @{perf.creator.shop_id}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {perf.creator.skin_type ? (
                        <Badge variant="outline">
                          {SKIN_TYPE_LABELS[perf.creator.skin_type as SkinType] ?? perf.creator.skin_type}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {perf.orderCount.toLocaleString('ko-KR')}건
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(perf.totalSales)}
                    </TableCell>
                    <TableCell className="text-right">
                      {perf.conversionRate > 0 ? `${perf.conversionRate}%` : '-'}
                    </TableCell>
                    <TableCell>
                      <Link href={`../campaigns/new?creator_id=${perf.creator.id}`}>
                        <Button variant="outline" size="sm">
                          <Megaphone className="h-3 w-3 mr-1" />
                          공구 제안
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
