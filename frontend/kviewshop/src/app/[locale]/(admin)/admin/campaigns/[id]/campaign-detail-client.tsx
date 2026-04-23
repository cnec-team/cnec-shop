'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminBreadcrumb } from '@/components/admin/admin-breadcrumb'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Megaphone, MoreVertical, Ban, EyeOff, Eye, AlertTriangle, Users, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
import { forceEndCampaign, setCampaignVisibility } from '@/lib/actions/admin-campaigns-force'

type CampaignDetail = Awaited<ReturnType<typeof import('@/lib/actions/admin-campaigns-force').getCampaignForceDetail>>

function CampaignStatusBadge({ status, isHidden, forceEndedAt }: { status: string; isHidden: boolean; forceEndedAt: string | null }) {
  if (forceEndedAt) return <Badge variant="destructive">강제 종료됨</Badge>
  if (isHidden) return <Badge className="bg-amber-100 text-amber-700">노출 차단</Badge>
  const map: Record<string, { label: string; cls: string }> = {
    DRAFT: { label: '초안', cls: 'bg-stone-100 text-stone-600' },
    RECRUITING: { label: '모집 중', cls: 'bg-blue-100 text-blue-700' },
    ACTIVE: { label: '진행 중', cls: 'bg-emerald-100 text-emerald-700' },
    PAUSED: { label: '일시중지', cls: 'bg-amber-100 text-amber-700' },
    ENDED: { label: '종료', cls: 'bg-stone-100 text-stone-600' },
  }
  const s = map[status] || { label: status, cls: 'bg-stone-100 text-stone-600' }
  return <Badge className={s.cls}>{s.label}</Badge>
}

