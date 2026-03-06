'use client';

import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { getClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/auth';
import type { Order, OrderItem, OrderStatus, Creator } from '@/types/database';
import { ORDER_STATUS_LABELS } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Download } from 'lucide-react';

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

interface OrderWithDetails extends Order {
  items?: (OrderItem & { product?: { name: string } })[];
  creator?: Creator;
}

function formatCurrency(num: number): string {
  return `${num.toLocaleString('ko-KR')}원`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusVariant(
  status: OrderStatus
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'PAID':
      return 'default';
    case 'PREPARING':
      return 'default';
    case 'SHIPPING':
      return 'secondary';
    case 'DELIVERED':
      return 'secondary';
    case 'CONFIRMED':
      return 'outline';
    case 'CANCELLED':
      return 'destructive';
    case 'REFUNDED':
      return 'destructive';
    default:
      return 'outline';
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

// Status filter tabs for quick filtering
const STATUS_FILTER_TABS: { value: string; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'PAID', label: '결제완료' },
  { value: 'PREPARING', label: '배송준비' },
  { value: 'SHIPPING', label: '배송중' },
  { value: 'DELIVERED', label: '배송완료' },
  { value: 'CONFIRMED', label: '구매확정' },
  { value: 'CANCELLED', label: '취소' },
];

function TableSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}

