'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'

const STATUS_LABELS: Record<string, { label: string; variant: BadgeVariant }> =
  {
    PENDING: { label: '진행 중', variant: 'secondary' },
    CONFIRMED: { label: '승인 완료', variant: 'default' },
    WEBHOOK_CONFIRMED: { label: '완료', variant: 'default' },
    FAILED: { label: '실패', variant: 'destructive' },
    CANCELLED: { label: '취소됨', variant: 'secondary' },
    REFUND_REQUESTED: { label: '환불 요청 중', variant: 'outline' },
    REFUND_REJECTED: { label: '환불 거절', variant: 'destructive' },
    REFUNDED: { label: '환불 완료', variant: 'secondary' },
    PARTIALLY_REFUNDED: { label: '부분 환불', variant: 'secondary' },
  }

interface Payment {
  id: string
  orderName: string
  status: string
  amount: string | number
  requestedAt: string
}

export function BillingHistoryClient({ payments }: { payments: Payment[] }) {
  const [refundTarget, setRefundTarget] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleRefundRequest = async () => {
    if (reason.length < 10) {
      toast.error('환불 사유를 10자 이상 입력해주세요')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/billing/refund-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: refundTarget, reason }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.message)
      setRefundTarget(null)
      setReason('')
      setTimeout(() => window.location.reload(), 1500)
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : '환불 요청에 실패했어요'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-2xl font-bold mb-8">결제 내역</h1>

      {payments.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">
          아직 결제 내역이 없어요.
        </p>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => {
            const canRefund = ['CONFIRMED', 'WEBHOOK_CONFIRMED'].includes(
              p.status
            )
            const statusInfo = STATUS_LABELS[p.status]
            return (
              <div
                key={p.id}
                className="border rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{p.orderName}</span>
                    {statusInfo && (
                      <Badge variant={statusInfo.variant}>
                        {statusInfo.label}
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(p.requestedAt).toLocaleString('ko-KR')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">
                    ₩{Number(p.amount).toLocaleString()}
                  </div>
                  {canRefund && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => setRefundTarget(p.id)}
                    >
                      환불 요청
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog
        open={!!refundTarget}
        onOpenChange={() => setRefundTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>환불 요청</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              환불 사유를 작성해주세요. 영업일 기준 2일 이내에 검토해서
              연락드려요.
            </p>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="환불 사유를 10자 이상 입력해주세요"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundTarget(null)}>
              취소
            </Button>
            <Button onClick={handleRefundRequest} disabled={submitting}>
              {submitting ? '처리 중...' : '환불 요청하기'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
