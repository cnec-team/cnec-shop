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
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Loader2,
  Bell,
  Mail,
  MessageSquare,
  Instagram,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  Gift,
  CalendarDays,
  Check,
  Info,
  Send,
  Percent,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
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

/* ==========================================================================
 *  Step Indicator (Toss-style)
 * ========================================================================== */
function StepIndicator({ step }: { step: 1 | 2 }) {
  const steps = [
    { id: 1, label: '제안 내용' },
    { id: 2, label: '메시지 & 발송' },
  ] as const
  return (
    <div className="flex items-center gap-3 mt-1">
      {steps.map((s, idx) => {
        const isActive = step === s.id
        const isDone = step > s.id
        return (
          <div key={s.id} className="flex items-center gap-2">
            <div
              className={cn(
                'flex items-center justify-center rounded-full w-7 h-7 text-[12px] font-bold transition-colors',
                isDone && 'bg-blue-500 text-white',
                isActive && 'bg-stone-900 text-white',
                !isActive && !isDone && 'bg-stone-100 text-stone-400',
              )}
            >
              {isDone ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : s.id}
            </div>
            <span
              className={cn(
                'text-[13px] font-semibold',
                isActive ? 'text-stone-900' : 'text-stone-400',
              )}
            >
              {s.label}
            </span>
            {idx === 0 && <div className="w-6 h-px bg-stone-200" />}
          </div>
        )
      })}
    </div>
  )
}

/* ==========================================================================
 *  Type Card (공구 / 상품 추천)
 * ========================================================================== */
function TypeCard({
  active,
  onClick,
  icon,
  title,
  desc,
  badge,
  accent,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  title: string
  desc: string
  badge?: string
  accent: 'blue' | 'purple'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative text-left rounded-2xl border-2 p-5 transition-all',
        active
          ? accent === 'blue'
            ? 'border-blue-500 bg-blue-50/40 shadow-sm'
            : 'border-purple-500 bg-purple-50/40 shadow-sm'
          : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50',
      )}
    >
      {active && (
        <div
          className={cn(
            'absolute top-3 right-3 rounded-full p-1',
            accent === 'blue' ? 'bg-blue-500' : 'bg-purple-500',
          )}
        >
          <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
        </div>
      )}
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'rounded-xl p-2.5 shrink-0',
            accent === 'blue' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600',
          )}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-[15px] font-bold text-stone-900">{title}</p>
            {badge && (
              <span
                className={cn(
                  'rounded-full text-[10px] font-bold px-2 py-0.5',
                  accent === 'blue' ? 'bg-blue-500 text-white' : 'bg-purple-500 text-white',
                )}
              >
                {badge}
              </span>
            )}
          </div>
          <p className="text-[12.5px] leading-relaxed text-stone-600">{desc}</p>
        </div>
      </div>
    </button>
  )
}

/* ==========================================================================
 *  Campaign Card Row (시각적 캠페인 리스트)
 * ========================================================================== */
function CampaignRow({
  campaign,
  selected,
  onClick,
}: {
  campaign: Campaign
  selected: boolean
  onClick: () => void
}) {
  const statusColor =
    campaign.status === 'RECRUITING'
      ? 'bg-green-100 text-green-700'
      : 'bg-blue-100 text-blue-700'
  const statusLabel = campaign.status === 'RECRUITING' ? '모집중' : '진행중'
  const dateStr =
    campaign.startAt && campaign.endAt
      ? `${new Date(campaign.startAt).toLocaleDateString('ko-KR', {
          month: 'short',
          day: 'numeric',
        })} ~ ${new Date(campaign.endAt).toLocaleDateString('ko-KR', {
          month: 'short',
          day: 'numeric',
        })}`
      : '기간 미정'
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-xl border-2 p-3.5 transition-all flex items-center gap-3',
        selected
          ? 'border-stone-900 bg-stone-50'
          : 'border-stone-200 bg-white hover:border-stone-300',
      )}
    >
      <div
        className={cn(
          'shrink-0 rounded-lg p-2.5',
          selected ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600',
        )}
      >
        <Sparkles className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className={cn('rounded-full text-[10px] font-bold px-2 py-0.5', statusColor)}>
            {statusLabel}
          </span>
          <p className="text-[14px] font-bold text-stone-900 truncate">{campaign.title}</p>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-stone-500">
          <CalendarDays className="w-3 h-3" />
          {dateStr}
          {campaign.commissionRate && (
            <>
              <span className="mx-1">·</span>
              <Percent className="w-3 h-3" />
              {campaign.commissionRate}%
            </>
          )}
        </div>
      </div>
      {selected && (
        <div className="rounded-full bg-stone-900 p-1">
          <Check className="w-3 h-3 text-white" strokeWidth={3} />
        </div>
      )}
    </button>
  )
}

