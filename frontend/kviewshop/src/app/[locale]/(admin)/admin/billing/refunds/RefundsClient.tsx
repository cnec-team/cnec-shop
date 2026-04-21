'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface RefundRequest {
  id: string
  orderName: string
  amount: string | number
  refundReason: string | null
  refundRequestedAt: string | null
  brand: {
    companyName: string | null
    brandName: string | null
  }
}

export function RefundsClient({ requests }: { requests: RefundRequest[] }) {
  const [target, setTarget] = useState<{
    id: string
    approve: boolean
  } | null>(null)
  const [reason, setReason] = useState('')
  const [cancelAmount, setCancelAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!target) return
    if (reason.length < 5) {
      toast.error('사유를 5자 이상 입력해주세요')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/billing/refund-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: target.id,
          approve: target.approve,
          reason,
          cancelAmount: cancelAmount ? Number(cancelAmount) : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(target.approve ? '환불 승인 완료' : '환불 거절 완료')
      setTarget(null)
      setReason('')
      setCancelAmount('')
      setTimeout(() => window.location.reload(), 1000)
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : '처리 중 오류가 발생했어요'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-8">환불 요청 승인</h1>
      {requests.length === 0 ? (
        <p className="text-muted-foreground">
          대기 중인 환불 요청이 없어요.
        </p>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <div key={r.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-medium">
                    {r.brand.companyName ?? r.brand.brandName}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {r.orderName}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    요청일:{' '}
                    {r.refundRequestedAt
                      ? new Date(r.refundRequestedAt).toLocaleString('ko-KR')
                      : '-'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">
                    ₩{Number(r.amount).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="bg-muted p-3 rounded text-sm mb-3">
                <div className="font-medium mb-1">환불 사유</div>
                <div>{r.refundReason}</div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setTarget({ id: r.id, approve: true })}
                >
                  승인
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTarget({ id: r.id, approve: false })}
                >
                  거절
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!target} onOpenChange={() => setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {target?.approve ? '환불 승인' : '환불 거절'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <label className="text-sm font-medium">처리 사유</label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
            {target?.approve && (
              <div>
                <label className="text-sm font-medium">
                  부분 환불 금액 (비우면 전액)
                </label>
                <Input
                  type="number"
                  value={cancelAmount}
                  onChange={(e) => setCancelAmount(e.target.value)}
                  placeholder="전액 환불 시 비워두세요"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)}>
              취소
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? '처리 중...' : '확정'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
