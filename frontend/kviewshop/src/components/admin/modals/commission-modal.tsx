'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { toast } from 'sonner'

interface CommissionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  brandName: string
  currentRate: number
  onConfirm: (params: { newRate: number; reason: string }) => Promise<void>
}

export function CommissionModal({
  open,
  onOpenChange,
  brandName,
  currentRate,
  onConfirm,
}: CommissionModalProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [newRate, setNewRate] = useState(currentRate)
  const [reason, setReason] = useState('')
  const [confirmName, setConfirmName] = useState('')
  const [loading, setLoading] = useState(false)

  const isValid = newRate >= 5 && newRate <= 50 && newRate !== currentRate && reason.length > 0

  function reset() {
    setStep(1)
    setNewRate(currentRate)
    setReason('')
    setConfirmName('')
    setLoading(false)
  }

  async function handleConfirm() {
    if (confirmName !== brandName) return
    setLoading(true)
    try {
      await onConfirm({ newRate, reason })
      toast.success('수수료율이 변경되었어요')
      onOpenChange(false)
      reset()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '변경에 실패했어요')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o) }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{brandName} 수수료율 조정</DialogTitle>
          <DialogDescription>크리에이터 커미션 수수료율을 변경합니다</DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div className="rounded-lg bg-stone-50 p-3">
              <p className="text-xs text-stone-500">현재 수수료율</p>
              <p className="text-lg font-bold tabular-nums text-stone-900">{currentRate}%</p>
            </div>
            <div>
              <label className="text-sm font-medium text-stone-700">새 수수료율</label>
              <div className="mt-2 flex items-center gap-4">
                <Slider
                  value={[newRate]}
                  onValueChange={v => setNewRate(v[0])}
                  min={5}
                  max={50}
                  step={1}
                  className="flex-1"
                />
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={newRate}
                    onChange={e => {
                      const v = parseInt(e.target.value)
                      if (!isNaN(v)) setNewRate(Math.min(50, Math.max(5, v)))
                    }}
                    className="w-16 text-center tabular-nums"
                    min={5}
                    max={50}
                  />
                  <span className="text-sm text-stone-500">%</span>
                </div>
              </div>
              {(newRate < 5 || newRate > 50) && (
                <p className="mt-1 text-xs text-red-500">5% ~ 50% 범위만 가능해요</p>
              )}
              {newRate === currentRate && (
                <p className="mt-1 text-xs text-amber-600">현재와 동일한 수수료율이에요</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-stone-700">변경 사유</label>
              <Textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="변경 사유를 입력해주세요"
                className="mt-1.5"
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
              <Button disabled={!isValid} onClick={() => setStep(2)}>다음</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-1">
              <p className="text-sm text-stone-700">
                이전 수수료율: <span className="font-semibold">{currentRate}%</span>
                {' → '}
                새 수수료율: <span className="font-semibold">{newRate}%</span>
              </p>
              <p className="text-xs text-stone-500">이전 주문에는 소급 적용되지 않아요</p>
            </div>
            <div>
              <label className="text-sm font-medium text-stone-700">
                변경하려면 브랜드명을 정확히 입력하세요
              </label>
              <Input
                value={confirmName}
                onChange={e => setConfirmName(e.target.value)}
                placeholder={brandName}
                className="mt-1.5"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>뒤로</Button>
              <Button
                disabled={confirmName !== brandName || loading}
                onClick={handleConfirm}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {loading ? '처리 중...' : '변경'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