/* ==========================================================================
 *  Channel Item (Step 2)
 * ========================================================================== */
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
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl border transition-colors',
        active ? 'bg-green-50/40 border-green-200' : 'bg-stone-50 border-stone-200',
      )}
    >
      <div
        className={cn(
          'rounded-lg p-2',
          active ? 'bg-green-100 text-green-600' : 'bg-stone-100 text-stone-400',
        )}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-semibold text-stone-900">{label}</p>
        <p className="text-[12px] text-stone-500 mt-0.5">{sublabel}</p>
      </div>
      <div className={cn('h-2.5 w-2.5 rounded-full shrink-0', active ? 'bg-green-500' : 'bg-stone-300')} />
    </div>
  )
}

/* ==========================================================================
 *  Main InviteModal
 * ========================================================================== */
export function InviteModal({
  open,
  onOpenChange,
  mode,
  creatorIds,
  creators = [],
  defaultType,
  brandInstagramHandle,
  brandInstagramVerified = false,
  brandName = '',
  onSuccess,
}: InviteModalProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [type, setType] = useState<'GONGGU' | 'PRODUCT_PICK'>(defaultType ?? 'GONGGU')
  const [campaignId, setCampaignId] = useState<string>('')
  const [templateId, setTemplateId] = useState<string>('')
  const [commissionRate, setCommissionRate] = useState<string>('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [templates, setTemplates] = useState<Template[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [useInstagramDm, setUseInstagramDm] = useState(false)
  const [previewTab, setPreviewTab] = useState('inApp')

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
    }
  }, [open, fetchData, defaultType])

  const handleTemplateSelect = (tid: string) => {
    setTemplateId(tid)
    const t = templates.find(tpl => tpl.id === tid)
    if (t) {
      setMessage(t.body)
      if (t.commissionRate) setCommissionRate(String(t.commissionRate))
      setType(t.type as 'GONGGU' | 'PRODUCT_PICK')
    }
  }

  const replaceVars = (text: string) => {
    const creatorName =
      creators.length === 1
        ? (creators[0].displayName || creators[0].igUsername || '크리에이터')
        : `${creatorIds.length}명의 크리에이터`
    const selectedCampaign = campaigns.find(c => c.id === campaignId)
    const campaignName = selectedCampaign?.title || '캠페인'
    const campaignPeriod =
      selectedCampaign?.startAt && selectedCampaign?.endAt
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
  const singleChannels = singleCreator
    ? getCreatorChannels({
        cnecJoinStatus: singleCreator.cnecJoinStatus,
        hasBrandEmail: singleCreator.hasBrandEmail,
        brandContactEmail: singleCreator.brandContactEmail,
        hasPhone: singleCreator.hasPhone,
        igUsername: singleCreator.igUsername,
      })
    : null
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
  const bulkBreakdown =
    mode === 'bulk' && creators.length > 0
      ? creators.reduce(
          (acc, c) => {
            const check = canProposalBeSent(
              {
                cnecJoinStatus: c.cnecJoinStatus,
                hasBrandEmail: c.hasBrandEmail,
                brandContactEmail: c.brandContactEmail,
                hasPhone: c.hasPhone,
                igUsername: c.igUsername,
              },
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
  const canSend =
    mode === 'bulk'
      ? (bulkBreakdown?.sendable ?? 0) > 0 && (type !== 'GONGGU' || !!campaignId)
      : singleSendCheck.ok && (type !== 'GONGGU' || !!campaignId)
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
      const endpoint =
        mode === 'single' ? '/api/brand/proposals' : '/api/brand/proposals/bulk'
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
          ? '초대를 보냈습니다'
          : `${data?.created ?? creatorIds.length}명에게 초대를 보냈습니다`,
      )
      onSuccess()
      onOpenChange(false)
    } catch {
      toast.error('초대 전송 중 오류가 발생했습니다')
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredCampaigns = campaigns.filter(
    c => c.status === 'RECRUITING' || c.status === 'ACTIVE',
  )
  const creatorDisplayName =
    creators.length === 1
      ? creators[0].displayName || creators[0].igUsername || '크리에이터'
      : ''

  return (
    <TooltipProvider delayDuration={150}>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[640px] max-h-[92vh] overflow-y-auto p-0 rounded-2xl">
          {/* Header */}
          <DialogHeader className="px-7 pt-7 pb-4 border-b border-stone-100">
            <DialogTitle className="text-[20px] font-extrabold text-stone-900 tracking-tight">
              {mode === 'single'
                ? `${creatorDisplayName}님에게 제안 보내기`
                : `${creatorIds.length}명에게 한 번에 제안 보내기`}
            </DialogTitle>
            <p className="text-[13px] text-stone-500 mt-1">
              두 단계만 거치면 크리에이터에게 바로 닿아요
            </p>
            <StepIndicator step={step} />
          </DialogHeader>

          {/* Body */}
          <div className="px-7 py-6">
            {step === 1 ? (
              /* ============== STEP 1 ============== */
              <div className="space-y-7">
                {/* 제안 유형 */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[15px] font-bold text-stone-900">
                      어떤 제안을 보낼까요?
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <TypeCard
                      active={type === 'GONGGU'}
                      onClick={() => setType('GONGGU')}
                      icon={<ShoppingBag className="w-5 h-5" />}
                      title="공동구매 초대"
                      desc="기간 한정 특가로 함께 판매하는 공구 캠페인이에요. 단기 매출 폭발에 유리해요."
                      accent="blue"
                      badge="추천"
                    />
                    <TypeCard
                      active={type === 'PRODUCT_PICK'}
                      onClick={() => setType('PRODUCT_PICK')}
                      icon={<Gift className="w-5 h-5" />}
                      title="상품 추천 등록"
                      desc="크리에이터 샵에 우리 상품을 상시 추천 상품으로 등록 요청해요. 꾸준한 노출에 유리해요."
                      accent="purple"
                    />
                  </div>
                </section>

                {/* 캠페인 선택 (공구일 때만) */}
                {type === 'GONGGU' && (
                  <section>
                    <div className="flex items-center gap-1.5 mb-3">
                      <h3 className="text-[15px] font-bold text-stone-900">
                        어느 캠페인에 초대할까요?
                      </h3>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button type="button" className="text-stone-300 hover:text-stone-500">
                            <Info className="w-3.5 h-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="max-w-[260px] bg-stone-900 text-white text-[12px] leading-relaxed px-3 py-2 rounded-lg"
                        >
                          모집중·진행중 상태의 캠페인만 표시돼요. 새 캠페인은 캠페인 메뉴에서 만들 수 있어요.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    {filteredCampaigns.length > 0 ? (
                      <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                        {filteredCampaigns.map(c => (
                          <CampaignRow
                            key={c.id}
                            campaign={c}
                            selected={campaignId === c.id}
                            onClick={() => setCampaignId(c.id)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-6 text-center">
                        <p className="text-[13px] text-stone-600 mb-1 font-semibold">
                          모집중인 캠페인이 없어요
                        </p>
                        <p className="text-[12px] text-stone-500">
                          캠페인 메뉴에서 새 캠페인을 먼저 만들어주세요
                        </p>
                      </div>
                    )}
                  </section>
                )}

                {/* 커미션율 */}
                <section>
                  <div className="flex items-center gap-1.5 mb-3">
                    <h3 className="text-[15px] font-bold text-stone-900">
                      커미션율을 정해주세요
                    </h3>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button type="button" className="text-stone-300 hover:text-stone-500">
                          <Info className="w-3.5 h-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        className="max-w-[280px] bg-stone-900 text-white text-[12px] leading-relaxed px-3 py-2 rounded-lg"
                      >
                        크리에이터에게 돌아가는 판매 수익의 비율이에요. 뷰티 카테고리는 보통 15~25%에서 시작해요.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="rounded-2xl border border-stone-200 bg-stone-50/60 p-5">
                    <div className="flex items-end justify-between mb-3">
                      <div>
                        <p className="text-[12px] text-stone-500 font-medium">커미션율</p>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <Input
                            type="number"
                            value={commissionRate}
                            onChange={e => setCommissionRate(e.target.value)}
                            placeholder="15"
                            className="w-20 h-12 text-[28px] font-extrabold tabular-nums border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 text-stone-900"
                          />
                          <span className="text-[24px] font-extrabold text-stone-900">%</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {[10, 15, 20, 25, 30].map(v => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setCommissionRate(String(v))}
                            className={cn(
                              'rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-all',
                              commissionRate === String(v)
                                ? 'bg-stone-900 text-white border-stone-900'
                                : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400',
                            )}
                          >
                            {v}%
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="text-[12px] text-stone-500">
                      미입력 시 캠페인 기본값이 적용돼요
                    </p>
                  </div>
                </section>
              </div>
            ) : (
              /* ============== STEP 2 ============== */
              <div className="space-y-7">
                {/* 메시지 */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[15px] font-bold text-stone-900">
                      어떤 메시지를 보낼까요?
                    </h3>
                    {templates.length > 0 && (
                      <Select value={templateId} onValueChange={handleTemplateSelect}>
                        <SelectTrigger className="w-[180px] h-9 text-[12px]">
                          <SelectValue placeholder="템플릿에서 가져오기" />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.map(t => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <Textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    rows={5}
                    placeholder="안녕하세요! 저희 브랜드와 함께 협업해보지 않으실래요? 자세한 조건은..."
                    className="resize-none rounded-xl border-stone-200 text-[14px] leading-relaxed"
                  />
                  <div className="flex items-center gap-1.5 mt-2 text-[11.5px] text-stone-500">
                    <Info className="w-3 h-3 shrink-0" />
                    <span>
                      변수: <code className="px-1 py-0.5 rounded bg-stone-100 text-stone-700">{`{{creatorName}}`}</code>{' '}
                      <code className="px-1 py-0.5 rounded bg-stone-100 text-stone-700">{`{{brandName}}`}</code>{' '}
                      <code className="px-1 py-0.5 rounded bg-stone-100 text-stone-700">{`{{campaignName}}`}</code>{' '}
                      <code className="px-1 py-0.5 rounded bg-stone-100 text-stone-700">{`{{commissionRate}}`}</code>
                    </span>
                  </div>
                </section>

                {/* 발송 채널 */}
                <section>
                  <h3 className="text-[15px] font-bold text-stone-900 mb-3">
                    어디로 보낼까요?
                  </h3>
                  {mode === 'single' && singleCreator && singleChannels ? (
                    <div className="space-y-2">
                      <ChannelItem
                        icon={<Bell className="w-4 h-4" />}
                        label="인앱 알림"
                        sublabel={
                          singleChannels.inApp
                            ? '크넥 앱 가입자에게 자동 발송돼요'
                            : '크넥에 가입되지 않아 발송할 수 없어요'
                        }
                        active={singleChannels.inApp}
                      />
                      <ChannelItem
                        icon={<Mail className="w-4 h-4" />}
                        label={
                          singleChannels.email
                            ? `이메일 (${singleCreator.brandContactEmail})`
                            : '이메일'
                        }
                        sublabel={
                          singleChannels.email
                            ? '등록된 비즈니스 이메일로 자동 발송돼요'
                            : '등록된 이메일이 없어요'
                        }
                        active={singleChannels.email}
                      />
                      <ChannelItem
                        icon={<MessageSquare className="w-4 h-4" />}
                        label="카카오 알림톡"
                        sublabel={
                          !singleCreator.hasPhone
                            ? '전화번호가 등록되지 않았어요'
                            : singleCreator.cnecJoinStatus !== 'VERIFIED'
                            ? '크넥 인증회원에게만 발송 가능해요'
                            : '전화번호로 자동 발송돼요 (도달률 최고)'
                        }
                        active={singleChannels.kakao}
                      />
                      <div
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-xl border',
                          useInstagramDm
                            ? 'bg-pink-50/40 border-pink-200'
                            : 'bg-stone-50 border-stone-200',
                        )}
                      >
                        <div
                          className={cn(
                            'rounded-lg p-2',
                            useInstagramDm
                              ? 'bg-pink-100 text-pink-600'
                              : 'bg-stone-100 text-stone-400',
                          )}
                        >
                          <Instagram className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13.5px] font-semibold text-stone-900">
                            {singleCreator.igUsername
                              ? `인스타 DM (@${singleCreator.igUsername})`
                              : '인스타 DM'}
                          </p>
                          <p className="text-[12px] text-stone-500 mt-0.5">
                            {!singleCreator.igUsername
                              ? '인스타 아이디가 없어요'
                              : !brandIgLinked
                              ? '브랜드 인스타 계정 연동이 필요해요'
                              : '브랜드 인스타 계정으로 DM 발송'}
                          </p>
                        </div>
                        <Switch
                          checked={useInstagramDm}
                          onCheckedChange={setUseInstagramDm}
                          disabled={!singleCreator.igUsername || !brandIgLinked}
                          className="data-[state=checked]:bg-pink-500"
                        />
                      </div>

                      {singleCreator.igUsername && !brandIgLinked && (
                        <Alert className="border-amber-200 bg-amber-50/60">
                          <AlertDescription className="text-[12px] text-amber-900">
                            인스타 DM을 사용하려면 브랜드 인스타 계정 연동이 필요해요.
                          </AlertDescription>
                        </Alert>
                      )}
                      {noChannelAvailable && !useInstagramDm && (
                        <Alert variant="destructive">
                          <AlertTriangle className="w-4 h-4" />
                          <AlertDescription className="text-[12px]">
                            연락 가능한 채널이 없어요.
                            {singleCreator.igUsername
                              ? ' "인스타 DM" 스위치를 켜주세요.'
                              : ' 인스타 아이디가 필요해요.'}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                      <p className="text-[13px] text-stone-700 font-medium">
                        일괄 발송 시 각 크리에이터별 가용 채널로 자동 발송돼요
                      </p>
                      {bulkBreakdown && (
                        <div className="grid grid-cols-3 gap-2 mt-3">
                          <div className="rounded-lg bg-white p-2.5 border border-stone-200 text-center">
                            <p className="text-[18px] font-extrabold text-green-600 tabular-nums">
                              {bulkBreakdown.sendable}
                            </p>
                            <p className="text-[10px] text-stone-500 mt-0.5">발송 가능</p>
                          </div>
                          <div className="rounded-lg bg-white p-2.5 border border-stone-200 text-center">
                            <p className="text-[18px] font-extrabold text-amber-600 tabular-nums">
                              {bulkBreakdown.unreachableBrandIg}
                            </p>
                            <p className="text-[10px] text-stone-500 mt-0.5">IG 연동 필요</p>
                          </div>
                          <div className="rounded-lg bg-white p-2.5 border border-stone-200 text-center">
                            <p className="text-[18px] font-extrabold text-stone-400 tabular-nums">
                              {bulkBreakdown.unreachableNoIg}
                            </p>
                            <p className="text-[10px] text-stone-500 mt-0.5">연락 불가</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </section>

                {/* 미리보기 */}
                <section>
                  <Label className="text-[15px] font-bold text-stone-900 mb-3 block">
                    크리에이터에게는 이렇게 보여요
                  </Label>
                  <Tabs value={previewTab} onValueChange={setPreviewTab}>
                    <TabsList className="w-full bg-stone-100 p-1 rounded-xl">
                      <TabsTrigger value="inApp" className="flex-1 rounded-lg text-[12px] font-semibold">
                        인앱
                      </TabsTrigger>
                      <TabsTrigger value="email" className="flex-1 rounded-lg text-[12px] font-semibold">
                        이메일
                      </TabsTrigger>
                      <TabsTrigger value="kakao" className="flex-1 rounded-lg text-[12px] font-semibold">
                        알림톡
                      </TabsTrigger>
                      <TabsTrigger value="dm" className="flex-1 rounded-lg text-[12px] font-semibold">
                        DM
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="inApp" className="mt-3">
                      <InAppPreview title={renderedTitle} body={renderedBody} />
                    </TabsContent>
                    <TabsContent value="email" className="mt-3">
                      <EmailPreview brandName={brandName || '브랜드'} subject={renderedTitle} body={renderedBody} />
                    </TabsContent>
                    <TabsContent value="kakao" className="mt-3">
                      <AlimtalkPreview brandName={brandName || '브랜드'} title={renderedTitle} body={renderedBody} />
                    </TabsContent>
                    <TabsContent value="dm" className="mt-3">
                      <DmPreview
                        brandHandle={brandInstagramHandle || ''}
                        creatorHandle={singleCreator?.igUsername || 'creator'}
                        body={renderedBody}
                      />
                    </TabsContent>
                  </Tabs>
                </section>

                {/* 비용 요약 */}
                <InviteCostSummary
                  totalCount={creatorIds.length}
                  freeQuota={freeQuota}
                  channelBreakdown={bulkBreakdown}
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="px-7 pb-7 pt-4 border-t border-stone-100 flex sm:justify-between gap-2">
            {step === 2 ? (
              <Button
                variant="ghost"
                onClick={() => setStep(1)}
                className="h-12 px-4 text-[14px] font-semibold text-stone-600 hover:text-stone-900"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> 이전 단계로
              </Button>
            ) : (
              <div />
            )}
            {step === 1 ? (
              <Button
                onClick={() => setStep(2)}
                disabled={type === 'GONGGU' && !campaignId}
                className="h-12 px-6 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-[15px] font-bold disabled:bg-stone-300"
              >
                다음 단계
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !canSend}
                className={cn(
                  'h-12 px-6 rounded-xl text-white text-[15px] font-bold',
                  !canSend
                    ? 'bg-stone-300'
                    : freeQuota.used < freeQuota.total
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-amber-500 hover:bg-amber-600',
                )}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                ) : (
                  <Send className="w-4 h-4 mr-1.5" />
                )}
                {!canSend
                  ? '발송 불가'
                  : freeQuota.used < freeQuota.total
                  ? mode === 'single'
                    ? '제안 보내기 (무료)'
                    : `${creatorIds.length}명에게 발송 (무료)`
                  : mode === 'single'
                  ? '제안 보내기'
                  : `${creatorIds.length}명에게 발송`}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}
