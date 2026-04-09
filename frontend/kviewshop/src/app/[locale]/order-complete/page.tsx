'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle,
  Clock,
  Copy,
  Landmark,
  Package,
  ShoppingBag,
} from 'lucide-react';
import { toast } from 'sonner';

function formatKRW(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface BankInfo {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

interface OrderCompleteData {
  orderNumber: string;
  totalAmount: number;
  isBankTransfer?: boolean;
  bankInfo?: BankInfo;
  shopUsername?: string;
}

export default function OrderCompletePage() {
  const params = useParams();
  const locale = params.locale as string;
  const [data, setData] = useState<OrderCompleteData | null>(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('cnec-order-complete');
      if (stored) {
        setData(JSON.parse(stored));
        sessionStorage.removeItem('cnec-order-complete');
      }
    } catch {
      // sessionStorage not available
    }
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('복사되었습니다.');
  };

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h1 className="text-lg font-bold text-gray-900 mb-2">
            주문 정보를 찾을 수 없습니다
          </h1>
          <p className="text-sm text-gray-400 mb-6">
            이미 확인한 주문이거나 잘못된 접근입니다.
          </p>
          <Link
            href={`/${locale}`}
            className="inline-flex items-center justify-center h-11 px-8 bg-gray-900 text-white rounded-xl font-medium text-sm"
          >
            홈으로 이동
          </Link>
        </div>
      </div>
    );
  }

  const isBankTransfer = data.isBankTransfer;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-16">
        <div className="text-center">
          {/* Icon */}
          {isBankTransfer ? (
            <div className="h-20 w-20 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
              <Clock className="h-10 w-10 text-amber-500" />
            </div>
          ) : (
            <div className="h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10 text-emerald-500" />
            </div>
          )}

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isBankTransfer ? '주문이 접수되었습니다' : '결제가 완료되었습니다'}
          </h1>
          <p className="text-sm text-gray-400 mb-8">
            {isBankTransfer
              ? '아래 계좌로 입금해주시면 주문이 확정됩니다.'
              : '주문이 정상적으로 처리되었습니다.'}
          </p>

          {/* Order Info */}
          <div className="bg-white rounded-2xl p-5 text-left space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">주문번호</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-medium text-gray-900">
                  {data.orderNumber}
                </span>
                <button
                  onClick={() => handleCopy(data.orderNumber)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">
                {isBankTransfer ? '입금금액' : '결제금액'}
              </span>
              <span className="text-xl font-bold text-gray-900">
                {formatKRW(data.totalAmount)}
              </span>
            </div>

            {/* Bank transfer account info */}
            {isBankTransfer && data.bankInfo && (
              <>
                <div className="h-px bg-gray-100" />
                <div className="bg-amber-50 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Landmark className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-semibold text-amber-900">
                      입금 계좌 안내
                    </span>
                  </div>
                  {data.bankInfo.bankName && (
                    <div className="flex justify-between text-sm">
                      <span className="text-amber-700">은행</span>
                      <span className="font-medium text-amber-900">
                        {data.bankInfo.bankName}
                      </span>
                    </div>
                  )}
                  {data.bankInfo.accountNumber && (
                    <div className="flex justify-between text-sm">
                      <span className="text-amber-700">계좌번호</span>
                      <button
                        onClick={() => handleCopy(data.bankInfo!.accountNumber)}
                        className="flex items-center gap-1.5 font-mono font-medium text-amber-900 hover:text-amber-700"
                      >
                        {data.bankInfo.accountNumber}
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  {data.bankInfo.accountHolder && (
                    <div className="flex justify-between text-sm">
                      <span className="text-amber-700">예금주</span>
                      <span className="font-medium text-amber-900">
                        {data.bankInfo.accountHolder}
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Status info */}
          <div className="bg-white rounded-2xl p-4 mt-3">
            {isBankTransfer ? (
              <div className="text-sm text-left space-y-2">
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>입금 확인 후 주문이 확정됩니다</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <CheckCircle className="h-4 w-4 text-gray-300 shrink-0" />
                  <span className="text-gray-400">
                    확인까지 영업일 기준 1~2일 소요
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-left space-y-2">
                <div className="flex items-center gap-2 text-gray-600">
                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>결제가 확인되었습니다</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>판매자에게 주문이 전달되었습니다</span>
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-gray-400 mt-4">
            배송은 브랜드에서 직접 처리합니다. 문의사항은 크넥에 연락해주세요.
          </p>

          {/* Actions */}
          <div className="mt-8 space-y-3">
            <Link
              href={`/${locale}/buyer/orders`}
              className="flex items-center justify-center gap-2 w-full h-12 bg-gray-900 text-white rounded-xl font-semibold"
            >
              <Package className="h-4 w-4" />
              주문 내역 보기
            </Link>
            {data.shopUsername && (
              <Link
                href={`/${locale}/${data.shopUsername}`}
                className="flex items-center justify-center w-full h-12 border border-gray-200 text-gray-900 rounded-xl font-semibold hover:bg-gray-50"
              >
                쇼핑 계속하기
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
