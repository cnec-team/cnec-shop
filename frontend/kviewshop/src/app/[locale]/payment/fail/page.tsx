'use client';

import { useSearchParams, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { XCircle, RefreshCw, Home, HelpCircle, CreditCard, Wifi, PackageX } from 'lucide-react';

const errorMessages: Record<string, { message: string; type: 'cancelled' | 'card' | 'network' | 'stock' | 'general' }> = {
  PAY_PROCESS_CANCELED: { message: '결제가 취소되었습니다', type: 'cancelled' },
  PAY_PROCESS_ABORTED: { message: '결제가 중단되었습니다', type: 'cancelled' },
  REJECT_CARD_COMPANY: { message: '카드사에서 결제를 거부했습니다', type: 'card' },
  EXCEED_MAX_DAILY_PAYMENT_COUNT: { message: '일일 결제 한도를 초과했습니다', type: 'card' },
  EXCEED_MAX_PAYMENT_AMOUNT: { message: '최대 결제 금액을 초과했습니다', type: 'card' },
  INVALID_CARD_EXPIRATION: { message: '카드 유효기간이 만료되었습니다', type: 'card' },
  INVALID_STOPPED_CARD: { message: '사용이 중지된 카드입니다', type: 'card' },
  INVALID_CARD_LOST: { message: '분실 신고된 카드입니다', type: 'card' },
  INVALID_CARD_NUMBER: { message: '카드 번호가 올바르지 않습니다', type: 'card' },
  INSUFFICIENT_BALANCE: { message: '잔액이 부족합니다', type: 'card' },
  NOT_SUPPORTED_INSTALLMENT_PLAN_CARD_OR_MERCHANT: { message: '할부 결제가 지원되지 않는 카드입니다', type: 'card' },
  INVALID_CARD_ISSUER: { message: '카드 발급사를 확인해주세요', type: 'card' },
  DUPLICATED_PAYMENT: { message: '이미 결제된 주문입니다', type: 'general' },
  NOT_AVAILABLE_PAYMENT: { message: '사용할 수 없는 결제 수단입니다', type: 'general' },
  OUT_OF_STOCK: { message: '상품이 품절되었습니다', type: 'stock' },
  NETWORK_ERROR: { message: '네트워크 연결이 불안정합니다', type: 'network' },
};

function getErrorInfo(code: string) {
  return errorMessages[code] || { message: '결제 처리 중 오류가 발생했습니다', type: 'general' as const };
}

function getErrorIcon(type: string) {
  switch (type) {
    case 'card': return <CreditCard className="h-10 w-10 text-red-500" />;
    case 'network': return <Wifi className="h-10 w-10 text-red-500" />;
    case 'stock': return <PackageX className="h-10 w-10 text-red-500" />;
    default: return <XCircle className="h-10 w-10 text-red-500" />;
  }
}

export default function PaymentFailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = params.locale as string;

  const code = searchParams.get('code') || 'UNKNOWN_ERROR';
  const serverMessage = searchParams.get('message');
  const orderId = searchParams.get('orderId');

  const errorInfo = getErrorInfo(code);
  const displayMessage = serverMessage || errorInfo.message;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center space-y-6">
          {/* Error icon */}
          <div className="h-20 w-20 rounded-full bg-red-50 flex items-center justify-center mx-auto">
            {getErrorIcon(errorInfo.type)}
          </div>

          {/* Title & message */}
          <div>
            <h1 className="text-xl font-bold text-gray-900">결제에 실패했습니다</h1>
            <p className="text-sm text-gray-500 mt-2">{displayMessage}</p>
            {code && code !== 'UNKNOWN_ERROR' && (
              <p className="font-mono text-[10px] text-gray-300 mt-2">
                오류 코드: {code}
              </p>
            )}
          </div>

          {/* Help box */}
          <div className="bg-gray-50 rounded-xl p-4 text-sm text-left space-y-2">
            <p className="font-medium text-gray-700 mb-2">이런 이유일 수 있어요</p>
            <ul className="list-disc list-inside space-y-1 text-gray-500 text-xs">
              {errorInfo.type === 'card' && (
                <>
                  <li>카드 한도를 확인해주세요</li>
                  <li>카드 유효기간이 지났을 수 있어요</li>
                  <li>다른 카드로 시도해보세요</li>
                </>
              )}
              {errorInfo.type === 'cancelled' && (
                <>
                  <li>결제 창에서 취소 버튼을 누르셨어요</li>
                  <li>결제 시간이 초과되었을 수 있어요</li>
                </>
              )}
              {errorInfo.type === 'network' && (
                <>
                  <li>인터넷 연결을 확인해주세요</li>
                  <li>잠시 후 다시 시도해주세요</li>
                </>
              )}
              {errorInfo.type === 'stock' && (
                <>
                  <li>다른 고객이 먼저 구매했을 수 있어요</li>
                  <li>다른 상품을 확인해보세요</li>
                </>
              )}
              {errorInfo.type === 'general' && (
                <>
                  <li>잔액이 부족할 수 있어요</li>
                  <li>카드 정보를 다시 확인해주세요</li>
                  <li>잠시 후 다시 시도해주세요</li>
                </>
              )}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            {errorInfo.type !== 'stock' ? (
              <Button
                className="w-full h-12 bg-gray-900 text-white hover:bg-gray-800 rounded-xl text-sm font-semibold gap-2"
                onClick={() => window.history.back()}
              >
                <RefreshCw className="h-4 w-4" />
                다시 시도하기
              </Button>
            ) : (
              <Link href={'/' + locale} className="w-full">
                <Button className="w-full h-12 bg-gray-900 text-white hover:bg-gray-800 rounded-xl text-sm font-semibold gap-2">
                  <Home className="h-4 w-4" />
                  쇼핑 계속하기
                </Button>
              </Link>
            )}

            {errorInfo.type === 'card' && (
              <Button
                variant="outline"
                className="w-full h-12 rounded-xl text-sm font-semibold gap-2"
                onClick={() => window.history.back()}
              >
                <CreditCard className="h-4 w-4" />
                다른 결제수단으로 시도
              </Button>
            )}

            <Link href={'/' + locale}>
              <Button variant="outline" className="w-full h-12 rounded-xl text-sm gap-2">
                <Home className="h-4 w-4" />
                홈으로 돌아가기
              </Button>
            </Link>

            <Button variant="ghost" className="w-full text-xs text-gray-400 gap-1">
              <HelpCircle className="h-3.5 w-3.5" />
              고객센터 문의
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
