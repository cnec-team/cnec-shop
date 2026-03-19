'use client';

import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  getBrandSession,
  getBrandOrders,
  updateOrderStatus,
  cancelOrder as cancelOrderAction,
  handleShippingStart as shippingStartAction,
  updateTrackingInfo,
} from '@/lib/actions/brand';
import { ORDER_STATUS_LABELS } from '@/types/database';

type OrderStatus = 'PAID' | 'PREPARING' | 'SHIPPING' | 'DELIVERED' | 'CONFIRMED' | 'CANCELLED' | 'REFUNDED';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Download,
  ChevronDown,
  ChevronUp,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  ShoppingCart,
} from 'lucide-react';

const COURIERS = [
  { code: 'cj', name: 'CJ대한통운' },
  { code: 'hanjin', name: '한진택배' },
  { code: 'logen', name: '로젠택배' },
  { code: 'epost', name: '우체국택배' },
  { code: 'lotte', name: '롯데택배' },
];

const COURIER_MAP: Record<string, string> = Object.fromEntries(
  COURIERS.map((c) => [c.code, c.name])
);

interface OrderWithDetails {
  id: string;
  orderNumber: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;
  totalAmount: number;
  shippingFee: number;
  status: OrderStatus;
  trackingNumber: string | null;
  courierCode: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelReason?: string | null;
  shippingAddress?: string;
  shippingDetail?: string | null;
  shippingZipcode?: string | null;
  createdAt: string;
  items?: { id: string; quantity: number; totalPrice: number; product?: { name: string; thumbnailUrl?: string | null } | null }[];
  creator?: { displayName: string | null } | null;
}

function formatCurrency(num: number): string {
  return `${num.toLocaleString('ko-KR')}원`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusColor(status: OrderStatus): string {
  switch (status) {
    case 'PAID': return 'bg-blue-500/10 text-blue-600 border-blue-200';
    case 'PREPARING': return 'bg-yellow-500/10 text-yellow-600 border-yellow-200';
    case 'SHIPPING': return 'bg-purple-500/10 text-purple-600 border-purple-200';
    case 'DELIVERED': return 'bg-green-500/10 text-green-600 border-green-200';
    case 'CONFIRMED': return 'bg-gray-500/10 text-gray-600 border-gray-200';
    case 'CANCELLED': return 'bg-red-500/10 text-red-600 border-red-200';
    case 'REFUNDED': return 'bg-red-500/10 text-red-600 border-red-200';
    default: return '';
  }
}

function getStatusIcon(status: OrderStatus) {
  switch (status) {
    case 'PAID': return <Clock className="h-4 w-4" />;
    case 'PREPARING': return <Package className="h-4 w-4" />;
    case 'SHIPPING': return <Truck className="h-4 w-4" />;
    case 'DELIVERED': return <CheckCircle className="h-4 w-4" />;
    case 'CONFIRMED': return <CheckCircle className="h-4 w-4" />;
    case 'CANCELLED': return <XCircle className="h-4 w-4" />;
    case 'REFUNDED': return <XCircle className="h-4 w-4" />;
    default: return null;
  }
}

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PAID: 'PREPARING',
  PREPARING: 'SHIPPING',
  SHIPPING: 'DELIVERED',
  DELIVERED: 'CONFIRMED',
};

const NEXT_STATUS_LABEL: Partial<Record<OrderStatus, string>> = {
  PAID: '배송준비',
  PREPARING: '배송 시작',
  SHIPPING: '배송완료 처리',
  DELIVERED: '구매확정 처리',
};

const STATUS_TABS: { value: string; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'PAID', label: '신규주문' },
  { value: 'PREPARING', label: '배송준비' },
  { value: 'SHIPPING', label: '배송중' },
  { value: 'DELIVERED', label: '배송완료' },
  { value: 'CANCELLED', label: '취소/환불' },
];

