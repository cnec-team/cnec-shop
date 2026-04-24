'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  AlertTriangle, Bell, Mail, MessageSquare, Send, Calendar,
  Users, Save, ChevronLeft, ChevronRight, Loader2, Eye, Clock,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  createBroadcast,
  updateBroadcast,
  previewBroadcastTargets,
  testSendBroadcast,
  sendBroadcast,
  scheduleBroadcast,
} from '@/lib/actions/admin-broadcast'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TargetType = 'ALL_USERS' | 'BRANDS' | 'CREATORS' | 'BUYERS' | 'SEGMENT'
type BroadcastType = 'INFORMATIONAL' | 'PROMOTIONAL'
type Channel = 'IN_APP' | 'EMAIL' | 'KAKAO'
type SegmentGroup = 'BRANDS' | 'CREATORS' | 'BUYERS'

interface SegmentRules {
  targetGroup?: SegmentGroup
  createdAtFrom?: string
  createdAtTo?: string
  purchaseCountMin?: number | ''
  purchaseCountMax?: number | ''
}

interface PreviewResult {
  totalCount: number
  breakdown: { brands: number; creators: number; buyers: number }
  sample: { id: string; name: string; userType: string; channels: string[] }[]
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TARGET_OPTIONS: { value: TargetType; label: string; desc: string }[] = [
  { value: 'ALL_USERS', label: '전체 사용자', desc: '브랜드 + 크리에이터 + 구매자 전원' },
  { value: 'BRANDS', label: '브랜드', desc: '등록된 브랜드 계정' },
  { value: 'CREATORS', label: '크리에이터', desc: '등록된 크리에이터 계정' },
  { value: 'BUYERS', label: '구매자', desc: '구매 이력이 있는 회원' },
  { value: 'SEGMENT', label: '세그먼트', desc: '조건을 직접 지정하여 필터링' },
]

const STEP_LABELS = [
  '대상 선택',
  '채널 설정',
  '내용 작성',
  '미리보기',
  '최종 확인',
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

function formatUserType(t: string) {
  if (t === 'BRAND') return '브랜드'
  if (t === 'CREATOR') return '크리에이터'
  if (t === 'BUYER') return '구매자'
  return t
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function BroadcastNewPage() {
  const router = useRouter()

  // -- wizard step --
  const [step, setStep] = useState(0)

  // -- step 1: target --
  const [targetType, setTargetType] = useState<TargetType>('ALL_USERS')
  const [segmentRules, setSegmentRules] = useState<SegmentRules>({})
  const [preview, setPreview] = useState<PreviewResult | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // -- step 2: channel + type --
  const [broadcastType, setBroadcastType] = useState<BroadcastType>('INFORMATIONAL')
  const [channels, setChannels] = useState<Channel[]>(['IN_APP'])

  // -- step 3: content --
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [excludeSelf, setExcludeSelf] = useState(true)

  // -- step 4: test --
  const [testSending, setTestSending] = useState(false)

  // -- step 5: send --
  const [sendMode, setSendMode] = useState<'immediate' | 'scheduled'>('immediate')
  const [scheduledAt, setScheduledAt] = useState('')
  const [confirmCount, setConfirmCount] = useState('')
  const [sending, setSending] = useState(false)

  // -- draft --
  const [draftId, setDraftId] = useState<string | null>(null)
  const [savingDraft, setSavingDraft] = useState(false)

  // ---------------------------------------------------------------------------
  // Target preview with debounce
  // ---------------------------------------------------------------------------

  const fetchPreview = useCallback(async () => {
    setPreviewLoading(true)
    try {
      const result = await previewBroadcastTargets({
        targetType,
        segmentRules: targetType === 'SEGMENT' ? (segmentRules as Record<string, unknown>) : null,
        type: broadcastType,
        channels,
        excludeSelf,
      })
      setPreview(result)
    } catch {
      setPreview(null)
    } finally {
      setPreviewLoading(false)
    }
  }, [targetType, segmentRules, broadcastType, channels, excludeSelf])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchPreview()
    }, 500)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [fetchPreview])

