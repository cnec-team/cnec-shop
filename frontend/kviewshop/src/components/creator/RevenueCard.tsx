'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Wallet, Calendar } from 'lucide-react';
import { useCountUp } from '@/lib/hooks/use-count-up';

interface RevenueData {
  today: number;
  month: number;
  pendingSettlement: number;
  nextSettlementDate: string;
}

function formatAmount(value: number): string {
  return '₩' + value.toLocaleString('ko-KR');
}

function AnimatedAmount({ value, duration }: { value: number; duration: number }) {
  const animated = useCountUp(value, duration);
  return <span className="font-price">{formatAmount(animated)}</span>;
}

export function RevenueCard() {
  const { data, isLoading } = useQuery<RevenueData>({
    queryKey: ['creator-revenue'],
    queryFn: async () => {
      const res = await fetch('/api/creator/dashboard/revenue');
      if (!res.ok) throw new Error('Failed to fetch revenue');
      return res.json();
    },
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="rounded-2xl border-gray-100 shadow-sm">
            <CardContent className="p-4">
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-7 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const today = data?.today ?? 0;
  const month = data?.month ?? 0;
  const pending = data?.pendingSettlement ?? 0;
  const settlementDate = data?.nextSettlementDate ?? '';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <Card className="rounded-2xl border-gray-100 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1.5">
            <TrendingUp className="h-4 w-4 text-trust" />
            <span className="text-xs text-muted-foreground">오늘 수익</span>
          </div>
          <p className="text-lg font-bold">
            <AnimatedAmount value={today} duration={600} />
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-gray-100 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1.5">
            <Wallet className="h-4 w-4 text-earnings" />
            <span className="text-xs text-muted-foreground">이번 달 수익</span>
          </div>
          <p className="text-lg font-bold">
            <AnimatedAmount value={month} duration={800} />
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-gray-100 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1.5">
            <Calendar className="h-4 w-4 text-trust" />
            <span className="text-xs text-muted-foreground">정산 예정</span>
          </div>
          <p className="text-lg font-bold">
            <AnimatedAmount value={pending} duration={800} />
          </p>
          {settlementDate && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {settlementDate} 입금 예정
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
