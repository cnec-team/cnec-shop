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
  bulkShippingStart,
} from '@/lib/actions/brand';
import { ORDER_STATUS_LABELS } from '@/types/database';

type OrderStatus = 'PAID' | 'PREPARING' | 'SHIPPING' | 'DELIVERED' | 'CONFIRMED' | 'CANCELLED' | 'REFUNDED';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
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
  User,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Send,
  AlertTriangle,
  Loader2,
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
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
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
  shippingMemo?: string | null;
  createdAt: string;
  items?: { id: string; quantity: number; unitPrice: number; totalPrice: number; product?: { name: string; thumbnailUrl?: string | null; images?: string[] } | null }[];
  creator?: { displayName: string | null } | null;
}

function formatCurrency(num: number): string {
  return `${num.toLocaleString('ko-KR')}원`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusStyle(status: OrderStatus) {
  switch (status) {
    case 'PAID': return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' };
    case 'PREPARING': return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' };
    case 'SHIPPING': return { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', dot: 'bg-violet-500' };
    case 'DELIVERED': return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' };
    case 'CONFIRMED': return { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', dot: 'bg-gray-400' };
    case 'CANCELLED': return { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', dot: 'bg-red-500' };
    case 'REFUNDED': return { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', dot: 'bg-red-500' };
    default: return { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', dot: 'bg-gray-400' };
  }
}

function getStatusIcon(status: OrderStatus) {
  switch (status) {
    case 'PAID': return <Clock className="h-3.5 w-3.5" />;
    case 'PREPARING': return <Package className="h-3.5 w-3.5" />;
    case 'SHIPPING': return <Truck className="h-3.5 w-3.5" />;
    case 'DELIVERED': return <CheckCircle className="h-3.5 w-3.5" />;
    case 'CONFIRMED': return <CheckCircle className="h-3.5 w-3.5" />;
    case 'CANCELLED': return <XCircle className="h-3.5 w-3.5" />;
    case 'REFUNDED': return <XCircle className="h-3.5 w-3.5" />;
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
  PAID: '승인 (배송준비)',
  PREPARING: '발송 처리',
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

  // Bulk shipping
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [bulkShipOpen, setBulkShipOpen] = useState(false);
  const [bulkCourier, setBulkCourier] = useState('cj');
  const [bulkTrackingInputs, setBulkTrackingInputs] = useState<Record<string, string>>({});
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // Confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    variant: 'default' | 'destructive';
    onConfirm: () => void;
  }>({ open: false, title: '', description: '', variant: 'default', onConfirm: () => {} });

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
          (data ?? []).map((o: Record<string, unknown>) => ({
            ...o,
            createdAt: (o.createdAt as Date)?.toISOString?.() ?? o.createdAt,
            shippedAt: (o.shippedAt as Date)?.toISOString?.() ?? o.shippedAt,
            deliveredAt: (o.deliveredAt as Date)?.toISOString?.() ?? o.deliveredAt,
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

  function showConfirm(title: string, description: string, onConfirm: () => void, variant: 'default' | 'destructive' = 'default') {
    setConfirmDialog({ open: true, title, description, variant, onConfirm });
  }

  async function handleStatusChange(orderId: string, newStatus: OrderStatus) {
    setUpdatingId(orderId);
    try {
      const trackingNumber = newStatus === 'SHIPPING' ? trackingInputs[orderId] : undefined;
      const courierCode = newStatus === 'SHIPPING' ? courierInputs[orderId] : undefined;
      await updateOrderStatus(orderId, newStatus, trackingNumber, courierCode);
      setOrders(orders.map((o) => o.id === orderId ? { ...o, status: newStatus, ...(trackingNumber ? { trackingNumber } : {}), ...(courierCode ? { courierCode } : {}) } : o));
      toast.success('주문 상태가 변경되었습니다');
    } catch (error) {
      console.error('Failed to update order status:', error);
      toast.error('상태 변경에 실패했습니다');
    }
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
      toast.success('주문이 취소되었습니다');
    } catch (error) {
      console.error('Failed to cancel order:', error);
      toast.error('주문 취소에 실패했습니다');
    }
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
      toast.success('발송 처리되었습니다');
    } catch (error) {
      console.error('Failed to start shipping:', error);
      toast.error('발송 처리에 실패했습니다');
    }
    setUpdatingId(null);
  }

  async function handleTrackingSave(orderId: string) {
    const trackingNumber = trackingInputs[orderId];
    const courierCode = courierInputs[orderId];
    if (!trackingNumber) return;
    try {
      await updateTrackingInfo(orderId, trackingNumber, courierCode);
      setOrders(orders.map((o) => o.id === orderId ? { ...o, trackingNumber, ...(courierCode ? { courierCode } : {}) } : o));
      toast.success('송장 정보가 저장되었습니다');
    } catch (error) {
      console.error('Failed to save tracking info:', error);
      toast.error('송장 저장에 실패했습니다');
    }
  }

  // Bulk shipping helpers
  const shippableOrders = orders.filter((o) => o.status === 'PREPARING');
  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };
  const toggleSelectAll = () => {
    if (selectedOrderIds.size === shippableOrders.length) {
      setSelectedOrderIds(new Set());
    } else {
      setSelectedOrderIds(new Set(shippableOrders.map((o) => o.id)));
    }
  };
  const handleBulkShip = async () => {
    const payload = Array.from(selectedOrderIds).map((id) => ({
      orderId: id,
      trackingNumber: bulkTrackingInputs[id] || '',
      courierCode: bulkCourier,
    }));
    const missing = payload.filter((p) => !p.trackingNumber.trim());
    if (missing.length > 0) {
      toast.error(`송장번호가 입력되지 않은 주문이 ${missing.length}건 있습니다`);
      return;
    }
    setBulkProcessing(true);
    try {
      const results = await bulkShippingStart(payload);
      const successCount = results.filter((r) => r.success).length;
      const failCount = results.filter((r) => !r.success).length;
      setOrders((prev) =>
        prev.map((o) => {
          const result = results.find((r) => r.orderId === o.id && r.success);
          if (!result) return o;
          const p = payload.find((p) => p.orderId === o.id)!;
          return { ...o, status: 'SHIPPING' as OrderStatus, trackingNumber: p.trackingNumber, courierCode: p.courierCode };
        })
      );
      setSelectedOrderIds(new Set());
      setBulkShipOpen(false);
      setBulkTrackingInputs({});
      if (failCount > 0) {
        toast.error(`${successCount}건 성공, ${failCount}건 실패`);
      } else {
        toast.success(`${successCount}건 일괄 발송 처리되었습니다`);
      }
    } catch {
      toast.error('일괄 발송 처리에 실패했습니다');
    } finally {
      setBulkProcessing(false);
    }
  };

  const allOrders = orders;
  const statusCounts = allOrders.reduce((acc, o) => {
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
        '주문자명': order.buyerName || order.customerName || '',
        '주문자 연락처': order.buyerPhone || order.customerPhone || '',
        '주문자 이메일': order.buyerEmail || order.customerEmail || '',
        '수령인': order.buyerName || '',
        '수령인 연락처': order.buyerPhone || '',
        '배송지': `${order.shippingAddress ?? ''} ${order.shippingDetail ?? ''}`.trim(),
        '우편번호': order.shippingZipcode ?? '',
        '배송 메모': order.shippingMemo ?? '',
        '주문상태': ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS],
        '크리에이터': order.creator?.displayName ?? '-',
        '택배사': order.courierCode ? COURIER_MAP[order.courierCode] ?? order.courierCode : '',
        '송장번호': order.trackingNumber ?? '',
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '주문목록');
    XLSX.writeFile(wb, `cnec_orders_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  // Summary stats for header
  const newOrderCount = statusCounts['PAID'] ?? 0;
  const preparingCount = statusCounts['PREPARING'] ?? 0;
  const shippingCount = statusCounts['SHIPPING'] ?? 0;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">주문 관리</h1>
          <p className="text-sm text-gray-400 mt-1">총 {orders.length}건의 주문</p>
        </div>
        <div className="flex gap-2">
          {selectedOrderIds.size > 0 && (
            <Button size="sm" onClick={() => setBulkShipOpen(true)} className="h-10 rounded-xl bg-violet-600 hover:bg-violet-700 text-white">
              <Truck className="h-4 w-4 mr-1.5" />
              일괄 발송 ({selectedOrderIds.size}건)
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleDownloadExcel} disabled={orders.length === 0} className="h-10 rounded-xl px-4">
            <Download className="h-4 w-4 mr-2" />
            엑셀 다운로드
          </Button>
        </div>
      </div>

      {/* Quick stats */}
      {(newOrderCount > 0 || preparingCount > 0 || shippingCount > 0) && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-50 rounded-2xl p-4 text-center border border-blue-100">
            <p className="text-2xl font-bold text-blue-700">{newOrderCount}</p>
            <p className="text-xs text-blue-500 mt-0.5">신규 주문</p>
          </div>
          <div className="bg-amber-50 rounded-2xl p-4 text-center border border-amber-100">
            <p className="text-2xl font-bold text-amber-700">{preparingCount}</p>
            <p className="text-xs text-amber-500 mt-0.5">배송 준비중</p>
          </div>
          <div className="bg-violet-50 rounded-2xl p-4 text-center border border-violet-100">
            <p className="text-2xl font-bold text-violet-700">{shippingCount}</p>
            <p className="text-xs text-violet-500 mt-0.5">배송중</p>
          </div>
        </div>
      )}

      {/* Status filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {STATUS_TABS.map((tab) => {
          const count = tab.value === 'ALL' ? orders.length :
            tab.value === 'CANCELLED' ? (statusCounts['CANCELLED'] ?? 0) + (statusCounts['REFUNDED'] ?? 0) :
            statusCounts[tab.value] ?? 0;
          const isActive = statusFilter === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`inline-flex min-w-[20px] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                  isActive ? 'bg-white/20 text-white' :
                  tab.value === 'PAID' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
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
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex gap-4">
                <Skeleton className="h-14 w-14 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
            <ShoppingCart className="h-8 w-8 text-gray-300" />
          </div>
          <p className="text-lg font-semibold text-gray-900 mb-1">아직 주문이 없어요</p>
          <p className="text-sm text-gray-400">캠페인을 시작하면 주문이 들어와요</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            const totalQuantity = (order.items ?? []).reduce((sum, item) => sum + item.quantity, 0);
            const style = getStatusStyle(order.status);
            const contactName = order.buyerName || order.customerName || '';
            const contactPhone = order.buyerPhone || order.customerPhone || '';
            const contactEmail = order.buyerEmail || order.customerEmail || '';
            const firstItemImg = order.items?.[0]?.product?.thumbnailUrl || order.items?.[0]?.product?.images?.[0];

            return (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden transition-shadow hover:shadow-md">
                {/* Order summary row */}
                <div
                  className="flex items-center gap-4 p-4 sm:p-5 cursor-pointer"
                  onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                >
                  {/* Checkbox for PREPARING orders */}
                  {order.status === 'PREPARING' && (
                    <div onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedOrderIds.has(order.id)}
                        onCheckedChange={() => toggleOrderSelection(order.id)}
                      />
                    </div>
                  )}
                  {/* Product thumbnail */}
                  <div className="hidden sm:flex h-14 w-14 rounded-xl bg-gray-50 shrink-0 overflow-hidden items-center justify-center">
                    {firstItemImg ? (
                      <img src={firstItemImg} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Package className="h-6 w-6 text-gray-300" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[11px] font-mono text-gray-400">{order.orderNumber}</span>
                      <Badge variant="outline" className={`${style.bg} ${style.text} ${style.border} text-[11px] gap-1 rounded-full px-2 py-0.5`}>
                        {getStatusIcon(order.status)}
                        {ORDER_STATUS_LABELS[order.status]}
                      </Badge>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 truncate leading-snug">
                      {order.items?.[0]?.product?.name ?? '상품'}
                      {(order.items?.length ?? 0) > 1 && (
                        <span className="text-gray-400 font-normal"> 외 {(order.items?.length ?? 1) - 1}건</span>
                      )}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">{contactName}</span>
                      {contactPhone && (
                        <>
                          <span className="text-gray-200">|</span>
                          <span className="text-xs text-gray-400">{contactPhone}</span>
                        </>
                      )}
                      <span className="text-gray-200">|</span>
                      <span className="text-xs text-gray-400">{formatDateShort(order.createdAt)}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-base font-bold text-gray-900">{formatCurrency(order.totalAmount)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{totalQuantity}개</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {order.status === 'PAID' && (
                      <Button
                        size="sm"
                        className="h-9 rounded-xl text-xs bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={updatingId === order.id}
                        onClick={() => showConfirm(
                          '주문을 승인하시겠습니까?',
                          `${order.orderNumber} — ${contactName}님의 주문을 배송준비 상태로 변경합니다.`,
                          () => handleStatusChange(order.id, 'PREPARING'),
                        )}
                      >
                        승인
                      </Button>
                    )}
                    {order.status === 'PREPARING' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 rounded-xl text-xs"
                        onClick={() => setExpandedOrderId(order.id)}
                      >
                        송장입력
                      </Button>
                    )}
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/30">
                    <div className="p-4 sm:p-5 space-y-5">
                      {/* Info grid */}
                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {/* Orderer + Recipient Info */}
                        <div className="space-y-3">
                          {/* 주문자 정보 */}
                          <div>
                            <div className="flex items-center gap-1.5 mb-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <p className="text-sm font-semibold text-gray-900">주문자 정보</p>
                            </div>
                            <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900">{contactName || '-'}</span>
                              </div>
                              {contactPhone && (
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <Phone className="h-3.5 w-3.5 text-gray-400" />
                                  <span>{contactPhone}</span>
                                </div>
                              )}
                              {contactEmail && (
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <Mail className="h-3.5 w-3.5 text-gray-400" />
                                  <span>{contactEmail}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* 수령자 / 배송지 정보 */}
                          <div>
                            <div className="flex items-center gap-1.5 mb-2">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <p className="text-sm font-semibold text-gray-900">배송지 정보</p>
                            </div>
                            <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900">{contactName || '-'}</span>
                                {contactPhone && (
                                  <span className="text-sm text-gray-400">{contactPhone}</span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">
                                {order.shippingAddress || '-'}
                              </p>
                              {order.shippingDetail && (
                                <p className="text-sm text-gray-500">{order.shippingDetail}</p>
                              )}
                              {order.shippingZipcode && (
                                <p className="text-xs text-gray-400">우편번호: {order.shippingZipcode}</p>
                              )}
                              {order.shippingMemo && (
                                <div className="pt-2 border-t border-gray-50">
                                  <p className="text-xs text-gray-400">배송 메모</p>
                                  <p className="text-sm text-gray-600 mt-0.5">{order.shippingMemo}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Order items + Payment */}
                        <div>
                          <div className="flex items-center gap-1.5 mb-2">
                            <CreditCard className="h-4 w-4 text-gray-400" />
                            <p className="text-sm font-semibold text-gray-900">주문 상품</p>
                          </div>
                          <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
                            {(order.items ?? []).map((item) => (
                              <div key={item.id} className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-gray-50 overflow-hidden shrink-0">
                                  {(item.product?.thumbnailUrl || item.product?.images?.[0]) ? (
                                    <img src={item.product?.thumbnailUrl || item.product?.images?.[0]} alt="" className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="h-full w-full flex items-center justify-center">
                                      <Package className="h-4 w-4 text-gray-300" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-gray-900 truncate">{item.product?.name ?? '상품'}</p>
                                  <p className="text-xs text-gray-400">{formatCurrency(Number(item.unitPrice))} x {item.quantity}</p>
                                </div>
                                <span className="text-sm font-medium text-gray-900 shrink-0">{formatCurrency(Number(item.totalPrice))}</span>
                              </div>
                            ))}
                            <Separator />
                            <div className="space-y-1.5">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-400">배송비</span>
                                <span className="text-gray-600">{order.shippingFee > 0 ? formatCurrency(order.shippingFee) : '무료'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm font-semibold text-gray-900">총 결제금액</span>
                                <span className="text-base font-bold text-gray-900">{formatCurrency(order.totalAmount)}</span>
                              </div>
                            </div>
                            {order.creator?.displayName && (
                              <>
                                <Separator />
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-400">크리에이터</span>
                                  <span className="text-gray-600">{order.creator.displayName}</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Tracking info — if exists */}
                      {order.trackingNumber && (
                        <div className="bg-white rounded-xl border border-gray-100 p-4">
                          <div className="flex items-center gap-1.5 mb-2">
                            <Truck className="h-4 w-4 text-gray-400" />
                            <p className="text-sm font-semibold text-gray-900">배송 추적</p>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                            {order.courierCode && (
                              <div>
                                <p className="text-xs text-gray-400 mb-0.5">택배사</p>
                                <p className="font-medium text-gray-900">{COURIER_MAP[order.courierCode] ?? order.courierCode}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-xs text-gray-400 mb-0.5">송장번호</p>
                              <p className="font-medium text-gray-900 font-mono">{order.trackingNumber}</p>
                            </div>
                            {order.shippedAt && (
                              <div>
                                <p className="text-xs text-gray-400 mb-0.5">발송일</p>
                                <p className="font-medium text-gray-700">{formatDateShort(order.shippedAt)}</p>
                              </div>
                            )}
                            {order.deliveredAt && (
                              <div>
                                <p className="text-xs text-gray-400 mb-0.5">배송완료</p>
                                <p className="font-medium text-gray-700">{formatDateShort(order.deliveredAt)}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Cancel reason */}
                      {order.status === 'CANCELLED' && order.cancelReason && (
                        <div className="bg-red-50 rounded-xl border border-red-100 p-4">
                          <div className="flex items-center gap-1.5 mb-1">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                            <p className="text-sm font-semibold text-red-700">취소 사유</p>
                          </div>
                          <p className="text-sm text-red-600">{order.cancelReason}</p>
                        </div>
                      )}

                      {/* Shipping actions */}
                      {order.status !== 'CANCELLED' && order.status !== 'CONFIRMED' && order.status !== 'REFUNDED' && (
                        <div className="bg-white rounded-xl border border-gray-100 p-4">
                          <div className="flex items-center gap-1.5 mb-3">
                            <Send className="h-4 w-4 text-gray-400" />
                            <p className="text-sm font-semibold text-gray-900">배송 처리</p>
                          </div>
                          <div className="flex flex-wrap items-end gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs text-gray-500">택배사</Label>
                              <Select
                                value={courierInputs[order.id] ?? order.courierCode ?? ''}
                                onValueChange={(value) => setCourierInputs({ ...courierInputs, [order.id]: value })}
                              >
                                <SelectTrigger className="w-40 h-10 rounded-xl"><SelectValue placeholder="택배사 선택" /></SelectTrigger>
                                <SelectContent>
                                  {COURIERS.map((c) => (<SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-gray-500">송장번호</Label>
                              <Input
                                value={trackingInputs[order.id] ?? order.trackingNumber ?? ''}
                                onChange={(e) => setTrackingInputs({ ...trackingInputs, [order.id]: e.target.value })}
                                placeholder="송장번호 입력"
                                className="w-56 h-10 rounded-xl"
                              />
                            </div>
                            {order.status === 'PREPARING' && (
                              <Button
                                className="h-10 rounded-xl bg-violet-600 hover:bg-violet-700 text-white px-5"
                                disabled={updatingId === order.id || !trackingInputs[order.id]?.trim()}
                                onClick={() => showConfirm(
                                  '발송 처리하시겠습니까?',
                                  `송장번호 "${trackingInputs[order.id]}"로 발송 처리합니다. 구매자에게 배송 시작 알림이 전송됩니다.`,
                                  () => handleShippingStart(order.id),
                                )}
                              >
                                <Truck className="h-4 w-4 mr-1.5" />
                                {updatingId === order.id ? '처리 중...' : '발송하기'}
                              </Button>
                            )}
                            {(order.status === 'SHIPPING' || order.status === 'DELIVERED') && (
                              <Button variant="outline" className="h-10 rounded-xl" onClick={() => handleTrackingSave(order.id)}>
                                송장 저장
                              </Button>
                            )}
                            {NEXT_STATUS[order.status] && order.status !== 'PREPARING' && (
                              <Button
                                className="h-10 rounded-xl"
                                disabled={updatingId === order.id}
                                onClick={() => showConfirm(
                                  `${NEXT_STATUS_LABEL[order.status]}하시겠습니까?`,
                                  `주문 ${order.orderNumber}의 상태를 변경합니다.`,
                                  () => handleStatusChange(order.id, NEXT_STATUS[order.status]!),
                                )}
                              >
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
                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl"
                              disabled={updatingId === order.id}
                              onClick={() => setShowCancelForm({ ...showCancelForm, [order.id]: true })}>
                              <XCircle className="h-4 w-4 mr-1.5" />
                              주문 취소
                            </Button>
                          ) : (
                            <div className="bg-red-50 rounded-xl border border-red-100 p-4 space-y-3">
                              <div className="flex items-center gap-1.5">
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                                <p className="text-sm font-semibold text-red-700">주문을 취소합니다</p>
                              </div>
                              <Textarea
                                value={cancelReasonInputs[order.id] ?? ''}
                                onChange={(e) => setCancelReasonInputs({ ...cancelReasonInputs, [order.id]: e.target.value })}
                                placeholder="취소 사유를 입력하세요 (구매자에게 전달됩니다)"
                                rows={2}
                                className="rounded-xl"
                              />
                              <div className="flex gap-2">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="rounded-xl"
                                  disabled={updatingId === order.id || !cancelReasonInputs[order.id]?.trim()}
                                  onClick={() => showConfirm(
                                    '정말 주문을 취소하시겠습니까?',
                                    '이 작업은 되돌릴 수 없습니다. 재고가 복원되고 구매자에게 취소 알림이 전송됩니다.',
                                    () => handleCancelOrder(order.id),
                                    'destructive',
                                  )}
                                >
                                  {updatingId === order.id ? '처리 중...' : '취소 확정'}
                                </Button>
                                <Button variant="outline" size="sm" className="rounded-xl"
                                  onClick={() => setShowCancelForm({ ...showCancelForm, [order.id]: false })}>
                                  닫기
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Bulk Shipping Modal */}
      <Dialog open={bulkShipOpen} onOpenChange={setBulkShipOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>일괄 발송 처리</DialogTitle>
            <DialogDescription>{selectedOrderIds.size}건의 주문을 발송 처리합니다</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-sm">택배사 (전체 동일 적용)</Label>
              <Select value={bulkCourier} onValueChange={setBulkCourier}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COURIERS.map((c) => (<SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div className="space-y-3">
              {orders.filter((o) => selectedOrderIds.has(o.id)).map((order) => (
                <div key={order.id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{order.items?.[0]?.product?.name ?? '상품'}</p>
                    <p className="text-xs text-gray-400">{order.orderNumber} · {order.buyerName}</p>
                  </div>
                  <Input
                    value={bulkTrackingInputs[order.id] ?? ''}
                    onChange={(e) => setBulkTrackingInputs((prev) => ({ ...prev, [order.id]: e.target.value }))}
                    placeholder="송장번호"
                    className="w-44 h-10 rounded-xl"
                  />
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setBulkShipOpen(false)}>취소</Button>
            <Button onClick={handleBulkShip} disabled={bulkProcessing} className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl">
              {bulkProcessing ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />처리 중...</> : `${selectedOrderIds.size}건 일괄 발송`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{confirmDialog.title}</DialogTitle>
            <DialogDescription>{confirmDialog.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 sm:justify-end">
            <Button variant="outline" className="flex-1 sm:flex-none rounded-xl h-11" onClick={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}>
              취소
            </Button>
            <Button
              variant={confirmDialog.variant === 'destructive' ? 'destructive' : 'default'}
              className="flex-1 sm:flex-none rounded-xl h-11"
              onClick={() => {
                confirmDialog.onConfirm();
                setConfirmDialog((prev) => ({ ...prev, open: false }));
              }}
            >
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
