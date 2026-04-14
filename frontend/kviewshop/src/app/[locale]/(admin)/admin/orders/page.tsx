'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import {
  ShoppingBag,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  CreditCard,
  Loader2,
  ExternalLink,
  Copy,
} from 'lucide-react'
import { toast } from 'sonner'

import { getAdminOrders, getAdminOrderStats, updateOrderStatus } from '@/lib/actions/admin'
import { COURIER_LABELS } from '@/lib/utils/courier'
import { getTrackingUrl, getCourierLabel } from '@/lib/utils/courier'

import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// ─── Types ───────────────────────────────────────────────────

interface OrderItem {
  id: string
  quantity: number
  unitPrice: number
  totalPrice: number
  optionValues: string | null
  product: {
    id: string
    name: string
    thumbnailUrl: string | null
  } | null
}

interface Order {
  id: string
  orderNumber: string | null
  status: string
  totalAmount: number
  subtotal: number | null
  productAmount: number | null
  shippingFee: number
  creatorRevenue: number | null
  platformRevenue: number | null
  brandRevenue: number | null
  buyerName: string | null
  buyerPhone: string | null
  buyerEmail: string | null
  customerName: string | null
  customerPhone: string | null
  shippingAddress: string | null
  shippingMemo: string | null
  trackingNumber: string | null
  courierCode: string | null
  cancelReason: string | null
  paymentMethod: string | null
  createdAt: string
  shippedAt: string | null
  deliveredAt: string | null
  confirmedAt: string | null
  cancelledAt: string | null
  items: OrderItem[]
  creator: { id: string; username: string; displayName: string | null } | null
  brand: { id: string; companyName: string | null } | null
  buyer: { id: string; nickname: string | null } | null
}

// ─── Constants ───────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  PAID: '결제완료',
  PREPARING: '준비중',
  SHIPPING: '배송중',
  DELIVERED: '배송완료',
  CONFIRMED: '구매확정',
  CANCELLED: '취소',
  REFUNDED: '환불',
}

const STATUS_COLORS: Record<string, string> = {
  PAID: 'bg-blue-100 text-blue-800',
  PREPARING: 'bg-yellow-100 text-yellow-800',
  SHIPPING: 'bg-orange-100 text-orange-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-red-100 text-red-800',
}

const STAT_CARDS: { key: string; label: string; icon: React.ElementType; color: string }[] = [
  { key: 'PAID', label: '결제완료', icon: CreditCard, color: 'text-blue-600' },
  { key: 'PREPARING', label: '준비중', icon: Package, color: 'text-yellow-600' },
  { key: 'SHIPPING', label: '배송중', icon: Truck, color: 'text-orange-600' },
  { key: 'DELIVERED', label: '배송완료', icon: CheckCircle2, color: 'text-green-600' },
  { key: 'CANCELLED', label: '취소', icon: XCircle, color: 'text-red-600' },
]

const PERIOD_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'today', label: '오늘' },
  { value: '7days', label: '7일' },
  { value: '30days', label: '30일' },
]

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PAID: ['PREPARING', 'CANCELLED'],
  PREPARING: ['SHIPPING', 'CANCELLED'],
  SHIPPING: ['DELIVERED', 'CANCELLED'],
  DELIVERED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['CANCELLED'],
}

// ─── Page ────────────────────────────────────────────────────

