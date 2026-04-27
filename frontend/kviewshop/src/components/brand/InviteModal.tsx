'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Loader2,
  HelpCircle,
  Bell,
  Mail,
  MessageSquare,
  Instagram,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Settings,
} from 'lucide-react'
import { toast } from 'sonner'
import { useUpsellModal } from '@/lib/store/upsell'
import { getCreatorChannels, canProposalBeSent } from '@/lib/messaging/channel-availability'
import { InviteCostSummary } from './invite/InviteCostSummary'
import { InAppPreview } from './invite/previews/InAppPreview'
import { EmailPreview } from './invite/previews/EmailPreview'
import { AlimtalkPreview } from './invite/previews/AlimtalkPreview'
import { DmPreview } from './invite/previews/DmPreview'

interface Template {
  id: string
  name: string
  type: string
  body: string
  commissionRate: number | null
}

interface Campaign {
  id: string
  title: string
  type: string
  status: string
  startAt?: string | Date | null
  endAt?: string | Date | null
  commissionRate?: number | string | null
}

interface CreatorChannel {
  id: string
  cnecJoinStatus: 'NOT_JOINED' | 'JOINED' | 'VERIFIED'
  hasBrandEmail: boolean
  brandContactEmail: string | null
  hasPhone: boolean
  igUsername: string | null
  displayName?: string | null
}

interface InviteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'single' | 'bulk'
  creatorIds: string[]
  creators?: CreatorChannel[]
  defaultType?: 'GONGGU' | 'PRODUCT_PICK'
  brandInstagramHandle?: string | null
  brandInstagramVerified?: boolean
  brandName?: string
  onSuccess: () => void
}

const COMMISSION_PRESETS = [10, 15, 20, 25, 30]

