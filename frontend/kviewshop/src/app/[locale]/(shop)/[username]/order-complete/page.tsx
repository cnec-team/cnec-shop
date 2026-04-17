'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  CheckCircle,
  Clock,
  Copy,
  Landmark,
  Package,
  ShoppingBag,
  MessageCircle,
  Bell,
  Zap,
  Gift,
  Loader2,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { getOrderComplete } from '@/lib/actions/shop';

function formatKRW(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string | Date | null): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface BankInfo {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

interface OrderItem {
  id: string;
  productName?: string | null;
  productImage?: string | null;
  quantity: number;
  unitPrice: number | string;
  totalPrice: number | string;
  product?: {
    name?: string | null;
    nameKo?: string | null;
    thumbnailUrl?: string | null;
    images?: string[];
  } | null;
}

interface OrderCompleteData {
  orderNumber: string;
  totalAmount: number;
  createdAt?: string;
  isBankTransfer?: boolean;
  bankInfo?: BankInfo;
  shopUsername?: string;
  items?: OrderItem[];
  shippingAddress?: string;
  buyerName?: string;
  buyerPhone?: string;
  brandName?: string;
  brandPhone?: string;
  brandEmail?: string;
  shippingFee?: number;
  creatorName?: string;
  isLoggedIn?: boolean;
}

export default function ShopOrderCompletePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = params.locale as string;
  const username = params.username as string;
  const [data, setData] = useState<OrderCompleteData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // 1차: sessionStorage에서 데이터 로드
        const stored = sessionStorage.getItem('cnec-order-complete');
        if (stored) {
          const parsed = JSON.parse(stored);
          setData(parsed);
          sessionStorage.removeItem('cnec-order-complete');
          setIsLoading(false);
          return;
        }
      } catch {
        // sessionStorage not available
      }

      // 2차: URL 쿼리 파라미터(orderNumber)로 서버 조회
      const orderNumber = searchParams.get('orderNumber');
      if (orderNumber) {
        try {
          const order = await getOrderComplete(orderNumber);
          if (order) {
            const items: OrderItem[] = (order.items || []).map((item: any) => ({
              id: item.id,
              productName: item.productName,
              productImage: item.productImage,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              product: item.product,
            }));

            setData({
              orderNumber: order.orderNumber || orderNumber,
              totalAmount: Number(order.totalAmount),
              createdAt: order.createdAt ? String(order.createdAt) : undefined,
              isBankTransfer: order.paymentMethod === 'BANK_TRANSFER',
              items,
              shippingAddress: order.shippingAddress || undefined,
              buyerName: order.buyerName || undefined,
              buyerPhone: order.buyerPhone || undefined,
              brandName: order.brand?.brandName || order.brand?.companyName || undefined,
              brandPhone: order.brand?.contactPhone || undefined,
              brandEmail: order.brand?.contactEmail || undefined,
              shippingFee: Number(order.shippingFee || 0),
              shopUsername: order.creator?.shopId || undefined,
              creatorName: order.creator?.displayName || undefined,
            });
          }
        } catch {
          // 서버 조회 실패
        }
      }

      setIsLoading(false);
    };

    loadData();
  }, [searchParams]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('복사되었습니다');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

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
            href={`/${locale}/${username}`}
            className="inline-flex items-center justify-center h-11 px-8 bg-gray-900 text-white rounded-xl font-medium text-sm"
          >
            샵으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const isBankTransfer = data.isBankTransfer;
  const creatorName = data.creatorName || username;
  const brandName = data.brandName;
  const isLoggedIn = data.isLoggedIn;

  // Summary: first item + count
  const firstItem = data.items?.[0];
  const itemCount = data.items?.length ?? 0;
  const firstItemName =
    firstItem?.productName ||
    firstItem?.product?.name ||
    firstItem?.product?.nameKo ||
    '상품';
  const firstItemImage =
    firstItem?.productImage ||
    firstItem?.product?.thumbnailUrl ||
    (firstItem?.product?.images && firstItem.product.images.length > 0
      ? firstItem.product.images[0]
      : null);

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="max-w-lg mx-auto px-4 py-12">
        {/* Header: icon + title */}
        <div className="text-center mb-8">
          {isBankTransfer ? (
            <div className="h-20 w-20 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
              <Clock className="h-10 w-10 text-amber-500" />
            </div>
          ) : (
            <div className="h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10 text-emerald-500" />
            </div>
          )}
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {isBankTransfer ? '주문이 접수되었습니다' : '주문이 완료됐어요'}
          </h1>
          <div className="text-sm text-gray-400 mt-2 space-y-0.5">
            <p>주문번호: <span className="font-mono">{data.orderNumber}</span>
              <button
                onClick={() => handleCopy(data.orderNumber)}
                className="inline-flex ml-1.5 text-gray-400 hover:text-gray-600"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </p>
            {data.createdAt && (
              <p>{formatDate(data.createdAt)}</p>
            )}
          </div>
        </div>

        {/* Creator attribution message */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <MessageCircle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">
                {creatorName}님의 추천 감사합니다
              </p>
              {brandName ? (
                <p className="text-sm text-blue-700 mt-0.5">
                  배송은 {brandName}에서 직접 보내드려요. 보통 2-3일 소요됩니다
                </p>
              ) : (
                <p className="text-sm text-blue-700 mt-0.5">
                  배송은 브랜드에서 직접 보내드려요. 보통 2-3일 소요됩니다
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bank transfer account info */}
        {isBankTransfer && data.bankInfo && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Landmark className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-semibold text-amber-900">
                입금 계좌 안내
              </span>
            </div>
            <div className="space-y-2">
              {data.bankInfo.bankName && (
                <div className="flex justify-between text-sm">
                  <span className="text-amber-700">은행</span>
                  <span className="font-medium text-amber-900">{data.bankInfo.bankName}</span>
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
                  <span className="font-medium text-amber-900">{data.bankInfo.accountHolder}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-amber-700">입금금액</span>
                <span className="font-bold text-amber-900">{formatKRW(data.totalAmount)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Order summary card */}
        {firstItem && (
          <div className="bg-white rounded-2xl p-5 mb-4">
            <div className="flex gap-3">
              <div className="w-16 h-16 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden">
                {firstItemImage ? (
                  <Image
                    src={firstItemImage}
                    alt={firstItemName}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-5 h-5 text-gray-300" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {firstItemName}
                  {itemCount > 1 && (
                    <span className="text-gray-400 font-normal"> 외 {itemCount - 1}건</span>
                  )}
                </p>
                <p className="text-lg font-bold text-gray-900 mt-1">
                  {formatKRW(data.totalAmount)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Signup nudge (비로그인 시만) */}
        {!isLoggedIn && (
          <div className="bg-white rounded-2xl p-5 mb-4 border border-gray-100">
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              회원가입하면
            </h3>
            <div className="space-y-3 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4 text-blue-500" />
                </div>
                <span className="text-sm text-gray-700">주문 추적 자동</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4 text-amber-500" />
                </div>
                <span className="text-sm text-gray-700">다음 결제 30초</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                  <Gift className="w-4 h-4 text-emerald-500" />
                </div>
                <span className="text-sm text-gray-700">즉시 3,000 포인트</span>
              </div>
            </div>
            <Link
              href={`/${locale}/buyer/signup?returnUrl=${encodeURIComponent(`/${locale}/${username}`)}`}
              className="flex items-center justify-center w-full h-12 bg-[#FEE500] text-[#191919] rounded-xl font-semibold text-sm hover:bg-[#FFD700] transition-colors"
            >
              카카오로 1초 가입
            </Link>
          </div>
        )}

        {/* 비회원 주문 조회 안내 */}
        {!isLoggedIn && (
          <div className="text-center mb-4">
            <p className="text-xs text-gray-400 mb-1">
              비회원 주문 조회는 주문번호 + 전화번호로 가능해요
            </p>
            <Link
              href={`/${locale}/orders?orderNumber=${data.orderNumber}&guest=1`}
              className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
            >
              <Search className="w-3 h-3" />
              주문 조회하기
            </Link>
          </div>
        )}
      </div>

      {/* Bottom sticky CTA */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-lg"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="max-w-lg mx-auto px-4 py-3 flex gap-3">
          <Link
            href={
              isLoggedIn
                ? `/${locale}/buyer/orders`
                : `/${locale}/orders?orderNumber=${data.orderNumber}&guest=1`
            }
            className="flex-1 flex items-center justify-center gap-2 h-12 bg-gray-900 text-white rounded-xl font-semibold text-sm"
          >
            <Package className="h-4 w-4" />
            주문내역 보기
          </Link>
          <Link
            href={`/${locale}/${username}`}
            className="flex-1 flex items-center justify-center h-12 border border-gray-200 text-gray-900 rounded-xl font-semibold text-sm hover:bg-gray-50"
          >
            샵 둘러보기
          </Link>
        </div>
      </div>
    </div>
  );
}
