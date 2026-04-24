'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AdminBreadcrumb } from '@/components/admin/admin-breadcrumb'
import {
  ChevronLeft, MoreHorizontal, CircleDollarSign, Pause, Play, Ban,
  FileText, Upload, AlertTriangle, Check, X, ExternalLink, Clock,
  Pencil,
} from 'lucide-react'
import { formatCurrency } from '@/lib/i18n/config'
import {
  getAdminSettlementDetail,
  forcePaySettlement,
  holdSettlement,
  releaseSettlement,
  cancelSettlement,
  updateSettlementMemo,
} from '@/lib/actions/admin-settlements'
import { toast } from 'sonner'

// ==================== Types ====================

interface Settlement {
  id: string
  status: string
  netAmount: unknown
  totalSales: unknown
  grossCommission: unknown
  withholdingTax: unknown
  paidAt: string | null
  paidBy: string | null
  paidAmount: unknown
  paidMemo: string | null
  paymentProofUrl: string | null
  heldAt: string | null
  heldBy: string | null
  heldReason: string | null
  cancelledAt: string | null
  cancelledBy: string | null
  cancelledReason: string | null
  periodStart: string | null
  periodEnd: string | null
  createdAt: string
  user?: {
    id: string
    name: string | null
    email: string | null
    phone: string | null
    role: string | null
    brand?: { id: string; brandName: string | null; logoUrl: string | null } | null
    creator?: { id: string; displayName: string | null; username: string | null } | null
  } | null
}

