'use client';

import { useState, useEffect, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CheckCircle,
  Clock,
  ArrowRightLeft,
  Receipt,
  ShoppingBag,
  Star,
  TrendingUp,
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

  const totalAmount = totalPending + totalCompleted;

  const pendingSettlement = settlements.find((s) => s.status === 'PENDING') ?? null;

  // Get next settlement date (20th of next month)
  const getNextSettlementInfo = () => {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 20);
    const monthName = nextMonth.getMonth() + 1;
    const dayName = nextMonth.getDate();
    return `${monthName}월 ${dayName}일`;
  };

  // Build bar chart data from settlements (last 30 days approximation)
  const chartData = useMemo(() => {
    const now = new Date();
    const bars: { label: string; value: number; maxValue: number }[] = [];
    const dayCount = 27;

    // Distribute settlement amounts across their period days for visualization
    const dailyMap = new Map<string, number>();

    for (const s of settlements) {
      const start = new Date(s.periodStart);
      const end = new Date(s.periodEnd);
      const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      const dailyAmount = s.netAmount / days;

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = `${d.getMonth() + 1}/${d.getDate()}`;
        dailyMap.set(key, (dailyMap.get(key) ?? 0) + dailyAmount);
      }
    }

    let maxVal = 0;
    for (let i = dayCount - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const key = `${date.getMonth() + 1}/${date.getDate()}`;
      const val = Math.round(dailyMap.get(key) ?? 0);
      if (val > maxVal) maxVal = val;
      bars.push({ label: key, value: val, maxValue: 0 });
    }

    // Set maxValue for percentage calculation
    for (const bar of bars) {
      bar.maxValue = maxVal || 1;
    }

    return bars;
  }, [settlements]);

  // Build recent transactions from settlements
  const recentTransactions = useMemo(() => {
    return settlements
      .slice(0, 10)
      .map((s) => {
        const start = new Date(s.periodStart);
        const dateLabel = `${start.getMonth() + 1}/${start.getDate()}`;
        const conversions = s.totalConversions ?? 0;

        return {
          id: s.id,
          description: `정산 (${new Date(s.periodStart).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} ~ ${new Date(s.periodEnd).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })})`,
          date: dateLabel,
          conversions,
          amount: s.netAmount,
          status: s.status,
        };
      });
  }, [settlements]);

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
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl pb-24">
      {/* Header Section */}
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">내 정산</h1>
          {pendingSettlement && (
            <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full font-medium">
              정산 대기중
            </span>
          )}
        </div>

        <div className="mt-4">
          <p className="text-4xl font-bold text-gray-900">
            {formatCurrency(totalAmount, 'KRW')}
          </p>
          <p className="text-sm text-gray-500 mt-1.5">
            {getNextSettlementInfo()} 입금 예정
            {totalCarriedOver > 0 && ` · 이월 ${formatCurrency(totalCarriedOver, 'KRW')}`}
          </p>
        </div>
      </div>

      {/* Trust Badge */}
      <div className="bg-foreground text-white rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <CheckCircle className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold">내 수익, 그대로 받아요</p>
            <p className="text-xs text-white/70 mt-0.5">수수료 0원 · 100% 전액 지급</p>
          </div>
        </div>
      </div>

      {/* 이번 달 수익 흐름 (Bar Chart) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-gray-500" />
          <p className="text-sm font-semibold text-gray-900">이번 달 수익 흐름</p>
        </div>

        {chartData.some((d) => d.value > 0) ? (
          <div className="flex items-end gap-[2px] h-24">
            {chartData.map((bar, i) => {
              const heightPercent = bar.maxValue > 0 ? (bar.value / bar.maxValue) * 100 : 0;
              const showLabel = i === 0 || i === Math.floor(chartData.length / 2) || i === chartData.length - 1;

              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end justify-center" style={{ height: '80px' }}>
                    <div
                      className={`w-full max-w-[8px] rounded-t-sm transition-all ${
                        bar.value > 0 ? 'bg-emerald-400' : 'bg-gray-100'
                      }`}
                      style={{ height: `${Math.max(heightPercent, 2)}%` }}
                    />
                  </div>
                  {showLabel && (
                    <span className="text-[9px] text-gray-400">{bar.label}</span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-24 text-sm text-gray-400">
            아직 수익 데이터가 없어요
          </div>
        )}
      </div>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 text-center">
          <Clock className="h-4 w-4 text-yellow-500 mx-auto" />
          <p className="text-xs text-gray-500 mt-1">준비중</p>
          <p className="text-sm font-bold text-gray-900 mt-0.5">
            {formatCurrency(totalPending, 'KRW')}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 text-center">
          <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
          <p className="text-xs text-gray-500 mt-1">완료</p>
          <p className="text-sm font-bold text-gray-900 mt-0.5">
            {formatCurrency(totalCompleted, 'KRW')}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 text-center">
          <ArrowRightLeft className="h-4 w-4 text-blue-500 mx-auto" />
          <p className="text-xs text-gray-500 mt-1">이월</p>
          <p className="text-sm font-bold text-gray-900 mt-0.5">
            {formatCurrency(totalCarriedOver, 'KRW')}
          </p>
        </div>
      </div>

      {/* 최근 내역 Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 pb-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">최근 내역</p>
            <div className="flex gap-1">
              {['all', 'completed', 'carried_over'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                    activeTab === tab
                      ? 'bg-foreground text-white'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {tab === 'all' ? '전체' : tab === 'completed' ? '완료' : '이월'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredSettlements.length === 0 ? (
          <div className="text-center py-12 px-5">
            <div className="h-14 w-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto">
              <Receipt className="h-7 w-7 text-gray-300" />
            </div>
            <p className="mt-4 text-sm font-bold text-gray-900">첫 판매가 발생하면 정산이 시작돼요</p>
            <p className="text-xs text-gray-400 mt-1">평균 첫 정산까지 7일 소요</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filteredSettlements.map((settlement) => {
              const statusInfo = getStatusBadge(settlement.status);
              const periodStart = new Date(settlement.periodStart);
              const periodEnd = new Date(settlement.periodEnd);
              const dateStr = `${periodStart.getMonth() + 1}/${periodStart.getDate()} ~ ${periodEnd.getMonth() + 1}/${periodEnd.getDate()}`;
              const conversions = settlement.totalConversions ?? 0;

              return (
                <div key={settlement.id} className="flex items-center gap-3 px-5 py-3.5">
                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    settlement.status === 'COMPLETED'
                      ? 'bg-green-50'
                      : settlement.status === 'PENDING'
                      ? 'bg-yellow-50'
                      : 'bg-blue-50'
                  }`}>
                    {settlement.status === 'COMPLETED' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : settlement.status === 'PENDING' ? (
                      <Clock className="h-4 w-4 text-yellow-500" />
                    ) : (
                      <ArrowRightLeft className="h-4 w-4 text-blue-500" />
                    )}
                  </div>

                  {/* Description */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      정산 ({dateStr})
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {conversions > 0 ? `${conversions}건` : ''} · {statusInfo.label}
                    </p>
                  </div>

                  {/* Amount */}
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ${
                      settlement.status === 'COMPLETED'
                        ? 'text-emerald-600'
                        : settlement.status === 'PENDING'
                        ? 'text-yellow-600'
                        : 'text-blue-600'
                    }`}>
                      +{formatCurrency(settlement.netAmount, 'KRW')}
                    </p>
                    {settlement.withholdingTax > 0 && (
                      <p className="text-[10px] text-gray-400">
                        세금 -{formatCurrency(settlement.withholdingTax, 'KRW')}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
