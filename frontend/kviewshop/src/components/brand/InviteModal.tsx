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
} from 'lucide-react'
import { toast } from 'sonner'
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

  // Variable replacement for preview
  const replaceVars = (text: string) => {
    const creatorName = creators.length === 1 ? (creators[0].displayName || creators[0].igUsername || '크리에이터') : `${creatorIds.length}명의 크리에이터`
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

  // For single mode: check if proposal can be sent
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

  // Bulk channel breakdown
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

  const canSend = mode === 'bulk'
    ? (bulkBreakdown?.sendable ?? 0) > 0 && (type !== 'GONGGU' || !!campaignId)
    : singleSendCheck.ok && (type !== 'GONGGU' || !!campaignId)

  const freeQuota = { used: 0, total: 50 } // placeholder

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
          : { creatorIds }),
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

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || '초대 전송에 실패했습니다')
        return
      }

      toast.success(
        mode === 'single'
          ? '초대를 보냈습니다'
          : `${creatorIds.length}명에게 초대를 보냈습니다`
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
            {mode === 'single' ? '크리에이터에게 초대' : `${creatorIds.length}명에게 일괄 초대`}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              Step {step}/2
            </span>
          </DialogTitle>
        </DialogHeader>

        {step === 1 ? (
          /* ========== Step 1: 무엇을? ========== */
          <div className="space-y-4">
            {/* 제안 유형 탭 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Label>제안 유형</Label>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                  </HoverCardTrigger>
                  <HoverCardContent className="w-72 text-sm">
                    <p className="font-semibold mb-1">공구 초대</p>
                    <p className="text-muted-foreground mb-2">기간 한정 특가로 함께 판매하는 공구 캠페인 초대</p>
                    <p className="font-semibold mb-1">상품 추천</p>
                    <p className="text-muted-foreground">이 크리에이터 샵에 우리 상품을 상시 추천 상품으로 등록 요청</p>
                  </HoverCardContent>
                </HoverCard>
              </div>
              <Tabs value={type} onValueChange={v => setType(v as 'GONGGU' | 'PRODUCT_PICK')}>
                <TabsList className="w-full">
                  <TabsTrigger value="GONGGU" className="flex-1">공구 초대</TabsTrigger>
                  <TabsTrigger value="PRODUCT_PICK" className="flex-1">상품 추천</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* 캠페인 선택 */}
            {type === 'GONGGU' && (
              <div>
                <Label>캠페인 선택 *</Label>
                <Select value={campaignId} onValueChange={setCampaignId}>
                  <SelectTrigger><SelectValue placeholder="캠페인 선택..." /></SelectTrigger>
                  <SelectContent>
                    {campaigns.filter(c => c.status === 'RECRUITING' || c.status === 'ACTIVE').map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 커미션율 */}
            <div>
              <Label>커미션율 (%)</Label>
              <Input
                type="number"
                value={commissionRate}
                onChange={e => setCommissionRate(e.target.value)}
                placeholder="예: 15"
              />
            </div>
          </div>
        ) : (
          /* ========== Step 2: 어떻게? ========== */
          <div className="space-y-4">
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
                placeholder="크리에이터에게 보낼 메시지..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                {'변수: {{creatorName}}, {{brandName}}, {{campaignName}}, {{commissionRate}}, {{campaignPeriod}}'}
              </p>
            </div>

            {/* ====== 발송 채널 섹션 ====== */}
            <div className="space-y-2 border-t pt-4">
              <h4 className="text-sm font-semibold">발송 채널</h4>

              {mode === 'single' && singleCreator && singleChannels ? (
                <div className="space-y-2">
                  {/* 인앱 알림 */}
                  <ChannelItem
                    icon={<Bell className="h-4 w-4" />}
                    label="인앱 알림"
                    sublabel={
                      singleChannels.inApp
                        ? '크넥 가입자 자동 발송'
                        : '크넥 미가입 - 발송 불가'
                    }
                    active={singleChannels.inApp}
                  />
                  {/* 이메일 */}
                  <ChannelItem
                    icon={<Mail className="h-4 w-4" />}
                    label={singleChannels.email ? `이메일 (${singleCreator.brandContactEmail})` : '이메일'}
                    sublabel={
                      singleChannels.email
                        ? '등록된 이메일로 자동 발송'
                        : '이메일 없음'
                    }
                    active={singleChannels.email}
                  />
                  {/* 알림톡 */}
                  <ChannelItem
                    icon={<MessageSquare className="h-4 w-4" />}
                    label={singleChannels.kakao ? '카카오 알림톡' : '카카오 알림톡'}
                    sublabel={
                      !singleCreator.hasPhone ? '전화번호 없음' :
                      singleCreator.cnecJoinStatus !== 'VERIFIED' ? '크넥 인증회원만 가능' :
                      '전화번호로 자동 발송'
                    }
                    active={singleChannels.kakao}
                  />
                  {/* 인스타 DM */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Instagram className="h-4 w-4" />
                      <div>
                        <p className="text-sm">
                          {singleCreator.igUsername ? `인스타 DM (@${singleCreator.igUsername})` : '인스타 DM'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {!singleCreator.igUsername ? '인스타 아이디 없음' :
                           !brandIgLinked ? '브랜드 인스타 연동 필요' :
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

                  {/* 브랜드 IG 미연동 안내 */}
                  {singleCreator.igUsername && !brandIgLinked && (
                    <Alert>
                      <AlertDescription className="text-xs">
                        인스타 DM을 사용하려면 브랜드 인스타 계정 연동이 필요합니다.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* 연락 수단 없음 경고 */}
                  {noChannelAvailable && !useInstagramDm && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        연락 수단이 없습니다.
                        {singleCreator.igUsername
                          ? ' "인스타 DM" 스위치를 켜주세요.'
                          : ' IG 아이디가 필요합니다.'}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  일괄 발송 시 각 크리에이터별 가용 채널로 자동 발송됩니다.
                </p>
              )}
            </div>

            {/* ====== 미리보기 탭 ====== */}
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

            {/* ====== 비용 요약 ====== */}
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
              다음 <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !canSend}
              className={
                !canSend ? 'bg-gray-400' :
                freeQuota.used < freeQuota.total ? 'bg-green-600 hover:bg-green-700' :
                'bg-amber-500 hover:bg-amber-600'
              }
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {!canSend ? '초대 불가' :
               freeQuota.used < freeQuota.total
                 ? (mode === 'single' ? '초대 보내기 (무료)' : `${creatorIds.length}명에게 전송 (무료)`)
                 : (mode === 'single' ? '초대 보내기 (500원)' : `${creatorIds.length}명에게 전송`)}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ====== Channel item sub-component ====== */
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