export default function BrandOrdersPage() {
  const [brand, setBrand] = useState<{ id: string } | null>(null);
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({});
  const [courierInputs, setCourierInputs] = useState<Record<string, string>>({});
  const [cancelReasonInputs, setCancelReasonInputs] = useState<Record<string, string>>({});
  const [showCancelForm, setShowCancelForm] = useState<Record<string, boolean>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const brandData = await getBrandSession();
      if (brandData) setBrand(brandData);
      else setIsLoading(false);
    }
    init();
  }, []);

  useEffect(() => {
    if (!brand?.id) return;
    async function fetchOrders() {
      try {
        const data = await getBrandOrders(brand!.id, statusFilter);
        setOrders(
          (data ?? []).map((o: any) => ({
            ...o,
            createdAt: o.createdAt?.toISOString?.() ?? o.createdAt,
            shippedAt: o.shippedAt?.toISOString?.() ?? o.shippedAt,
            deliveredAt: o.deliveredAt?.toISOString?.() ?? o.deliveredAt,
          })) as OrderWithDetails[]
        );
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      }
      setIsLoading(false);
    }
    setIsLoading(true);
    fetchOrders();
  }, [brand?.id, statusFilter]);

  async function handleStatusChange(orderId: string, newStatus: OrderStatus) {
    setUpdatingId(orderId);
    try {
      const trackingNumber = newStatus === 'SHIPPING' ? trackingInputs[orderId] : undefined;
      const courierCode = newStatus === 'SHIPPING' ? courierInputs[orderId] : undefined;
      await updateOrderStatus(orderId, newStatus, trackingNumber, courierCode);
      setOrders(orders.map((o) => o.id === orderId ? { ...o, status: newStatus, ...(trackingNumber ? { trackingNumber } : {}), ...(courierCode ? { courierCode } : {}) } : o));
    } catch (error) { console.error('Failed to update order status:', error); }
    setUpdatingId(null);
  }

  async function handleCancelOrder(orderId: string) {
    const reason = cancelReasonInputs[orderId]?.trim();
    if (!reason) return;
    setUpdatingId(orderId);
    try {
      await cancelOrderAction(orderId, reason);
      setOrders(orders.map((o) => o.id === orderId ? { ...o, status: 'CANCELLED' as OrderStatus, cancelReason: reason } : o));
      setShowCancelForm({ ...showCancelForm, [orderId]: false });
      setCancelReasonInputs({ ...cancelReasonInputs, [orderId]: '' });
    } catch (error) { console.error('Failed to cancel order:', error); }
    setUpdatingId(null);
  }

  async function handleShippingStart(orderId: string) {
    const trackingNumber = trackingInputs[orderId];
    const courierCode = courierInputs[orderId];
    if (!trackingNumber?.trim()) return;
    setUpdatingId(orderId);
    try {
      await shippingStartAction(orderId, trackingNumber, courierCode);
      setOrders(orders.map((o) => o.id === orderId ? { ...o, status: 'SHIPPING' as OrderStatus, trackingNumber: trackingNumber.trim(), ...(courierCode ? { courierCode } : {}) } : o));
    } catch (error) { console.error('Failed to start shipping:', error); }
    setUpdatingId(null);
  }

  async function handleTrackingSave(orderId: string) {
    const trackingNumber = trackingInputs[orderId];
    const courierCode = courierInputs[orderId];
    if (!trackingNumber) return;
    try {
      await updateTrackingInfo(orderId, trackingNumber, courierCode);
      setOrders(orders.map((o) => o.id === orderId ? { ...o, trackingNumber, ...(courierCode ? { courierCode } : {}) } : o));
    } catch (error) { console.error('Failed to save tracking info:', error); }
  }

  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  function handleDownloadExcel() {
    if (orders.length === 0) return;
    const rows = orders.map((order) => {
      const totalQuantity = (order.items ?? []).reduce((sum, item) => sum + item.quantity, 0);
      const productNames = (order.items ?? []).map((item) => item.product?.name ?? '상품').join(', ');
      return {
        '주문번호': order.orderNumber,
        '주문일시': new Date(order.createdAt).toLocaleString('ko-KR'),
        '상품명': productNames,
        '수량': totalQuantity,
        '결제금액': order.totalAmount,
        '주문자명': order.buyerName,
        '배송지': `${order.shippingAddress ?? ''} ${order.shippingDetail ?? ''}`.trim(),
        '주문상태': ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS],
        '크리에이터명': order.creator?.displayName ?? '-',
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '주문목록');
    XLSX.writeFile(wb, `cnec_orders_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">주문 관리</h1>
          <p className="text-sm text-muted-foreground mt-1">주문 {orders.length}건</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleDownloadExcel} disabled={orders.length === 0} className="h-9">
          <Download className="h-4 w-4 mr-1.5" />
          엑셀 다운로드
        </Button>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => {
          const count = tab.value === 'ALL' ? orders.length :
            tab.value === 'CANCELLED' ? (statusCounts['CANCELLED'] ?? 0) + (statusCounts['REFUNDED'] ?? 0) :
            statusCounts[tab.value] ?? 0;
          return (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                statusFilter === tab.value
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-white border text-muted-foreground hover:bg-gray-50'
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`inline-flex min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                  statusFilter === tab.value ? 'bg-white/20 text-primary-foreground' :
                  tab.value === 'PAID' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Orders list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <Card className="bg-white rounded-xl border shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ShoppingCart className="h-16 w-16 text-muted-foreground/20 mb-4" />
            <p className="text-lg font-medium mb-1">아직 주문이 없어요</p>
            <p className="text-sm text-muted-foreground">
              캠페인을 시작하면 주문이 들어와요
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            const totalQuantity = (order.items ?? []).reduce((sum, item) => sum + item.quantity, 0);

            return (
              <Card key={order.id} className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                {/* Order row */}
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer"
                  onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                >
                  {/* Product thumbnail */}
                  <div className="hidden sm:block h-12 w-12 rounded-lg bg-gray-100 shrink-0 overflow-hidden">
                    {order.items?.[0]?.product?.thumbnailUrl ? (
                      <img src={order.items[0].product.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="h-5 w-5 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-muted-foreground">{order.orderNumber}</span>
                      <Badge variant="outline" className={getStatusColor(order.status)}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium truncate">
                      {order.items?.[0]?.product?.name ?? '상품'}
                      {(order.items?.length ?? 0) > 1 && (
                        <span className="text-muted-foreground"> 외 {(order.items?.length ?? 1) - 1}건</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {order.buyerName} · {formatDate(order.createdAt)}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold">{formatCurrency(order.totalAmount)}</p>
                    <p className="text-xs text-muted-foreground">{totalQuantity}개</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {/* Quick action buttons */}
                    {order.status === 'PREPARING' && (
                      <Button size="sm" variant="default" className="h-8 text-xs hidden sm:flex"
                        disabled={updatingId === order.id}
                        onClick={() => setExpandedOrderId(order.id)}
                      >
                        송장입력
                      </Button>
                    )}
                    {order.status === 'PAID' && (
                      <Button size="sm" variant="outline" className="h-8 text-xs hidden sm:flex"
                        disabled={updatingId === order.id}
                        onClick={() => handleStatusChange(order.id, 'PREPARING')}
                      >
                        배송준비
                      </Button>
                    )}
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t bg-gray-50/50 p-4 space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-sm font-medium mb-2">배송지 정보</p>
                        <div className="rounded-lg bg-white border p-3 text-sm text-muted-foreground space-y-0.5">
                          <p className="font-medium text-foreground">{order.buyerName} ({order.buyerPhone})</p>
                          <p>{order.shippingAddress}</p>
                          {order.shippingDetail && <p>{order.shippingDetail}</p>}
                          {order.shippingZipcode && <p>우편번호: {order.shippingZipcode}</p>}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">주문 상품</p>
                        <div className="rounded-lg bg-white border p-3 space-y-2">
                          {(order.items ?? []).map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span>{item.product?.name ?? '상품'} x {item.quantity}</span>
                              <span className="text-muted-foreground">{formatCurrency(item.totalPrice)}</span>
                            </div>
                          ))}
                          <Separator />
                          <div className="flex justify-between text-sm">
                            <span>배송비</span><span>{formatCurrency(order.shippingFee)}</span>
                          </div>
                          <div className="flex justify-between text-sm font-semibold">
                            <span>총 결제금액</span><span>{formatCurrency(order.totalAmount)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tracking info */}
                    {order.trackingNumber && (
                      <div className="rounded-lg bg-white border p-3">
                        <p className="text-sm font-medium mb-1">배송 추적 정보</p>
                        <div className="text-sm text-muted-foreground space-y-0.5">
                          {order.courierCode && <p>택배사: {COURIER_MAP[order.courierCode] ?? order.courierCode}</p>}
                          <p>송장번호: {order.trackingNumber}</p>
                          {order.shippedAt && <p>발송일시: {formatDate(order.shippedAt)}</p>}
                          {order.deliveredAt && <p>배송완료: {formatDate(order.deliveredAt)}</p>}
                        </div>
                      </div>
                    )}

                    {/* Cancel reason */}
                    {order.status === 'CANCELLED' && order.cancelReason && (
                      <div className="rounded-lg bg-red-50 border border-red-100 p-3">
                        <p className="text-sm font-medium text-red-600 mb-1">취소 사유</p>
                        <p className="text-sm text-red-500">{order.cancelReason}</p>
                      </div>
                    )}

                    {/* Shipping actions */}
                    {order.status !== 'CANCELLED' && order.status !== 'CONFIRMED' && order.status !== 'REFUNDED' && (
                      <div className="rounded-lg bg-white border p-3 space-y-3">
                        <p className="text-sm font-medium">배송 처리</p>
                        <div className="flex flex-wrap items-end gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">택배사</Label>
                            <Select
                              value={courierInputs[order.id] ?? order.courierCode ?? ''}
                              onValueChange={(value) => setCourierInputs({ ...courierInputs, [order.id]: value })}
                            >
                              <SelectTrigger className="w-40 h-9"><SelectValue placeholder="택배사 선택" /></SelectTrigger>
                              <SelectContent>
                                {COURIERS.map((c) => (<SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">송장번호</Label>
                            <Input
                              value={trackingInputs[order.id] ?? order.trackingNumber ?? ''}
                              onChange={(e) => setTrackingInputs({ ...trackingInputs, [order.id]: e.target.value })}
                              placeholder="송장번호 입력"
                              className="w-52 h-9"
                            />
                          </div>
                          {(order.status === 'SHIPPING' || order.status === 'DELIVERED') && (
                            <Button variant="outline" size="sm" className="h-9" onClick={() => handleTrackingSave(order.id)}>송장 저장</Button>
                          )}
                          {order.status === 'PREPARING' && (
                            <Button size="sm" className="h-9" disabled={updatingId === order.id || !trackingInputs[order.id]?.trim()}
                              onClick={() => handleShippingStart(order.id)}>
                              {updatingId === order.id ? '처리 중...' : '배송 시작'}
                            </Button>
                          )}
                          {NEXT_STATUS[order.status] && order.status !== 'PREPARING' && (
                            <Button size="sm" className="h-9" disabled={updatingId === order.id}
                              onClick={() => handleStatusChange(order.id, NEXT_STATUS[order.status]!)}>
                              {updatingId === order.id ? '처리 중...' : NEXT_STATUS_LABEL[order.status]}
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Cancel form */}
                    {order.status === 'PAID' && (
                      <div>
                        {!showCancelForm[order.id] ? (
                          <Button variant="destructive" size="sm" disabled={updatingId === order.id}
                            onClick={() => setShowCancelForm({ ...showCancelForm, [order.id]: true })}>
                            주문 취소
                          </Button>
                        ) : (
                          <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-2">
                            <p className="text-sm font-medium text-red-600">주문 취소</p>
                            <Textarea
                              value={cancelReasonInputs[order.id] ?? ''}
                              onChange={(e) => setCancelReasonInputs({ ...cancelReasonInputs, [order.id]: e.target.value })}
                              placeholder="취소 사유를 입력하세요"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <Button variant="destructive" size="sm" disabled={updatingId === order.id || !cancelReasonInputs[order.id]?.trim()}
                                onClick={() => handleCancelOrder(order.id)}>
                                {updatingId === order.id ? '처리 중...' : '취소 확인'}
                              </Button>
                              <Button variant="outline" size="sm"
                                onClick={() => setShowCancelForm({ ...showCancelForm, [order.id]: false })}>
                                닫기
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
