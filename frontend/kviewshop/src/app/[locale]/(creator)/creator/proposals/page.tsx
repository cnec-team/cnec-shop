'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Percent,
  Calendar,
  Package,
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

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">받은 제안</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="PENDING" className="gap-1.5">
            대기중
            {pendingCount > 0 && (
              <Badge variant="destructive" className="h-5 min-w-[20px] px-1.5 text-[10px] rounded-full">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="ACCEPTED">수락</TabsTrigger>
          <TabsTrigger value="REJECTED">거절</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mt-4 space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))
        ) : proposals.length > 0 ? (
          proposals.map(p => (
            <Card key={p.id}>
              <CardContent className="p-5">
                {/* 브랜드 정보 */}
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={p.brand.logoUrl || undefined} />
                    <AvatarFallback>
                      {(p.brand.brandName ?? 'B')[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{p.brand.brandName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(p.createdAt)}
                    </p>
                  </div>
                  <Badge variant={p.type === 'GONGGU' ? 'default' : 'secondary'}>
                    {p.type === 'GONGGU' ? '공구' : '상품 추천'}
                  </Badge>
                </div>

                {/* 커미션 */}
                {p.commissionRate != null && (
                  <div className="flex items-center gap-2 mb-3 p-2 bg-muted rounded">
                    <Percent className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      커미션 {p.commissionRate}%
                    </span>
                  </div>
                )}

                {/* 캠페인 상세 */}
                {p.type === 'GONGGU' && p.campaign && (
                  <div className="mb-3 p-3 border rounded-lg space-y-1.5">
                    <p className="font-medium">{p.campaign.title}</p>
                    {p.campaign.startAt && p.campaign.endAt && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(p.campaign.startAt)} ~ {formatDate(p.campaign.endAt)}
                      </p>
                    )}
                    {p.campaign.totalStock != null && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Package className="h-3.5 w-3.5" />
                        한정 {p.campaign.totalStock.toLocaleString()}개
                      </p>
                    )}
                    {p.campaign.products?.map(cp => (
                      <div key={cp.id} className="flex justify-between text-sm">
                        <span>{cp.product.nameKo || cp.product.name}</span>
                        <span className="font-medium">
                          ₩{cp.campaignPrice.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 메시지 */}
                {p.message && (
                  <p className="text-sm whitespace-pre-wrap line-clamp-4 mb-3">
                    {p.message}
                  </p>
                )}

                {/* 거절 사유 */}
                {p.status === 'REJECTED' && p.rejectionReason && (
                  <p className="text-sm text-muted-foreground italic mb-3">
                    사유: {p.rejectionReason}
                  </p>
                )}

                {/* 액션 버튼 */}
                {p.status === 'PENDING' && (
                  <div className="flex gap-3 mt-4">
                    <Button
                      className="flex-1"
                      onClick={() => handleAccept(p.id)}
                      disabled={processing === p.id}
                    >
                      {processing === p.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <Check className="h-4 w-4 mr-1" />
                      )}
                      수락
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setRejectDialog({ open: true, proposalId: p.id })
                        setRejectionReason('')
                        setCustomReason('')
                      }}
                      disabled={processing === p.id}
                    >
                      거절
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-16">
            <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              {activeTab === 'PENDING'
                ? '대기 중인 제안이 없습니다'
                : activeTab === 'ACCEPTED'
                  ? '수락한 제안이 없습니다'
                  : '거절한 제안이 없습니다'}
            </p>
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
