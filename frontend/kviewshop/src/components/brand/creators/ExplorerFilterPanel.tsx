'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Switch } from '@/components/ui/switch'
import { ChevronDown, ChevronUp, Instagram, Mail, MessageSquare, RotateCcw, SlidersHorizontal, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BEAUTY_CATEGORIES } from '@/lib/creator-match/category-keywords'

const FOLLOWER_TIERS = [
  { label: '1K-10K', value: 'NANO' },
  { label: '10K-100K', value: 'MICRO' },
  { label: '100K-1M', value: 'MACRO' },
  { label: '1M+', value: 'MEGA' },
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
}: {
  label: string
  selected: boolean
  onClick: () => void
  selectedClass?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
        selected ? selectedClass : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
      )}
    >
      {label}
    </button>
  )
}

export function ExplorerFilterPanel() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [expanded, setExpanded] = useState(false)

  // Read current values from URL
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
    // Toggle off if already selected
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
    <div className="space-y-0">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full py-3"
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-stone-500" />
          <span className="text-sm font-medium text-stone-900">세부 필터</span>
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-stone-900 text-white text-[10px] font-bold">
              {activeCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {activeCount > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); resetAll() }}
              className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-700"
            >
              <RotateCcw className="w-3 h-3" />
              초기화
            </button>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
        </div>
      </button>

      {expanded && (
        <div className="space-y-6 pb-4">
          {/* 뷰티 카테고리 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <p className="text-sm font-medium text-stone-900">뷰티 카테고리</p>
              {selectedCategories.length > 0 && (
                <span className="text-xs text-stone-500">{selectedCategories.length}개 선택됨</span>
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
              <p className="text-sm font-medium text-stone-900 mb-3">팔로워 구간</p>
              <div className="flex flex-wrap gap-2">
                {FOLLOWER_TIERS.map(t => (
                  <Chip
                    key={t.value}
                    label={t.label}
                    selected={selectedTiers.includes(t.value)}
                    onClick={() => toggleTier(t.value)}
                    selectedClass="bg-stone-900 text-white border-stone-900"
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-stone-900">유효 팔로워</p>
                <p className="text-xs text-stone-500 mt-0.5">60% 이상만 보기 (봇·휴면 제외)</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={false} disabled className="opacity-50" />
                <span className="text-xs text-stone-400">OFF</span>
              </div>
            </div>
          </div>

          {/* ER · 참여율 + 최근 업로드 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-stone-900 mb-3">ER · 참여율</p>
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
              <p className="text-sm font-medium text-stone-900 mb-3">최근 업로드</p>
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
              <p className="text-sm font-medium text-stone-900">연락 수단</p>
              <span className="text-xs text-stone-500">발송 가능한 채널로 필터</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Chip
                label="DM 가능"
                selected={dmFilter}
                onClick={() => updateParams({ canSendDM: dmFilter ? null : 'true' })}
                selectedClass="bg-stone-900 text-white border-stone-900"
              />
              <Chip
                label="이메일 발송"
                selected={emailFilter}
                onClick={() => updateParams({ canSendEmail: emailFilter ? null : 'true' })}
                selectedClass="bg-blue-500 text-white border-blue-500"
              />
              <Chip
                label="알림톡 발송"
                selected={alimtalkFilter}
                onClick={() => updateParams({ canSendAlimtalk: alimtalkFilter ? null : 'true' })}
                selectedClass="bg-green-500 text-white border-green-500"
              />
            </div>
          </div>

          {/* 크넥 파트너 */}
          <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-blue-500 p-1.5 shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-xs font-semibold text-stone-900">크넥 파트너만 보기</p>
                <p className="text-[10px] text-stone-600 mt-0.5">협업 이력이 검증된 신뢰 파트너 크리에이터</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={cnecPartner}
                onCheckedChange={togglePartner}
                className="data-[state=checked]:bg-blue-500"
              />
              <span className="text-xs text-stone-400">{cnecPartner ? 'ON' : 'OFF'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
