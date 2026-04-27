'use client'

import { useState, useEffect, useCallback } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { Skeleton } from '@/components/ui/skeleton'
import {
  Check,
  Mail,
  Bell,
  Clock,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

interface Proposal {
  id: string
  type: 'GONGGU' | 'PRODUCT_PICK'
  status: string
  commissionRate: number | null
  message: string | null
  rejectionReason: string | null
  createdAt: string
  brand: {
    id: string
    brandName: string | null
    logoUrl: string | null
  }
  campaign: {
    id: string
    title: string
    startAt: string | null
    endAt: string | null
    totalStock: number | null
    products: {
      id: string
      campaignPrice: number
      product: {
        name: string | null
        nameKo: string | null
        salePrice: number | null
        originalPrice: number | null
      }
    }[]
  } | null
  template: { name: string } | null
}

export default function CreatorProposalsPage() {
  const [activeTab, setActiveTab] = useState('PENDING')
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean
    proposalId: string | null
  }>({ open: false, proposalId: null })
  const [rejectionReason, setRejectionReason] = useState('')
  const [customReason, setCustomReason] = useState('')

  const fetchProposals = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/creator/proposals?status=${activeTab}`)
      if (res.ok) {
        const data = await res.json()
        setProposals(data.proposals)
        setPendingCount(data.pendingCount)
      }
    } catch {
      toast.error('제안 목록을 불러오지 못했습니다')
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    fetchProposals()
  }, [fetchProposals])

  const handleAccept = async (proposalId: string) => {
    setProcessing(proposalId)
    try {
      const res = await fetch(`/api/creator/proposals/${proposalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept' }),
      })
      if (res.ok) {
        toast.success('제안을 수락했습니다')
        fetchProposals()
      } else {
        const data = await res.json()
        toast.error(data.error || '오류가 발생했습니다')
      }
    } catch {
      toast.error('오류가 발생했습니다')
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async () => {
    if (!rejectDialog.proposalId || !rejectionReason) return
    const reason = rejectionReason === '기타' ? customReason : rejectionReason
    setProcessing(rejectDialog.proposalId)
    try {
      const res = await fetch(`/api/creator/proposals/${rejectDialog.proposalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', rejectionReason: reason }),
      })
      if (res.ok) {
        toast.success('제안을 거절했습니다')
        setRejectDialog({ open: false, proposalId: null })
        setRejectionReason('')
        setCustomReason('')
        fetchProposals()
      } else {
        const data = await res.json()
        toast.error(data.error || '오류가 발생했습니다')
      }
    } catch {
      toast.error('오류가 발생했습니다')
    } finally {
      setProcessing(null)
    }
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('ko-KR')

  const getDDay = (dateStr: string) => {
    const now = new Date()
    const created = new Date(dateStr)
    const diffMs = now.getTime() - created.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getEstimatedTotal = () => {
    return proposals.reduce((sum, p) => {
      if (p.commissionRate != null && p.campaign?.products?.[0]) {
        return sum + Math.round(p.campaign.products[0].campaignPrice * p.commissionRate / 100)
      }
      return sum
    }, 0)
  }

  const tabs = [
    { key: 'PENDING', label: '대기중', count: pendingCount },
    { key: 'ACCEPTED', label: '수락', count: null },
    { key: 'REJECTED', label: '거절', count: null },
  ]

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-2xl font-bold">받은 제안</h1>
        {pendingCount > 0 && (
          <div className="relative">
            <Bell className="h-5 w-5 text-foreground" />
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500" />
          </div>
        )}
      </div>

      {/* Pill Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === tab.key
                ? 'bg-foreground text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
            {tab.key === 'PENDING' && pendingCount > 0 && (
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key
                  ? 'bg-white/20 text-white'
                  : 'bg-red-500 text-white'
              }`}>
                {pendingCount}
              </span>
            )}
            {tab.key === 'ACCEPTED' && !loading && proposals.length > 0 && activeTab === 'ACCEPTED' && (
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-300 text-gray-600'
              }`}>
                {proposals.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))
        ) : proposals.length > 0 ? (
          <>
            {/* Summary Card — only in PENDING tab */}
            {activeTab === 'PENDING' && pendingCount > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-2">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm">새 제안 {pendingCount}개</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-muted-foreground">
                        예상 수익 <span className="font-semibold text-emerald-600">₩{getEstimatedTotal().toLocaleString()}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>24시간 내 응답</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section Label */}
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide pt-1">
              브랜드 제안
            </p>

            {/* Proposal Cards */}
            {proposals.map((p) => {
              const estimatedEarnings = p.commissionRate != null && p.campaign?.products?.[0]
                ? Math.round(p.campaign.products[0].campaignPrice * p.commissionRate / 100)
                : null
              const dDays = getDDay(p.createdAt)

              return (
                <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  {/* Brand row */}
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={p.brand.logoUrl || undefined} />
                      <AvatarFallback className="text-sm font-semibold">
                        {(p.brand.brandName ?? 'B')[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold truncate">{p.brand.brandName}</p>
                        {activeTab === 'PENDING' && dDays <= 3 && (
                          <span className="shrink-0 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                            D-{Math.max(1, 3 - dDays + 1)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(p.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Campaign / Product description */}
                  {p.type === 'GONGGU' && p.campaign && (
                    <p className="text-sm text-gray-700 line-clamp-2 mb-3">
                      {p.campaign.title}
                      {p.campaign.products?.[0] && (
                        <span className="text-muted-foreground">
                          {' '} — {p.campaign.products[0].product.nameKo || p.campaign.products[0].product.name}
                        </span>
                      )}
                    </p>
                  )}

                  {p.message && (
                    <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-2 mb-3">
                      {p.message}
                    </p>
                  )}

                  {/* Rejection reason for REJECTED tab */}
                  {p.status === 'REJECTED' && p.rejectionReason && (
                    <div className="bg-gray-50 rounded-xl p-3 mb-3">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-gray-700">거절 사유:</span> {p.rejectionReason}
                      </p>
                    </div>
                  )}

                  {/* Bottom row: earnings + buttons */}
                  {activeTab === 'PENDING' && (
                    <div className="flex items-center justify-between mt-1 pt-3 border-t border-gray-100">
                      <div>
                        {estimatedEarnings != null && (
                          <>
                            <p className="text-xs text-muted-foreground">예상 수익</p>
                            <p className="text-base font-bold text-emerald-600">
                              ₩{estimatedEarnings.toLocaleString()}
                            </p>
                          </>
                        )}
                        {p.commissionRate != null && (
                          <p className="text-xs text-muted-foreground">수수료율 {p.commissionRate}%</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl px-4"
                          onClick={() => {
                            setRejectDialog({ open: true, proposalId: p.id })
                            setRejectionReason('')
                            setCustomReason('')
                          }}
                          disabled={processing === p.id}
                        >
                          거절
                        </Button>
                        <Button
                          size="sm"
                          className="rounded-xl px-4 bg-foreground text-white hover:bg-foreground/90"
                          onClick={() => handleAccept(p.id)}
                          disabled={processing === p.id}
                        >
                          {processing === p.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <Check className="h-4 w-4 mr-1" />
                          )}
                          수락하기
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Accepted tab: show earnings info without buttons */}
                  {activeTab === 'ACCEPTED' && estimatedEarnings != null && (
                    <div className="mt-1 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">예상 수익</p>
                          <p className="text-base font-bold text-emerald-600">
                            ₩{estimatedEarnings.toLocaleString()}
                          </p>
                        </div>
                        {p.commissionRate != null && (
                          <span className="text-xs text-muted-foreground">수수료율 {p.commissionRate}%</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </>
        ) : (
          <div className="text-center py-16">
            <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Mail className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <p className="font-bold">
              {activeTab === 'PENDING'
                ? '새 제안이 도착하면 여기로 보내드릴게요'
                : activeTab === 'ACCEPTED'
                  ? '수락한 제안이 여기에 표시돼요'
                  : '거절한 제안이 여기에 표시돼요'}
            </p>
            {activeTab === 'PENDING' && (
              <p className="text-sm text-muted-foreground mt-1.5">
                샵을 꾸미고 상품을 담으면 브랜드 제안이 더 많이 와요
              </p>
            )}
          </div>
        )}
      </div>

      {/* 거절 사유 Dialog */}
      <Dialog
        open={rejectDialog.open}
        onOpenChange={open => {
          if (!open) setRejectDialog({ open: false, proposalId: null })
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>제안을 거절하시겠습니까?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label>거절 사유</Label>
            <Select value={rejectionReason} onValueChange={setRejectionReason}>
              <SelectTrigger>
                <SelectValue placeholder="사유 선택..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="일정이 맞지 않아요">
                  일정이 맞지 않아요
                </SelectItem>
                <SelectItem value="카테고리가 맞지 않아요">
                  카테고리가 맞지 않아요
                </SelectItem>
                <SelectItem value="커미션 조건이 맞지 않아요">
                  커미션 조건이 맞지 않아요
                </SelectItem>
                <SelectItem value="기타">기타</SelectItem>
              </SelectContent>
            </Select>
            {rejectionReason === '기타' && (
              <Textarea
                value={customReason}
                onChange={e => setCustomReason(e.target.value)}
                placeholder="거절 사유를 입력해주세요"
              />
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialog({ open: false, proposalId: null })}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={
                !rejectionReason ||
                (rejectionReason === '기타' && !customReason.trim()) ||
                processing !== null
              }
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : null}
              거절하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
