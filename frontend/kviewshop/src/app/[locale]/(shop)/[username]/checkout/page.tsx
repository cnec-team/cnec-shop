'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCartStore, useAuthStore } from '@/lib/store/auth';
import { getCreatorByShopId, getCheckoutProducts, createOrder } from '@/lib/actions/shop';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Loader2,
  ArrowLeft,
  ShoppingCart,
  MapPin,
  User,
  CheckCircle,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';

const INDIRECT_COMMISSION_RATE = 0.03;

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

function generateOrderNumber(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CNEC-${dateStr}-${random}`;
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

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    addressDetail: '',
    zipcode: '',
  });

  // Load checkout data
  useEffect(() => {
    const loadData = async () => {
      if (!username) return;

      try {
        // Fetch creator via server action
        const creatorData = await getCreatorByShopId(username);

        if (!creatorData) {
          router.push(`/${locale}`);
          return;
        }

        setCreator(creatorData);

        // Filter cart items for this creator
        const creatorItems = items.filter((item) => item.creatorId === creatorData.id);

        if (creatorItems.length === 0) {
          router.push(`/${locale}/${username}`);
          return;
        }

        // Fetch products via server action
        const productIds = creatorItems.map((item) => item.productId);
        const products = await getCheckoutProducts(productIds);

        const itemsWithProducts: CartItemWithProduct[] = creatorItems.map((item) => ({
          ...item,
          product: products?.find((p: any) => p.id === item.productId),
        }));

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
    return total + item.unitPrice * item.quantity;
  }, 0);

  // Calculate shipping fee based on product shipping_fee_type
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
    if (!validateForm() || !creator) return;

    setIsProcessing(true);

    try {
      const orderNumber = generateOrderNumber();

      // Determine brand_id from first product
      const firstProduct = cartItems[0]?.product;
      const brandId = firstProduct?.brandId || firstProduct?.brand?.id || '';

      // Read visitor cookie for attribution
      const visitorCookie = document.cookie
        .split('; ')
        .find((c) => c.startsWith('cnec_visitor='));
      const conversionType = visitorCookie ? 'DIRECT' : 'INDIRECT';

      // Build commission rates
      const commissionRates: Record<string, number> = {};
      cartItems.forEach((ci) => {
        commissionRates[ci.productId] = ci.campaignId
          ? 0.1
          : INDIRECT_COMMISSION_RATE;
      });

      // Create order via server action
      const result = await createOrder({
        orderNumber,
        creatorId: creator.id,
        brandId,
        buyerId: buyer?.id || null,
        buyerName: form.name,
        buyerPhone: form.phone,
        buyerEmail: form.email,
        shippingAddress: form.address,
        shippingDetail: form.addressDetail,
        shippingZipcode: form.zipcode,
        totalAmount,
        shippingFee,
        items: cartItems.map((item) => ({
          productId: item.productId,
          campaignId: item.campaignId || null,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.unitPrice * item.quantity,
          productName: item.product?.name || item.product?.nameKo || null,
          productImage: item.product?.imageUrl || (item.product?.images && item.product.images[0]) || null,
        })),
        conversionType: conversionType as 'DIRECT' | 'INDIRECT',
        commissionRates,
      });

      // Clear cart for this creator
      clearCart();

      // Show order completion
      setOrderResult({
        orderNumber: result.orderNumber ?? '',
        totalAmount,
      });
    } catch (error: any) {
      console.error('Checkout failed:', error);
      toast.error(error.message || '주문 처리 중 오류가 발생했습니다.');
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Empty cart state
  if (!creator || cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center px-4">
          <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-xl font-bold mb-2 text-foreground">장바구니가 비었습니다</h1>
          <p className="text-sm text-muted-foreground mb-4">
            상품을 추가한 후 다시 시도해주세요.
          </p>
          <Link href={`/${locale}/${username}`}>
            <Button className="btn-gold">쇼핑 계속하기</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Order completion state
  if (orderResult) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-lg mx-auto px-4 py-16">
          <div className="text-center">
            <CheckCircle className="h-16 w-16 mx-auto mb-4 text-success" />
            <h1 className="text-2xl font-bold text-foreground mb-2">
              주문이 완료되었습니다
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              주문 내역은 이메일로 전송됩니다.
            </p>

            <Card className="text-left">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">주문번호</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-medium text-foreground">
                      {orderResult.orderNumber}
                    </span>
                    <button
                      onClick={handleCopyOrderNumber}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">결제금액</span>
                  <span className="text-lg font-bold text-primary">
                    {formatKRW(orderResult.totalAmount)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="mt-8 space-y-3">
              <Link href={`/${locale}/${username}`} className="block">
                <Button className="w-full btn-gold h-11">쇼핑 계속하기</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Checkout form
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-lg mx-auto flex items-center h-12 px-4">
          <Link
            href={`/${locale}/${username}`}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">돌아가기</span>
          </Link>
          <h1 className="flex-1 text-center text-base font-semibold text-foreground pr-8">
            주문/결제
          </h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Cart Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingCart className="h-4 w-4" />
              주문 상품 ({cartItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cartItems.map((item) => (
              <div key={item.productId} className="flex gap-3">
                <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                  {item.product?.images?.[0] ? (
                    <img
                      src={item.product.images[0]}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {item.product?.brand?.brandName && (
                    <p className="text-[11px] text-muted-foreground">
                      {item.product.brand.brandName}
                    </p>
                  )}
                  <p className="text-sm font-medium text-foreground truncate">
                    {item.product?.name || '상품'}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">
                      수량: {item.quantity}
                    </span>
                    <span className="text-sm font-bold text-foreground">
                      {formatKRW(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Buyer Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              주문자 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">이름 *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="홍길동"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">전화번호 *</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="010-1234-5678"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">이메일 *</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="example@email.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Shipping Address */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4" />
              배송지
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="zipcode">우편번호 *</Label>
              <Input
                id="zipcode"
                value={form.zipcode}
                onChange={(e) => setForm({ ...form, zipcode: e.target.value })}
                placeholder="12345"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">주소 *</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="서울특별시 강남구 테헤란로 123"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressDetail">상세주소</Label>
              <Input
                id="addressDetail"
                value={form.addressDetail}
                onChange={(e) => setForm({ ...form, addressDetail: e.target.value })}
                placeholder="101동 1001호"
              />
            </div>
          </CardContent>
        </Card>

        {/* Total Amount */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">상품금액</span>
                <span className="text-foreground">{formatKRW(productAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">배송비</span>
                <span className={shippingFee === 0 ? 'text-success' : 'text-foreground'}>
                  {shippingFee === 0 ? '무료' : formatKRW(shippingFee)}
                </span>
              </div>
              <Separator className="my-3" />
              <div className="flex justify-between items-center">
                <span className="text-base font-semibold text-foreground">
                  총 결제금액
                </span>
                <span className="text-xl font-bold text-primary">
                  {formatKRW(totalAmount)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Checkout Button */}
        <Button
          onClick={handleCheckout}
          className="w-full h-12 text-base font-semibold btn-gold rounded-xl"
          disabled={isProcessing}
        >
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              주문 처리중...
            </span>
          ) : (
            `${formatKRW(totalAmount)} 결제하기`
          )}
        </Button>

        {/* Terms notice */}
        <p className="text-xs text-center text-muted-foreground pb-4">
          주문 시 개인정보 수집 및 이용에 동의하며,
          <br />
          결제 정보는 안전하게 암호화됩니다.
        </p>
      </div>
    </div>
  );
}
