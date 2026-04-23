'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminBreadcrumb } from '@/components/admin/admin-breadcrumb'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { AlertTriangle, Ban, Package, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
import { forceCancelOrder } from '@/lib/actions/admin-orders-force'

type OrderDetail = Awaited<ReturnType<typeof import('@/lib/actions/admin-orders-force').getOrderForceDetail>>

function formatKrw(n: number) { return '₩' + n.toLocaleString() }

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    PAID: { label: '결제 완료', cls: 'bg-blue-100 text-blue-700' },
    PREPARING: { label: '준비 중', cls: 'bg-amber-100 text-amber-700' },
    SHIPPING: { label: '배송 중', cls: 'bg-indigo-100 text-indigo-700' },
    DELIVERED: { label: '배송 완료', cls: 'bg-emerald-100 text-emerald-700' },
    CONFIRMED: { label: '구매 확정', cls: 'bg-emerald-100 text-emerald-700' },
    CANCELLED: { label: '취소', cls: 'bg-red-100 text-red-600' },
    REFUNDED: { label: '환불', cls: 'bg-red-100 text-red-600' },
  }
  const s = map[status] || { label: status, cls: 'bg-stone-100 text-stone-600' }
  return <Badge className={s.cls}>{s.label}</Badge>
}

export function OrderDetailClient({ order }: { order: OrderDetail }) {
  const router = useRouter()
  const [cancelOpen, setCancelOpen] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)
  const [refundType, setRefundType] = useState<'FULL' | 'PARTIAL'>('FULL')
  const [partialAmount, setPartialAmount] = useState(0)
  const [reason, setReason] = useState('')
  const [confirmOrderNum, setConfirmOrderNum] = useState('')
  const [confirmAmount, setConfirmAmount] = useState('')
  const [confirmEmail, setConfirmEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const isCancelled = order.status === 'CANCELLED' || order.status === 'REFUNDED'
  const actualRefundAmount = refundType === 'FULL' ? order.totalAmount : partialAmount

  function reset() {
    setStep(1); setRefundType('FULL'); setPartialAmount(0); setReason('')
    setConfirmOrderNum(''); setConfirmAmount(''); setConfirmEmail(''); setLoading(false)
  }

  const canStep2 = reason.length >= 20 && actualRefundAmount > 0
  const canConfirm =
    confirmOrderNum === (order.orderNumber || order.id.slice(0, 8)) &&
    confirmAmount === actualRefundAmount.toString() &&
    confirmEmail === order.buyerEmail

  async function handleConfirm() {
    if (!canConfirm) return
    setLoading(true)
    try {
      await forceCancelOrder({ orderId: order.id, refundType, refundAmount: refundType === 'PARTIAL' ? partialAmount : undefined, reason })
      toast.success(`환불이 완료되었어요 (${formatKrw(actualRefundAmount)})`)
      setCancelOpen(false); reset()
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '환불에 실패했어요')
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-6">
      <AdminBreadcrumb items={[
        { href: '/admin', label: '어드민' },
        { href: '/admin/orders', label: '주문 관리' },
        { label: `#${order.orderNumber || order.id.slice(0, 8)}` },
      ]} />

      {/* 환불 배너 */}
      {order.refundedAt && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">이 주문은 환불되었어요</p>
            <p className="mt-0.5 text-xs text-red-600">환불일: {new Date(order.refundedAt).toLocaleDateString('ko-KR')}</p>
          </div>
        </div>
      )}

      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-stone-900">#{order.orderNumber || order.id.slice(0, 8)}</h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-sm text-stone-500">
            {order.buyerName} · {order.paidAt ? new Date(order.paidAt).toLocaleDateString('ko-KR') : '결제 전'}
          </p>
        </div>
        <Button variant="destructive" disabled={isCancelled} onClick={() => setCancelOpen(true)}>
          <Ban className="mr-1.5 h-4 w-4" />강제 취소/환불
        </Button>
      </div>

      {/* 주문 정보 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 space-y-3">
          <h3 className="text-sm font-semibold text-stone-900">주문 정보</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-stone-500">결제 금액</span>
            <span className="font-semibold tabular-nums">{formatKrw(order.totalAmount)}</span>
            <span className="text-stone-500">결제 수단</span>
            <span>{order.paymentMethod || '-'}</span>
            <span className="text-stone-500">구매자</span>
            <span>{order.buyerName}</span>
            <span className="text-stone-500">이메일</span>
            <span>{order.buyerEmail || '-'}</span>
            {order.brandName && <>
              <span className="text-stone-500">브랜드</span>
              <span>{order.brandName}</span>
            </>}
            {order.creatorName && <>
              <span className="text-stone-500">크리에이터</span>
              <span>{order.creatorName}</span>
            </>}
          </div>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5 space-y-3">
          <h3 className="text-sm font-semibold text-stone-900">상품 목록</h3>
          {order.items.map(item => (
            <div key={item.id} className="flex items-center gap-3">
              <Package className="h-4 w-4 text-stone-400" />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm">{item.productName}</p>
                <p className="text-xs text-stone-400">수량 {item.quantity}</p>
              </div>
              <span className="text-sm tabular-nums">{formatKrw(item.totalPrice)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 강제 취소 모달 */}
      <Dialog open={cancelOpen} onOpenChange={(o) => { if (!o) reset(); setCancelOpen(o) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>주문 강제 취소</DialogTitle>
            <DialogDescription>PortOne에서 실제 환불이 진행돼요</DialogDescription>
          </DialogHeader>

          {step === 1 && (
            <div className="space-y-4">
              {/* 배송 경고 */}
              {order.shippedAt && !order.deliveredAt && (
                <div className="rounded-lg bg-amber-50 p-3 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                  <p className="text-sm text-amber-700">이미 배송 중이에요. 배송 회수를 별도 안내해야 해요.</p>
                </div>
              )}
              {order.deliveredAt && (
                <div className="rounded-lg bg-amber-50 p-3 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                  <p className="text-sm text-amber-700">이미 배송 완료되었어요. 구매자 동의를 받는 것을 권장해요.</p>
                </div>
              )}

              {/* 환불 옵션 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-700">환불 옵션</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 rounded-lg border border-stone-200 p-3 cursor-pointer hover:bg-stone-50">
                    <input type="radio" checked={refundType === 'FULL'} onChange={() => setRefundType('FULL')} />
                    <span className="text-sm">전액 환불 ({formatKrw(order.totalAmount)})</span>
                    <span className="ml-auto text-xs text-stone-400">재고 복원됨</span>
                  </label>
                  <label className="flex items-center gap-2 rounded-lg border border-stone-200 p-3 cursor-pointer hover:bg-stone-50">
                    <input type="radio" checked={refundType === 'PARTIAL'} onChange={() => setRefundType('PARTIAL')} />
                    <span className="text-sm">부분 환불</span>
                    <span className="ml-auto text-xs text-stone-400">재고 미복원</span>
                  </label>
                </div>
                {refundType === 'PARTIAL' && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-stone-500">₩</span>
                    <Input
                      type="number"
                      value={partialAmount || ''}
                      onChange={e => setPartialAmount(Math.min(order.totalAmount, Math.max(0, parseInt(e.target.value) || 0)))}
                      placeholder="환불 금액"
                      className="tabular-nums"
                      min={1}
                      max={order.totalAmount}
                    />
                  </div>
                )}
              </div>

              {/* 사유 */}
              <div>
                <label className="text-sm font-medium text-stone-700">취소 사유</label>
                <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="취소 사유를 상세히 입력해주세요 (최소 20자)" className="mt-1.5" rows={3} />
                <p className="mt-1 text-xs text-stone-400">{reason.length}/20자 이상</p>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCancelOpen(false)}>취소</Button>
                <Button disabled={!canStep2} onClick={() => setStep(2)}>다음</Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="rounded-lg bg-red-50 p-3 space-y-1">
                <p className="text-sm font-medium text-red-800">환불 후 되돌릴 수 없어요</p>
                <p className="text-xs text-red-600">PortOne에서 실제 환불 처리 · 실패 시 자동 재시도 3회</p>
              </div>

              <div className="rounded-lg bg-stone-50 p-3 space-y-1 text-sm">
                <p>환불 금액: <span className="font-bold tabular-nums">{formatKrw(actualRefundAmount)}</span></p>
                <p>재고 복원: {refundType === 'FULL' ? '복원됨' : '변화 없음'}</p>
                {order.creatorRevenue > 0 && (
                  <p>크리에이터 수익 차감: {formatKrw(Math.round(order.creatorRevenue * (actualRefundAmount / order.totalAmount)))}</p>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-stone-500">주문번호 재입력</label>
                  <Input value={confirmOrderNum} onChange={e => setConfirmOrderNum(e.target.value)} placeholder={order.orderNumber || order.id.slice(0, 8)} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs text-stone-500">환불 금액 재입력 (숫자만)</label>
                  <Input value={confirmAmount} onChange={e => setConfirmAmount(e.target.value)} placeholder={actualRefundAmount.toString()} className="mt-1 tabular-nums" />
                </div>
                <div>
                  <label className="text-xs text-stone-500">구매자 이메일 재입력</label>
                  <Input value={confirmEmail} onChange={e => setConfirmEmail(e.target.value)} placeholder={order.buyerEmail} className="mt-1" />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setStep(1)}>뒤로</Button>
                <Button variant="destructive" disabled={!canConfirm || loading} onClick={handleConfirm}>
                  {loading ? 'PortOne 처리 중...' : '환불 실행'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
