'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Coins, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/i18n/config';
import { POINT_TYPE_LABELS } from '@/types/database';
import { getCreatorSession, getCreatorPoints, withdrawPoints } from '@/lib/actions/creator';

type PointType = 'COMMISSION' | 'REFERRAL' | 'MISSION' | 'BONUS' | 'WITHDRAWAL' | 'ADJUSTMENT';

interface PointEntry {
  id: string;
  creatorId: string;
  pointType: string;
  amount: number;
  balanceAfter: number;
  description: string | null;
  relatedId: string | null;
  createdAt: string;
}

export default function CreatorPointsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const [creator, setCreator] = useState<{ id: string } | null>(null);
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<PointEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showWithdraw, setShowWithdraw] = useState(false);

  const limit = 20;

  const fetchPoints = useCallback(async (p: number) => {
    if (!creator) return;
    try {
      setLoading(true);
      const data = await getCreatorPoints(p, limit);
      setBalance(data.balance);
      setHistory(data.history as PointEntry[]);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to fetch points:', error);
    } finally {
      setLoading(false);
    }
  }, [creator]);

  useEffect(() => {
    async function init() {
      const creatorData = await getCreatorSession();
      if (creatorData) {
        setCreator(creatorData as any);
      } else {
        setLoading(false);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (creator) {
      fetchPoints(page);
    }
  }, [creator, page, fetchPoints]);

  const handleWithdraw = async () => {
    const amount = parseInt(withdrawAmount, 10);
    if (!amount || amount <= 0) {
      toast.error('올바른 금액을 입력하세요');
      return;
    }
    if (amount > balance) {
      toast.error('잔액이 부족합니다');
      return;
    }

    setWithdrawing(true);
    try {
      const result = await withdrawPoints(amount);
      if (result.success) {
        toast.success('출금 신청이 완료되었습니다');
        setShowWithdraw(false);
        setWithdrawAmount('');
        fetchPoints(1);
        setPage(1);
      }
    } catch (error: any) {
      toast.error(error?.message || '오류가 발생했습니다');
    } finally {
      setWithdrawing(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">포인트</h1>
        <p className="text-sm text-muted-foreground">포인트 적립 내역과 잔액을 확인하세요</p>
      </div>

      {/* Balance Card */}
      <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Coins className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">포인트 잔액</p>
                <p className="text-3xl font-bold">{formatCurrency(balance, locale)}</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowWithdraw(!showWithdraw)}
            >
              출금 신청
            </Button>
          </div>

          {showWithdraw && (
            <div className="mt-4 pt-4 border-t flex flex-col sm:flex-row gap-3">
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="출금 금액"
                className="flex-1 px-3 py-2 border rounded-md text-sm"
                min={1}
                max={balance}
              />
              <Button onClick={handleWithdraw} disabled={withdrawing} size="sm">
                {withdrawing ? '처리 중...' : '출금 요청'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowWithdraw(false)}>취소</Button>
            </div>
          )}
          {showWithdraw && (
            <p className="text-xs text-muted-foreground mt-2">출금 요청 후 관리자 확인 후 처리됩니다</p>
          )}
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">포인트 내역</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">포인트 내역이 없습니다</p>
          ) : (
            <div className="space-y-3">
              {history.map((point) => (
                <div key={point.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    {point.amount > 0 ? (
                      <ArrowDownCircle className="h-5 w-5 text-green-500 shrink-0" />
                    ) : (
                      <ArrowUpCircle className="h-5 w-5 text-red-500 shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {POINT_TYPE_LABELS[point.pointType as keyof typeof POINT_TYPE_LABELS] || point.pointType}
                      </p>
                      {point.description && (
                        <p className="text-xs text-muted-foreground">{point.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(point.createdAt).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${point.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {point.amount > 0 ? '+' : ''}{formatCurrency(point.amount, locale)}
                    </p>
                    <p className="text-xs text-muted-foreground">잔액 {formatCurrency(point.balanceAfter, locale)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                이전
              </Button>
              <span className="text-sm self-center">{page} / {totalPages}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                다음
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
