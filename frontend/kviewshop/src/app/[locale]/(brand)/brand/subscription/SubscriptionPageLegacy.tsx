'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  CreditCard,
  Crown,
  BarChart3,
  Calendar,
  Loader2,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { toast } from 'sonner';

interface DailySend {
  date: string;
  count: number;
}

interface SubscriptionPayment {
  id: string;
  amount: number;
  plan: string;
  paidAt: string;
  status: string;
  periodStart: string;
  periodEnd: string;
}

interface SubscriptionData {
  subscription: {
    id: string | null;
    plan: string;
    status: string;
    monthlyFee: number;
    includedMessageQuota: number;
    currentMonthUsed: number;
    nextBillingAt: string | null;
    startedAt: string;
  };
  summary: {
    freeCount: number;
    paidCount: number;
    paidAmount: number;
    dailySends: DailySend[];
  };
  payments: SubscriptionPayment[];
}

const PLAN_DETAILS = [
  {
    name: 'FREE',
    label: '무료',
    fee: 0,
    quota: 0,
    description: '체험용',
  },
  {
    name: 'STARTER',
    label: '스타터',
    fee: 500000,
    quota: 100,
    description: '소규모 브랜드',
  },
  {
    name: 'PRO',
    label: '프로',
    fee: 1000000,
    quota: 300,
    description: '성장 브랜드',
  },
  {
    name: 'ENTERPRISE',
    label: '엔터프라이즈',
    fee: 2000000,
    quota: 1000,
    description: '대규모 브랜드',
  },
];

function planLabel(plan: string): string {
  return PLAN_DETAILS.find((p) => p.name === plan)?.label ?? plan;
}

function planBadgeVariant(
  plan: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (plan) {
    case 'ENTERPRISE':
      return 'default';
    case 'PRO':
      return 'default';
    case 'STARTER':
      return 'secondary';
    default:
      return 'outline';
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'PAID':
      return '결제 완료';
    case 'FAILED':
      return '결제 실패';
    case 'REFUNDED':
      return '환불';
    default:
      return status;
  }
}

function formatAmount(num: number): string {
  return num.toLocaleString('ko-KR') + '원';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
  });
}

export default function BrandSubscriptionPage() {
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [changingPlan, setChangingPlan] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/brand/subscription');
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await res.json();
        setData(json);
      } catch {
        toast.error('구독 정보를 불러오지 못했습니다');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  async function handlePlanChange() {
    setChangingPlan(true);
    try {
      const res = await fetch('/api/brand/subscription', { method: 'POST' });
      const json = await res.json();
      toast.info(json.message || '준비중입니다');
    } catch {
      toast.error('요청에 실패했습니다');
    } finally {
      setChangingPlan(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-muted-foreground">구독 정보를 불러올 수 없습니다</p>
      </div>
    );
  }

  const { subscription, summary, payments } = data;
  const quotaPercent =
    subscription.includedMessageQuota > 0
      ? Math.min(
          100,
          (subscription.currentMonthUsed / subscription.includedMessageQuota) *
            100
        )
      : 0;

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">구독 관리</h1>

      {/* Current Plan Card */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <Crown className="h-5 w-5 text-amber-500" />
          <CardTitle>현재 플랜</CardTitle>
          <Badge variant={planBadgeVariant(subscription.plan)} className="ml-2">
            {planLabel(subscription.plan)}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">월 요금</p>
              <p className="text-xl font-semibold">
                {formatAmount(subscription.monthlyFee)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">이번달 쿼터</p>
              <div className="flex items-baseline gap-1">
                <p className="text-xl font-semibold">
                  {subscription.currentMonthUsed.toLocaleString('ko-KR')}
                </p>
                <p className="text-sm text-muted-foreground">
                  / {subscription.includedMessageQuota.toLocaleString('ko-KR')}건
                </p>
              </div>
              <Progress value={quotaPercent} className="mt-2 h-2" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">다음 결제일</p>
              <p className="text-xl font-semibold">
                {subscription.nextBillingAt
                  ? formatDate(subscription.nextBillingAt)
                  : '-'}
              </p>
            </div>
          </div>

          {/* Usage summary */}
          <div className="flex flex-wrap gap-4 rounded-lg bg-muted/50 p-4 text-sm">
            <div>
              <span className="text-muted-foreground">무료 발송</span>{' '}
              <span className="font-medium">
                {summary.freeCount.toLocaleString('ko-KR')}건
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">유료 발송</span>{' '}
              <span className="font-medium">
                {summary.paidCount.toLocaleString('ko-KR')}건
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">유료 과금액</span>{' '}
              <span className="font-medium">
                {formatAmount(summary.paidAmount)}
              </span>
            </div>
          </div>

          <Button onClick={handlePlanChange} disabled={changingPlan}>
            {changingPlan ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ArrowUpRight className="mr-2 h-4 w-4" />
            )}
            플랜 변경
          </Button>
        </CardContent>
      </Card>

      {/* Plan Comparison */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <CreditCard className="h-5 w-5" />
          <CardTitle>플랜 비교</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">항목</TableHead>
                  {PLAN_DETAILS.map((p) => (
                    <TableHead key={p.name} className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-semibold">{p.label}</span>
                        {subscription.plan === p.name && (
                          <Badge variant="outline" className="text-xs">
                            현재
                          </Badge>
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">월 요금</TableCell>
                  {PLAN_DETAILS.map((p) => (
                    <TableCell key={p.name} className="text-center">
                      {formatAmount(p.fee)}
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">포함 건수</TableCell>
                  {PLAN_DETAILS.map((p) => (
                    <TableCell key={p.name} className="text-center">
                      {p.quota.toLocaleString('ko-KR')}건
                    </TableCell>
                  ))}
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">초과 시</TableCell>
                  {PLAN_DETAILS.map((p) => (
                    <TableCell
                      key={p.name}
                      className="text-center text-muted-foreground"
                    >
                      건당 500원
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Daily Send Chart */}
      {summary.dailySends.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <BarChart3 className="h-5 w-5" />
            <CardTitle>일별 발송 현황</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.dailySends}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={formatShortDate}
                  />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip
                    labelFormatter={(label) => formatDate(String(label))}
                    formatter={(value) => [
                      `${Number(value).toLocaleString('ko-KR')}건`,
                      '발송',
                    ]}
                  />
                  <Bar
                    dataKey="count"
                    fill="#6366f1"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <Calendar className="h-5 w-5" />
          <CardTitle>결제 내역</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              결제 내역이 없습니다
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>결제일</TableHead>
                    <TableHead>플랜</TableHead>
                    <TableHead>기간</TableHead>
                    <TableHead className="text-right">금액</TableHead>
                    <TableHead className="text-center">상태</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{formatDate(payment.paidAt)}</TableCell>
                      <TableCell>{planLabel(payment.plan)}</TableCell>
                      <TableCell>
                        {formatDate(payment.periodStart)} ~{' '}
                        {formatDate(payment.periodEnd)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatAmount(payment.amount)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            payment.status === 'PAID'
                              ? 'default'
                              : payment.status === 'REFUNDED'
                                ? 'secondary'
                                : 'destructive'
                          }
                        >
                          {statusLabel(payment.status)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