export default function AdminOrdersPage() {
  // State
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [stats, setStats] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  // Filters
  const [statusFilter, setStatusFilter] = useState('all')
  const [period, setPeriod] = useState('all')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)

  // Sheet (order details)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  // Shipping dialog
  const [shippingDialog, setShippingDialog] = useState(false)
  const [shippingOrderId, setShippingOrderId] = useState('')
  const [courierCode, setCourierCode] = useState('cj')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // ─── Data fetching ─────────────────────────────────────────

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getAdminOrders({
        status: statusFilter,
        period,
        search,
        page,
      })
      setOrders(result.orders as unknown as Order[])
      setTotal(result.total)
      setPageSize(result.pageSize)
    } catch {
      toast.error('주문 목록을 불러오는 데 실패했습니다')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, period, search, page])

  const fetchStats = useCallback(async () => {
    try {
      const s = await getAdminOrderStats()
      setStats(s)
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  // ─── Handlers ──────────────────────────────────────────────

  const handleSearch = () => {
    setSearch(searchInput)
    setPage(1)
  }

  const handleStatusCardClick = (status: string) => {
    setStatusFilter(prev => (prev === status ? 'all' : status))
    setPage(1)
  }

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    if (newStatus === 'SHIPPING') {
      setShippingOrderId(orderId)
      setCourierCode('cj')
      setTrackingNumber('')
      setShippingDialog(true)
      return
    }

    setActionLoading(true)
    try {
      const extra = newStatus === 'CANCELLED' ? { cancelReason: '관리자 취소' } : undefined
      await updateOrderStatus(orderId, newStatus, extra)
      toast.success(`주문 상태가 ${STATUS_LABELS[newStatus] || newStatus}(으)로 변경되었습니다`)
      fetchOrders()
      fetchStats()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '상태 변경에 실패했습니다')
    } finally {
      setActionLoading(false)
    }
  }

  const handleShippingConfirm = async () => {
    if (!trackingNumber.trim()) {
      toast.error('송장번호를 입력해주세요')
      return
    }
    setActionLoading(true)
    try {
      await updateOrderStatus(shippingOrderId, 'SHIPPING', {
        trackingNumber: trackingNumber.trim(),
        courierCode,
      })
      toast.success('배송이 시작되었습니다')
      setShippingDialog(false)
      fetchOrders()
      fetchStats()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '배송 처리에 실패했습니다')
    } finally {
      setActionLoading(false)
    }
  }

  const openOrderDetail = (order: Order) => {
    setSelectedOrder(order)
    setSheetOpen(true)
  }

  const totalPages = Math.ceil(total / pageSize)

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('복사되었습니다')
  }

  // ─── Render ────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">주문 관리</h1>
        <p className="text-sm text-muted-foreground mt-1">전체 주문을 조회하고 상태를 관리합니다</p>
      </div>

      {/* Stat Cards */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
        {STAT_CARDS.map(({ key, label, icon: Icon, color }) => (
          <Card
            key={key}
            className={`min-w-[140px] cursor-pointer transition-colors ${
              statusFilter === key ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/50'
            }`}
            onClick={() => handleStatusCardClick(key)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`h-4 w-4 ${statusFilter === key ? 'text-primary-foreground' : color}`} />
                <span className={`text-xs font-medium ${statusFilter === key ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                  {label}
                </span>
              </div>
              <p className="text-2xl font-bold">{stats[key] ?? 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Period toggle */}
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {PERIOD_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => { setPeriod(opt.value); setPage(1) }}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                period === opt.value
                  ? 'bg-background text-foreground shadow-sm font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="주문번호, 이름, 전화번호 검색"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="pl-9"
            />
          </div>
          <Button onClick={handleSearch} variant="secondary">
            검색
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <ShoppingBag className="h-12 w-12 mb-4" />
          <p>주문이 없습니다</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[130px]">주문번호</TableHead>
                  <TableHead className="w-[140px]">주문일시</TableHead>
                  <TableHead>구매자</TableHead>
                  <TableHead>상품</TableHead>
                  <TableHead className="text-right">결제금액</TableHead>
                  <TableHead>크리에이터</TableHead>
                  <TableHead className="w-[90px]">상태</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map(order => {
                  const firstItem = order.items[0]
                  const extraCount = order.items.length - 1
                  const nextStatuses = ALLOWED_TRANSITIONS[order.status] || []

                  return (
                    <TableRow
                      key={order.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => openOrderDetail(order)}
                    >
                      <TableCell className="font-mono text-xs">
                        {order.orderNumber || order.id.slice(0, 8)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {order.customerName || order.buyerName || order.buyer?.nickname || '-'}
                      </TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">
                        {firstItem?.product?.name || '상품 정보 없음'}
                        {extraCount > 0 && (
                          <span className="text-muted-foreground ml-1">외 {extraCount}건</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium text-sm">
                        {order.totalAmount.toLocaleString()}원
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {order.creator?.displayName || order.creator?.username || '-'}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'}`}>
                          {STATUS_LABELS[order.status] || order.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {nextStatuses.length > 0 && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {nextStatuses.map(ns => (
                                <DropdownMenuItem
                                  key={ns}
                                  onClick={e => {
                                    e.stopPropagation()
                                    handleStatusChange(order.id, ns)
                                  }}
                                  disabled={actionLoading}
                                >
                                  {STATUS_LABELS[ns] || ns}(으)로 변경
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden space-y-3">
            {orders.map(order => {
              const firstItem = order.items[0]
              const extraCount = order.items.length - 1
              const nextStatuses = ALLOWED_TRANSITIONS[order.status] || []

              return (
                <Card
                  key={order.id}
                  className="cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => openOrderDetail(order)}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-muted-foreground">
                        {order.orderNumber || order.id.slice(0, 8)}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'}`}>
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </div>

                    <div className="text-sm font-medium truncate">
                      {firstItem?.product?.name || '상품 정보 없음'}
                      {extraCount > 0 && (
                        <span className="text-muted-foreground ml-1">외 {extraCount}건</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {order.customerName || order.buyerName || order.buyer?.nickname || '-'}
                      </span>
                      <span className="font-semibold">
                        {order.totalAmount.toLocaleString()}원
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </span>
                      {nextStatuses.length > 0 && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                            <Button variant="outline" size="sm" className="h-7 text-xs">
                              상태 변경
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {nextStatuses.map(ns => (
                              <DropdownMenuItem
                                key={ns}
                                onClick={e => {
                                  e.stopPropagation()
                                  handleStatusChange(order.id, ns)
                                }}
                                disabled={actionLoading}
                              >
                                {STATUS_LABELS[ns] || ns}(으)로 변경
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="icon"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {page} / {totalPages} (총 {total}건)
              </span>
              <Button
                variant="outline"
                size="icon"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* ─── Order Detail Sheet ─────────────────────────────── */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>주문 상세</SheetTitle>
          </SheetHeader>

          {selectedOrder && (
            <div className="space-y-6 mt-4">
              {/* Order Info */}
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">주문 정보</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">주문번호</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-xs">{selectedOrder.orderNumber || '-'}</span>
                    {selectedOrder.orderNumber && (
                      <button onClick={() => copyToClipboard(selectedOrder.orderNumber!)}>
                        <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                      </button>
                    )}
                  </div>
                  <span className="text-muted-foreground">주문일시</span>
                  <span>{formatDate(selectedOrder.createdAt)}</span>
                  <span className="text-muted-foreground">상태</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium w-fit ${STATUS_COLORS[selectedOrder.status] || ''}`}>
                    {STATUS_LABELS[selectedOrder.status] || selectedOrder.status}
                  </span>
                  <span className="text-muted-foreground">결제수단</span>
                  <span>{selectedOrder.paymentMethod || '-'}</span>
                </div>
              </section>

              {/* Buyer Info */}
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">구매자 정보</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">이름</span>
                  <span>{selectedOrder.customerName || selectedOrder.buyerName || '-'}</span>
                  <span className="text-muted-foreground">전화번호</span>
                  <span>{selectedOrder.customerPhone || selectedOrder.buyerPhone || '-'}</span>
                  <span className="text-muted-foreground">이메일</span>
                  <span className="break-all">{selectedOrder.buyerEmail || '-'}</span>
                  <span className="text-muted-foreground">회원</span>
                  <span>{selectedOrder.buyer?.nickname || '비회원'}</span>
                </div>
              </section>

              {/* Shipping Info */}
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">배송 정보</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">배송지</span>
                  <span className="break-all">{selectedOrder.shippingAddress || '-'}</span>
                  <span className="text-muted-foreground">배송메모</span>
                  <span>{selectedOrder.shippingMemo || '-'}</span>
                  <span className="text-muted-foreground">택배사</span>
                  <span>{getCourierLabel(selectedOrder.courierCode)}</span>
                  <span className="text-muted-foreground">송장번호</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-xs">{selectedOrder.trackingNumber || '-'}</span>
                    {selectedOrder.trackingNumber && (
                      <>
                        <button onClick={() => copyToClipboard(selectedOrder.trackingNumber!)}>
                          <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                        </button>
                        {(() => {
                          const url = getTrackingUrl(selectedOrder.courierCode, selectedOrder.trackingNumber)
                          return url ? (
                            <a href={url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                            </a>
                          ) : null
                        })()}
                      </>
                    )}
                  </div>
                  {selectedOrder.shippedAt && (
                    <>
                      <span className="text-muted-foreground">발송일</span>
                      <span>{formatDate(selectedOrder.shippedAt)}</span>
                    </>
                  )}
                  {selectedOrder.deliveredAt && (
                    <>
                      <span className="text-muted-foreground">배송완료일</span>
                      <span>{formatDate(selectedOrder.deliveredAt)}</span>
                    </>
                  )}
                </div>
              </section>

              {/* Items */}
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  주문 상품 ({selectedOrder.items.length}건)
                </h3>
                <div className="space-y-3">
                  {selectedOrder.items.map(item => (
                    <div key={item.id} className="flex gap-3 items-start">
                      {item.product?.thumbnailUrl ? (
                        <Image
                          src={item.product.thumbnailUrl}
                          alt={item.product.name || ''}
                          width={56}
                          height={56}
                          className="rounded-md object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {item.product?.name || '삭제된 상품'}
                        </p>
                        {item.optionValues && (
                          <p className="text-xs text-muted-foreground">{item.optionValues}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.unitPrice.toLocaleString()}원 x {item.quantity}개
                        </p>
                      </div>
                      <span className="text-sm font-medium whitespace-nowrap">
                        {item.totalPrice.toLocaleString()}원
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Payment Summary */}
              <section className="space-y-2 border-t pt-4">
                <h3 className="text-sm font-semibold text-muted-foreground">결제 금액</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {selectedOrder.productAmount != null && (
                    <>
                      <span className="text-muted-foreground">상품금액</span>
                      <span className="text-right">{selectedOrder.productAmount.toLocaleString()}원</span>
                    </>
                  )}
                  <span className="text-muted-foreground">배송비</span>
                  <span className="text-right">{selectedOrder.shippingFee.toLocaleString()}원</span>
                  <span className="font-semibold">총 결제금액</span>
                  <span className="text-right font-semibold">{selectedOrder.totalAmount.toLocaleString()}원</span>
                </div>
              </section>

              {/* Creator / Brand Info */}
              {(selectedOrder.creator || selectedOrder.brand) && (
                <section className="space-y-2 border-t pt-4">
                  <h3 className="text-sm font-semibold text-muted-foreground">크리에이터 / 브랜드</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">크리에이터</span>
                    <span>{selectedOrder.creator?.displayName || selectedOrder.creator?.username || '-'}</span>
                    <span className="text-muted-foreground">브랜드</span>
                    <span>{selectedOrder.brand?.companyName || '-'}</span>
                    {selectedOrder.creatorRevenue != null && (
                      <>
                        <span className="text-muted-foreground">크리에이터 수익</span>
                        <span className="text-right">{selectedOrder.creatorRevenue.toLocaleString()}원</span>
                      </>
                    )}
                    {selectedOrder.platformRevenue != null && (
                      <>
                        <span className="text-muted-foreground">플랫폼 수익</span>
                        <span className="text-right">{selectedOrder.platformRevenue.toLocaleString()}원</span>
                      </>
                    )}
                    {selectedOrder.brandRevenue != null && (
                      <>
                        <span className="text-muted-foreground">브랜드 수익</span>
                        <span className="text-right">{selectedOrder.brandRevenue.toLocaleString()}원</span>
                      </>
                    )}
                  </div>
                </section>
              )}

              {/* Cancel Info */}
              {selectedOrder.cancelReason && (
                <section className="space-y-2 border-t pt-4">
                  <h3 className="text-sm font-semibold text-muted-foreground">취소 정보</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">취소사유</span>
                    <span>{selectedOrder.cancelReason}</span>
                    <span className="text-muted-foreground">취소일시</span>
                    <span>{formatDate(selectedOrder.cancelledAt)}</span>
                  </div>
                </section>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ─── Shipping Dialog ────────────────────────────────── */}
      <Dialog open={shippingDialog} onOpenChange={setShippingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>배송 정보 입력</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">택배사</label>
              <Select value={courierCode} onValueChange={setCourierCode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(COURIER_LABELS).map(([code, label]) => (
                    <SelectItem key={code} value={code}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">송장번호</label>
              <Input
                placeholder="송장번호를 입력하세요"
                value={trackingNumber}
                onChange={e => setTrackingNumber(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleShippingConfirm()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShippingDialog(false)}>
              취소
            </Button>
            <Button onClick={handleShippingConfirm} disabled={actionLoading}>
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              배송 시작
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