export function InviteModal({
  open,
  onOpenChange,
  mode,
  creatorIds,
  creators: creatorsProp = [],
  defaultType,
  brandInstagramHandle,
  brandInstagramVerified = false,
  brandName = '',
  onSuccess,
}: InviteModalProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [type, setType] = useState<'GONGGU' | 'PRODUCT_PICK'>(defaultType ?? 'GONGGU')
  const [campaignId, setCampaignId] = useState<string>('')
  const [commissionRate, setCommissionRate] = useState<string>('')
  const [templateId, setTemplateId] = useState<string>('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [useInstagramDm, setUseInstagramDm] = useState(false)
  const [previewTab, setPreviewTab] = useState('inApp')
  const [fetchedCreators, setFetchedCreators] = useState<CreatorChannel[]>([])
  const [loadingCreators, setLoadingCreators] = useState(false)

  // 크리에이터 정보: props 우선, 없으면 fetch
  const creators = creatorsProp.length > 0 ? creatorsProp : fetchedCreators

  const fetchData = useCallback(async () => {
    try {
      const [tRes, cRes] = await Promise.all([
        fetch('/api/brand/proposal-templates'),
        fetch('/api/brand/campaigns/list'),
      ])
      const tData = await tRes.json()
      const cData = await cRes.json()
      setTemplates(tData.templates ?? [])
      setCampaigns(cData.campaigns ?? [])
    } catch {
      // silent
    }
  }, [])

  // 크리에이터 정보가 없으면 API로 가져오기
  const fetchCreatorInfo = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return
    setLoadingCreators(true)
    try {
      const res = await fetch('/api/brand/creators/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorIds: ids }),
      })
      if (res.ok) {
        const data = await res.json()
        setFetchedCreators(data.creators ?? [])
      }
    } catch {
      // 크리에이터 정보 못 가져와도 발송은 가능
    } finally {
      setLoadingCreators(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      fetchData()
      setStep(1)
      setType(defaultType ?? 'GONGGU')
      setCampaignId('')
      setTemplateId('')
      setCommissionRate('')
      setMessage('')
      setUseInstagramDm(false)
      setPreviewTab('inApp')
      setFetchedCreators([])
      // props에 크리에이터 정보 없으면 fetch
      if (creatorsProp.length === 0 && creatorIds.length > 0) {
        fetchCreatorInfo(creatorIds)
      }
    }
  }, [open, fetchData, fetchCreatorInfo, defaultType, creatorIds, creatorsProp.length])

  // 캠페인 선택 시 해당 캠페인의 커미션율 자동 설정
  const handleCampaignSelect = (cid: string) => {
    setCampaignId(cid)
    const campaign = campaigns.find(c => c.id === cid)
    if (campaign?.commissionRate && !commissionRate) {
      setCommissionRate(String(Number(campaign.commissionRate)))
    }
  }

  const handleTemplateSelect = (tid: string) => {
    setTemplateId(tid)
    const t = templates.find(tpl => tpl.id === tid)
    if (t) {
      setMessage(t.body)
      if (t.commissionRate) setCommissionRate(String(t.commissionRate))
      setType(t.type as 'GONGGU' | 'PRODUCT_PICK')
    }
  }

  // 크리에이터 이름 결정
  const creatorName = creators.length === 1
    ? (creators[0].displayName || creators[0].igUsername || '크리에이터')
    : mode === 'single' && creatorIds.length === 1
      ? '크리에이터'
      : `${creatorIds.length}명`

  const replaceVars = (text: string) => {
    const selectedCampaign = campaigns.find(c => c.id === campaignId)
    const campaignName = selectedCampaign?.title || '캠페인'
    const campaignPeriod = selectedCampaign?.startAt && selectedCampaign?.endAt
      ? `${new Date(selectedCampaign.startAt).toLocaleDateString('ko-KR')} ~ ${new Date(selectedCampaign.endAt).toLocaleDateString('ko-KR')}`
      : '기간 미정'
    const commRateDisplay = commissionRate ? `${commissionRate}%` : '미정'
    return text
      .replace(/\{\{creatorName\}\}/g, creatorName)
      .replace(/\{\{brandName\}\}/g, brandName || '브랜드')
      .replace(/\{\{campaignName\}\}/g, campaignName)
      .replace(/\{\{commissionRate\}\}/g, commRateDisplay)
      .replace(/\{\{campaignPeriod\}\}/g, campaignPeriod)
  }

  const renderedTitle = type === 'GONGGU' ? '공구 초대' : '상품 추천'
  const renderedBody = replaceVars(message || '')

  // Channel availability for single creator
  const singleCreator = creators.length === 1 ? creators[0] : null
  const singleChannels = singleCreator ? getCreatorChannels({
    cnecJoinStatus: singleCreator.cnecJoinStatus,
    hasBrandEmail: singleCreator.hasBrandEmail,
    brandContactEmail: singleCreator.brandContactEmail,
    hasPhone: singleCreator.hasPhone,
    igUsername: singleCreator.igUsername,
  }) : null
  const brandIgLinked = brandInstagramVerified

  const singleSendCheck = singleCreator
    ? canProposalBeSent(
        {
          cnecJoinStatus: singleCreator.cnecJoinStatus,
          hasBrandEmail: singleCreator.hasBrandEmail,
          brandContactEmail: singleCreator.brandContactEmail,
          hasPhone: singleCreator.hasPhone,
          igUsername: singleCreator.igUsername,
        },
        useInstagramDm,
        brandIgLinked,
      )
    : { ok: true }

  const bulkBreakdown = mode === 'bulk' && creators.length > 0
    ? creators.reduce(
        (acc, c) => {
          const check = canProposalBeSent(
            { cnecJoinStatus: c.cnecJoinStatus, hasBrandEmail: c.hasBrandEmail, brandContactEmail: c.brandContactEmail, hasPhone: c.hasPhone, igUsername: c.igUsername },
            useInstagramDm,
            brandIgLinked,
          )
          if (check.ok) {
            acc.sendable++
          } else if (check.reason === 'BRAND_IG_NOT_LINKED') {
            acc.unreachableBrandIg++
          } else {
            acc.unreachableNoIg++
          }
          return acc
        },
        { sendable: 0, unreachableNoIg: 0, unreachableBrandIg: 0 },
      )
    : undefined

  const noChannelAvailable = singleCreator
    ? !singleChannels?.inApp && !singleChannels?.email && !singleChannels?.kakao
    : false

  // 크리에이터 정보 없으면 항상 발송 가능 (서버에서 한번 더 체크)
  const canSend = mode === 'bulk'
    ? (creators.length === 0 || (bulkBreakdown?.sendable ?? 0) > 0) && (type !== 'GONGGU' || !!campaignId)
    : (creators.length === 0 || singleSendCheck.ok) && (type !== 'GONGGU' || !!campaignId)

  const freeQuota = { used: 0, total: 50 }
  const { open: openUpsell } = useUpsellModal()

  const handleSubmit = async () => {
    if (type === 'GONGGU' && !campaignId) {
      toast.error('공구 초대 시 캠페인을 선택해주세요')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        ...(mode === 'single'
          ? { creatorId: creatorIds[0] }
          : { creatorIds, confirm: true }),
        type,
        campaignId: campaignId || undefined,
        templateId: templateId || undefined,
        commissionRate: commissionRate ? parseFloat(commissionRate) : undefined,
        message: message || undefined,
        useInstagramDm,
      }

      const endpoint = mode === 'single' ? '/api/brand/proposals' : '/api/brand/proposals/bulk'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json().catch(() => null)

      if (res.status === 402 && data?.upsell) {
        openUpsell(data.upsell)
        if (data.partial && data.created > 0) {
          toast.info(`${data.created}명에게만 발송됐어요. 나머지는 한도 초과`)
        }
        onOpenChange(false)
        return
      }

      if (!res.ok) {
        toast.error(data?.message || data?.error || '초대 전송에 실패했습니다')
        return
      }

      toast.success(
        mode === 'single'
          ? `${creatorName} 님에게 초대를 보냈습니다`
          : `${data?.created ?? creatorIds.length}명에게 초대를 보냈습니다`
      )
      onSuccess()
      onOpenChange(false)
    } catch {
      toast.error('초대 전송 중 오류가 발생했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'single'
              ? `${creatorName} 님에게 제안 보내기`
              : `${creatorIds.length}명에게 일괄 제안`}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            두 단계만 거치면 크리에이터에게 바로 닿아요
          </p>
          {/* 스텝 인디케이터 */}
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${step === 1 ? 'bg-stone-900 text-white' : 'bg-stone-200 text-stone-500'}`}>1</span>
              <span className={`text-sm ${step === 1 ? 'font-semibold text-stone-900' : 'text-stone-400'}`}>제안 내용</span>
            </div>
            <div className="w-8 h-px bg-stone-200" />
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${step === 2 ? 'bg-stone-900 text-white' : 'bg-stone-200 text-stone-500'}`}>2</span>
              <span className={`text-sm ${step === 2 ? 'font-semibold text-stone-900' : 'text-stone-400'}`}>메시지 & 발송</span>
            </div>
          </div>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-5 mt-2">
            {/* 제안 유형 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Label className="text-sm font-semibold">어떤 제안을 보낼까요?</Label>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </HoverCardTrigger>
                  <HoverCardContent className="w-72 text-sm">
                    <p className="font-semibold mb-1">공동구매 초대</p>
                    <p className="text-muted-foreground mb-2">기간 한정 특가로 함께 판매하는 공구 캠페인에 초대해요. 단기 매출 폭발에 유리해요.</p>
                    <p className="font-semibold mb-1">상품 추천 등록</p>
                    <p className="text-muted-foreground">크리에이터 샵에 우리 상품을 상시 추천 상품으로 등록 요청해요. 꾸준한 노출에 유리해요.</p>
                  </HoverCardContent>
                </HoverCard>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setType('GONGGU')}
                  className={`relative rounded-xl border-2 p-4 text-left transition-all ${type === 'GONGGU' ? 'border-stone-900 bg-stone-50' : 'border-stone-200 hover:border-stone-300'}`}
                >
                  {type === 'GONGGU' && <div className="absolute top-2 right-2 inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-100 rounded-full px-2 py-0.5">추천</div>}
                  <p className="font-semibold text-sm text-stone-900 mb-1">공동구매 초대</p>
                  <p className="text-xs text-stone-500 leading-relaxed">기간 한정 특가로 함께 판매하는 공구 캠페인이에요. 단기 매출 폭발에 유리해요.</p>
                </button>
                <button
                  onClick={() => setType('PRODUCT_PICK')}
                  className={`rounded-xl border-2 p-4 text-left transition-all ${type === 'PRODUCT_PICK' ? 'border-stone-900 bg-stone-50' : 'border-stone-200 hover:border-stone-300'}`}
                >
                  <p className="font-semibold text-sm text-stone-900 mb-1">상품 추천 등록</p>
                  <p className="text-xs text-stone-500 leading-relaxed">크리에이터 샵에 우리 상품을 상시 추천 상품으로 등록 요청해요. 꾸준한 노출에 유리해요.</p>
                </button>
              </div>
            </div>

            {/* 캠페인 선택 */}
            {type === 'GONGGU' && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label className="text-sm font-semibold">어느 캠페인에 초대할까요?</Label>
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </HoverCardTrigger>
                    <HoverCardContent className="w-64 text-sm">
                      모집 중이거나 진행 중인 캠페인만 선택할 수 있어요. 캠페인이 없다면 먼저 캠페인을 만들어주세요.
                    </HoverCardContent>
                  </HoverCard>
                </div>
                <Select value={campaignId} onValueChange={handleCampaignSelect}>
                  <SelectTrigger><SelectValue placeholder="캠페인을 선택해주세요" /></SelectTrigger>
                  <SelectContent>
                    {campaigns
                      .filter(c => c.status === 'RECRUITING' || c.status === 'ACTIVE')
                      .map(c => {
                        const startStr = c.startAt ? new Date(c.startAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) : ''
                        const endStr = c.endAt ? new Date(c.endAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) : ''
                        const commRate = c.commissionRate ? `${Number(c.commissionRate)}%` : ''
                        return (
                          <SelectItem key={c.id} value={c.id}>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${c.status === 'RECRUITING' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                {c.status === 'RECRUITING' ? '모집중' : '진행중'}
                              </span>
                              <span>{c.title}</span>
                              {(startStr || commRate) && (
                                <span className="text-xs text-muted-foreground">
                                  {startStr && endStr ? `${startStr} ~ ${endStr}` : ''}{commRate ? ` · ${commRate}` : ''}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        )
                      })}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 커미션율 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Label className="text-sm font-semibold">커미션율을 정해주세요</Label>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </HoverCardTrigger>
                  <HoverCardContent className="w-64 text-sm">
                    크리에이터에게 지급하는 판매 수수료 비율이에요. K-뷰티 평균은 15~25%이며, 캠페인에 설정된 기본값이 있으면 자동 적용돼요.
                  </HoverCardContent>
                </HoverCard>
              </div>
              <div className="rounded-xl border border-stone-200 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Label className="text-xs text-stone-500">커미션율</Label>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={commissionRate}
                      onChange={e => setCommissionRate(e.target.value)}
                      placeholder="직접 입력"
                      className="w-20 h-8 text-center text-lg font-bold"
                      min={0}
                      max={100}
                      step={0.1}
                    />
                    <span className="text-lg font-bold text-stone-700">%</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {COMMISSION_PRESETS.map(rate => (
                    <button
                      key={rate}
                      onClick={() => setCommissionRate(String(rate))}
                      className={`rounded-full px-4 py-1.5 text-sm font-medium border transition-all ${
                        commissionRate === String(rate)
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
                <p className="text-xs text-stone-400 mt-2">미입력 시 캠페인 기본값이 적용돼요</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            {/* 템플릿 선택 */}
            {templates.length > 0 && (
              <div>
                <Label>메시지 템플릿 (선택)</Label>
                <Select value={templateId} onValueChange={handleTemplateSelect}>
                  <SelectTrigger><SelectValue placeholder="템플릿 선택..." /></SelectTrigger>
                  <SelectContent>
                    {templates.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 메시지 */}
            <div>
              <Label>메시지</Label>
              <Textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={4}
                placeholder="크리에이터에게 보낼 메시지를 입력하세요..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                {'사용 가능한 변수: {{creatorName}}, {{brandName}}, {{campaignName}}, {{commissionRate}}, {{campaignPeriod}}'}
              </p>
            </div>

            {/* 발송 채널 섹션 */}
            <div className="space-y-2 border-t pt-4">
              <h4 className="text-sm font-semibold">발송 채널</h4>

              {loadingCreators ? (
                <div className="flex items-center gap-2 p-3 text-sm text-stone-500">
                  <Loader2 className="h-4 w-4 animate-spin" /> 크리에이터 정보 확인 중...
                </div>
              ) : mode === 'single' && singleCreator && singleChannels ? (
                <div className="space-y-2">
                  <ChannelItem
                    icon={<Bell className="h-4 w-4" />}
                    label="인앱 알림"
                    sublabel={singleChannels.inApp ? '크넥 가입자 — 자동 발송' : '크넥 미가입 — 발송 불가'}
                    active={singleChannels.inApp}
                  />
                  <ChannelItem
                    icon={<Mail className="h-4 w-4" />}
                    label={singleChannels.email ? `이메일 (${singleCreator.brandContactEmail})` : '이메일'}
                    sublabel={singleChannels.email ? '등록된 이메일로 자동 발송' : '이메일 미등록'}
                    active={singleChannels.email}
                  />
                  <ChannelItem
                    icon={<MessageSquare className="h-4 w-4" />}
                    label="카카오 알림톡"
                    sublabel={
                      singleChannels.kakao ? '전화번호로 자동 발송' :
                      !singleCreator.hasPhone ? '전화번호 미등록' :
                      '크넥 인증회원만 발송 가능'
                    }
                    active={singleChannels.kakao}
                  />
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Instagram className="h-4 w-4" />
                      <div>
                        <p className="text-sm">
                          {singleCreator.igUsername ? `인스타 DM (@${singleCreator.igUsername})` : '인스타 DM'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {!singleCreator.igUsername ? '인스타 아이디 없음' :
                           !brandIgLinked ? '브랜드 인스타 연동 필요 (설정에서 연동)' :
                           '브랜드 인스타 계정으로 DM 발송'}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={useInstagramDm}
                      onCheckedChange={setUseInstagramDm}
                      disabled={!singleCreator.igUsername || !brandIgLinked}
                    />
                  </div>

                  {singleCreator.igUsername && !brandIgLinked && (
                    <Alert>
                      <Settings className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        인스타 DM을 사용하려면 <a href="/brand/settings" className="underline font-semibold">브랜드 설정</a>에서 인스타 계정을 연동해주세요.
                      </AlertDescription>
                    </Alert>
                  )}

                  {noChannelAvailable && !useInstagramDm && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-xs leading-relaxed">
                        <p className="font-semibold mb-1">발송 가능한 채널이 없습니다</p>
                        <p>이 크리에이터에게 메시지를 보내려면 아래 방법 중 하나가 필요해요:</p>
                        <ul className="list-disc ml-4 mt-1 space-y-0.5">
                          <li>크리에이터가 크넥에 가입하면 인앱 알림 가능</li>
                          <li>크리에이터의 이메일을 관리자에게 요청</li>
                          {singleCreator.igUsername && <li>&quot;인스타 DM&quot; 스위치를 켜서 DM으로 발송 (브랜드 인스타 연동 필요)</li>}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : mode === 'single' && creators.length === 0 ? (
                <p className="text-xs text-muted-foreground p-2 rounded-lg bg-muted/50">
                  크리에이터의 가용 채널(인앱·이메일·알림톡·DM)로 자동 발송됩니다.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  일괄 발송 시 각 크리에이터별 가용 채널로 자동 발송됩니다.
                </p>
              )}
            </div>

            {/* 미리보기 탭 */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-2">미리보기</h4>
              <Tabs value={previewTab} onValueChange={setPreviewTab}>
                <TabsList className="w-full">
                  <TabsTrigger value="inApp" className="flex-1">인앱</TabsTrigger>
                  <TabsTrigger value="email" className="flex-1">이메일</TabsTrigger>
                  <TabsTrigger value="kakao" className="flex-1">알림톡</TabsTrigger>
                  <TabsTrigger value="dm" className="flex-1">DM</TabsTrigger>
                </TabsList>
                <TabsContent value="inApp">
                  <InAppPreview title={renderedTitle} body={renderedBody} />
                </TabsContent>
                <TabsContent value="email">
                  <EmailPreview brandName={brandName || '브랜드'} subject={renderedTitle} body={renderedBody} />
                </TabsContent>
                <TabsContent value="kakao">
                  <AlimtalkPreview brandName={brandName || '브랜드'} title={renderedTitle} body={renderedBody} />
                </TabsContent>
                <TabsContent value="dm">
                  <DmPreview
                    brandHandle={brandInstagramHandle || ''}
                    creatorHandle={singleCreator?.igUsername || 'creator'}
                    body={renderedBody}
                  />
                </TabsContent>
              </Tabs>
            </div>

            <InviteCostSummary
              totalCount={creatorIds.length}
              freeQuota={freeQuota}
              channelBreakdown={bulkBreakdown}
            />
          </div>
        )}

        <DialogFooter className="flex gap-2">
          {step === 2 && (
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> 이전
            </Button>
          )}
          {step === 1 ? (
            <Button
              onClick={() => setStep(2)}
              disabled={type === 'GONGGU' && !campaignId}
            >
              다음 단계 <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !canSend}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {!canSend ? '발송 불가' :
               mode === 'single' ? '제안 보내기' : `${creatorIds.length}명에게 전송`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ChannelItem({
  icon,
  label,
  sublabel,
  active,
}: {
  icon: React.ReactNode
  label: string
  sublabel: string
  active: boolean
}) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
      <div className={active ? 'text-green-600' : 'text-muted-foreground'}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm">{label}</p>
        <p className="text-xs text-muted-foreground">{sublabel}</p>
      </div>
      <div className={`h-2 w-2 rounded-full ${active ? 'bg-green-500' : 'bg-gray-300'}`} />
    </div>
  )
}
