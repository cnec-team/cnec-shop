'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
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
  Package,
  Clock,
  CheckCircle2,
  Truck,
  PackageCheck,
  XCircle,
  Ban,
  Loader2,
  User,
  Send,
  TrendingUp,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getBrandTrialRequests,
  approveTrialRequest,
  rejectTrialRequest,
  shipTrialSample,
  getTrialStats,
} from '@/lib/actions/trial'

interface TrialRequest {
  id: string
  status: string
  decision: string | null
  message: string | null
  trackingNumber: string | null
  rejectReason: string | null
  passReason: string | null
  createdAt: Date | string
  respondedAt: Date | string | null
  shippedAt: Date | string | null
  receivedAt: Date | string | null
  decidedAt: Date | string | null
  creator: {
    id: string
    displayName: string | null
    username: string | null
    profileImage: string | null
    profileImageUrl: string | null
    instagramHandle: string | null
    skinType: string | null
  }
  product: {
    id: string
    name: string | null
    nameKo: string | null
    imageUrl: string | null
    thumbnailUrl: string | null
  } | null
}

interface Stats {
  totalRequests: number
  pendingCount: number
  approvedCount: number
  shippedCount: number
  receivedCount: number
  decidedCount: number
  proceedCount: number
  passCount: number
  conversionRate: number
  avgResponseTimeHours: number | null
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

const FILTER_TABS = [
  { value: '', label: '전체' },
  { value: 'pending', label: '대기중' },
  { value: 'approved', label: '승인' },
  { value: 'shipped', label: '발송' },
  { value: 'received', label: '수령' },
  { value: 'decided', label: '결정' },
  { value: 'rejected', label: '거절' },
]

const REJECT_REASONS = [
  '카테고리 불일치',
  '팔로워 기준 미달',
  '재고 부족',
  '기타',
]

export default function BrandTrialPage() {
  const [trials, setTrials] = useState<TrialRequest[]>([])
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Ship modal
  const [shipTarget, setShipTarget] = useState<TrialRequest | null>(null)
  const [trackingNumber, setTrackingNumber] = useState('')

  // Reject dialog
  const [rejectTarget, setRejectTarget] = useState<TrialRequest | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [trialsRes, statsRes] = await Promise.all([
        getBrandTrialRequests({ status: filter || undefined, limit: 50 }),
        getTrialStats(),
      ])
      setTrials(trialsRes.trials as TrialRequest[])
      setTotal(trialsRes.total)
      setStats(statsRes.stats)
    } catch {
      toast.error('데이터를 불러오지 못했어요.')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleApprove = async (trialId: string) => {
    setActionLoading(trialId)
    try {
      const res = await approveTrialRequest(trialId)
      if (res.success) {
        toast.success('체험 신청을 승인했어요.')
        fetchData()
      } else {
        toast.error(res.error ?? '승인에 실패했어요.')
      }
    } catch {
      toast.error('승인에 실패했어요.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async () => {
    if (!rejectTarget) return
    setActionLoading(rejectTarget.id)
    try {
      const res = await rejectTrialRequest({
        trialId: rejectTarget.id,
        rejectReason: rejectReason || undefined,
      })
      if (res.success) {
        toast.success('체험 신청을 거절했어요.')
        setRejectTarget(null)
        setRejectReason('')
        fetchData()
      } else {
        toast.error(res.error ?? '거절에 실패했어요.')
      }
    } catch {
      toast.error('거절에 실패했어요.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleShip = async () => {
    if (!shipTarget || !trackingNumber.trim()) return
    setActionLoading(shipTarget.id)
    try {
      const res = await shipTrialSample({
        trialId: shipTarget.id,
        trackingNumber: trackingNumber.trim(),
      })
      if (res.success) {
        toast.success('발송 처리를 완료했어요.')
        setShipTarget(null)
        setTrackingNumber('')
        fetchData()
      } else {
        toast.error(res.error ?? '발송 처리에 실패했어요.')
      }
    } catch {
      toast.error('발송 처리에 실패했어요.')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">체험 신청 관리</h1>
        {stats && stats.pendingCount > 0 && (
          <p className="text-sm text-gray-500 mt-1">총 {stats.pendingCount}건 대기중</p>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500">대기중</p>
            <p className="text-2xl font-bold text-gray-900">{stats.pendingCount}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500">진행중</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.approvedCount + stats.shippedCount + stats.receivedCount}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-500">전환</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.proceedCount}</p>
            {stats.conversionRate > 0 && (
              <p className="text-xs text-emerald-500 flex items-center gap-0.5 mt-0.5">
                <TrendingUp className="w-3 h-3" /> {stats.conversionRate}%
              </p>
            )}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              filter === tab.value
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Trials List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : trials.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Package className="w-12 h-12 text-gray-300" />
          <p className="text-sm text-gray-500">
            {filter ? '해당 상태의 신청이 없어요.' : '아직 체험 신청이 없어요.'}
          </p>
          {!filter && (
            <p className="text-xs text-gray-400 text-center max-w-xs">
              상품에서 &apos;체험 허용&apos;을 켜두면 크리에이터가 신청할 수 있어요.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {trials.map((trial) => (
            <TrialRequestCard
              key={trial.id}
              trial={trial}
              actionLoading={actionLoading}
              onApprove={handleApprove}
              onReject={setRejectTarget}
              onShip={setShipTarget}
            />
          ))}
          {total > trials.length && (
            <p className="text-center text-xs text-gray-400 py-2">
              {total}건 중 {trials.length}건 표시
            </p>
          )}
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>체험 거절</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">거절 사유를 선택해주세요.</p>
            <Select value={rejectReason} onValueChange={setRejectReason}>
              <SelectTrigger>
                <SelectValue placeholder="사유 선택" />
              </SelectTrigger>
              <SelectContent>
                {REJECT_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              onClick={handleReject}
              disabled={!!actionLoading}
              className="w-full bg-gray-100 text-gray-700 rounded-xl h-11 font-medium hover:bg-gray-200"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : '거절하기'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ship Dialog */}
      <Dialog open={!!shipTarget} onOpenChange={(open) => !open && setShipTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>샘플 발송</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">송장번호를 입력해주세요.</p>
            <Input
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="송장번호 입력"
            />
          </div>
          <DialogFooter>
            <Button
              onClick={handleShip}
              disabled={!!actionLoading || !trackingNumber.trim()}
              className="w-full bg-gray-900 text-white rounded-xl h-11 font-medium"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <><Send className="w-4 h-4 mr-2" />발송 처리</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TrialRequestCard({
  trial,
  actionLoading,
  onApprove,
  onReject,
  onShip,
}: {
  trial: TrialRequest
  actionLoading: string | null
  onApprove: (id: string) => void
  onReject: (t: TrialRequest) => void
  onShip: (t: TrialRequest) => void
}) {
  const status = STATUS_MAP[trial.status] ?? STATUS_MAP.pending
  const StatusIcon = status.icon
  const isLoading = actionLoading === trial.id
  const creatorName = trial.creator.displayName || trial.creator.username || '크리에이터'
  const productName = trial.product?.nameKo || trial.product?.name || '상품'
  const profileImg = trial.creator.profileImageUrl || trial.creator.profileImage

  const decidedProceed = trial.status === 'decided' && trial.decision === 'PROCEED'
  const decidedPass = trial.status === 'decided' && trial.decision === 'PASS'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      {/* Creator Info */}
      <div className="flex gap-3">
        <div className="w-11 h-11 rounded-full bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
          {profileImg ? (
            <Image src={profileImg} alt="" width={44} height={44} className="w-full h-full object-cover" />
          ) : (
            <User className="w-5 h-5 text-gray-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{creatorName}</p>
          {trial.creator.instagramHandle && (
            <p className="text-xs text-gray-500">@{trial.creator.instagramHandle}</p>
          )}
          <div className="flex flex-wrap gap-2 mt-1">
            {trial.creator.skinType && (
              <span className="text-xs bg-gray-50 text-gray-600 rounded px-2 py-0.5">
                {trial.creator.skinType}
              </span>
            )}
          </div>
        </div>
        <span className={`self-start inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium shrink-0 ${
          decidedProceed ? 'bg-emerald-50 text-emerald-700' :
          decidedPass ? 'bg-gray-100 text-gray-500' :
          status.className
        }`}>
          <StatusIcon className="w-3 h-3" />
          {decidedProceed ? '전환 완료' : decidedPass ? '패스' : status.text}
        </span>
      </div>

      {/* Product Info */}
      <div className="flex gap-3 items-center bg-gray-50 rounded-xl p-3">
        <div className="w-10 h-10 rounded-lg bg-white overflow-hidden shrink-0">
          {trial.product?.thumbnailUrl || trial.product?.imageUrl ? (
            <Image
              src={trial.product.thumbnailUrl || trial.product.imageUrl || ''}
              alt=""
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-4 h-4 text-gray-300" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500">신청 상품</p>
          <p className="text-sm font-medium text-gray-900 truncate">{productName}</p>
        </div>
      </div>

      {/* Message */}
      {trial.message && (
        <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3 italic">
          &ldquo;{trial.message}&rdquo;
        </p>
      )}

      {/* Timeline */}
      <div className="text-xs text-gray-400 space-y-0.5">
        <p>신청일: {formatDate(trial.createdAt)}</p>
        {trial.respondedAt && <p>응답일: {formatDate(trial.respondedAt)}</p>}
        {trial.shippedAt && <p>발송일: {formatDate(trial.shippedAt)}</p>}
        {trial.trackingNumber && <p>송장: {trial.trackingNumber}</p>}
        {trial.receivedAt && <p>수령일: {formatDate(trial.receivedAt)}</p>}
        {trial.decidedAt && <p>결정일: {formatDate(trial.decidedAt)}</p>}
      </div>

      {trial.rejectReason && (
        <p className="text-xs text-red-500">거절 사유: {trial.rejectReason}</p>
      )}
      {decidedPass && trial.passReason && (
        <p className="text-xs text-gray-400">패스 사유: {trial.passReason}</p>
      )}

      {/* Actions */}
      {trial.status === 'pending' && (
        <div className="flex gap-2">
          <Button
            onClick={() => onApprove(trial.id)}
            disabled={isLoading}
            className="flex-1 bg-emerald-500 text-white rounded-xl h-10 text-sm font-medium hover:bg-emerald-600"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : '승인'}
          </Button>
          <Button
            onClick={() => onReject(trial)}
            disabled={isLoading}
            variant="outline"
            className="flex-1 rounded-xl h-10 text-sm font-medium"
          >
            거절
          </Button>
        </div>
      )}

      {trial.status === 'approved' && (
        <Button
          onClick={() => onShip(trial)}
          disabled={isLoading}
          className="w-full bg-gray-900 text-white rounded-xl h-10 text-sm font-medium"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
            <><Send className="w-4 h-4 mr-2" />발송 처리</>
          )}
        </Button>
      )}

      {decidedProceed && (
        <div className="bg-emerald-50 rounded-xl p-3 text-center">
          <p className="text-sm font-medium text-emerald-700">공구/픽 전환 완료</p>
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
