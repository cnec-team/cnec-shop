'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  PackageCheck,
  XCircle,
  Ban,
  ArrowRight,
  Loader2,
  Gift,
  ShoppingBag,
  Plus,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getMyTrials,
  cancelProductTrial,
  confirmTrialReceived,
  decideProductTrial,
} from '@/lib/actions/trial'

interface Trial {
  id: string
  status: string
  decision: string | null
  message: string | null
  trackingNumber: string | null
  passReason: string | null
  createdAt: Date | string
  respondedAt: Date | string | null
  shippedAt: Date | string | null
  receivedAt: Date | string | null
  decidedAt: Date | string | null
  convertedTo: string | null
  product: {
    id: string
    name: string | null
    nameKo: string | null
    imageUrl: string | null
    thumbnailUrl: string | null
    category: string | null
  } | null
  brand: {
    id: string
    companyName: string | null
    logoUrl: string | null
  }
}

const STATUS_MAP: Record<string, { text: string; className: string; icon: React.ElementType }> = {
  pending: { text: '대기중', className: 'bg-yellow-50 text-yellow-700', icon: Clock },
  approved: { text: '승인됨', className: 'bg-blue-50 text-blue-700', icon: CheckCircle2 },
  shipped: { text: '배송중', className: 'bg-purple-50 text-purple-700', icon: Truck },
  received: { text: '수령완료', className: 'bg-emerald-50 text-emerald-700', icon: PackageCheck },
  decided: { text: '결정완료', className: 'bg-emerald-50 text-emerald-700', icon: CheckCircle2 },
  rejected: { text: '거절됨', className: 'bg-red-50 text-red-700', icon: XCircle },
  cancelled: { text: '취소됨', className: 'bg-gray-100 text-gray-400', icon: Ban },
}

const FILTERS = [
  { value: '', label: '전체' },
  { value: 'pending', label: '대기중' },
  { value: 'active', label: '진행중' },
  { value: 'done', label: '완료' },
]

const PASS_REASONS = [
  '제품이 안 맞아요',
  '팔로워 반응이 좋지 않을 것 같아요',
  '기타',
]

function filterTrials(trials: Trial[], filter: string): Trial[] {
  if (!filter) return trials
  if (filter === 'active') return trials.filter((t) => ['approved', 'shipped', 'received'].includes(t.status))
  if (filter === 'done') return trials.filter((t) => ['decided', 'rejected', 'cancelled'].includes(t.status))
  return trials.filter((t) => t.status === filter)
}

