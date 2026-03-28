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
  FileText,
  Banknote,
} from 'lucide-react';
import { formatCurrency } from '@/lib/i18n/config';
import { getCreatorSession, getCreatorSettlements } from '@/lib/actions/creator';

type SettlementStatus = 'PENDING' | 'COMPLETED' | 'CARRIED_OVER';

interface Settlement {
  id: string;
  creatorId: string;
  periodStart: string;
  periodEnd: string;
  totalSales: number;
  grossCommission: number;
  directCommission?: number;
  indirectCommission?: number;
  totalConversions?: number;
  netAmount: number;
  withholdingTax: number;
  status: SettlementStatus;
  paidAt: string | null;
  createdAt: string;
}

// 3-step settlement progress bar
function SettlementProgressBar({ pendingSettlement }: { pendingSettlement: Settlement | null }) {
  const steps = [
    { label: '집계중', icon: FileText },
    { label: '확정', icon: CheckCircle },
    { label: '입금완료', icon: Banknote },
  ];

  let currentStep = 0;
  if (pendingSettlement) {
    currentStep = 1; // has pending = at least confirmed/aggregating
  }
  if (pendingSettlement?.status === 'COMPLETED') {
    currentStep = 3;
  }

  // Calculate D-day for next settlement (20th of next month approximation)
  const getNextSettlementDate = () => {
    if (!pendingSettlement) return null;
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 20);
    const diff = Math.ceil((nextMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : null;
  };

  const dDay = getNextSettlementDate();

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-gray-900">정산 진행 상태</p>
          {dDay && pendingSettlement && (
            <span className="text-xs font-medium text-earnings bg-earnings/10 px-2 py-1 rounded-full">
              입금까지 D-{dDay}
            </span>
          )}
        </div>

        <div className="flex items-center gap-0">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isActive = i < currentStep;
            const isCurrent = i === currentStep;

            return (
              <div key={step.label} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      isActive
                        ? 'bg-green-500 text-white'
                        : isCurrent
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className={`text-[11px] font-medium ${
                    isActive || isCurrent ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 mb-5 ${
                    isActive ? 'bg-green-500' : 'bg-gray-100'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {pendingSettlement && (
          <div className="mt-3 pt-3 border-t border-gray-50 text-center">
            <p className="text-sm text-gray-500">
              입금 예정 금액{' '}
              <span className="font-bold text-gray-900">
                {formatCurrency(pendingSettlement.netAmount, 'KRW')}
              </span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function CreatorSettlementsPage() {
  const [creator, setCreator] = useState<{ id: string } | null>(null);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      const creatorData = await getCreatorSession();
      if (!creatorData || cancelled) {
        if (!cancelled) setLoading(false);
        return;
      }
      setCreator(creatorData as any);

      try {
        const data = await getCreatorSettlements(creatorData.id);
        if (!cancelled) {
          setSettlements(data as unknown as Settlement[]);
        }
      } catch (error) {
        console.error('Failed to fetch settlements:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, []);

  const filteredSettlements = useMemo(() => {
    if (activeTab === 'all') return settlements;
    if (activeTab === 'completed') return settlements.filter((s) => s.status === 'COMPLETED');
    if (activeTab === 'carried_over') return settlements.filter((s) => s.status === 'CARRIED_OVER');
    return settlements;
  }, [settlements, activeTab]);

  // Summary stats
  const totalPending = settlements
    .filter((s) => s.status === 'PENDING')
    .reduce((sum, s) => sum + s.netAmount, 0);
  const totalCompleted = settlements
    .filter((s) => s.status === 'COMPLETED')
    .reduce((sum, s) => sum + s.netAmount, 0);
  const totalCarriedOver = settlements
    .filter((s) => s.status === 'CARRIED_OVER')
    .reduce((sum, s) => sum + s.netAmount, 0);

  const pendingSettlement = settlements.find((s) => s.status === 'PENDING') ?? null;

  const getStatusBadge = (status: SettlementStatus) => {
    switch (status) {
      case 'PENDING':
        return {
          label: '입금 준비중',
          className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
          icon: <Clock className="h-3 w-3" />,
        };
      case 'COMPLETED':
        return {
          label: '입금 완료',
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
        <Skeleton className="h-32 w-full rounded-2xl" />
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
        <h1 className="text-2xl sm:text-3xl font-bold">내 정산</h1>
        <p className="text-sm text-muted-foreground">입금 내역을 확인하세요</p>
      </div>

      {/* Settlement Progress Bar */}
      <SettlementProgressBar pendingSettlement={pendingSettlement} />

      {/* Summary Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-3 sm:p-6 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">입금 준비중</CardTitle>
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
            <CardTitle className="text-xs sm:text-sm font-medium">입금 완료</CardTitle>
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
                입금완료 ({settlements.filter((s) => s.status === 'COMPLETED').length})
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
              <p className="mt-4 text-muted-foreground">아직 정산 내역이 없어요</p>
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
                        {new Date(settlement.periodStart).toLocaleDateString('ko-KR')}
                        {' ~ '}
                        {new Date(settlement.periodEnd).toLocaleDateString('ko-KR')}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {(settlement.totalConversions ?? 0).toLocaleString()}건
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatCurrency(settlement.totalSales, 'KRW')}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatCurrency(settlement.directCommission ?? 0, 'KRW')}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatCurrency(settlement.indirectCommission ?? 0, 'KRW')}
                      </TableCell>
                      <TableCell className="text-right text-sm text-destructive">
                        -{formatCurrency(settlement.withholdingTax, 'KRW')}
                      </TableCell>
                      <TableCell className="text-right text-sm font-bold text-primary">
                        {formatCurrency(settlement.netAmount, 'KRW')}
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
