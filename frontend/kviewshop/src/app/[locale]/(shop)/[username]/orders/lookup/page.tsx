'use client';

import { useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { lookupOrder } from '@/lib/actions/shop';
import { getCourierLabel, getTrackingUrl } from '@/lib/utils/courier';
import {
  Search,
  Package,
  Truck,
  Loader2,
  ShoppingBag,
  Bell,
  Zap,
  Gift,
  ExternalLink,
} from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  PENDING: '결제대기',
  PAID: '결제완료',
  PREPARING: '배송준비',
  SHIPPING: '배송중',
  DELIVERED: '배송완료',
  CONFIRMED: '구매확정',
  CANCELLED: '취소',
  REFUNDED: '환불',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-50 text-yellow-700',
  PAID: 'bg-blue-50 text-blue-700',
  PREPARING: 'bg-amber-50 text-amber-700',
  SHIPPING: 'bg-purple-50 text-purple-700',
  DELIVERED: 'bg-emerald-50 text-emerald-700',
  CONFIRMED: 'bg-emerald-50 text-emerald-700',
  CANCELLED: 'bg-red-50 text-red-700',
  REFUNDED: 'bg-gray-100 text-gray-600',
};

function formatDate(dateString: string | Date | null): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString() + '원';
}

export default function GuestOrderLookupPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = params.locale as string;
  const username = params.username as string;

  const initialOrderNumber = searchParams.get('orderNumber') || searchParams.get('orderId') || '';
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [buyerPhone, setBuyerPhone] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!orderNumber.trim() || !buyerPhone.trim()) {
      setError('주문번호와 전화번호를 모두 입력해주세요.');
      return;
    }
    setLoading(true);
    setError(null);
    setOrder(null);
    setSearched(true);
    try {
      const data = await lookupOrder(orderNumber.trim(), buyerPhone.trim());
      if (!data) {
        setError('주문을 찾을 수 없습니다. 주문번호와 전화번호를 확인해주세요.');
        return;
      }
      setOrder(data);
    } catch {
      setError('주문 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
            <ShoppingBag className="w-6 h-6 text-gray-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">비회원 주문 조회</h1>
          <p className="text-sm text-gray-400 mt-2">
            주문번호와 전화번호로 주문을 조회합니다
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-2xl p-5 mb-4">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">주문번호</label>
              <input
                type="text"
                placeholder="CNEC-20260213-12345"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                disabled={loading}
                className="w-full h-11 px-4 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 disabled:opacity-50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">주문자 전화번호</label>
              <input
                type="tel"
                placeholder="01012345678"
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(e.target.value)}
                disabled={loading}
                className="w-full h-11 px-4 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gray-900 text-white rounded-xl font-semibold text-sm hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />조회중...</> : <><Search className="w-4 h-4" />주문 조회</>}
            </button>
          </form>
        </div>

        {/* Signup nudge */}
        <div className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
          <p className="text-sm font-medium text-gray-900 mb-3">가입하시면</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <Bell className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-gray-600">주문 추적 자동</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-gray-600">다음 결제 30초</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Gift className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-gray-600">즉시 3,000 포인트</span>
            </div>
          </div>
          <Link
            href={`/${locale}/buyer/signup?returnUrl=${encodeURIComponent(`/${locale}/${username}`)}`}
            className="mt-3 flex items-center justify-center w-full h-10 bg-[#FEE500] text-[#191919] rounded-xl font-semibold text-sm"
          >
            카카오로 1초 가입
          </Link>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 rounded-2xl p-4 mb-4">
            <p className="text-red-600 text-sm text-center">{error}</p>
          </div>
        )}

        {/* No results */}
        {searched && !loading && !error && !order && (
          <div className="bg-white rounded-2xl p-5 mb-4">
            <p className="text-gray-400 text-sm text-center">검색 결과가 없습니다.</p>
          </div>
        )}

        {/* Order Details */}
        {order && (
          <div className="space-y-3">
            {/* Status */}
            <div className="bg-white rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-900">주문 상태</h2>
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                  {STATUS_LABELS[order.status] || order.status}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">주문번호</span>
                  <span className="font-mono font-medium text-gray-900">{order.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">주문일시</span>
                  <span className="text-gray-600">{formatDate(order.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="bg-white rounded-2xl p-5">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Package className="w-4 h-4" />
                주문 상품
              </h2>
              <div className="space-y-4">
                {order.items?.map((item: any, index: number) => {
                  const productName = item.product?.name || item.productName || '상품';
                  const imageUrl = item.product?.thumbnailUrl || item.productImage || (item.product?.images?.[0] ?? null);
                  return (
                    <div key={item.id}>
                      {index > 0 && <div className="h-px bg-gray-100 mb-4" />}
                      <div className="flex gap-3">
                        <div className="w-16 h-16 bg-gray-100 rounded-xl flex-shrink-0 overflow-hidden">
                          {imageUrl ? (
                            <Image src={imageUrl} alt={productName} width={64} height={64} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-5 h-5 text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{productName}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {formatCurrency(Number(item.unitPrice))} x {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">{formatCurrency(Number(item.totalPrice))}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="h-px bg-gray-100 my-4" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">배송비</span>
                  <span className="text-gray-600">
                    {Number(order.shippingFee) === 0 ? '무료' : formatCurrency(Number(order.shippingFee))}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-base pt-1">
                  <span className="text-gray-900">총 결제금액</span>
                  <span className="text-gray-900">{formatCurrency(Number(order.totalAmount))}</span>
                </div>
              </div>
            </div>

            {/* Shipping / Tracking */}
            <div className="bg-white rounded-2xl p-5">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Truck className="w-4 h-4" />
                배송 정보
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">받는분</span>
                  <span className="text-gray-900">{order.buyerName || '-'}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-gray-400 shrink-0">배송지</span>
                  <span className="text-right ml-4 text-gray-900">
                    {order.shippingAddress}
                    {order.shippingDetail && ` ${order.shippingDetail}`}
                  </span>
                </div>
              </div>

              {order.trackingNumber && (() => {
                const trackingUrl = getTrackingUrl(order.courierCode, order.trackingNumber);
                return (
                  <>
                    <div className="h-px bg-gray-100 my-4" />
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">택배사</span>
                        <span className="text-gray-900">{getCourierLabel(order.courierCode)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">운송장번호</span>
                        <span className="font-mono text-gray-900">{order.trackingNumber}</span>
                      </div>
                      {trackingUrl && (
                        <a href={trackingUrl} target="_blank" rel="noopener noreferrer" className="block mt-2">
                          <button className="w-full h-10 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 hover:bg-gray-50 flex items-center justify-center gap-2">
                            <Truck className="w-4 h-4" />
                            배송 추적하기
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </a>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