export default function MyTrialsPage() {
  const [trials, setTrials] = useState<Trial[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Decision modal
  const [decideTarget, setDecideTarget] = useState<Trial | null>(null)
  const [passSheetOpen, setPassSheetOpen] = useState(false)
  const [passReason, setPassReason] = useState('')

  const fetchTrials = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getMyTrials({ limit: 50 })
      setTrials(res.trials as Trial[])
      setTotal(res.total)
    } catch {
      toast.error('체험 목록을 불러오지 못했어요.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTrials()
  }, [fetchTrials])

  const handleCancel = async (trialId: string) => {
    setActionLoading(trialId)
    try {
      const res = await cancelProductTrial(trialId)
      if (res.success) {
        toast.success('체험 신청을 취소했어요.')
        fetchTrials()
      } else {
        toast.error(res.error ?? '취소에 실패했어요.')
      }
    } catch {
      toast.error('취소에 실패했어요.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReceived = async (trialId: string) => {
    setActionLoading(trialId)
    try {
      const res = await confirmTrialReceived(trialId)
      if (res.success) {
        toast.success('수령을 확인했어요!')
        fetchTrials()
      } else {
        toast.error(res.error ?? '수령 확인에 실패했어요.')
      }
    } catch {
      toast.error('수령 확인에 실패했어요.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDecide = async (decision: 'PROCEED' | 'PASS', convertTo?: 'campaign' | 'pick') => {
    if (!decideTarget) return
    setActionLoading(decideTarget.id)
    try {
      const res = await decideProductTrial({
        trialId: decideTarget.id,
        decision,
        passReason: decision === 'PASS' ? passReason || undefined : undefined,
        convertTo,
      })
      if (res.success) {
        toast.success(decision === 'PROCEED' ? '전환을 완료했어요!' : '패스했어요.')
        setDecideTarget(null)
        setPassSheetOpen(false)
        setPassReason('')
        fetchTrials()
      } else {
        toast.error(res.error ?? '처리에 실패했어요.')
      }
    } catch {
      toast.error('처리에 실패했어요.')
    } finally {
      setActionLoading(null)
    }
  }

  const displayed = filterTrials(trials, filter)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">내 체험 현황</h1>
          <p className="text-sm text-gray-500 mt-1">총 {total}건</p>
        </div>
        <Link href="/ko/creator/trial">
          <Button variant="outline" size="sm" className="rounded-xl">
            <Gift className="w-4 h-4 mr-1" /> 체험 상품 보기
          </Button>
        </Link>
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              filter === f.value
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Trials List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Package className="w-12 h-12 text-gray-300" />
          <p className="text-sm text-gray-500">아직 체험 신청 내역이 없어요</p>
          <Link href="/ko/creator/trial">
            <Button variant="outline" size="sm" className="rounded-xl">
              체험 가능 상품 보기 <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((trial) => (
            <TrialCard
              key={trial.id}
              trial={trial}
              actionLoading={actionLoading}
              onCancel={handleCancel}
              onReceived={handleReceived}
              onDecide={setDecideTarget}
            />
          ))}
        </div>
      )}

      {/* Decision Dialog */}
      <Dialog open={!!decideTarget && !passSheetOpen} onOpenChange={(open) => !open && setDecideTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>체험 후 결정</DialogTitle>
          </DialogHeader>
          {decideTarget && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                <strong>{decideTarget.product?.nameKo || decideTarget.product?.name}</strong> 제품을 체험해보셨나요?
              </p>
              <div className="space-y-2">
                <Button
                  onClick={() => handleDecide('PROCEED', 'pick')}
                  disabled={!!actionLoading}
                  className="w-full bg-gray-900 text-white rounded-xl h-11 font-medium"
                >
                  {actionLoading === decideTarget.id ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <><Plus className="w-4 h-4 mr-2" />크리에이터픽에 추가</>
                  )}
                </Button>
                <Button
                  onClick={() => handleDecide('PROCEED', 'campaign')}
                  disabled={!!actionLoading}
                  className="w-full bg-emerald-500 text-white rounded-xl h-11 font-medium"
                >
                  {actionLoading === decideTarget.id ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <><ShoppingBag className="w-4 h-4 mr-2" />이 제품으로 공구하기</>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setPassSheetOpen(true)
                  }}
                  variant="outline"
                  className="w-full rounded-xl h-11 text-gray-600"
                >
                  패스하기
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Pass Sheet */}
      <Sheet open={passSheetOpen} onOpenChange={setPassSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>패스 사유 (선택)</SheetTitle>
          </SheetHeader>
          <div className="space-y-3 py-4">
            {PASS_REASONS.map((reason) => (
              <button
                key={reason}
                onClick={() => setPassReason(reason)}
                className={`w-full text-left rounded-xl px-4 py-3 text-sm transition-colors ${
                  passReason === reason
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {reason}
              </button>
            ))}
            {passReason === '기타' && (
              <Textarea
                value=""
                placeholder="사유를 입력해주세요"
                onChange={(e) => setPassReason(e.target.value)}
                rows={2}
              />
            )}
            <Button
              onClick={() => handleDecide('PASS')}
              disabled={!!actionLoading}
              className="w-full bg-gray-100 text-gray-700 rounded-xl h-11 font-medium"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : '패스하기'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function TrialCard({
  trial,
  actionLoading,
  onCancel,
  onReceived,
  onDecide,
}: {
  trial: Trial
  actionLoading: string | null
  onCancel: (id: string) => void
  onReceived: (id: string) => void
  onDecide: (t: Trial) => void
}) {
  const status = STATUS_MAP[trial.status] ?? STATUS_MAP.pending
  const StatusIcon = status.icon
  const isLoading = actionLoading === trial.id
  const productName = trial.product?.nameKo || trial.product?.name || '상품'
  const imgSrc = trial.product?.thumbnailUrl || trial.product?.imageUrl

  const decidedProceed = trial.status === 'decided' && trial.decision === 'PROCEED'
  const decidedPass = trial.status === 'decided' && trial.decision === 'PASS'

  const statusBadgeClass = decidedProceed
    ? 'bg-emerald-50 text-emerald-700'
    : decidedPass
      ? 'bg-gray-100 text-gray-500'
      : status.className

  const statusText = decidedProceed
    ? '공구/픽 전환 완료'
    : decidedPass
      ? '패스'
      : status.text

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
      {/* Product info */}
      <div className="flex gap-3">
        <div className="w-14 h-14 rounded-xl bg-gray-50 overflow-hidden shrink-0">
          {imgSrc ? (
            <Image src={imgSrc} alt="" width={56} height={56} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-6 h-6 text-gray-300" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500">{trial.brand.companyName}</p>
          <p className="text-sm font-medium text-gray-900 truncate">{productName}</p>
          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-medium mt-1 ${statusBadgeClass}`}>
            <StatusIcon className="w-3 h-3" />
            {statusText}
          </span>
        </div>
      </div>

      {/* Timeline */}
      <div className="text-xs text-gray-500 space-y-0.5">
        <p>신청일: {formatDate(trial.createdAt)}</p>
        {trial.respondedAt && <p>응답일: {formatDate(trial.respondedAt)}</p>}
        {trial.shippedAt && <p>발송일: {formatDate(trial.shippedAt)}</p>}
        {trial.trackingNumber && <p>송장: {trial.trackingNumber}</p>}
        {trial.receivedAt && <p>수령일: {formatDate(trial.receivedAt)}</p>}
        {trial.decidedAt && <p>결정일: {formatDate(trial.decidedAt)}</p>}
      </div>

      {decidedPass && trial.passReason && (
        <p className="text-xs text-gray-400">사유: {trial.passReason}</p>
      )}

      {/* Actions */}
      {trial.status === 'pending' && (
        <Button
          onClick={() => onCancel(trial.id)}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="rounded-xl"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : '신청 취소'}
        </Button>
      )}

      {trial.status === 'shipped' && (
        <Button
          onClick={() => onReceived(trial.id)}
          disabled={isLoading}
          className="bg-gray-900 text-white rounded-xl h-10 text-sm font-medium"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : '수령 확인'}
        </Button>
      )}

      {trial.status === 'received' && (
        <div className="flex gap-2">
          <Button
            onClick={() => onDecide(trial)}
            disabled={isLoading}
            className="flex-1 bg-gray-900 text-white rounded-xl h-10 text-sm font-medium"
          >
            체험 후 결정하기
          </Button>
        </div>
      )}
    </div>
  )
}

function formatDate(dateStr: Date | string): string {
  try {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  } catch {
    return String(dateStr)
  }
}
