'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCartStore, useAuthStore } from '@/lib/store/auth';
import { getCreatorByShopId, getCheckoutProducts } from '@/lib/actions/shop';
import {
  Loader2,
  ArrowLeft,
  ShoppingBag,
  CheckCircle,
  Copy,
  Lightbulb,
} from 'lucide-react';
import { toast } from 'sonner';

// =============================================
// Helpers
// =============================================

function formatKRW(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// =============================================
// Types
// =============================================

interface CartItemWithProduct {
  productId: string;
  campaignId?: string;
  quantity: number;
  creatorId: string;
  unitPrice: number;
  product?: any;
}

interface OrderResult {
  orderNumber: string;
  totalAmount: number;
}

const DELIVERY_MEMOS = [
  '선택하세요',
  '부재시 문 앞에 놓아주세요',
  '배송 전 연락 부탁드립니다',
  '경비실에 맡겨주세요',
  '직접 입력',
];

const PAYMENT_METHODS = [
  { value: 'card', label: '신용카드', payMethod: 'CARD' as const, easyPayProvider: undefined },
  { value: 'kakao', label: '카카오페이', payMethod: 'EASY_PAY' as const, easyPayProvider: 'KAKAOPAY' as const },
  { value: 'naver', label: '네이버페이', payMethod: 'EASY_PAY' as const, easyPayProvider: 'NAVERPAY' as const },
  { value: 'toss', label: '토스페이', payMethod: 'EASY_PAY' as const, easyPayProvider: 'TOSSPAY' as const },
];

// =============================================
// Main Component
// =============================================

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  const locale = params.locale as string;

  const { items, clearCart } = useCartStore();
  const buyer = useAuthStore((s) => s.buyer);

  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [creator, setCreator] = useState<any>(null);
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([]);
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);
  const [selectedPayment, setSelectedPayment] = useState('card');
  const [deliveryMemo, setDeliveryMemo] = useState('선택하세요');

  const [returnUrl, setReturnUrl] = useState('');

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    addressDetail: '',
    zipcode: '',
  });

  // Set returnUrl on client side
  useEffect(() => {
    setReturnUrl(window.location.pathname);
  }, []);

  // Load checkout data
  useEffect(() => {
    const loadData = async () => {
      if (!username) return;

      try {
        const creatorData = await getCreatorByShopId(username);

        if (!creatorData) {
          router.push(`/${locale}`);
          return;
        }

        setCreator(creatorData);

        const creatorItems = items.filter((item) => item.creatorId === creatorData.id);

        if (creatorItems.length === 0) {
          router.push(`/${locale}/${username}`);
          return;
        }

        const productIds = creatorItems.map((item) => item.productId);
        const products = await getCheckoutProducts(productIds);

        const itemsWithProducts: CartItemWithProduct[] = creatorItems.map((item) => {
          const product = products?.find((p: any) => p.id === item.productId);
          const cartPrice = Number(item.unitPrice);
          const dbPrice = Number(product?.salePrice ?? 0);
          return {
            ...item,
            unitPrice: isNaN(cartPrice) || cartPrice <= 0 ? dbPrice : cartPrice,
            product,
          };
        });

        setCartItems(itemsWithProducts);
      } catch (error) {
        console.error('Failed to load checkout data:', error);
        toast.error('데이터를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [username, items, locale, router]);

  const productAmount = cartItems.reduce((total, item) => {
    return total + Number(item.unitPrice) * item.quantity;
  }, 0);

  const shippingFee = (() => {
    let maxFee = 0;
    for (const item of cartItems) {
      const product = item.product as any;
      if (!product) continue;
      const feeType = product.shippingFeeType || 'FREE';
      if (feeType === 'PAID') {
        maxFee = Math.max(maxFee, Number(product.shippingFee || 0));
      } else if (feeType === 'CONDITIONAL_FREE') {
        const threshold = Number(product.freeShippingThreshold || 0);
        if (productAmount < threshold) {
          maxFee = Math.max(maxFee, Number(product.shippingFee || 0));
        }
      }
    }
    return maxFee;
  })();

  const totalAmount = productAmount + shippingFee;

  const validateForm = (): boolean => {
    if (!form.name.trim()) {
      toast.error('이름을 입력해주세요.');
      return false;
    }
    if (!form.phone.trim()) {
      toast.error('전화번호를 입력해주세요.');
      return false;
    }
    if (!form.email.trim()) {
      toast.error('이메일을 입력해주세요.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      toast.error('올바른 이메일 형식을 입력해주세요.');
      return false;
    }
    if (!form.address.trim()) {
      toast.error('주소를 입력해주세요.');
      return false;
    }
    if (!form.zipcode.trim()) {
      toast.error('우편번호를 입력해주세요.');
      return false;
    }
    return true;
  };

  const handleCheckout = async () => {
    if (!validateForm() || !creator || isProcessing) return;

    const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID;
    const channelKey = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY;
    if (!storeId || !channelKey) {
      toast.error('결제 시스템 설정이 완료되지 않았습니다. 관리자에게 문의해주세요.');
      return;
    }

    setIsProcessing(true);

    try {
      // 1. 서버에서 주문 생성 + 재고 차감
      const prepareRes = await fetch('/api/payments/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            productId: item.productId,
            campaignId: item.campaignId || undefined,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
          })),
          creatorId: creator.id,
          buyer: {
            name: form.name,
            phone: form.phone,
            email: form.email,
          },
          shipping: {
            address: form.address,
            zipcode: form.zipcode,
            detail: form.addressDetail || undefined,
            memo: deliveryMemo !== '선택하세요' ? deliveryMemo : undefined,
          },
        }),
      });

      if (!prepareRes.ok) {
        const err = await prepareRes.json();
        if (prepareRes.status === 409) {
          throw new Error('재고가 부족한 상품이 있습니다. 수량을 확인해주세요.');
        }
        throw new Error(err.error || '주문 생성에 실패했습니다.');
      }

      const { orderId, orderNumber, totalAmount: serverTotal } = await prepareRes.json();

      // 2. 포트원 SDK 로드 및 결제 요청
      let PortOne;
      try {
        PortOne = await import('@portone/browser-sdk/v2');
      } catch {
        throw new Error('결제 시스템을 불러오는 중 문제가 생겼어요. 새로고침 후 다시 시도해주세요.');
      }

      const paymentId = `${orderNumber}-${Date.now()}`;

      const firstItem = cartItems[0];
      const orderName =
        cartItems.length === 1
          ? (firstItem.product?.name || firstItem.product?.nameKo || '상품')
          : `${firstItem.product?.name || firstItem.product?.nameKo || '상품'} 외 ${cartItems.length - 1}건`;

      const selectedMethod = PAYMENT_METHODS.find((m) => m.value === selectedPayment) || PAYMENT_METHODS[0];

      const paymentRequest: Parameters<typeof PortOne.requestPayment>[0] = {
        storeId,
        channelKey,
        paymentId,
        orderName,
        totalAmount: Number(serverTotal),
        currency: 'KRW',
        payMethod: selectedMethod.payMethod,
        redirectUrl: `${window.location.origin}/${locale}/payment/success?orderId=${orderId}`,
        customer: {
          fullName: form.name,
          phoneNumber: form.phone,
          email: form.email,
        },
      };

      if (selectedMethod.payMethod === 'EASY_PAY' && selectedMethod.easyPayProvider) {
        paymentRequest.easyPay = { easyPayProvider: selectedMethod.easyPayProvider };
      }

      const paymentResponse = await PortOne.requestPayment(paymentRequest);

      // 3. SDK 결과 처리
      if (!paymentResponse || paymentResponse.code != null) {
        const code = paymentResponse?.code;
        if (code === 'USER_CANCEL') {
          toast.error('결제가 취소되었어요');
        } else {
          toast.error(paymentResponse?.message || '결제에 실패했어요. 다른 결제 수단을 시도해주세요.');
        }
        return;
      }

      // 4. 서버에서 결제 검증
      const completeRes = await fetch('/api/payments/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          paymentId: paymentResponse.paymentId,
          pgProvider: 'portone',
        }),
      });

      if (!completeRes.ok) {
        const err = await completeRes.json();
        throw new Error(err.error || '결제 확인 중 문제가 생겼어요. 고객센터에 문의해주세요.');
      }

      const completeData = await completeRes.json();

      // 5. 결제 성공 — 장바구니 비우고 결과 표시
      clearCart();
      setOrderResult({
        orderNumber: completeData.orderNumber || orderNumber,
        totalAmount: Number(serverTotal),
      });
    } catch (error: any) {
      console.error('Checkout failed:', error);
      toast.error(error.message || '네트워크 오류가 발생했어요. 다시 시도해주세요.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyOrderNumber = () => {
    if (orderResult) {
      navigator.clipboard.writeText(orderResult.orderNumber);
      toast.success('주문번호가 복사되었습니다.');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Empty cart state
  if (!creator || cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center px-4">
          <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h1 className="text-xl font-bold mb-2 text-gray-900">장바구니가 비었습니다</h1>
          <p className="text-sm text-gray-400 mb-6">
            상품을 추가한 후 다시 시도해주세요.
          </p>
          <Link
            href={`/${locale}/${username}`}
            className="inline-flex items-center justify-center h-11 px-8 bg-gray-900 text-white rounded-xl font-medium text-sm"
          >
            쇼핑 계속하기
          </Link>
        </div>
      </div>
    );
  }

  // Order completion state
  if (orderResult) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-lg mx-auto px-4 py-16">
          <div className="text-center">
            <CheckCircle className="h-16 w-16 mx-auto mb-4 text-emerald-500" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              결제가 완료되었습니다
            </h1>
            <p className="text-sm text-gray-400 mb-8">
              주문 내역은 이메일로 전송됩니다.
            </p>

            <div className="bg-white rounded-2xl p-5 text-left">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">주문번호</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-medium text-gray-900">
                    {orderResult.orderNumber}
                  </span>
                  <button
                    onClick={handleCopyOrderNumber}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="h-px bg-gray-100 my-4" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">결제금액</span>
                <span className="text-xl font-bold text-gray-900">
                  {formatKRW(orderResult.totalAmount)}
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-400 mt-4">
              배송은 브랜드에서 직접 처리합니다. 문의사항은 크넥에 연락해주세요.
            </p>

            <div className="mt-8 space-y-3">
              <Link
                href={`/${locale}/orders`}
                className="block w-full h-12 bg-gray-900 text-white rounded-xl font-semibold flex items-center justify-center"
              >
                주문 조회하기
              </Link>
              <Link
                href={`/${locale}/${username}`}
                className="block w-full h-12 border border-gray-200 text-gray-900 rounded-xl font-semibold flex items-center justify-center hover:bg-gray-50"
              >
                쇼핑 계속하기
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Checkout form
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-lg mx-auto flex items-center h-12 px-4">
          <Link
            href={`/${locale}/${username}`}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">돌아가기</span>
          </Link>
          <h1 className="flex-1 text-center text-base font-semibold text-gray-900 pr-8">
            주문/결제
          </h1>
        </div>
      </header>

      {/* Checkout Progress */}
      <div className="flex items-center justify-center gap-2 py-4 text-xs text-gray-400">
        <span className="text-gray-300">장바구니</span>
        <span>→</span>
        <span className="text-gray-900 font-medium">주문/결제</span>
        <span>→</span>
        <span className="text-gray-300">완료</span>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {/* Cart Summary */}
        <div className="bg-white rounded-2xl p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">주문 상품</h2>
          <div className="space-y-3">
            {cartItems.map((item) => (
              <div key={item.productId} className="flex gap-3">
                <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  {item.product?.images?.[0] ? (
                    <img
                      src={item.product.images[0]}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <ShoppingBag className="h-5 w-5 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.product?.name || '상품'}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-400">
                      수량: {item.quantity}
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {formatKRW(Number(item.unitPrice) * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Login Banner */}
        {!buyer && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-blue-800">
                  회원이시면 로그인하고 배송지를 자동으로 입력하세요
                </p>
                <Link
                  href={`/${locale}/buyer/login?returnUrl=${encodeURIComponent(returnUrl)}`}
                  className="inline-flex items-center mt-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                >
                  로그인하기
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Delivery Info */}
        <div className="bg-white rounded-2xl p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">배송 정보</h2>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">이름 *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="홍길동"
                className="w-full h-11 px-4 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">전화번호 *</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="010-1234-5678"
                className="w-full h-11 px-4 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">이메일 *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="example@email.com"
                className="w-full h-11 px-4 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">우편번호 *</label>
              <input
                type="text"
                value={form.zipcode}
                onChange={(e) => setForm({ ...form, zipcode: e.target.value })}
                placeholder="12345"
                className="w-full h-11 px-4 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">주소 *</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="서울특별시 강남구 테헤란로 123"
                className="w-full h-11 px-4 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">상세주소</label>
              <input
                type="text"
                value={form.addressDetail}
                onChange={(e) => setForm({ ...form, addressDetail: e.target.value })}
                placeholder="101동 1001호"
                className="w-full h-11 px-4 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">배송 메모</label>
              <select
                value={deliveryMemo}
                onChange={(e) => setDeliveryMemo(e.target.value)}
                className="w-full h-11 px-4 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 bg-white"
              >
                {DELIVERY_MEMOS.map((memo) => (
                  <option key={memo} value={memo}>{memo}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-2xl p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">결제 수단</h2>
          <div className="space-y-2">
            {PAYMENT_METHODS.map((method) => (
              <label
                key={method.value}
                className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                  selectedPayment === method.value
                    ? 'border-gray-900 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={method.value}
                  checked={selectedPayment === method.value}
                  onChange={() => setSelectedPayment(method.value)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedPayment === method.value
                    ? 'border-gray-900'
                    : 'border-gray-300'
                }`}>
                  {selectedPayment === method.value && (
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-900" />
                  )}
                </div>
                <span className="text-sm text-gray-900">{method.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Total Amount */}
        <div className="bg-white rounded-2xl p-5">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">상품금액</span>
              <span className="text-gray-900">{formatKRW(productAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">배송비</span>
              <span className={shippingFee === 0 ? 'text-emerald-500' : 'text-gray-900'}>
                {shippingFee === 0 ? '무료' : formatKRW(shippingFee)}
              </span>
            </div>
            <div className="h-px bg-gray-100 my-3" />
            <div className="flex justify-between items-center">
              <span className="text-base font-semibold text-gray-900">총 결제금액</span>
              <span className="text-xl font-bold text-gray-900">
                {formatKRW(totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Terms notice */}
        <p className="text-xs text-center text-gray-400 pb-2">
          주문 시 개인정보 수집 및 이용에 동의하며,
          <br />
          결제 정보는 안전하게 암호화됩니다.
        </p>
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-lg" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="max-w-lg mx-auto px-4 py-3">
          <button
            onClick={handleCheckout}
            disabled={isProcessing}
            className="w-full h-14 bg-gray-900 text-white rounded-xl font-semibold text-base hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                결제 처리중...
              </>
            ) : (
              <>총 {formatKRW(totalAmount)} 결제하기</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
