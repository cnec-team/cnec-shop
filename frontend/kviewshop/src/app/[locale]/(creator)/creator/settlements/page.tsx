'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Wallet,
  CheckCircle,
  Clock,
  ArrowRightLeft,
  Receipt,
} from 'lucide-react';
import { getClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/auth';
import { formatCurrency } from '@/lib/i18n/config';
import type { Settlement, SettlementStatus } from '@/types/database';

export default function CreatorSettlementsPage() {
  const { creator, isLoading: authLoading } = useAuthStore();

  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (authLoading || !creator) {
      if (!authLoading) setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchData() {
      try {
        const supabase = getClient();

        const { data, error } = await supabase
          .from('settlements')
          .select('*')
          .eq('creator_id', creator!.id)
          .order('period_start', { ascending: false });

        if (cancelled) return;

        if (!error && data) {
          setSettlements(data);
        }
      } catch (error) {
        console.error('Failed to fetch settlements:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [authLoading, creator]);

  const filteredSettlements = useMemo(() => {
    if (activeTab === 'all') return settlements;
    if (activeTab === 'completed') return settlements.filter((s) => s.status === 'COMPLETED');
    if (activeTab === 'carried_over') return settlements.filter((s) => s.status === 'CARRIED_OVER');
    return settlements;
  }, [settlements, activeTab]);

  // Summary stats
  const totalPending = settlements
    .filter((s) => s.status === 'PENDING')
    .reduce((sum, s) => sum + s.net_amount, 0);
  const totalCompleted = settlements
    .filter((s) => s.status === 'COMPLETED')
    .reduce((sum, s) => sum + s.net_amount, 0);
  const totalCarriedOver = settlements
    .filter((s) => s.status === 'CARRIED_OVER')
    .reduce((sum, s) => sum + s.net_amount, 0);

  const getStatusBadge = (status: SettlementStatus) => {
    switch (status) {
      case 'PENDING':
        return {
          label: '정산 대기',
          className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
          icon: <Clock className="h-3 w-3" />,
        };
      case 'COMPLETED':
        return {
          label: '정산 완료',
          className: 'bg-green-500/10 text-green-600 border-green-500/30',
          icon: <CheckCircle className="h-3 w-3" />,
        };
      case 'CARRIED_OVER':
        return {
          label: '이월',
          className: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
          icon: <ArrowRightLeft className="h-3 w-3" />,
        };
    }
  };

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
        <div className="grid gap-4 grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">정산 관리</h1>
        <p className="text-sm text-muted-foreground">정산 내역을 확인하세요</p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-6 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">정산 대기</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold text-warning">
              {formatCurrency(totalPending, 'KRW')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-6 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">정산 완료</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold text-green-600">
              {formatCurrency(totalCompleted, 'KRW')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-6 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">이월 금액</CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold text-blue-600">
              {formatCurrency(totalCarriedOver, 'KRW')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settlements Table with Tabs */}
      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">
                전체 ({settlements.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                정산완료 ({settlements.filter((s) => s.status === 'COMPLETED').length})
              </TabsTrigger>
              <TabsTrigger value="carried_over">
                이월 ({settlements.filter((s) => s.status === 'CARRIED_OVER').length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {filteredSettlements.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">정산 내역이 없습니다</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>정산 기간</TableHead>
                  <TableHead className="text-right">구매 수</TableHead>
                  <TableHead className="text-right">정산대상 금액</TableHead>
                  <TableHead className="text-right">직접 수익</TableHead>
                  <TableHead className="text-right">간접 수익</TableHead>
                  <TableHead className="text-right">원천징수</TableHead>
                  <TableHead className="text-right">정산금액</TableHead>
                  <TableHead>상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSettlements.map((settlement) => {
                  const statusInfo = getStatusBadge(settlement.status);

                  return (
                    <TableRow key={settlement.id}>
                      <TableCell className="text-sm">
                        {new Date(settlement.period_start).toLocaleDateString('ko-KR')}
                        {' ~ '}
                        {new Date(settlement.period_end).toLocaleDateString('ko-KR')}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {settlement.total_conversions.toLocaleString()}건
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatCurrency(settlement.total_sales, 'KRW')}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatCurrency(settlement.direct_commission, 'KRW')}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatCurrency(settlement.indirect_commission, 'KRW')}
                      </TableCell>
                      <TableCell className="text-right text-sm text-destructive">
                        -{formatCurrency(settlement.withholding_tax, 'KRW')}
                      </TableCell>
                      <TableCell className="text-right text-sm font-bold text-primary">
                        {formatCurrency(settlement.net_amount, 'KRW')}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusInfo.className}>
                          {statusInfo.icon}
                          <span className="ml-1">{statusInfo.label}</span>
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
