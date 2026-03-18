'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Receipt,
  BarChart3,
} from 'lucide-react';
import { formatCurrency } from '@/lib/i18n/config';
import { getCreatorSession, getCreatorSalesData } from '@/lib/actions/creator';

interface ConversionWithDetails {
  id: string;
  orderId: string;
  orderItemId: string;
  creatorId: string;
  conversionType: string;
  orderAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: string;
  createdAt: string;
  orderItem?: { product?: { name: string } } | null;
}

type PeriodTab = 'today' | 'week' | 'month';

export default function CreatorSalesPage() {
  const [conversions, setConversions] = useState<ConversionWithDetails[]>([]);
  const [totalVisits, setTotalVisits] = useState(0);
  const [pendingSettlement, setPendingSettlement] = useState(0);
  const [loading, setLoading] = useState(true);
  const [periodTab, setPeriodTab] = useState<PeriodTab>('month');

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      const creatorData = await getCreatorSession();
      if (!creatorData || cancelled) {
        if (!cancelled) setLoading(false);
        return;
      }

      try {
        const data = await getCreatorSalesData(creatorData.id);
        if (!cancelled) {
          setConversions(data.conversions as unknown as ConversionWithDetails[]);
          setTotalVisits(data.totalVisits);
          setPendingSettlement(data.pendingSettlement);
        }
      } catch (error) {
        console.error('Failed to fetch sales data:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, []);

  // Filter conversions by period
  const filteredConversions = useMemo(() => {
    const now = new Date();
    return conversions.filter((c) => {
      const created = new Date(c.createdAt);
      switch (periodTab) {
        case 'today': {
          return created.toDateString() === now.toDateString();
        }
        case 'week': {
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return created >= weekAgo;
        }
        case 'month': {
          return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
        }
      }
    });
  }, [conversions, periodTab]);

  // Computed stats from filtered
  const confirmedConversions = filteredConversions.filter((c) => c.status === 'CONFIRMED');
  const totalOrders = confirmedConversions.length;
  const totalRevenue = confirmedConversions.reduce((sum, c) => sum + c.orderAmount, 0);
  const totalCommission = confirmedConversions.reduce((sum, c) => sum + c.commissionAmount, 0);
  const conversionRate = totalVisits > 0 ? (totalOrders / totalVisits) * 100 : 0;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full rounded-lg" />
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop Header */}
      <div className="hidden md:block">
        <h1 className="text-2xl sm:text-3xl font-bold">판매 현황</h1>
        <p className="text-sm text-muted-foreground">내 샵의 판매와 수익을 확인하세요</p>
      </div>

      {/* Period Tabs */}
      <div className="flex rounded-lg bg-muted p-1 gap-1">
        {([
          { key: 'today' as PeriodTab, label: '오늘' },
          { key: 'week' as PeriodTab, label: '이번주' },
          { key: 'month' as PeriodTab, label: '이번달' },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setPeriodTab(tab.key)}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              periodTab === tab.key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Key Metrics - 3 cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <DollarSign className="h-5 w-5 mx-auto text-primary mb-1" />
            <p className="text-[10px] sm:text-xs text-muted-foreground">총 매출</p>
            <p className="text-sm sm:text-lg font-bold text-primary mt-0.5">
              {formatCurrency(totalRevenue, 'KRW')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <BarChart3 className="h-5 w-5 mx-auto text-green-500 mb-1" />
            <p className="text-[10px] sm:text-xs text-muted-foreground">내 수익</p>
            <p className="text-sm sm:text-lg font-bold text-green-600 mt-0.5">
              {formatCurrency(totalCommission, 'KRW')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <TrendingUp className="h-5 w-5 mx-auto text-blue-500 mb-1" />
            <p className="text-[10px] sm:text-xs text-muted-foreground">전환율</p>
            <p className="text-sm sm:text-lg font-bold mt-0.5">
              {conversionRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sub Stats */}
      <div className="flex items-center justify-between px-1">
        <div className="text-xs text-muted-foreground">
          주문 <span className="font-semibold text-foreground">{totalOrders}건</span>
        </div>
        <div className="text-xs text-muted-foreground">
          정산 예정 <span className="font-semibold text-warning">{formatCurrency(pendingSettlement, 'KRW')}</span>
        </div>
      </div>

      {/* Simple Bar Chart - visual representation */}
      {filteredConversions.length > 0 && (
        <Card>
          <CardHeader className="p-3 sm:p-4 pb-2">
            <CardTitle className="text-sm font-medium">일별 매출</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <DailyBarChart conversions={filteredConversions} />
          </CardContent>
        </Card>
      )}

      {/* Recent Orders */}
      <Card>
        <CardHeader className="p-3 sm:p-4 pb-2">
          <CardTitle className="text-sm font-medium">최근 주문</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-4 sm:pt-0">
          {filteredConversions.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 text-sm text-muted-foreground">해당 기간 판매 내역이 없습니다</p>
            </div>
          ) : (
            <>
              {/* Mobile: Card List */}
              <div className="sm:hidden divide-y">
                {filteredConversions.slice(0, 20).map((conversion) => (
                  <div key={conversion.id} className="px-3 py-3 flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {conversion.orderItem?.product?.name ?? '-'}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">
                          {new Date(conversion.createdAt).toLocaleDateString('ko-KR', {
                            month: '2-digit',
                            day: '2-digit',
                          })}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            conversion.status === 'CONFIRMED'
                              ? 'text-green-600 border-green-500/30'
                              : conversion.status === 'CANCELLED'
                              ? 'text-red-600 border-red-500/30'
                              : 'text-yellow-600 border-yellow-500/30'
                          }`}
                        >
                          {conversion.status === 'CONFIRMED' ? '확정' : conversion.status === 'CANCELLED' ? '취소' : '대기'}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right ml-3">
                      <p className="text-sm font-bold text-primary">
                        {formatCurrency(conversion.commissionAmount, 'KRW')}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatCurrency(conversion.orderAmount, 'KRW')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: Table */}
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>결제일시</TableHead>
                      <TableHead>상품명</TableHead>
                      <TableHead className="text-right">판매금액</TableHead>
                      <TableHead>전환유형</TableHead>
                      <TableHead className="text-right">수익률</TableHead>
                      <TableHead className="text-right">내 수익</TableHead>
                      <TableHead>상태</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredConversions.map((conversion) => (
                      <TableRow key={conversion.id}>
                        <TableCell className="text-sm">
                          {new Date(conversion.createdAt).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <p className="text-sm truncate">
                            {conversion.orderItem?.product?.name ?? '-'}
                          </p>
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium">
                          {formatCurrency(conversion.orderAmount, 'KRW')}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              conversion.conversionType === 'DIRECT'
                                ? 'text-blue-600 border-blue-500/30'
                                : 'text-purple-600 border-purple-500/30'
                            }
                          >
                            {conversion.conversionType === 'DIRECT' ? '직접' : '간접'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {(conversion.commissionRate * 100).toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium text-primary">
                          {formatCurrency(conversion.commissionAmount, 'KRW')}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              conversion.status === 'CONFIRMED'
                                ? 'text-green-600 border-green-500/30'
                                : conversion.status === 'CANCELLED'
                                ? 'text-red-600 border-red-500/30'
                                : 'text-yellow-600 border-yellow-500/30'
                            }
                          >
                            {conversion.status === 'CONFIRMED'
                              ? '확정'
                              : conversion.status === 'CANCELLED'
                              ? '취소'
                              : '대기'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Simple daily bar chart component
function DailyBarChart({ conversions }: { conversions: ConversionWithDetails[] }) {
  const dailyData = useMemo(() => {
    const map = new Map<string, number>();
    conversions
      .filter((c) => c.status === 'CONFIRMED')
      .forEach((c) => {
        const day = new Date(c.createdAt).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' });
        map.set(day, (map.get(day) || 0) + c.orderAmount);
      });

    const entries = Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    // Take last 7 days max
    return entries.slice(-7);
  }, [conversions]);

  if (dailyData.length === 0) return null;

  const maxVal = Math.max(...dailyData.map(([, v]) => v), 1);

  return (
    <div className="flex items-end gap-1.5 h-24">
      {dailyData.map(([day, value]) => (
        <div key={day} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full bg-primary/20 rounded-t-sm relative min-h-[4px]"
            style={{ height: `${Math.max((value / maxVal) * 100, 5)}%` }}
          >
            <div
              className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-sm"
              style={{ height: '100%' }}
            />
          </div>
          <span className="text-[9px] text-muted-foreground">{day}</span>
        </div>
      ))}
    </div>
  );
}
