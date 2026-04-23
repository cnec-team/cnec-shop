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
import { toast } from 'sonner'

interface ReactivateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetName: string
  targetType: 'brand' | 'creator'
  currentReason?: string | null
  onConfirm: (params: { reason: string }) => Promise<void>
}

export function ReactivateModal({
  open,
  onOpenChange,
  targetName,
  targetType,
  currentReason,
  onConfirm,
}: ReactivateModalProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [reason, setReason] = useState('')
  const [confirmName, setConfirmName] = useState('')
  const [loading, setLoading] = useState(false)

  const label = targetType === 'brand' ? '브랜드' : '크리에이터'

  function reset() {
    setStep(1)
    setReason('')
    setConfirmName('')
    setLoading(false)
  }

  async function handleConfirm() {
    if (confirmName !== targetName) return
    setLoading(true)
    try {
      await onConfirm({ reason })
      toast.success(`${targetName}이(가) 다시 활성화되었어요`)
      onOpenChange(false)
      reset()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '해제에 실패했어요')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o) }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{targetName} 정지 해제</DialogTitle>
          <DialogDescription>이 {label}의 정지를 해제합니다</DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            {currentReason && (
              <div className="rounded-lg bg-stone-50 p-3">
                <p className="text-xs font-medium text-stone-500">현재 정지 사유</p>
                <p className="mt-1 text-sm text-stone-700">{currentReason}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-stone-700">해제 사유</label>
              <Textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="해제 사유를 입력해주세요"
                className="mt-1.5"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
              <Button disabled={!reason} onClick={() => setStep(2)}>다음</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-stone-600">
              해제하면 이 {label}가 다시 로그인할 수 있어요.
            </p>
            <div>
              <label className="text-sm font-medium text-stone-700">
                해제하려면 {label}명을 정확히 입력하세요
              </label>
              <Input
                value={confirmName}
                onChange={e => setConfirmName(e.target.value)}
                placeholder={targetName}
                className="mt-1.5"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>뒤로</Button>
              <Button
                disabled={confirmName !== targetName || loading}
                onClick={handleConfirm}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {loading ? '처리 중...' : '해제'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
