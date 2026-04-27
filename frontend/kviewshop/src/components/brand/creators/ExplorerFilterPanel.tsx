'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Switch } from '@/components/ui/switch'
import {
  ChevronDown,
  ChevronUp,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { BEAUTY_CATEGORIES } from '@/lib/creator-match/category-keywords'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const FOLLOWER_TIERS = [
  { label: '1K-10K', value: 'NANO', hint: '나노 인플루언서. 친밀한 팔로워 관계와 높은 참여율이 강점이에요.' },
  { label: '10K-100K', value: 'MICRO', hint: '마이크로 인플루언서. 도달과 참여율의 밸런스가 좋아 가성비가 가장 높은 구간이에요.' },
  { label: '100K-1M', value: 'MACRO', hint: '매크로 인플루언서. 광범위한 도달과 브랜드 인지도 향상에 유리해요.' },
  { label: '1M+', value: 'MEGA', hint: '메가 인플루언서. 전국 단위 노출이 필요할 때 효과적이에요.' },
]

const ER_RANGES = [
  { label: '0-2%', min: '0', max: '2' },
  { label: '2-5%', min: '2', max: '5' },
  { label: '5-10%', min: '5', max: '10' },
  { label: '10%+', min: '10', max: '' },
]

const UPLOAD_OPTIONS = [
  { label: '최근 7일', value: '7' },
  { label: '최근 14일', value: '14' },
  { label: '최근 30일', value: '30' },
  { label: '최근 90일', value: '90' },
]

function Chip({
  label,
  selected,
  onClick,
  selectedClass = 'bg-stone-900 text-white border-stone-900',
  hint,
}: {
  label: string
  selected: boolean
  onClick: () => void
  selectedClass?: string
  hint?: string
}) {
  const button = (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-all',
        selected
          ? selectedClass
          : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400 hover:text-stone-900',
      )}
    >
      {label}
    </button>
  )
  if (!hint) return button
  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent
        side="top"
        className="max-w-[260px] bg-stone-900 text-white text-[12px] leading-relaxed px-3 py-2 rounded-lg"
      >
        {hint}
      </TooltipContent>
    </Tooltip>
  )
}

function LabelWithHint({ label, hint }: { label: string; hint: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <p className="text-[15px] font-bold text-stone-900">{label}</p>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="text-stone-300 hover:text-stone-500 transition-colors"
            aria-label={`${label} 설명`}
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-[280px] bg-stone-900 text-white text-[12px] leading-relaxed px-3 py-2 rounded-lg"
        >
          {hint}
        </TooltipContent>
      </Tooltip>
    </div>
  )
}

