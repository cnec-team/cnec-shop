'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import Link from 'next/link';
import { useCartStore, useAuthStore } from '@/lib/store/auth';
import { Button } from '@/components/ui/button';
import { CheckCircle, Package, Home, Loader2, AlertCircle } from 'lucide-react';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = params.locale as string;
  const clearCart = useCartStore((state) => state.clearCart);
  const buyer = useAuthStore((s) => s.buyer);

  const [isProcessing, setIsProcessing] = useState(true);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const orderId = searchParams.get('orderId');
  const paymentKey = searchParams.get('paymentKey');
  const amount = searchParams.get('amount');

  useEffect(() => {
    const confirmPayment = async () => {
      if (!orderId || !paymentKey || !amount) {
        setError('결제 정보가 올바르지 않습니다');
        setIsProcessing(false);
        return;
      }

      try {
        const response = await fetch('/api/payments/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId,
            paymentKey,
            amount: parseInt(amount),
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || '결제 확인에 실패했습니다');
        }

        setOrderNumber(result.orderNumber || orderId);
        clearCart();
      } catch (err: unknown) {
        console.error('Payment confirmation error:', err);
        setError(err instanceof Error ? err.message : '결제 확인에 실패했습니다');
      } finally {
        setIsProcessing(false);
      }
    };

    confirmPayment();
  }, [orderId, paymentKey, amount, clearCart]);

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md mx-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-gray-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-900">결제를 확인하고 있습니다</h2>
          <p className="text-sm text-gray-400 mt-2">잠시만 기다려주세요</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md mx-4 bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center space-y-6">
          <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">결제 확인에 실패했습니다</h2>
            <p className="text-sm text-gray-500 mt-2">{error}</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => router.back()}>
              돌아가기
            </Button>
            <Link href={'/' + locale} className="flex-1">
              <Button className="w-full h-12 bg-gray-900 text-white hover:bg-gray-800 rounded-xl">
                홈으로
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center space-y-6">
          {/* Success icon */}
          <div className="h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
            <CheckCircle className="h-10 w-10 text-emerald-500" />
          </div>

          {/* Title */}
          <div>
            <h1 className="text-xl font-bold text-gray-900">주문이 완료되었습니다</h1>
            <p className="text-sm text-gray-500 mt-2">결제가 정상적으로 처리되었습니다</p>
            {orderNumber && (
              <p className="font-mono text-base mt-3 font-semibold text-gray-900">{orderNumber}</p>
            )}
          </div>

          {/* Confirmation */}
          <div className="bg-gray-50 rounded-xl p-4 text-sm text-left space-y-2">
            <div className="flex items-center gap-2 text-gray-600">
              <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>결제가 확인되었습니다</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>주문 확인 알림이 발송되었습니다</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>판매자에게 주문이 전달되었습니다</span>
            </div>
          </div>

          {/* Shipping & CS Info */}
          <div className="bg-gray-50 rounded-xl p-4 text-sm text-center space-y-1">
            <p className="text-gray-600 font-medium">브랜드에서 직접 배송됩니다</p>
            <p className="text-xs text-gray-400">문의사항은 크넥 고객센터로 연락해주세요</p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Link href={buyer ? ('/' + locale + '/buyer/orders') : ('/' + locale + '/orders' + (orderNumber ? '?orderNumber=' + encodeURIComponent(orderNumber) : ''))}>
              <Button className="w-full h-12 bg-gray-900 text-white hover:bg-gray-800 rounded-xl gap-2">
                <Package className="h-4 w-4" />
                주문 내역 보기
              </Button>
            </Link>
            <Link href={'/' + locale}>
              <Button variant="outline" className="w-full h-12 rounded-xl gap-2">
                <Home className="h-4 w-4" />
                쇼핑 계속하기
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
