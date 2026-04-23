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
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface SuspendModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetName: string
  targetType: 'brand' | 'creator'
  /** 활성 캠페인 수 (브랜드만) */
  activeCampaigns?: number
  onConfirm: (params: { reason: string; autoStopCampaigns: boolean }) => Promise<void>
}

export function SuspendModal({
  open,
  onOpenChange,
  targetName,
  targetType,
  activeCampaigns = 0,
  onConfirm,
}: SuspendModalProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [reason, setReason] = useState('')
  const [autoStop, setAutoStop] = useState(true)
  const [confirmName, setConfirmName] = useState('')
  const [loading, setLoading] = useState(false)

  const label = targetType === 'brand' ? '브랜드' : '크리에이터'
  const canProceed = reason.length >= 10
  const canConfirm = confirmName === targetName

  function reset() {
    setStep(1)
    setReason('')
    setAutoStop(true)
    setConfirmName('')
    setLoading(false)
  }

  async function handleConfirm() {
    if (!canConfirm) return
    setLoading(true)
    try {
      await onConfirm({ reason, autoStopCampaigns: autoStop })
      toast.success(`${targetName}이(가) 정지되었어요`)
      onOpenChange(false)
      reset()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '정지에 실패했어요')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o) }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{targetName} 정지</DialogTitle>
          <DialogDescription>
            이 {label}의 계정을 정지합니다
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-stone-700">정지 사유</label>
              <Textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="정지 사유를 상세히 입력해주세요 (최소 10자)"
                className="mt-1.5"
                rows={3}
              />
              <p className="mt-1 text-xs text-stone-400">{reason.length}/10자 이상</p>
            </div>
            {targetType === 'brand' && activeCampaigns > 0 && (
              <label className="flex items-center gap-2 rounded-lg border border-stone-200 p-3">
                <input
                  type="checkbox"
                  checked={autoStop}
                  onChange={e => setAutoStop(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-stone-700">
                  진행 중 캠페인 {activeCampaigns}개 자동 종료
                </span>
              </label>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
              <Button disabled={!canProceed} onClick={() => setStep(2)}>다음</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="rounded-lg bg-red-50 p-3 flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">
                정지하면 이 {label}는 로그인할 수 없어요. 신중히 결정해주세요.
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-stone-700">
                정지하려면 {label}명을 정확히 입력하세요
              </label>
              <p className="mt-0.5 text-xs text-stone-400">입력: {targetName}</p>
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
                variant="destructive"
                disabled={!canConfirm || loading}
                onClick={handleConfirm}
              >
                {loading ? '처리 중...' : '정지'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