export function ExplorerFilterPanel() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [expanded, setExpanded] = useState(false)

  const selectedCategories = (searchParams.get('category') || '').split(',').filter(Boolean)
  const selectedTiers = (searchParams.get('tier') || '').split(',').filter(Boolean)
  const erMin = searchParams.get('minEngagement') || ''
  const erMax = searchParams.get('maxEngagement') || ''
  const uploadDays = searchParams.get('updatedWithinDays') || ''
  const cnecPartner = searchParams.get('cnecPartnerOnly') === 'true'
  const dmFilter = searchParams.get('canSendDM') === 'true'
  const emailFilter = searchParams.get('canSendEmail') === 'true'
  const alimtalkFilter = searchParams.get('canSendAlimtalk') === 'true'

  const contactFilterCount = (dmFilter ? 1 : 0) + (emailFilter ? 1 : 0) + (alimtalkFilter ? 1 : 0)
  const activeCount =
    (selectedCategories.length > 0 ? 1 : 0) +
    (selectedTiers.length > 0 ? 1 : 0) +
    (erMin || erMax ? 1 : 0) +
    (uploadDays ? 1 : 0) +
    (cnecPartner ? 1 : 0) +
    (contactFilterCount > 0 ? 1 : 0)

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === '') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    }
    params.set('page', '1')
    router.push(`?${params.toString()}`)
  }

  function toggleCategory(cat: string) {
    const next = selectedCategories.includes(cat)
      ? selectedCategories.filter(c => c !== cat)
      : [...selectedCategories, cat]
    updateParams({ category: next.length > 0 ? next.join(',') : null })
  }

  function toggleTier(tier: string) {
    const next = selectedTiers.includes(tier)
      ? selectedTiers.filter(t => t !== tier)
      : [...selectedTiers, tier]
    updateParams({ tier: next.length > 0 ? next.join(',') : null })
  }

  function selectErRange(min: string, max: string) {
    if (erMin === min && erMax === max) {
      updateParams({ minEngagement: null, maxEngagement: null })
    } else {
      updateParams({
        minEngagement: min || null,
        maxEngagement: max || null,
      })
    }
  }

  function selectUpload(days: string) {
    updateParams({ updatedWithinDays: uploadDays === days ? null : days })
  }

  function togglePartner(v: boolean) {
    updateParams({ cnecPartnerOnly: v ? 'true' : null })
  }

  function resetAll() {
    const view = searchParams.get('view')
    const sort = searchParams.get('sort')
    const params = new URLSearchParams()
    if (view) params.set('view', view)
    if (sort) params.set('sort', sort)
    router.push(`?${params.toString()}`)
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-0">
        {/* Header */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-between w-full py-4"
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-stone-500" />
            <span className="text-[16px] font-bold text-stone-900">세부 필터</span>
            {activeCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-stone-900 text-white text-[11px] font-bold">
                {activeCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {activeCount > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  resetAll()
                }}
                className="flex items-center gap-1 text-[13px] font-medium text-stone-500 hover:text-stone-900"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                초기화
              </button>
            )}
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-stone-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-stone-400" />
            )}
          </div>
        </button>

        {expanded && (
          <div className="space-y-7 pb-4">
            {/* 뷰티 카테고리 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <LabelWithHint
                  label="뷰티 카테고리"
                  hint="크리에이터의 메인 콘텐츠 카테고리예요. 우리 브랜드와 가까운 카테고리를 선택하면 매칭 적합도가 더 정확해져요."
                />
                {selectedCategories.length > 0 && (
                  <span className="text-[12px] font-medium text-stone-500">
                    {selectedCategories.length}개 선택됨
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {BEAUTY_CATEGORIES.map(cat => (
                  <Chip
                    key={cat}
                    label={cat}
                    selected={selectedCategories.includes(cat)}
                    onClick={() => toggleCategory(cat)}
                    selectedClass="bg-blue-500 text-white border-blue-500"
                  />
                ))}
              </div>
            </div>

            {/* 팔로워 구간 + 유효 팔로워 토글 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <div className="mb-3">
                  <LabelWithHint
                    label="팔로워 구간"
                    hint="나노(1K-10K)는 친밀한 참여율, 메가(1M+)는 폭넓은 도달이 강점이에요. 캠페인 목적에 맞춰 골라보세요."
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {FOLLOWER_TIERS.map(t => (
                    <Chip
                      key={t.value}
                      label={t.label}
                      selected={selectedTiers.includes(t.value)}
                      onClick={() => toggleTier(t.value)}
                      selectedClass="bg-stone-900 text-white border-stone-900"
                      hint={t.hint}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <LabelWithHint
                    label="유효 팔로워"
                    hint="실제 활성 사용자 비율이 60% 이상인 크리에이터만 보여드려요. 봇·휴면 비율이 낮을수록 광고 효율이 높아져요."
                  />
                  <p className="text-[12px] text-stone-500 mt-1">60% 이상만 보기 (봇·휴면 제외)</p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={false} disabled className="opacity-50" />
                  <span className="text-[12px] text-stone-400 font-medium">OFF</span>
                </div>
              </div>
            </div>

            {/* ER · 참여율 + 최근 업로드 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <div className="mb-3">
                  <LabelWithHint
                    label="ER · 참여율"
                    hint="좋아요·댓글이 팔로워 수 대비 얼마나 나오는지의 비율이에요. K-뷰티 평균은 2.4%, 5% 이상이면 매우 높은 편이에요."
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {ER_RANGES.map(r => (
                    <Chip
                      key={r.label}
                      label={r.label}
                      selected={erMin === r.min && erMax === r.max}
                      onClick={() => selectErRange(r.min, r.max)}
                      selectedClass="bg-green-500 text-white border-green-500"
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-3">
                  <LabelWithHint
                    label="최근 업로드"
                    hint="최근에 콘텐츠를 올린 활동 중인 크리에이터만 필터해요. 짧은 기간일수록 더 활발한 계정이에요."
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {UPLOAD_OPTIONS.map(o => (
                    <Chip
                      key={o.value}
                      label={o.label}
                      selected={uploadDays === o.value}
                      onClick={() => selectUpload(o.value)}
                      selectedClass="bg-blue-500 text-white border-blue-500"
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* 연락 수단 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <LabelWithHint
                  label="연락 수단"
                  hint="제안을 보낼 수 있는 채널(인스타 DM·이메일·카카오 알림톡)별로 필터해요. 도달률은 알림톡 > 이메일 > DM 순이에요."
                />
                <span className="text-[12px] text-stone-500">발송 가능한 채널로 필터</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Chip
                  label="DM 가능"
                  selected={dmFilter}
                  onClick={() => updateParams({ canSendDM: dmFilter ? null : 'true' })}
                  selectedClass="bg-stone-900 text-white border-stone-900"
                  hint="브랜드 인스타 계정과 연동 시 DM으로 발송 가능해요."
                />
                <Chip
                  label="이메일 발송"
                  selected={emailFilter}
                  onClick={() => updateParams({ canSendEmail: emailFilter ? null : 'true' })}
                  selectedClass="bg-blue-500 text-white border-blue-500"
                  hint="크리에이터가 등록한 비즈니스 이메일로 자동 발송돼요."
                />
                <Chip
                  label="알림톡 발송"
                  selected={alimtalkFilter}
                  onClick={() => updateParams({ canSendAlimtalk: alimtalkFilter ? null : 'true' })}
                  selectedClass="bg-green-500 text-white border-green-500"
                  hint="크넥 인증회원에게 카카오 알림톡으로 발송. 도달률이 가장 높아요."
                />
              </div>
            </div>

            {/* 크넥 파트너 */}
            <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/80 to-blue-50/30 p-5 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-blue-500 p-2 shrink-0">
                  <Sparkles className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[14px] font-bold text-stone-900">크넥 파트너만 보기</p>
                  <p className="text-[12px] text-stone-600 mt-0.5">
                    협업 이력이 검증된 신뢰 파트너 크리에이터만 모아 보여드려요
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Switch
                  checked={cnecPartner}
                  onCheckedChange={togglePartner}
                  className="data-[state=checked]:bg-blue-500"
                />
                <span className="text-[12px] text-stone-500 font-semibold w-7">
                  {cnecPartner ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