export default function BrandOrdersPage() {
  const { brand, isLoading: authLoading } = useAuthStore();
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [trackingInputs, setTrackingInputs] = useState<
    Record<string, string>
  >({});
  const [courierInputs, setCourierInputs] = useState<
    Record<string, string>
  >({});
  const [cancelReasonInputs, setCancelReasonInputs] = useState<
    Record<string, string>
  >({});
  const [showCancelForm, setShowCancelForm] = useState<
    Record<string, boolean>
  >({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!brand?.id) {
      if (!authLoading) setIsLoading(false);
      return;
    }

    async function fetchOrders() {
      const supabase = getClient();
      let query = supabase
        .from('orders')
        .select(
          '*, items:order_items(*, product:products(name)), creator:creators(*)'
        )
        .eq('brand_id', brand!.id)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'ALL') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Failed to fetch orders:', error);
      } else {
        setOrders((data ?? []) as OrderWithDetails[]);
      }
      setIsLoading(false);
    }

    setIsLoading(true);
    fetchOrders();
  }, [brand?.id, statusFilter, authLoading]);

  async function handleStatusChange(orderId: string, newStatus: OrderStatus) {
    setUpdatingId(orderId);
    const supabase = getClient();

    const updateData: Record<string, unknown> = { status: newStatus };

    if (newStatus === 'PREPARING') {
      // Transition from PAID to PREPARING
    }
    if (newStatus === 'SHIPPING') {
      updateData.shipped_at = new Date().toISOString();
      const trackingNumber = trackingInputs[orderId];
      if (trackingNumber) {
        updateData.tracking_number = trackingNumber;
      }
      const courierCode = courierInputs[orderId];
      if (courierCode) {
        updateData.courier_code = courierCode;
      }
    }
    if (newStatus === 'DELIVERED') {
      updateData.delivered_at = new Date().toISOString();
    }
    if (newStatus === 'CONFIRMED') {
      updateData.confirmed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (!error) {
      setOrders(
        orders.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: newStatus,
                ...(updateData.tracking_number
                  ? { tracking_number: updateData.tracking_number as string }
                  : {}),
                ...(updateData.courier_code
                  ? { courier_code: updateData.courier_code as string }
                  : {}),
              }
            : o
        )
      );
    }
    setUpdatingId(null);
  }

  async function handleCancelOrder(orderId: string) {
    const cancelReason = cancelReasonInputs[orderId]?.trim();
    if (!cancelReason) return;

    setUpdatingId(orderId);
    const supabase = getClient();

    const { error } = await supabase
      .from('orders')
      .update({
        status: 'CANCELLED',
        cancelled_at: new Date().toISOString(),
        cancel_reason: cancelReason,
      })
      .eq('id', orderId);

    if (!error) {
      setOrders(
        orders.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: 'CANCELLED' as OrderStatus,
                cancel_reason: cancelReason,
              }
            : o
        )
      );
      setShowCancelForm({ ...showCancelForm, [orderId]: false });
      setCancelReasonInputs({ ...cancelReasonInputs, [orderId]: '' });
    }
    setUpdatingId(null);
  }

  async function handleShippingStart(orderId: string) {
    const trackingNumber = trackingInputs[orderId];
    const courierCode = courierInputs[orderId];

    if (!trackingNumber?.trim()) return;

    setUpdatingId(orderId);
    const supabase = getClient();

    const updateData: Record<string, unknown> = {
      status: 'SHIPPING',
      shipped_at: new Date().toISOString(),
      tracking_number: trackingNumber.trim(),
    };
    if (courierCode) {
      updateData.courier_code = courierCode;
    }

    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (!error) {
      setOrders(
        orders.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: 'SHIPPING' as OrderStatus,
                tracking_number: trackingNumber.trim(),
                ...(courierCode ? { courier_code: courierCode } : {}),
              }
            : o
        )
      );
    }
    setUpdatingId(null);
  }

  async function handleTrackingSave(orderId: string) {
    const trackingNumber = trackingInputs[orderId];
    const courierCode = courierInputs[orderId];
    if (!trackingNumber) return;

    const supabase = getClient();
    const updateData: Record<string, unknown> = {
      tracking_number: trackingNumber,
    };
    if (courierCode) {
      updateData.courier_code = courierCode;
    }

    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (!error) {
      setOrders(
        orders.map((o) =>
          o.id === orderId
            ? {
                ...o,
                tracking_number: trackingNumber,
                ...(courierCode ? { courier_code: courierCode } : {}),
              }
            : o
        )
      );
    }
  }

  function toggleExpand(orderId: string) {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  }

  // Count by status (from all orders when filter is ALL, otherwise from fetched)
  const statusCounts = orders.reduce(
    (acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  function handleDownloadExcel() {
    if (orders.length === 0) return;

    const rows = orders.map((order) => {
      const totalQuantity = (order.items ?? []).reduce((sum, item) => sum + item.quantity, 0);
      const productNames = (order.items ?? [])
        .map((item) => item.product?.name ?? '상품')
        .join(', ');

      return {
        '주문번호': order.order_number,
        '주문일시': new Date(order.created_at).toLocaleString('ko-KR'),
        '상품명': productNames,
        '수량': totalQuantity,
        '결제금액': order.total_amount,
        '주문자명': order.buyer_name,
        '배송지': `${order.shipping_address} ${order.shipping_detail ?? ''}`.trim(),
        '주문상태': ORDER_STATUS_LABELS[order.status],
        '크리에이터명': order.creator?.display_name ?? '-',
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '주문목록');
    XLSX.writeFile(wb, `cnec_orders_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">주문 관리</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadExcel}
          disabled={orders.length === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          엑셀 다운로드
        </Button>
      </div>

      {/* Status summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Object.entries(ORDER_STATUS_LABELS).map(([status, label]) => (
          <Card key={status}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="text-xl font-bold">
                {statusCounts[status] ?? 0}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status filter tabs */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-2">
            {STATUS_FILTER_TABS.map((tab) => (
              <Button
                key={tab.value}
                variant={statusFilter === tab.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(tab.value)}
              >
                {tab.label}
                {statusFilter === 'ALL' && tab.value !== 'ALL' && statusCounts[tab.value]
                  ? ` (${statusCounts[tab.value]})`
                  : ''}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            주문 목록{' '}
            <span className="text-sm font-normal text-muted-foreground">
              ({orders.length}건)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton />
          ) : orders.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">주문이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Table header */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>주문번호</TableHead>
                    <TableHead>주문일시</TableHead>
                    <TableHead>상품</TableHead>
                    <TableHead>구매자</TableHead>
                    <TableHead>크리에이터</TableHead>
                    <TableHead className="text-right">금액</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>액션</TableHead>
                    <TableHead className="w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => {
                    const isExpanded = expandedOrderId === order.id;
                    const totalQuantity = (order.items ?? []).reduce(
                      (sum, item) => sum + item.quantity,
                      0
                    );
                    return (
                      <>
                        <TableRow
                          key={order.id}
                          className="cursor-pointer"
                          onClick={() => toggleExpand(order.id)}
                        >
                          <TableCell className="font-mono text-sm">
                            {order.order_number}
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(order.created_at)}
                          </TableCell>
                          <TableCell>
                            {order.items && order.items.length > 0 ? (
                              <div>
                                <span className="text-sm">
                                  {order.items[0].product?.name ?? '상품'}
                                </span>
                                {order.items.length > 1 && (
                                  <span className="text-xs text-muted-foreground ml-1">
                                    외 {order.items.length - 1}건
                                  </span>
                                )}
                                <p className="text-xs text-muted-foreground">
                                  수량: {totalQuantity}개
                                </p>
                              </div>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{order.buyer_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {order.buyer_phone}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {order.creator?.display_name ?? '-'}
                            </div>
                            {order.creator && (
                              <div className="text-xs text-muted-foreground">
                                판매 경유
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(order.total_amount)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={getStatusVariant(order.status)}
                            >
                              {ORDER_STATUS_LABELS[order.status]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div
                              className="flex gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {(order.status === 'PAID' || order.status === 'PREPARING') && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={updatingId === order.id}
                                  onClick={() =>
                                    handleStatusChange(
                                      order.id,
                                      NEXT_STATUS[order.status]!
                                    )
                                  }
                                >
                                  {NEXT_STATUS_LABEL[order.status]}
                                </Button>
                              )}
                              {order.status === 'PAID' && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  disabled={updatingId === order.id}
                                  onClick={() =>
                                    setShowCancelForm({
                                      ...showCancelForm,
                                      [order.id]: true,
                                    })
                                  }
                                >
                                  취소
                                </Button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-muted-foreground">
                              {isExpanded ? '▲' : '▼'}
                            </span>
                          </TableCell>
                        </TableRow>

                        {/* Expanded detail row */}
                        {isExpanded && (
                          <TableRow key={`${order.id}-detail`}>
                            <TableCell colSpan={9} className="bg-muted/30">
                              <div className="space-y-4 p-4">
                                {/* Shipping address & Order items */}
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                  <div>
                                    <p className="text-sm font-medium">
                                      배송지 정보
                                    </p>
                                    <div className="mt-1 text-sm text-muted-foreground space-y-0.5">
                                      <p>
                                        {order.buyer_name} ({order.buyer_phone})
                                      </p>
                                      <p>{order.shipping_address}</p>
                                      {order.shipping_detail && (
                                        <p>{order.shipping_detail}</p>
                                      )}
                                      {order.shipping_zipcode && (
                                        <p>우편번호: {order.shipping_zipcode}</p>
                                      )}
                                      <p>이메일: {order.buyer_email}</p>
                                    </div>
                                  </div>

                                  <div>
                                    <p className="text-sm font-medium">
                                      주문 상품
                                    </p>
                                    <div className="mt-1 space-y-1">
                                      {(order.items ?? []).map((item) => (
                                        <div
                                          key={item.id}
                                          className="flex justify-between text-sm"
                                        >
                                          <span>
                                            {item.product?.name ?? '상품'} x{' '}
                                            {item.quantity}
                                          </span>
                                          <span className="text-muted-foreground">
                                            {formatCurrency(item.total_price)}
                                          </span>
                                        </div>
                                      ))}
                                      <Separator className="my-1" />
                                      <div className="flex justify-between text-sm">
                                        <span>배송비</span>
                                        <span>
                                          {formatCurrency(order.shipping_fee)}
                                        </span>
                                      </div>
                                      <div className="flex justify-between text-sm font-medium">
                                        <span>총 결제금액</span>
                                        <span>
                                          {formatCurrency(order.total_amount)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Tracking info display (when tracking_number exists) */}
                                {order.tracking_number && (
                                  <>
                                    <Separator />
                                    <div>
                                      <p className="text-sm font-medium mb-1">
                                        배송 추적 정보
                                      </p>
                                      <div className="text-sm text-muted-foreground space-y-0.5">
                                        {order.courier_code && (
                                          <p>
                                            택배사:{' '}
                                            {COURIER_MAP[order.courier_code] ?? order.courier_code}
                                          </p>
                                        )}
                                        <p>송장번호: {order.tracking_number}</p>
                                        {order.shipped_at && (
                                          <p>발송일시: {formatDate(order.shipped_at)}</p>
                                        )}
                                        {order.delivered_at && (
                                          <p>배송완료: {formatDate(order.delivered_at)}</p>
                                        )}
                                      </div>
                                    </div>
                                  </>
                                )}

                                {/* Cancel reason display */}
                                {order.status === 'CANCELLED' && order.cancel_reason && (
                                  <>
                                    <Separator />
                                    <div>
                                      <p className="text-sm font-medium mb-1 text-destructive">
                                        취소 사유
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        {order.cancel_reason}
                                      </p>
                                    </div>
                                  </>
                                )}

                                <Separator />

                                {/* Courier, Tracking & Shipping Actions */}
                                {order.status !== 'CANCELLED' &&
                                  order.status !== 'CONFIRMED' &&
                                  order.status !== 'REFUNDED' && (
                                    <div className="space-y-3">
                                      <p className="text-sm font-medium">배송 처리</p>
                                      <div className="flex flex-wrap items-end gap-3">
                                        <div className="space-y-1">
                                          <Label className="text-xs">택배사</Label>
                                          <Select
                                            value={
                                              courierInputs[order.id] ??
                                              order.courier_code ??
                                              ''
                                            }
                                            onValueChange={(value) =>
                                              setCourierInputs({
                                                ...courierInputs,
                                                [order.id]: value,
                                              })
                                            }
                                          >
                                            <SelectTrigger
                                              className="w-44"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              <SelectValue placeholder="택배사 선택" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {COURIERS.map((c) => (
                                                <SelectItem key={c.code} value={c.code}>
                                                  {c.name}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="space-y-1">
                                          <Label className="text-xs">송장번호</Label>
                                          <Input
                                            value={
                                              trackingInputs[order.id] ??
                                              order.tracking_number ??
                                              ''
                                            }
                                            onChange={(e) =>
                                              setTrackingInputs({
                                                ...trackingInputs,
                                                [order.id]: e.target.value,
                                              })
                                            }
                                            placeholder="송장번호 입력"
                                            className="w-56"
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                        </div>

                                        {/* Save tracking info button (for already-shipped orders) */}
                                        {(order.status === 'SHIPPING' || order.status === 'DELIVERED') && (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleTrackingSave(order.id);
                                            }}
                                          >
                                            송장 저장
                                          </Button>
                                        )}

                                        {/* "배송 시작" button: for PREPARING status, sets to SHIPPING with courier + tracking */}
                                        {order.status === 'PREPARING' && (
                                          <Button
                                            size="sm"
                                            disabled={
                                              updatingId === order.id ||
                                              !trackingInputs[order.id]?.trim()
                                            }
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleShippingStart(order.id);
                                            }}
                                          >
                                            {updatingId === order.id
                                              ? '처리 중...'
                                              : '배송 시작'}
                                          </Button>
                                        )}

                                        {/* Status progression for other statuses */}
                                        {NEXT_STATUS[order.status] &&
                                          order.status !== 'PREPARING' && (
                                            <Button
                                              size="sm"
                                              disabled={updatingId === order.id}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleStatusChange(
                                                  order.id,
                                                  NEXT_STATUS[order.status]!
                                                );
                                              }}
                                            >
                                              {updatingId === order.id
                                                ? '처리 중...'
                                                : NEXT_STATUS_LABEL[order.status]}
                                            </Button>
                                          )}
                                      </div>
                                    </div>
                                  )}

                                {/* Cancel order form (for PAID status only) */}
                                {order.status === 'PAID' && (
                                  <>
                                    <Separator />
                                    <div className="space-y-3">
                                      {!showCancelForm[order.id] ? (
                                        <Button
                                          variant="destructive"
                                          size="sm"
                                          disabled={updatingId === order.id}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setShowCancelForm({
                                              ...showCancelForm,
                                              [order.id]: true,
                                            });
                                          }}
                                        >
                                          주문 취소
                                        </Button>
                                      ) : (
                                        <div
                                          className="space-y-2 rounded-md border border-destructive/30 bg-destructive/5 p-3"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <p className="text-sm font-medium text-destructive">
                                            주문 취소
                                          </p>
                                          <Textarea
                                            value={cancelReasonInputs[order.id] ?? ''}
                                            onChange={(e) =>
                                              setCancelReasonInputs({
                                                ...cancelReasonInputs,
                                                [order.id]: e.target.value,
                                              })
                                            }
                                            placeholder="취소 사유를 입력하세요"
                                            rows={2}
                                          />
                                          <div className="flex gap-2">
                                            <Button
                                              variant="destructive"
                                              size="sm"
                                              disabled={
                                                updatingId === order.id ||
                                                !cancelReasonInputs[order.id]?.trim()
                                              }
                                              onClick={() =>
                                                handleCancelOrder(order.id)
                                              }
                                            >
                                              {updatingId === order.id
                                                ? '처리 중...'
                                                : '취소 확인'}
                                            </Button>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() =>
                                                setShowCancelForm({
                                                  ...showCancelForm,
                                                  [order.id]: false,
                                                })
                                              }
                                            >
                                              닫기
                                            </Button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