  // ---------------------------------------------------------------------------
  // Channel toggle
  // ---------------------------------------------------------------------------

  function toggleChannel(ch: Channel) {
    if (ch === 'IN_APP') return // always on
    setChannels(prev =>
      prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch],
    )
  }

  // ---------------------------------------------------------------------------
  // Draft save
  // ---------------------------------------------------------------------------

  async function saveDraft() {
    setSavingDraft(true)
    try {
      const data = {
        title: title || '(제목 없음)',
        content: content || '(내용 없음)',
        type: broadcastType,
        channels,
        targetType,
        segmentRules: targetType === 'SEGMENT' ? (segmentRules as Record<string, unknown>) : null,
        excludeSelf,
      }
      if (draftId) {
        await updateBroadcast(draftId, data)
      } else {
        const res = await createBroadcast(data)
        setDraftId(res.broadcastId)
      }
      toast.success('임시저장 완료')
      router.push('/ko/admin/broadcast')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '저장에 실패했어요')
    } finally {
      setSavingDraft(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Ensure draft exists before step 4+ (needed for test send / actual send)
  // ---------------------------------------------------------------------------

  async function ensureDraft(): Promise<string | null> {
    if (draftId) {
      try {
        await updateBroadcast(draftId, {
          title,
          content,
          type: broadcastType,
          channels,
          targetType,
          segmentRules: targetType === 'SEGMENT' ? (segmentRules as Record<string, unknown>) : null,
          excludeSelf,
        })
        return draftId
      } catch (err) {
        toast.error(err instanceof Error ? err.message : '업데이트 실패')
        return null
      }
    }
    try {
      const res = await createBroadcast({
        title,
        content,
        type: broadcastType,
        channels,
        targetType,
        segmentRules: targetType === 'SEGMENT' ? (segmentRules as Record<string, unknown>) : null,
        excludeSelf,
      })
      setDraftId(res.broadcastId)
      return res.broadcastId
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '임시저장 실패')
      return null
    }
  }

  // ---------------------------------------------------------------------------
  // Step validation
  // ---------------------------------------------------------------------------

  function canProceed(): boolean {
    switch (step) {
      case 0:
        if (targetType === 'SEGMENT' && !segmentRules.targetGroup) return false
        return true
      case 1:
        return channels.length > 0
      case 2:
        return title.length >= 5 && title.length <= 60 && content.length >= 10 && content.length <= 1000
      case 3:
        return true
      default:
        return true
    }
  }

  async function handleNext() {
    if (step === 2) {
      // going to preview step - ensure draft
      const id = await ensureDraft()
      if (!id) return
    }
    setStep(prev => Math.min(prev + 1, 4))
  }

  // ---------------------------------------------------------------------------
  // Test send
  // ---------------------------------------------------------------------------

  async function handleTestSend() {
    if (!draftId) {
      toast.error('먼저 내용을 저장해주세요')
      return
    }
    setTestSending(true)
    try {
      await testSendBroadcast(draftId)
      toast.success('테스트 발송 완료! 본인 계정으로 전송되었어요')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '테스트 발송에 실패했어요')
    } finally {
      setTestSending(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Send / Schedule
  // ---------------------------------------------------------------------------

  async function handleSend() {
    if (!draftId) return
    setSending(true)
    try {
      if (sendMode === 'scheduled') {
        if (!scheduledAt) {
          toast.error('예약 시각을 선택해주세요')
          setSending(false)
          return
        }
        await scheduleBroadcast(draftId, scheduledAt)
        toast.success('예약 발송이 설정되었어요')
      } else {
        const key = crypto.randomUUID()
        const res = await sendBroadcast(draftId, key)
        toast.success(`${res.totalCount.toLocaleString()}명에게 발송을 시작했어요`)
      }
      router.push(`/ko/admin/broadcast/${draftId}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '발송에 실패했어요')
    } finally {
      setSending(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Computed
  // ---------------------------------------------------------------------------

  const isOverLimit = (preview?.totalCount ?? 0) > 10000
  const needsCountConfirm = isOverLimit
  const countConfirmed = confirmCount === String(preview?.totalCount ?? 0)
  const displayTitle = broadcastType === 'PROMOTIONAL' ? `(광고) ${title}` : title

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-headline font-bold">새 공지 작성</h1>
        <p className="text-muted-foreground">5단계 마법사를 따라 공지를 작성하고 발송해요</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1">
        {STEP_LABELS.map((label, i) => (
          <div key={i} className="flex items-center gap-1 flex-1">
            <div
              className={cn(
                'flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0',
                i < step && 'bg-primary text-primary-foreground',
                i === step && 'bg-primary text-primary-foreground ring-2 ring-primary/30',
                i > step && 'bg-muted text-muted-foreground',
              )}
            >
              {i + 1}
            </div>
            <span className={cn(
              'text-xs truncate hidden sm:inline',
              i === step ? 'font-semibold text-foreground' : 'text-muted-foreground',
            )}>
              {label}
            </span>
            {i < STEP_LABELS.length - 1 && (
              <div className={cn(
                'h-px flex-1 mx-1',
                i < step ? 'bg-primary' : 'bg-muted',
              )} />
            )}
          </div>
        ))}
      </div>

      {/* ================================================================= */}
      {/* STEP 1: Target Selection */}
      {/* ================================================================= */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              누구에게 보낼까요?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              {TARGET_OPTIONS.map(opt => (
                <label
                  key={opt.value}
                  className={cn(
                    'flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors',
                    targetType === opt.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground/30',
                  )}
                >
                  <input
                    type="radio"
                    name="targetType"
                    checked={targetType === opt.value}
                    onChange={() => {
                      setTargetType(opt.value)
                      if (opt.value !== 'SEGMENT') setSegmentRules({})
                    }}
                    className="mt-1 accent-primary"
                  />
                  <div>
                    <p className="font-medium">{opt.label}</p>
                    <p className="text-sm text-muted-foreground">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            {/* Segment filters */}
            {targetType === 'SEGMENT' && (
              <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
                <div>
                  <Label className="text-sm font-medium">대상 그룹</Label>
                  <Select
                    value={segmentRules.targetGroup ?? ''}
                    onValueChange={v => setSegmentRules(prev => ({ ...prev, targetGroup: v as SegmentGroup }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="그룹 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRANDS">브랜드</SelectItem>
                      <SelectItem value="CREATORS">크리에이터</SelectItem>
                      <SelectItem value="BUYERS">구매자</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">가입일 시작</Label>
                    <Input
                      type="date"
                      value={segmentRules.createdAtFrom ?? ''}
                      onChange={e => setSegmentRules(prev => ({ ...prev, createdAtFrom: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">가입일 종료</Label>
                    <Input
                      type="date"
                      value={segmentRules.createdAtTo ?? ''}
                      onChange={e => setSegmentRules(prev => ({ ...prev, createdAtTo: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </div>
                {segmentRules.targetGroup === 'BUYERS' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm">최소 구매 횟수</Label>
                      <Input
                        type="number"
                        min={0}
                        value={segmentRules.purchaseCountMin ?? ''}
                        onChange={e => setSegmentRules(prev => ({
                          ...prev,
                          purchaseCountMin: e.target.value === '' ? '' : Number(e.target.value),
                        }))}
                        className="mt-1"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">최대 구매 횟수</Label>
                      <Input
                        type="number"
                        min={0}
                        value={segmentRules.purchaseCountMax ?? ''}
                        onChange={e => setSegmentRules(prev => ({
                          ...prev,
                          purchaseCountMax: e.target.value === '' ? '' : Number(e.target.value),
                        }))}
                        className="mt-1"
                        placeholder="제한 없음"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Preview */}
            <div className="border rounded-lg p-4 bg-muted/20">
              {previewLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  대상 집계 중...
                </div>
              ) : preview ? (
                <div className="space-y-2">
                  <p className="font-semibold text-lg">
                    총 {preview.totalCount.toLocaleString()}명에게 발송 예정
                  </p>
                  <div className="flex gap-3 text-sm text-muted-foreground">
                    {preview.breakdown.brands > 0 && (
                      <span>브랜드 {preview.breakdown.brands.toLocaleString()}명</span>
                    )}
                    {preview.breakdown.creators > 0 && (
                      <span>크리에이터 {preview.breakdown.creators.toLocaleString()}명</span>
                    )}
                    {preview.breakdown.buyers > 0 && (
                      <span>구매자 {preview.breakdown.buyers.toLocaleString()}명</span>
                    )}
                  </div>
                  {preview.sample.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground mb-1">대상 샘플 (최대 10명)</p>
                      <div className="flex flex-wrap gap-1.5">
                        {preview.sample.map(s => (
                          <Badge key={s.id} variant="outline" className="text-xs">
                            {s.name} ({formatUserType(s.userType)})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {isOverLimit && (
                    <div className="flex items-start gap-2 mt-3 p-3 bg-orange-50 border border-orange-200 rounded-md text-sm text-orange-800">
                      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>1만명이 넘어요. 예약 발송만 가능해요</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">대상을 선택하면 발송 예정 인원이 표시돼요</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ================================================================= */}
      {/* STEP 2: Channel + Type */}
      {/* ================================================================= */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              어떻게 보낼까요?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Type */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">발송 유형</Label>
              <div className="grid gap-3">
                <label
                  className={cn(
                    'flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors',
                    broadcastType === 'INFORMATIONAL'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground/30',
                  )}
                >
                  <input
                    type="radio"
                    name="broadcastType"
                    checked={broadcastType === 'INFORMATIONAL'}
                    onChange={() => setBroadcastType('INFORMATIONAL')}
                    className="mt-1 accent-primary"
                  />
                  <div>
                    <p className="font-medium">정보성</p>
                    <p className="text-sm text-muted-foreground">전체 사용자에게 발송 가능</p>
                  </div>
                </label>
                <label
                  className={cn(
                    'flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors',
                    broadcastType === 'PROMOTIONAL'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground/30',
                  )}
                >
                  <input
                    type="radio"
                    name="broadcastType"
                    checked={broadcastType === 'PROMOTIONAL'}
                    onChange={() => setBroadcastType('PROMOTIONAL')}
                    className="mt-1 accent-primary"
                  />
                  <div>
                    <p className="font-medium">광고성</p>
                    <p className="text-sm text-muted-foreground">마케팅 수신 동의자에게만 발송</p>
                  </div>
                </label>
              </div>
              {broadcastType === 'PROMOTIONAL' && (
                <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-md text-sm text-orange-800">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>광고성 메시지에는 제목 앞에 &quot;(광고)&quot; 가 자동으로 붙어요. 알림톡/이메일에는 수신거부 안내가 포함돼요.</span>
                </div>
              )}
            </div>

            {/* Channels */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">발송 채널</Label>
              <div className="grid gap-3">
                <label className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 cursor-not-allowed">
                  <Checkbox checked disabled />
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">인앱 알림</p>
                    <p className="text-xs text-muted-foreground">필수 채널</p>
                  </div>
                </label>
                <label
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                    channels.includes('EMAIL') ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/30',
                  )}
                  onClick={() => toggleChannel('EMAIL')}
                >
                  <Checkbox checked={channels.includes('EMAIL')} />
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">이메일</p>
                    <p className="text-xs text-muted-foreground">이메일 주소가 등록된 사용자에게 발송</p>
                  </div>
                </label>
                <label
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                    channels.includes('KAKAO') ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/30',
                  )}
                  onClick={() => toggleChannel('KAKAO')}
                >
                  <Checkbox checked={channels.includes('KAKAO')} />
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">카카오 알림톡</p>
                    <p className="text-xs text-muted-foreground">전화번호가 등록된 사용자에게 발송</p>
                  </div>
                </label>
              </div>
              {broadcastType === 'PROMOTIONAL' && channels.includes('KAKAO') && (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
                  <Clock className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>광고성 알림톡은 야간(21:00~08:00)에 발송할 수 없어요. 서버에서 자동 차단돼요.</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ================================================================= */}
      {/* STEP 3: Content */}
      {/* ================================================================= */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              무엇을 보낼까요?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label className="text-sm font-semibold">제목</Label>
              <div className="mt-1 relative">
                <Input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="공지 제목을 입력하세요 (5~60자)"
                  maxLength={60}
                />
                <span className={cn(
                  'absolute right-3 top-1/2 -translate-y-1/2 text-xs',
                  title.length < 5 ? 'text-red-500' : 'text-muted-foreground',
                )}>
                  {title.length}/60
                </span>
              </div>
              {broadcastType === 'PROMOTIONAL' && title.length > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">
                  실제 표시: <span className="font-medium">(광고) {title}</span>
                </p>
              )}
              {title.length > 0 && title.length < 5 && (
                <p className="mt-1 text-xs text-red-500">최소 5자 이상 입력해주세요</p>
              )}
            </div>

            <div>
              <Label className="text-sm font-semibold">본문</Label>
              <div className="mt-1 relative">
                <Textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="공지 내용을 입력하세요 (10~1000자)"
                  maxLength={1000}
                  rows={8}
                  className="resize-y"
                />
                <span className={cn(
                  'absolute right-3 bottom-3 text-xs',
                  content.length < 10 ? 'text-red-500' : 'text-muted-foreground',
                )}>
                  {content.length}/1,000
                </span>
              </div>
              {content.length > 0 && content.length < 10 && (
                <p className="mt-1 text-xs text-red-500">최소 10자 이상 입력해주세요</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="excludeSelf"
                checked={excludeSelf}
                onCheckedChange={v => setExcludeSelf(v === true)}
              />
              <Label htmlFor="excludeSelf" className="text-sm cursor-pointer">
                본인(관리자)은 발송 대상에서 제외
              </Label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ================================================================= */}
      {/* STEP 4: Preview + Test */}
      {/* ================================================================= */}
      {step === 3 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                확인해보세요
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* In-App preview */}
              <div className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Bell className="h-4 w-4" />
                  인앱 알림
                </div>
                <div className="bg-muted/50 rounded-md p-3">
                  <p className="font-semibold text-sm">{displayTitle || '(제목 없음)'}</p>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{content || '(내용 없음)'}</p>
                </div>
              </div>

              {/* Email preview */}
              {channels.includes('EMAIL') && (
                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    이메일
                  </div>
                  <div className="bg-muted/50 rounded-md p-3 space-y-1">
                    <p className="text-xs text-muted-foreground">제목</p>
                    <p className="font-semibold text-sm">{displayTitle || '(제목 없음)'}</p>
                    <p className="text-xs text-muted-foreground mt-2">본문 요약</p>
                    <p className="text-sm text-muted-foreground line-clamp-3">{content || '(내용 없음)'}</p>
                  </div>
                </div>
              )}

              {/* Kakao preview */}
              {channels.includes('KAKAO') && (
                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <MessageSquare className="h-4 w-4" />
                    카카오 알림톡
                  </div>
                  <div className="max-w-xs">
                    <div className="bg-yellow-50 rounded-2xl rounded-tl-sm p-4 border border-yellow-100">
                      <p className="font-semibold text-sm">{displayTitle || '(제목 없음)'}</p>
                      <p className="text-sm mt-1">{content || '(내용 없음)'}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test send */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">테스트 발송</p>
                  <p className="text-xs text-muted-foreground">본인 계정으로만 테스트 발송해요</p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleTestSend}
                  disabled={testSending}
                >
                  {testSending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  본인에게만 테스트 발송
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ================================================================= */}
      {/* STEP 5: Final Confirm */}
      {/* ================================================================= */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              발송 전 마지막 확인
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Summary */}
            <div className="border rounded-lg divide-y">
              <div className="flex justify-between items-center p-3">
                <span className="text-sm text-muted-foreground">대상</span>
                <span className="font-semibold">{(preview?.totalCount ?? 0).toLocaleString()}명</span>
              </div>
              <div className="flex justify-between items-center p-3">
                <span className="text-sm text-muted-foreground">채널</span>
                <div className="flex gap-1.5">
                  {channels.includes('IN_APP') && <Badge variant="outline"><Bell className="h-3 w-3 mr-1" />인앱</Badge>}
                  {channels.includes('EMAIL') && <Badge variant="outline"><Mail className="h-3 w-3 mr-1" />이메일</Badge>}
                  {channels.includes('KAKAO') && <Badge variant="outline"><MessageSquare className="h-3 w-3 mr-1" />알림톡</Badge>}
                </div>
              </div>
              <div className="flex justify-between items-center p-3">
                <span className="text-sm text-muted-foreground">유형</span>
                <Badge
                  variant="outline"
                  className={broadcastType === 'PROMOTIONAL' ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'}
                >
                  {broadcastType === 'PROMOTIONAL' ? '광고성' : '정보성'}
                </Badge>
              </div>
              <div className="flex justify-between items-center p-3">
                <span className="text-sm text-muted-foreground">제목</span>
                <span className="font-medium text-sm max-w-[250px] truncate">{displayTitle}</span>
              </div>
              <div className="flex justify-between items-center p-3">
                <span className="text-sm text-muted-foreground">예상 소요</span>
                <span className="text-sm">
                  {(preview?.totalCount ?? 0) <= 1000 ? '약 1분 이내' :
                   (preview?.totalCount ?? 0) <= 5000 ? '약 5분' :
                   (preview?.totalCount ?? 0) <= 10000 ? '약 10분' : '10분 이상'}
                </span>
              </div>
            </div>

            {/* Send mode */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">발송 방식</Label>
              <div className="grid gap-3">
                <label
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors',
                    sendMode === 'immediate'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground/30',
                    isOverLimit && 'opacity-50 cursor-not-allowed',
                  )}
                >
                  <input
                    type="radio"
                    name="sendMode"
                    checked={sendMode === 'immediate'}
                    onChange={() => setSendMode('immediate')}
                    disabled={isOverLimit}
                    className="accent-primary"
                  />
                  <Send className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">즉시 발송</p>
                    {isOverLimit && (
                      <p className="text-xs text-red-500">1만명 초과 시 즉시 발송 불가</p>
                    )}
                  </div>
                </label>
                <label
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors',
                    sendMode === 'scheduled'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground/30',
                  )}
                >
                  <input
                    type="radio"
                    name="sendMode"
                    checked={sendMode === 'scheduled'}
                    onChange={() => setSendMode('scheduled')}
                    className="accent-primary"
                  />
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">예약 발송</p>
                  </div>
                </label>
              </div>
              {sendMode === 'scheduled' && (
                <Input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={e => setScheduledAt(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="mt-2"
                />
              )}
            </div>

            {/* Count confirmation for large broadcasts */}
            {needsCountConfirm && (
              <div className="space-y-2 p-4 border border-orange-200 bg-orange-50 rounded-lg">
                <p className="text-sm font-medium text-orange-800">
                  대상이 {(preview?.totalCount ?? 0).toLocaleString()}명이에요. 발송을 진행하려면 아래에 정확한 숫자를 입력하세요.
                </p>
                <Input
                  value={confirmCount}
                  onChange={e => setConfirmCount(e.target.value)}
                  placeholder={`${preview?.totalCount ?? 0} 입력`}
                  className="max-w-[200px]"
                />
              </div>
            )}

            {/* Send button */}
            <Button
              size="lg"
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              disabled={
                sending ||
                (sendMode === 'scheduled' && !scheduledAt) ||
                (needsCountConfirm && !countConfirmed)
              }
              onClick={handleSend}
            >
              {sending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : sendMode === 'scheduled' ? (
                <Calendar className="mr-2 h-4 w-4" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              {sending
                ? '처리 중...'
                : sendMode === 'scheduled'
                  ? '예약 발송 설정'
                  : `${(preview?.totalCount ?? 0).toLocaleString()}명에게 발송하기`}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ================================================================= */}
      {/* Navigation */}
      {/* ================================================================= */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          onClick={saveDraft}
          disabled={savingDraft}
        >
          {savingDraft ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          저장하고 나가기
        </Button>
        <div className="flex gap-2">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(s => s - 1)}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              이전
            </Button>
          )}
          {step < 4 && (
            <Button onClick={handleNext} disabled={!canProceed()}>
              다음
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