interface AuditEntry {
  id: string
  action: string
  actorId: string
  actorRole: string
  reason: string | null
  payload: unknown
  createdAt: string
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  PENDING: { label: '지급대기', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  PAID: { label: '지급완료', className: 'bg-green-100 text-green-800 border-green-200' },
  HOLD: { label: '보류', className: 'bg-orange-100 text-orange-800 border-orange-200' },
  CANCELLED: { label: '취소', className: 'bg-gray-100 text-gray-600 border-gray-200' },
}

const ACTION_LABELS: Record<string, string> = {
  SETTLEMENT_FORCE_PAY: '강제 지급',
  SETTLEMENT_HOLD: '보류',
  SETTLEMENT_RELEASE: '보류 해제',
  SETTLEMENT_CANCEL: '취소',
}

function getRecipientName(settlement: Settlement): string {
  return settlement.user?.brand?.brandName
    ?? settlement.user?.creator?.displayName
    ?? settlement.user?.creator?.username
    ?? settlement.user?.name
    ?? '-'
}

// ==================== Page ====================

export default function SettlementDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [settlement, setSettlement] = useState<Settlement | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)

  // Modal states
  const [forcePayOpen, setForcePayOpen] = useState(false)
  const [holdOpen, setHoldOpen] = useState(false)
  const [releaseOpen, setReleaseOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [memoOpen, setMemoOpen] = useState(false)
  const [proofPreviewOpen, setProofPreviewOpen] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const data = await getAdminSettlementDetail(id)
      setSettlement(data.settlement as unknown as Settlement)
      setAuditLogs(data.auditLogs as unknown as AuditEntry[])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '정산 상세를 불러오지 못했어요')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) return <div className="text-center py-12 text-muted-foreground">로딩 중...</div>
  if (!settlement) return <div className="text-center py-12 text-muted-foreground">정산을 찾을 수 없어요</div>

  const recipientName = getRecipientName(settlement)
  const statusInfo = STATUS_BADGE[settlement.status] ?? STATUS_BADGE['PENDING']

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <AdminBreadcrumb items={[
        { href: '/admin', label: '어드민' },
        { href: '/admin/settlements', label: '정산 관리' },
        { label: `정산 #${settlement.id.slice(-8)}` },
      ]} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/ko/admin/settlements')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">정산 #{settlement.id.slice(-8)}</h1>
          <Badge variant="outline" className={statusInfo.className}>{statusInfo.label}</Badge>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <MoreHorizontal className="mr-2 h-4 w-4" />
              액션
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(settlement.status === 'PENDING' || settlement.status === 'HOLD') && (
              <DropdownMenuItem onClick={() => setForcePayOpen(true)}>
                <CircleDollarSign className="mr-2 h-4 w-4" />
                강제 지급
              </DropdownMenuItem>
            )}
            {settlement.status === 'PENDING' && (
              <DropdownMenuItem onClick={() => setHoldOpen(true)}>
                <Pause className="mr-2 h-4 w-4" />
                보류
              </DropdownMenuItem>
            )}
            {settlement.status === 'HOLD' && (
              <DropdownMenuItem onClick={() => setReleaseOpen(true)}>
                <Play className="mr-2 h-4 w-4" />
                보류 해제
              </DropdownMenuItem>
            )}
            {settlement.status === 'PAID' && (
              <DropdownMenuItem onClick={() => setMemoOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" />
                메모 수정
              </DropdownMenuItem>
            )}
            {settlement.status !== 'CANCELLED' && (
              <DropdownMenuItem onClick={() => setCancelOpen(true)} className="text-red-600">
                <Ban className="mr-2 h-4 w-4" />
                취소
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Status Banner */}
      {settlement.status === 'HOLD' && (
        <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <Pause className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-orange-800">이 정산은 보류 중이에요</p>
            <p className="text-sm text-orange-700 mt-1">사유: {settlement.heldReason}</p>
            <p className="text-xs text-orange-600 mt-1">
              보류일: {settlement.heldAt ? new Date(settlement.heldAt).toLocaleDateString('ko-KR') : '-'}
            </p>
          </div>
        </div>
      )}
      {settlement.status === 'PAID' && (
        <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <Check className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-green-800">지급 완료</p>
            <p className="text-sm text-green-700 mt-1">
              지급일: {settlement.paidAt ? new Date(settlement.paidAt).toLocaleDateString('ko-KR') : '-'}
            </p>
          </div>
        </div>
      )}
      {settlement.status === 'CANCELLED' && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <Ban className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-red-800">취소됨</p>
            <p className="text-sm text-red-700 mt-1">사유: {settlement.cancelledReason}</p>
            <p className="text-xs text-red-600 mt-1">
              취소일: {settlement.cancelledAt ? new Date(settlement.cancelledAt).toLocaleDateString('ko-KR') : '-'}
            </p>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left - Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Settlement info */}
          <Card>
            <CardHeader>
              <CardTitle>정산 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-muted-foreground">수령인</dt>
                  <dd className="font-medium flex items-center gap-2 mt-1">
                    {settlement.user?.brand?.logoUrl && (
                      <img src={settlement.user.brand.logoUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
                    )}
                    {recipientName}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">정산 대상 기간</dt>
                  <dd className="font-medium mt-1">
                    {settlement.periodStart && settlement.periodEnd
                      ? `${new Date(settlement.periodStart).toLocaleDateString('ko-KR')} ~ ${new Date(settlement.periodEnd).toLocaleDateString('ko-KR')}`
                      : '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">총 GMV</dt>
                  <dd className="font-medium tabular-nums mt-1">
                    {formatCurrency(Number(settlement.totalSales), 'KRW')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">수수료</dt>
                  <dd className="font-medium tabular-nums mt-1">
                    {formatCurrency(Number(settlement.grossCommission), 'KRW')}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm text-muted-foreground">정산액</dt>
                  <dd className="text-2xl font-bold tabular-nums mt-1 text-primary">
                    {formatCurrency(Number(settlement.netAmount), 'KRW')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">생성일</dt>
                  <dd className="font-medium mt-1">
                    {new Date(settlement.createdAt).toLocaleDateString('ko-KR')}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Payment info (PAID only) */}
          {settlement.status === 'PAID' && (
            <Card>
              <CardHeader>
                <CardTitle>지급 정보</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm text-muted-foreground">지급 금액</dt>
                    <dd className="font-bold tabular-nums text-lg mt-1">
                      {formatCurrency(Number(settlement.paidAmount), 'KRW')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">지급 일시</dt>
                    <dd className="font-medium mt-1">
                      {settlement.paidAt ? new Date(settlement.paidAt).toLocaleString('ko-KR') : '-'}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-sm text-muted-foreground">메모</dt>
                    <dd className="font-medium mt-1 flex items-center gap-2">
                      {settlement.paidMemo ?? '-'}
                      <Button variant="ghost" size="sm" onClick={() => setMemoOpen(true)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </dd>
                  </div>
                  {settlement.paymentProofUrl && (
                    <div className="sm:col-span-2">
                      <dt className="text-sm text-muted-foreground mb-2">송금 증빙</dt>
                      <dd>
                        {settlement.paymentProofUrl.endsWith('.pdf') ? (
                          <Button variant="outline" onClick={() => window.open(settlement.paymentProofUrl!, '_blank')}>
                            <FileText className="mr-2 h-4 w-4" />
                            PDF 증빙 보기
                            <ExternalLink className="ml-2 h-3 w-3" />
                          </Button>
                        ) : (
                          <div
                            className="cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setProofPreviewOpen(true)}
                          >
                            <img
                              src={settlement.paymentProofUrl}
                              alt="송금 증빙"
                              className="max-w-xs rounded-lg border shadow-sm"
                            />
                            <p className="text-xs text-muted-foreground mt-1">클릭하여 확대</p>
                          </div>
                        )}
                      </dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Actions card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">현재 상태</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Badge variant="outline" className={`${statusInfo.className} text-base px-3 py-1`}>
                {statusInfo.label}
              </Badge>
              <div className="space-y-2 pt-2">
                {(settlement.status === 'PENDING' || settlement.status === 'HOLD') && (
                  <Button className="w-full" onClick={() => setForcePayOpen(true)}>
                    <CircleDollarSign className="mr-2 h-4 w-4" />
                    강제 지급
                  </Button>
                )}
                {settlement.status === 'PENDING' && (
                  <Button variant="outline" className="w-full" onClick={() => setHoldOpen(true)}>
                    <Pause className="mr-2 h-4 w-4" />
                    보류
                  </Button>
                )}
                {settlement.status === 'HOLD' && (
                  <Button variant="outline" className="w-full" onClick={() => setReleaseOpen(true)}>
                    <Play className="mr-2 h-4 w-4" />
                    보류 해제
                  </Button>
                )}
                {settlement.status !== 'CANCELLED' && (
                  <Button variant="outline" className="w-full text-red-600 hover:text-red-700" onClick={() => setCancelOpen(true)}>
                    <Ban className="mr-2 h-4 w-4" />
                    취소
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Audit history */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">액션 히스토리</CardTitle>
            </CardHeader>
            <CardContent>
              {auditLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground">기록이 없어요</p>
              ) : (
                <div className="space-y-3">
                  {auditLogs.map(log => (
                    <div key={log.id} className="border-l-2 pl-3 py-1">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString('ko-KR')}
                        </span>
                      </div>
                      <p className="text-sm font-medium mt-0.5">
                        {ACTION_LABELS[log.action] ?? log.action}
                      </p>
                      {log.reason && (
                        <p className="text-xs text-muted-foreground mt-0.5">{log.reason}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ========== Modals ========== */}

      {/* Force Pay Modal */}
      <ForcePayModal
        open={forcePayOpen}
        onOpenChange={setForcePayOpen}
        settlement={settlement}
        recipientName={recipientName}
        onSuccess={() => { setForcePayOpen(false); fetchData() }}
      />

      {/* Hold Modal */}
      <HoldModal
        open={holdOpen}
        onOpenChange={setHoldOpen}
        settlement={settlement}
        onSuccess={() => { setHoldOpen(false); fetchData() }}
      />

      {/* Release Modal */}
      <ReleaseModal
        open={releaseOpen}
        onOpenChange={setReleaseOpen}
        settlement={settlement}
        onSuccess={() => { setReleaseOpen(false); fetchData() }}
      />

      {/* Cancel Modal */}
      <CancelModal
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        settlement={settlement}
        recipientName={recipientName}
        onSuccess={() => { setCancelOpen(false); fetchData() }}
      />

      {/* Memo Modal */}
      <MemoModal
        open={memoOpen}
        onOpenChange={setMemoOpen}
        settlement={settlement}
        onSuccess={() => { setMemoOpen(false); fetchData() }}
      />

      {/* Proof Preview */}
      {settlement.paymentProofUrl && !settlement.paymentProofUrl.endsWith('.pdf') && (
        <Dialog open={proofPreviewOpen} onOpenChange={setProofPreviewOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>송금 증빙</DialogTitle>
            </DialogHeader>
            <img src={settlement.paymentProofUrl} alt="송금 증빙" className="w-full rounded-lg" />
            <DialogFooter>
              <Button variant="outline" onClick={() => window.open(settlement.paymentProofUrl!, '_blank')}>
                <ExternalLink className="mr-2 h-4 w-4" />
                새 탭에서 열기
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// ==================== Force Pay Modal (3 steps) ====================

function ForcePayModal({
  open, onOpenChange, settlement, recipientName, onSuccess,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  settlement: Settlement
  recipientName: string
  onSuccess: () => void
}) {
  const [step, setStep] = useState(1)
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')
  const [proofUrl, setProofUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Step 3 confirmations
  const [confirmId, setConfirmId] = useState('')
  const [confirmBrand, setConfirmBrand] = useState('')
  const [confirmAmount, setConfirmAmount] = useState('')

  // Reset on close
  useEffect(() => {
    if (!open) {
      setStep(1)
      setAmount(String(Number(settlement.netAmount)))
      setMemo('')
      setProofUrl('')
      setConfirmId('')
      setConfirmBrand('')
      setConfirmAmount('')
    } else {
      setAmount(String(Number(settlement.netAmount)))
    }
  }, [open, settlement.netAmount])

  const handleUpload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error('파일 크기는 10MB 이하여야 해요')
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('settlementId', settlement.id)
      const res = await fetch('/api/admin/settlements/upload-proof', { method: 'POST', body: formData })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || '업로드 실패')
      }
      const { url } = await res.json()
      setProofUrl(url)
      toast.success('증빙이 업로드됐어요')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '업로드에 실패했어요')
    } finally {
      setUploading(false)
    }
  }

  const parsedAmount = parseInt(amount.replace(/,/g, ''), 10)
  const step1Valid = parsedAmount > 0 && memo.length >= 10 && !!proofUrl

  const normalizeForCompare = (v: string) => v.replace(/,/g, '').trim()
  const step3Valid =
    (confirmId.trim() === settlement.id || confirmId.trim() === settlement.id.slice(-8)) &&
    confirmBrand.trim() === recipientName &&
    normalizeForCompare(confirmAmount) === String(parsedAmount)

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await forcePaySettlement({
        settlementId: settlement.id,
        paidAmount: parsedAmount,
        paidMemo: memo,
        paymentProofUrl: proofUrl,
        expectedStatus: settlement.status as 'PENDING' | 'HOLD',
      })
      toast.success(`정산 ${formatCurrency(parsedAmount, 'KRW')} 지급 완료 처리됐어요`)
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '지급 처리에 실패했어요')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === 1 && '강제 지급 - 정보 입력'}
            {step === 2 && '강제 지급 - 확인'}
            {step === 3 && '강제 지급 - 최종 검증'}
          </DialogTitle>
          <DialogDescription>
            단계 {step}/3
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-3 space-y-1">
              <div className="text-sm text-muted-foreground">브랜드: <span className="font-medium text-foreground">{recipientName}</span></div>
              <div className="text-sm text-muted-foreground">정산액: <span className="font-bold text-foreground tabular-nums">{formatCurrency(Number(settlement.netAmount), 'KRW')}</span></div>
            </div>

            <div>
              <label className="text-sm font-medium">실제 지급 금액</label>
              <Input
                type="text"
                value={amount}
                onChange={e => setAmount(e.target.value.replace(/[^0-9,]/g, ''))}
                placeholder="금액 입력"
                className="tabular-nums"
              />
            </div>

            <div>
              <label className="text-sm font-medium">지급 메모 (최소 10자)</label>
              <Textarea
                value={memo}
                onChange={e => setMemo(e.target.value)}
                placeholder="2026-04-24 KB국민 12345678 송금"
                rows={2}
              />
              <p className="text-xs text-muted-foreground mt-1">{memo.length}/10자</p>
            </div>

            <div>
              <label className="text-sm font-medium">이체 확인서 (필수)</label>
              {proofUrl ? (
                <div className="flex items-center gap-3 mt-2 p-3 border rounded-lg">
                  {proofUrl.endsWith('.pdf') ? (
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  ) : (
                    <img src={proofUrl} alt="증빙" className="h-16 w-16 object-cover rounded" />
                  )}
                  <div className="flex-1 text-sm">업로드 완료</div>
                  <Button variant="outline" size="sm" onClick={() => setProofUrl('')}>교체</Button>
                </div>
              ) : (
                <label className="mt-2 flex flex-col items-center justify-center gap-2 h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {uploading ? '업로드 중...' : 'JPG, PNG, PDF (최대 10MB)'}
                  </span>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    className="hidden"
                    disabled={uploading}
                    onChange={e => {
                      const f = e.target.files?.[0]
                      if (f) handleUpload(f)
                    }}
                  />
                </label>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="font-medium">다음 정보가 맞나요?</p>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">브랜드명</dt><dd className="font-medium">{recipientName}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">정산액</dt><dd className="font-bold tabular-nums">{formatCurrency(Number(settlement.netAmount), 'KRW')}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">지급 금액</dt><dd className="font-bold tabular-nums">{formatCurrency(parsedAmount, 'KRW')}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">메모</dt><dd>{memo}</dd></div>
            </dl>
            {proofUrl && (
              <div className="p-3 border rounded-lg">
                {proofUrl.endsWith('.pdf') ? (
                  <div className="flex items-center gap-2"><FileText className="h-5 w-5" /><span className="text-sm">PDF 증빙</span></div>
                ) : (
                  <img src={proofUrl} alt="증빙" className="max-h-32 rounded" />
                )}
              </div>
            )}
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <p>지급 완료로 표시하면 정산 상태가 변경돼요. 실제 송금은 은행에서 별도로 진행해주세요.</p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="font-medium">지급 처리하려면 아래 3가지를 모두 정확히 입력하세요</p>
            <div>
              <label className="text-sm text-muted-foreground">정산 ID (전체 또는 뒤 8자리)</label>
              <Input value={confirmId} onChange={e => setConfirmId(e.target.value)} placeholder={settlement.id.slice(-8)} />
              {confirmId && (confirmId.trim() === settlement.id || confirmId.trim() === settlement.id.slice(-8))
                ? <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><Check className="h-3 w-3" />일치</p>
                : confirmId && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><X className="h-3 w-3" />불일치</p>
              }
            </div>
            <div>
              <label className="text-sm text-muted-foreground">브랜드명</label>
              <Input value={confirmBrand} onChange={e => setConfirmBrand(e.target.value)} placeholder={recipientName} />
              {confirmBrand && confirmBrand.trim() === recipientName
                ? <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><Check className="h-3 w-3" />일치</p>
                : confirmBrand && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><X className="h-3 w-3" />불일치</p>
              }
            </div>
            <div>
              <label className="text-sm text-muted-foreground">지급 금액 (숫자만, 쉼표 허용)</label>
              <Input
                value={confirmAmount}
                onChange={e => setConfirmAmount(e.target.value.replace(/[^0-9,]/g, ''))}
                placeholder={String(parsedAmount)}
                className="tabular-nums"
              />
              {confirmAmount && normalizeForCompare(confirmAmount) === String(parsedAmount)
                ? <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><Check className="h-3 w-3" />일치</p>
                : confirmAmount && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><X className="h-3 w-3" />불일치</p>
              }
            </div>
          </div>
        )}

        <DialogFooter className="flex gap-2">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(s => s - 1)}>뒤로</Button>
          )}
          {step < 3 && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
              <Button
                onClick={() => setStep(s => s + 1)}
                disabled={step === 1 && !step1Valid}
              >
                다음
              </Button>
            </>
          )}
          {step === 3 && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
              <Button
                variant="destructive"
                onClick={handleSubmit}
                disabled={!step3Valid || submitting}
              >
                {submitting ? '처리 중...' : '지급 처리'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ==================== Hold Modal (2 steps) ====================

function HoldModal({
  open, onOpenChange, settlement, onSuccess,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  settlement: Settlement
  onSuccess: () => void
}) {
  const [step, setStep] = useState(1)
  const [reason, setReason] = useState('')
  const [confirmId, setConfirmId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { if (!open) { setStep(1); setReason(''); setConfirmId('') } }, [open])

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await holdSettlement({ settlementId: settlement.id, reason })
      toast.success('정산이 보류되었어요')
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '보류에 실패했어요')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{step === 1 ? '정산 보류' : '정산 보류 확인'}</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">보류 사유 (최소 20자)</label>
              <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="보류 사유를 입력해주세요" rows={3} />
              <p className="text-xs text-muted-foreground mt-1">{reason.length}/20자</p>
            </div>
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <p>보류하면 지급이 일시 중단돼요. 브랜드에게 알림이 전송됩니다.</p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm">보류하려면 정산 ID를 재입력하세요</p>
            <Input value={confirmId} onChange={e => setConfirmId(e.target.value)} placeholder={settlement.id} />
          </div>
        )}

        <DialogFooter>
          {step === 1 && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
              <Button onClick={() => setStep(2)} disabled={reason.length < 20}>다음</Button>
            </>
          )}
          {step === 2 && (
            <>
              <Button variant="outline" onClick={() => setStep(1)}>뒤로</Button>
              <Button onClick={handleSubmit} disabled={confirmId.trim() !== settlement.id || submitting}>
                {submitting ? '처리 중...' : '보류 처리'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ==================== Release Modal ====================

function ReleaseModal({
  open, onOpenChange, settlement, onSuccess,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  settlement: Settlement
  onSuccess: () => void
}) {
  const [memo, setMemo] = useState('')
  const [confirmId, setConfirmId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { if (!open) { setMemo(''); setConfirmId('') } }, [open])

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await releaseSettlement({ settlementId: settlement.id, memo: memo || undefined })
      toast.success('보류가 해제되었어요')
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '해제에 실패했어요')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>보류 해제</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {settlement.heldReason && (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm text-muted-foreground">현재 보류 사유</p>
              <p className="text-sm font-medium mt-1">{settlement.heldReason}</p>
            </div>
          )}
          <div>
            <label className="text-sm font-medium">해제 메모 (선택)</label>
            <Textarea value={memo} onChange={e => setMemo(e.target.value)} placeholder="해제 사유" rows={2} />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">정산 ID 재입력</label>
            <Input value={confirmId} onChange={e => setConfirmId(e.target.value)} placeholder={settlement.id} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
          <Button
            onClick={handleSubmit}
            disabled={confirmId.trim() !== settlement.id || submitting}
            className="bg-green-600 hover:bg-green-700"
          >
            {submitting ? '처리 중...' : '해제'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ==================== Cancel Modal (2-3 steps) ====================

function CancelModal({
  open, onOpenChange, settlement, recipientName, onSuccess,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  settlement: Settlement
  recipientName: string
  onSuccess: () => void
}) {
  const isPaid = settlement.status === 'PAID'
  const [step, setStep] = useState(1)
  const [reason, setReason] = useState('')
  const [confirmId, setConfirmId] = useState('')
  const [confirmBrand, setConfirmBrand] = useState('')
  const [confirmAmount, setConfirmAmount] = useState('')
  const [recoveryChecked, setRecoveryChecked] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) {
      setStep(1); setReason(''); setConfirmId(''); setConfirmBrand(''); setConfirmAmount(''); setRecoveryChecked(false)
    }
  }, [open])

  const amountToConfirm = isPaid ? String(Number(settlement.paidAmount)) : String(Number(settlement.netAmount))

  const step2Valid =
    confirmId.trim() === settlement.id &&
    confirmBrand.trim() === recipientName &&
    confirmAmount.replace(/,/g, '').trim() === amountToConfirm

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await cancelSettlement({ settlementId: settlement.id, reason })
      toast.success('정산이 취소되었어요')
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '취소에 실패했어요')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>정산 취소</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <p>정산을 취소하면 되돌릴 수 없어요</p>
            </div>
            {isPaid && (
              <div className="p-3 bg-red-50 border border-red-300 rounded-lg text-sm text-red-900 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <p>이미 지급 처리된 정산을 취소합니다. 실제 송금이 이미 이루어졌다면 별도 환수 처리가 필요해요.</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium">취소 사유 (최소 20자)</label>
              <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="취소 사유를 입력해주세요" rows={3} />
              <p className="text-xs text-muted-foreground mt-1">{reason.length}/20자</p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="font-medium">취소하려면 아래 3가지를 재입력하세요</p>
            <div>
              <label className="text-sm text-muted-foreground">정산 ID</label>
              <Input value={confirmId} onChange={e => setConfirmId(e.target.value)} placeholder={settlement.id} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">브랜드명</label>
              <Input value={confirmBrand} onChange={e => setConfirmBrand(e.target.value)} placeholder={recipientName} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">{isPaid ? '지급금액' : '정산액'}</label>
              <Input value={confirmAmount} onChange={e => setConfirmAmount(e.target.value.replace(/[^0-9,]/g, ''))} placeholder={amountToConfirm} className="tabular-nums" />
            </div>
          </div>
        )}

        {step === 3 && isPaid && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <Checkbox
                checked={recoveryChecked}
                onCheckedChange={v => setRecoveryChecked(v === true)}
                className="mt-0.5"
              />
              <label className="text-sm text-red-800 cursor-pointer" onClick={() => setRecoveryChecked(!recoveryChecked)}>
                이미 송금된 경우 환수 처리가 필요함을 확인했어요
              </label>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 1 && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
              <Button onClick={() => setStep(2)} disabled={reason.length < 20}>다음</Button>
            </>
          )}
          {step === 2 && (
            <>
              <Button variant="outline" onClick={() => setStep(1)}>뒤로</Button>
              {isPaid ? (
                <Button onClick={() => setStep(3)} disabled={!step2Valid}>다음</Button>
              ) : (
                <Button variant="destructive" onClick={handleSubmit} disabled={!step2Valid || submitting}>
                  {submitting ? '처리 중...' : '취소 실행'}
                </Button>
              )}
            </>
          )}
          {step === 3 && (
            <>
              <Button variant="outline" onClick={() => setStep(2)}>뒤로</Button>
              <Button variant="destructive" onClick={handleSubmit} disabled={!recoveryChecked || submitting}>
                {submitting ? '처리 중...' : '취소 실행'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ==================== Memo Modal ====================

function MemoModal({
  open, onOpenChange, settlement, onSuccess,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  settlement: Settlement
  onSuccess: () => void
}) {
  const [memo, setMemo] = useState(settlement.paidMemo ?? '')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { if (open) setMemo(settlement.paidMemo ?? '') }, [open, settlement.paidMemo])

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await updateSettlementMemo({ settlementId: settlement.id, memo })
      toast.success('메모가 수정되었어요')
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '수정에 실패했어요')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>메모 수정</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {settlement.paidMemo && (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm text-muted-foreground">기존 메모</p>
              <p className="text-sm mt-1">{settlement.paidMemo}</p>
            </div>
          )}
          <div>
            <label className="text-sm font-medium">새 메모 (최소 10자)</label>
            <Textarea value={memo} onChange={e => setMemo(e.target.value)} rows={3} />
            <p className="text-xs text-muted-foreground mt-1">{memo.length}/10자</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
          <Button onClick={handleSubmit} disabled={memo.length < 10 || submitting}>
            {submitting ? '저장 중...' : '저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
