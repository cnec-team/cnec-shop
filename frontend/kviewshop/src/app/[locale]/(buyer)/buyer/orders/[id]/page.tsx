'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@/lib/hooks/use-user';
import { getBuyerOrderDetail } from '@/lib/actions/buyer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
} from 'lucide-react';

const statusConfig: Record<string, { icon: typeof Clock; color: string; bgColor: string; label: string }> = {
  PENDING: { icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-500/10', label: 'Pending Payment' },
  PAID: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-500/10', label: 'Payment Confirmed' },
  PREPARING: { icon: Package, color: 'text-blue-600', bgColor: 'bg-blue-500/10', label: 'Preparing' },
  SHIPPING: { icon: Truck, color: 'text-purple-600', bgColor: 'bg-purple-500/10', label: 'Shipped' },
  DELIVERED: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-500/10', label: 'Delivered' },
  CONFIRMED: { icon: CheckCircle, color: 'text-green-700', bgColor: 'bg-green-600/10', label: 'Confirmed' },
  CANCELLED: { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-500/10', label: 'Cancelled' },
  REFUNDED: { icon: XCircle, color: 'text-gray-600', bgColor: 'bg-gray-500/10', label: 'Refunded' },
};

const shippingStatusSteps = ['PENDING', 'PAID', 'PREPARING', 'SHIPPING', 'DELIVERED'];

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const orderId = params.id as string;
  const { buyer } = useUser();

  const [isLoading, setIsLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    const loadOrder = async () => {
      if (!buyer || !orderId) {
        setIsLoading(false);
        return;
      }

      try {
        const orderData = await getBuyerOrderDetail(orderId, buyer.id);

        if (!orderData) {
          router.push('/' + locale + '/buyer/orders');
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
  }, [buyer, orderId, router, locale]);

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return '₩' + Number(amount).toLocaleString();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getItemName = (item: any): string => {
    return item.productName || item.product?.name || 'Unknown Product';
  };

  const getItemImage = (item: any): string | null => {
    return item.productImage || item.product?.imageUrl || null;
  };

  const getCreatorSlug = () => {
    return order?.creator?.shopId || order?.creator?.username || '';
  };

  const getCreatorColor = () => {
    return order?.creator?.themeColor || order?.creator?.backgroundColor || '#000';
  };

  const getCurrentStep = () => {
    if (!order) return 0;
    if (order.status === 'CANCELLED' || order.status === 'REFUNDED') return -1;
    return shippingStatusSteps.indexOf(order.status);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <ShoppingBag className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Order not found</h2>
        <Link href={'/' + locale + '/buyer/orders'}>
          <Button>Back to Orders</Button>
        </Link>
      </div>
    );
  }

  const status = statusConfig[order.status] || statusConfig.PENDING;
  const StatusIcon = status.icon;
  const currentStep = getCurrentStep();
  const subtotal = Number(order.totalAmount) - Number(order.shippingFee || 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <Link
        href={'/' + locale + '/buyer/orders'}
        className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to Orders
      </Link>

      {/* Order Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-headline font-bold flex items-center gap-2">
            Order {order.orderNumber}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => copyToClipboard(order.orderNumber)}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </h1>
          <p className="text-muted-foreground">Placed on {formatDate(order.createdAt)}</p>
        </div>
        <Badge className={'text-sm px-3 py-1 ' + status.bgColor + ' ' + status.color + ' border-0'}>
          <StatusIcon className="h-4 w-4 mr-1" />
          {status.label}
        </Badge>
      </div>

      {/* Progress Tracker */}
      {currentStep >= 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <div className="flex justify-between">
                {shippingStatusSteps.map((step, index) => {
                  const isCompleted = index <= currentStep;
                  const isCurrent = index === currentStep;
                  const stepLabel = statusConfig[step]?.label || step;
                  return (
                    <div key={step} className="flex flex-col items-center flex-1">
                      <div
                        className={
                          'w-8 h-8 rounded-full flex items-center justify-center z-10 ' +
                          (isCompleted
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground')
                        }
                      >
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <span className="text-sm">{index + 1}</span>
                        )}
                      </div>
                      <span
                        className={
                          'text-xs mt-2 ' +
                          (isCurrent ? 'font-semibold text-primary' : 'text-muted-foreground')
                        }
                      >
                        {stepLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
              {/* Progress Line */}
              <div className="absolute top-4 left-0 right-0 h-0.5 bg-muted -translate-y-1/2">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: (currentStep / (shippingStatusSteps.length - 1)) * 100 + '%' }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Items
                </CardTitle>
                {getCreatorSlug() && (
                  <Link
                    href={'/' + locale + '/' + getCreatorSlug()}
                    className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getCreatorColor() }}
                    />
                    {order.creator?.displayName || getCreatorSlug()}
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.orderItems?.map((item: any) => (
                <div key={item.id} className="flex gap-4">
                  <div className="relative w-20 h-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
                    {getItemImage(item) ? (
                      <Image
                        src={getItemImage(item)!}
                        alt={getItemName(item)}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium">{getItemName(item)}</h3>
                    <p className="text-sm text-muted-foreground">
                      Qty: {item.quantity} x {formatCurrency(Number(item.unitPrice))}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(Number(item.totalPrice))}</p>
                  </div>
                </div>
              ))}

              <Separator />

              {/* Order Summary */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{Number(order.shippingFee || 0) > 0 ? formatCurrency(Number(order.shippingFee)) : 'Free'}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(Number(order.totalAmount))}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tracking Info */}
          {order.trackingNumber && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Tracking Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Tracking Number</p>
                    <p className="font-mono font-semibold flex items-center gap-2">
                      {order.trackingNumber}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(order.trackingNumber || '')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order Details Sidebar */}
        <div className="space-y-6">
          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p className="font-medium">{order.buyerName}</p>
              <p>{order.shippingAddress}</p>
              <Separator className="my-3" />
              <p className="flex items-center gap-2">
                <Phone className="h-3 w-3 text-muted-foreground" />
                {order.buyerPhone}
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-3 w-3 text-muted-foreground" />
                {order.buyerEmail}
              </p>
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-4 w-4" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="outline" className="text-xs">
                  {order.paidAt ? 'Paid' : 'Pending'}
                </Badge>
              </div>
              {order.paidAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid At</span>
                  <span>{formatDate(order.paidAt)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-2">
            {order.status === 'DELIVERED' && (
              <Link href={'/' + locale + '/buyer/reviews?orderId=' + order.id} className="block">
                <Button className="w-full gap-2">
                  <Star className="h-4 w-4" />
                  Write a Review
                </Button>
              </Link>
            )}
            {['PENDING', 'PAID'].includes(order.status) && (
              <Button variant="outline" className="w-full text-destructive">
                Cancel Order
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
