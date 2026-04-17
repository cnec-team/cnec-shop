'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@/lib/hooks/use-user';
import { getBuyerOrderDetail, confirmOrder } from '@/lib/actions/buyer';
import { Button } from '@/components/ui/button';
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  ShoppingBag,
  ChevronLeft,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Copy,
  Loader2,
  Star,
  Store,
  ExternalLink,
  AlertTriangle,
  X as XIcon,
  MessageCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { getTrackingUrl, getCourierLabel } from '@/lib/utils/courier';

const statusConfig: Record<string, { icon: typeof Clock; color: string; bgColor: string; label: string }> = {
  PENDING: { icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-50', label: '결제대기' },
  PAID: { icon: CheckCircle, color: 'text-blue-600', bgColor: 'bg-blue-50', label: '결제완료' },
  PREPARING: { icon: Package, color: 'text-amber-600', bgColor: 'bg-amber-50', label: '배송준비중' },
  SHIPPING: { icon: Truck, color: 'text-purple-600', bgColor: 'bg-purple-50', label: '배송중' },
  DELIVERED: { icon: CheckCircle, color: 'text-emerald-600', bgColor: 'bg-emerald-50', label: '배송완료' },
  CONFIRMED: { icon: CheckCircle, color: 'text-emerald-700', bgColor: 'bg-emerald-50', label: '구매확정' },
  CANCELLED: { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-50', label: '주문취소' },
  REFUNDED: { icon: XCircle, color: 'text-gray-600', bgColor: 'bg-gray-100', label: '환불완료' },
};

const PROGRESS_STEPS = ['PAID', 'PREPARING', 'SHIPPING', 'DELIVERED'];
const STEP_LABELS: Record<string, string> = {
  PAID: '결제',
  PREPARING: '준비',
  SHIPPING: '배송',
  DELIVERED: '완료',
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CARD: '신용카드',
  EASY_PAY: '간편결제',
  BANK_TRANSFER: '무통장입금',
  card: '신용카드',
  kakao: '카카오페이',
  naver: '네이버페이',
  toss: '토스페이',
  bank_transfer: '무통장입금',
};

export default function ShopOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const username = params.username as string;
  const orderId = params.orderId as string;
  const { buyer } = useUser();

  const [isLoading, setIsLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const buyerId = buyer?.id;

  useEffect(() => {
    const loadOrder = async () => {
      if (!buyerId || !orderId) {
        setIsLoading(false);
        return;
      }
      try {
        const orderData = await getBuyerOrderDetail(orderId, buyerId);
        if (!orderData) {
          router.push(`/${locale}/${username}/me/orders`);
          return;
        }
        setOrder(orderData);
      } catch (error) {
        console.error('Failed to load order:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadOrder();
  }, [buyerId, orderId, router, locale, username]);

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString() + '원';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('복사되었습니다');
  };

  const getItemName = (item: any): string => {
    return item.productName || item.product?.name || '상품';
  };

  const getItemImage = (item: any): string | null => {
    return item.productImage || item.product?.imageUrl || null;
  };

  const getCurrentStep = () => {
    if (!order) return 0;
    if (order.status === 'CANCELLED' || order.status === 'REFUNDED') return -1;
    if (order.status === 'CONFIRMED') return PROGRESS_STEPS.length; // past all steps
    return PROGRESS_STEPS.indexOf(order.status);
  };

  const handleConfirmOrder = async () => {
    if (isConfirming) return;
    setIsConfirming(true);
    try {
      await confirmOrder(order.id);
      toast.success('구매가 확정되었습니다');
      setOrder({ ...order, status: 'CONFIRMED', confirmedAt: new Date().toISOString() });
    } catch (error: any) {
      toast.error(error.message || '구매확정에 실패했습니다');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      toast.error('취소 사유를 입력해주세요.');
      return;
    }
    setIsCancelling(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '주문 취소에 실패했습니다.');
      }
      toast.success('주문이 취소되었습니다.');
      setOrder({ ...order, status: 'CANCELLED', cancelReason: cancelReason.trim() });
      setShowCancelDialog(false);
      setCancelReason('');
    } catch (error: any) {
      toast.error(error.message || '주문 취소에 실패했습니다.');
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">주문을 찾을 수 없습니다</h2>
          <Link
            href={`/${locale}/${username}/me/orders`}
            className="inline-flex items-center justify-center h-11 px-8 bg-gray-900 text-white rounded-xl font-medium text-sm"
          >
            주문내역으로
          </Link>
        </div>
      </div>
    );
  }

  const status = statusConfig[order.status] || statusConfig.PENDING;
  const StatusIcon = status.icon;
  const currentStep = getCurrentStep();
  const subtotal = Number(order.totalAmount) - Number(order.shippingFee || 0);
  const trackingUrl = getTrackingUrl(order.courierCode, order.trackingNumber);

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="max-w-lg mx-auto px-4 pt-4">
        {/* Back link */}
        <Link
          href={`/${locale}/${username}/me/orders`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4"
        >
          <ChevronLeft className="h-4 w-4 mr-0.5" />
          주문내역
        </Link>

        {/* Order header */}
        <div className="bg-white rounded-2xl p-5 mb-3">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs text-gray-400">주문번호</p>
              <p className="text-sm font-mono font-medium text-gray-900 flex items-center gap-1.5">
                {order.orderNumber}
                <button onClick={() => copyToClipboard(order.orderNumber)} className="text-gray-400 hover:text-gray-600">
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </p>
            </div>
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
              <StatusIcon className="h-3.5 w-3.5" />
              {status.label}
            </span>
          </div>
          <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
        </div>

        {/* Section 1: Progress tracker */}
        {currentStep >= 0 && (
          <div className="bg-white rounded-2xl p-5 mb-3">
            <div className="relative flex justify-between">
              {PROGRESS_STEPS.map((step, index) => {
                const isCompleted = index <= currentStep;
                const isCurrent = index === currentStep;
                return (
                  <div key={step} className="flex flex-col items-center flex-1 z-10">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isCompleted
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <span className="text-xs">{index + 1}</span>
                      )}
                    </div>
                    <span
                      className={`text-[11px] mt-1.5 ${
                        isCurrent ? 'font-semibold text-gray-900' : 'text-gray-400'
                      }`}
                    >
                      {STEP_LABELS[step]}
                    </span>
                    {/* Timestamps */}
                    {step === 'PAID' && order.paidAt && (
                      <span className="text-[10px] text-gray-300 mt-0.5">{formatDate(order.paidAt).split(' ').slice(-1)}</span>
                    )}
                    {step === 'SHIPPING' && order.shippedAt && (
                      <span className="text-[10px] text-gray-300 mt-0.5">{formatDate(order.shippedAt).split(' ').slice(-1)}</span>
                    )}
                    {step === 'DELIVERED' && order.deliveredAt && (
                      <span className="text-[10px] text-gray-300 mt-0.5">{formatDate(order.deliveredAt).split(' ').slice(-1)}</span>
                    )}
                  </div>
                );
              })}
              {/* Progress line */}
              <div className="absolute top-4 left-[12.5%] right-[12.5%] h-0.5 bg-gray-100 -translate-y-1/2">
                <div
                  className="h-full bg-gray-900 transition-all duration-500"
                  style={{ width: `${Math.min((currentStep / (PROGRESS_STEPS.length - 1)) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Cancelled status */}
        {(order.status === 'CANCELLED' || order.status === 'REFUNDED') && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-3">
            <div className="flex items-center gap-2 text-red-600 text-sm font-medium">
              <XCircle className="h-4 w-4" />
              {order.status === 'CANCELLED' ? '주문이 취소되었습니다' : '환불이 완료되었습니다'}
            </div>
            {order.cancelReason && (
              <p className="text-xs text-red-500 mt-1">사유: {order.cancelReason}</p>
            )}
          </div>
        )}

        {/* Section 2: Order items */}
        <div className="bg-white rounded-2xl p-5 mb-3">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <Package className="w-4 h-4" />
            주문 상품
          </h3>
          <div className="space-y-4">
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex gap-3">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  {getItemImage(item) ? (
                    <Image src={getItemImage(item)!} alt={getItemName(item)} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-5 w-5 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{getItemName(item)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    수량: {item.quantity} x {formatCurrency(Number(item.unitPrice))}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(Number(item.totalPrice))}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="h-px bg-gray-100 my-4" />

          {/* Order Summary */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">상품금액</span>
              <span className="text-gray-900">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">배송비</span>
              <span className="text-gray-900">
                {Number(order.shippingFee || 0) > 0 ? formatCurrency(Number(order.shippingFee)) : '무료'}
              </span>
            </div>
            <div className="h-px bg-gray-100 my-1" />
            <div className="flex justify-between font-semibold text-base">
              <span className="text-gray-900">총 결제금액</span>
              <span className="text-gray-900">{formatCurrency(Number(order.totalAmount))}</span>
            </div>
          </div>
        </div>

        {/* Section 3: Shipping / Tracking */}
        <div className="bg-white rounded-2xl p-5 mb-3">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4" />
            배송 정보
          </h3>
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
            <div className="flex justify-between">
              <span className="text-gray-400">연락처</span>
              <span className="text-gray-900">{order.buyerPhone || '-'}</span>
            </div>
            {order.shippingMemo && (
              <div className="flex justify-between">
                <span className="text-gray-400">요청사항</span>
                <span className="text-gray-600">{order.shippingMemo}</span>
              </div>
            )}
          </div>

          {/* Tracking info */}
          {order.trackingNumber && (
            <>
              <div className="h-px bg-gray-100 my-4" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">택배사</span>
                  <span className="text-gray-900">{getCourierLabel(order.courierCode)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">운송장번호</span>
                  <span className="font-mono text-gray-900 flex items-center gap-1.5">
                    {order.trackingNumber}
                    <button onClick={() => copyToClipboard(order.trackingNumber || '')} className="text-gray-400 hover:text-gray-600">
                      <Copy className="h-3 w-3" />
                    </button>
                  </span>
                </div>
                {trackingUrl && (
                  <a href={trackingUrl} target="_blank" rel="noopener noreferrer" className="block mt-2">
                    <Button variant="outline" size="sm" className="w-full gap-2 rounded-xl">
                      <Truck className="h-4 w-4" />
                      배송 추적
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </a>
                )}
              </div>
            </>
          )}
        </div>

        {/* Section 4: Payment info */}
        <div className="bg-white rounded-2xl p-5 mb-3">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <CreditCard className="w-4 h-4" />
            결제 정보
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">결제상태</span>
              <span className="text-gray-900">{order.paidAt ? '결제완료' : '결제대기'}</span>
            </div>
            {order.paymentMethod && (
              <div className="flex justify-between">
                <span className="text-gray-400">결제수단</span>
                <span className="text-gray-900">
                  {PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}
                </span>
              </div>
            )}
            {order.paidAt && (
              <div className="flex justify-between">
                <span className="text-gray-400">결제일시</span>
                <span className="text-gray-600">{formatDate(order.paidAt)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Section 5: Brand / CS */}
        {order.brand && (
          <div className="bg-white rounded-2xl p-5 mb-3">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <Store className="w-4 h-4" />
              판매자 정보
            </h3>
            <div className="space-y-2 text-sm">
              <p className="font-medium text-gray-900">
                {order.brand.brandName || order.brand.companyName}
              </p>
              {order.brand.contactPhone && (
                <a href={`tel:${order.brand.contactPhone}`} className="flex items-center gap-2 text-gray-500 hover:text-gray-900">
                  <Phone className="h-3 w-3" />
                  {order.brand.contactPhone}
                </a>
              )}
              {order.brand.contactEmail && (
                <a href={`mailto:${order.brand.contactEmail}`} className="flex items-center gap-2 text-gray-500 hover:text-gray-900">
                  <Mail className="h-3 w-3" />
                  {order.brand.contactEmail}
                </a>
              )}
              <div className="h-px bg-gray-100 my-2" />
              <p className="text-xs text-gray-400">
                배송/교환/환불은 {order.brand.brandName || order.brand.companyName}이 처리합니다
              </p>
            </div>
            <button
              onClick={() => toast.info('1:1 문의는 준비 중입니다')}
              className="mt-3 w-full flex items-center justify-center gap-2 h-10 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              1:1 문의
            </button>
          </div>
        )}

        {/* Cancel notice */}
        {['SHIPPING', 'DELIVERED'].includes(order.status) && order.status !== 'CONFIRMED' && (
          <div className="bg-gray-50 rounded-2xl p-4 mb-3 text-sm text-gray-500">
            <p className="flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              배송 시작 후에는 취소가 불가합니다.
            </p>
            {(order.brand?.brandName || order.brand?.companyName) && (
              <p className="text-xs mt-1">
                교환/환불은 {order.brand.brandName || order.brand.companyName}에 문의해주세요.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Bottom sticky actions */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-lg"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="max-w-lg mx-auto px-4 py-3 flex gap-3">
          {order.status === 'DELIVERED' && (
            <>
              <Button
                onClick={handleConfirmOrder}
                disabled={isConfirming}
                className="flex-1 h-12 bg-gray-900 text-white rounded-xl font-semibold gap-2"
              >
                {isConfirming ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                구매 확정
              </Button>
              <Button
                variant="outline"
                onClick={() => toast.info('후기 작성은 준비 중입니다')}
                className="flex-1 h-12 rounded-xl gap-2"
              >
                <Star className="h-4 w-4" />
                후기 작성
              </Button>
            </>
          )}
          {order.status === 'CONFIRMED' && (
            <Link href={`/${locale}/${username}`} className="flex-1">
              <Button className="w-full h-12 bg-gray-900 text-white rounded-xl font-semibold gap-2">
                <ShoppingBag className="h-4 w-4" />
                재구매하기
              </Button>
            </Link>
          )}
          {['PENDING', 'PAID', 'PREPARING'].includes(order.status) && (
            <Button
              variant="outline"
              className="flex-1 h-12 rounded-xl text-red-500 border-red-200 hover:bg-red-50"
              onClick={() => setShowCancelDialog(true)}
            >
              주문 취소
            </Button>
          )}
          {!['DELIVERED', 'CONFIRMED', 'PENDING', 'PAID', 'PREPARING'].includes(order.status) && (
            <Link href={`/${locale}/${username}`} className="flex-1">
              <Button variant="outline" className="w-full h-12 rounded-xl gap-2">
                <ShoppingBag className="h-4 w-4" />
                샵 둘러보기
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Cancel Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50">
          <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-6 space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">주문을 취소하시겠습니까?</h3>
              <button onClick={() => { setShowCancelDialog(false); setCancelReason(''); }} className="text-gray-400 hover:text-gray-600">
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-500">취소 사유 *</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="취소 사유를 입력해주세요"
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 h-12 rounded-xl"
                onClick={() => { setShowCancelDialog(false); setCancelReason(''); }}
                disabled={isCancelling}
              >
                닫기
              </Button>
              <Button
                className="flex-1 h-12 rounded-xl bg-red-500 hover:bg-red-600 text-white"
                onClick={handleCancelOrder}
                disabled={isCancelling || !cancelReason.trim()}
              >
                {isCancelling ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />처리중...</> : '취소하기'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