export function CampaignDetailClient({ campaign }: { campaign: CampaignDetail }) {
  const router = useRouter()
  const [forceEndOpen, setForceEndOpen] = useState(false)
  const [visibilityOpen, setVisibilityOpen] = useState(false)

  // Force end modal state
  const [feStep, setFeStep] = useState<1 | 2>(1)
  const [feReason, setFeReason] = useState('')
  const [feConfirmName, setFeConfirmName] = useState('')
  const [feLoading, setFeLoading] = useState(false)

  // Visibility modal state
  const [visStep, setVisStep] = useState<1 | 2>(1)
  const [visReason, setVisReason] = useState('')
  const [visConfirmName, setVisConfirmName] = useState('')
  const [visLoading, setVisLoading] = useState(false)

  const isEnded = campaign.status === 'ENDED'

  function resetFe() { setFeStep(1); setFeReason(''); setFeConfirmName(''); setFeLoading(false) }
  function resetVis() { setVisStep(1); setVisReason(''); setVisConfirmName(''); setVisLoading(false) }

  async function handleForceEnd() {
    if (feConfirmName !== campaign.title) return
    setFeLoading(true)
    try {
      await forceEndCampaign({ campaignId: campaign.id, reason: feReason })
      toast.success('캠페인이 강제 종료되었어요')
      setForceEndOpen(false); resetFe(); router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '실패했어요')
    } finally { setFeLoading(false) }
  }

  async function handleVisibility() {
    if (visConfirmName !== campaign.title) return
    setVisLoading(true)
    try {
      await setCampaignVisibility({ campaignId: campaign.id, isHidden: !campaign.isHidden, reason: visReason })
      toast.success(campaign.isHidden ? '노출이 해제되었어요' : '노출이 차단되었어요')
      setVisibilityOpen(false); resetVis(); router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '실패했어요')
    } finally { setVisLoading(false) }
  }

  return (
    <div className="space-y-6">
      <AdminBreadcrumb items={[
        { href: '/admin', label: '어드민' },
        { href: '/admin/campaigns', label: '캠페인 관리' },
        { label: campaign.title },
      ]} />

      {/* 강제 종료 배너 */}
      {campaign.forceEndedAt && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">이 캠페인은 강제 종료되었어요</p>
            <p className="mt-0.5 text-xs text-red-600">사유: {campaign.forceEndedReason || '없음'} · {new Date(campaign.forceEndedAt).toLocaleDateString('ko-KR')}</p>
          </div>
        </div>
      )}
      {/* 노출 차단 배너 */}
      {campaign.isHidden && !campaign.forceEndedAt && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <EyeOff className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">이 캠페인은 노출 차단 상태예요</p>
            <p className="mt-0.5 text-xs text-amber-600">사유: {campaign.hiddenReason || '없음'}</p>
          </div>
        </div>
      )}

      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-stone-400" />
            <h1 className="text-xl font-bold text-stone-900">{campaign.title}</h1>
            <CampaignStatusBadge status={campaign.status} isHidden={campaign.isHidden} forceEndedAt={campaign.forceEndedAt} />
          </div>
          <p className="mt-1 text-sm text-stone-500">
            {campaign.brandName} · {campaign.type}
            {campaign.startAt && ` · ${new Date(campaign.startAt).toLocaleDateString('ko-KR')}`}
            {campaign.endAt && ` ~ ${new Date(campaign.endAt).toLocaleDateString('ko-KR')}`}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon"><MoreVertical className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setVisibilityOpen(true)} className="text-amber-600">
              {campaign.isHidden ? <Eye className="mr-2 h-4 w-4" /> : <EyeOff className="mr-2 h-4 w-4" />}
              {campaign.isHidden ? '노출 해제' : '노출 차단'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setForceEndOpen(true)} disabled={isEnded} className="text-red-600">
              <Ban className="mr-2 h-4 w-4" />강제 종료
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 캠페인 요약 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-stone-400" />
            <p className="text-xs text-stone-500">참여 크리에이터</p>
          </div>
          <p className="mt-1 text-2xl font-bold tabular-nums">{campaign.participationCount}명</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-stone-400" />
            <p className="text-xs text-stone-500">진행 중 주문</p>
          </div>
          <p className="mt-1 text-2xl font-bold tabular-nums">{campaign.activeOrderCount}건</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <p className="text-xs text-stone-500">브랜드</p>
          <p className="mt-1 text-lg font-bold">{campaign.brandName}</p>
        </div>
      </div>

      {/* 강제 종료 모달 */}
      <Dialog open={forceEndOpen} onOpenChange={(o) => { if (!o) resetFe(); setForceEndOpen(o) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>캠페인 강제 종료</DialogTitle>
            <DialogDescription>되돌릴 수 없는 작업이에요</DialogDescription>
          </DialogHeader>
          {feStep === 1 && (
            <div className="space-y-4">
              <div className="rounded-lg bg-red-50 p-3 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                <p className="text-sm text-red-700">강제 종료는 되돌릴 수 없어요. 진행 중 주문 {campaign.activeOrderCount}건은 그대로 유지돼요.</p>
              </div>
              <div>
                <label className="text-sm font-medium text-stone-700">종료 사유</label>
                <Textarea value={feReason} onChange={e => setFeReason(e.target.value)} placeholder="종료 사유를 입력해주세요 (최소 10자)" className="mt-1.5" rows={3} />
                <p className="mt-1 text-xs text-stone-400">{feReason.length}/10자 이상</p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setForceEndOpen(false)}>취소</Button>
                <Button disabled={feReason.length < 10} onClick={() => setFeStep(2)}>다음</Button>
              </div>
            </div>
          )}
          {feStep === 2 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-stone-700">종료하려면 캠페인명을 정확히 입력하세요</label>
                <p className="mt-0.5 text-xs text-stone-400">입력: {campaign.title}</p>
                <Input value={feConfirmName} onChange={e => setFeConfirmName(e.target.value)} placeholder={campaign.title} className="mt-1.5" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setFeStep(1)}>뒤로</Button>
                <Button variant="destructive" disabled={feConfirmName !== campaign.title || feLoading} onClick={handleForceEnd}>
                  {feLoading ? '처리 중...' : '강제 종료'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 노출 차단/해제 모달 */}
      <Dialog open={visibilityOpen} onOpenChange={(o) => { if (!o) resetVis(); setVisibilityOpen(o) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{campaign.isHidden ? '노출 해제' : '노출 차단'}</DialogTitle>
            <DialogDescription>{campaign.isHidden ? '소비자에게 다시 노출돼요' : '소비자에게 숨겨져요. 언제든 해제할 수 있어요'}</DialogDescription>
          </DialogHeader>
          {visStep === 1 && (
            <div className="space-y-4">
              {campaign.isHidden && campaign.hiddenReason && (
                <div className="rounded-lg bg-stone-50 p-3">
                  <p className="text-xs font-medium text-stone-500">현재 차단 사유</p>
                  <p className="mt-1 text-sm text-stone-700">{campaign.hiddenReason}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-stone-700">{campaign.isHidden ? '해제 사유 (선택)' : '차단 사유'}</label>
                <Textarea value={visReason} onChange={e => setVisReason(e.target.value)} placeholder={campaign.isHidden ? '해제 사유를 입력해주세요' : '차단 사유를 입력해주세요 (최소 10자)'} className="mt-1.5" rows={2} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setVisibilityOpen(false)}>취소</Button>
                <Button disabled={!campaign.isHidden && visReason.length < 10} onClick={() => setVisStep(2)}>다음</Button>
              </div>
            </div>
          )}
          {visStep === 2 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-stone-700">{campaign.isHidden ? '해제' : '차단'}하려면 캠페인명을 정확히 입력하세요</label>
                <Input value={visConfirmName} onChange={e => setVisConfirmName(e.target.value)} placeholder={campaign.title} className="mt-1.5" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setVisStep(1)}>뒤로</Button>
                <Button
                  disabled={visConfirmName !== campaign.title || visLoading}
                  onClick={handleVisibility}
                  className={campaign.isHidden ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'}
                >
                  {visLoading ? '처리 중...' : campaign.isHidden ? '노출 해제' : '노출 차단'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
