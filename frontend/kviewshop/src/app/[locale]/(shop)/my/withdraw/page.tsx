'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/lib/hooks/use-user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  ChevronLeft, AlertTriangle, Loader2, UserMinus,
} from 'lucide-react';

const REASONS = [
  '서비스 이용 빈도가 낮아서',
  '원하는 상품이 없어서',
  '개인정보 보호를 위해',
  '다른 서비스를 이용하기 위해',
  '기타',
];

export default function WithdrawPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const { user, buyer, signOut } = useUser();

  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasActiveOrders, setHasActiveOrders] = useState(false);

  const isSocial = !!(buyer as any)?.socialProvider;
  const pointsBalance = buyer?.pointsBalance || 0;

  useEffect(() => {
    if (!buyer?.id) return;
    fetch('/api/me/check-active-orders')
      .then(r => r.json())
      .then(data => setHasActiveOrders(data.hasActiveOrders || false))
      .catch(() => {});
  }, [buyer?.id]);

  const canWithdraw = reason && confirmed && !hasActiveOrders && (isSocial || password.length >= 8);

  const handleWithdraw = async () => {
    if (!canWithdraw || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/me/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, password: isSocial ? undefined : password }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '탈퇴 처리에 실패했습니다');
      }
      await signOut();
      toast.success('탈퇴가 완료되었습니다');
      router.push(`/${locale}/no-shop-context`);
    } catch (error: any) {
      toast.error(error.message || '탈퇴 처리에 실패했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-lg mx-auto px-4 pt-4">
        <Link
          href={`/${locale}/my/profile`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-0.5" />
          회원정보
        </Link>

        <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
          <UserMinus className="h-5 w-5" />
          회원 탈퇴
        </h1>

        {/* Warnings */}
        <div className="bg-red-50 border border-red-100 rounded-2xl p-5 mb-3 space-y-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div className="text-sm text-red-700 space-y-1.5">
              <p>탈퇴 시 30일간 데이터 보존 후 완전 삭제됩니다.</p>
              {pointsBalance > 0 && (
                <p className="font-semibold">보유 포인트 {pointsBalance.toLocaleString()}P가 소멸됩니다.</p>
              )}
              <p>탈퇴 후 동일 이메일로 재가입이 제한될 수 있습니다.</p>
            </div>
          </div>
        </div>

        {hasActiveOrders && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-3">
            <p className="text-sm text-amber-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              미배송 주문이 있어 탈퇴할 수 없습니다
            </p>
          </div>
        )}

        {/* Reason */}
        <div className="bg-white rounded-2xl p-5 mb-3">
          <label className="text-sm font-semibold text-gray-700 mb-3 block">탈퇴 사유</label>
          <div className="space-y-2">
            {REASONS.map((r) => (
              <label key={r} className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer">
                <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} className="accent-gray-900" />
                {r}
              </label>
            ))}
          </div>
        </div>

        {/* Confirmation */}
        <div className="bg-white rounded-2xl p-5 mb-3">
          <label className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="accent-gray-900" />
            위 내용을 모두 확인했습니다
          </label>
          {!isSocial && (
            <div className="mt-4">
              <Input type="password" placeholder="비밀번호 확인" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 rounded-xl" />
            </div>
          )}
        </div>

        <Button
          onClick={handleWithdraw}
          disabled={!canWithdraw || isSubmitting}
          className="w-full h-12 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : '탈퇴하기'}
        </Button>
      </div>
    </div>
  );
}
