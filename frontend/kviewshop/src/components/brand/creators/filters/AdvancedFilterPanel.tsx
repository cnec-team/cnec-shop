'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RotateCcw, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CreatorFilters } from '@/lib/creators/filter-types'
import { countActiveFilters } from '@/lib/creators/filter-types'

// ─── Constants ───────────────────────────────────────────────

const TIER_PRESETS = [
  { label: 'Nano (1K-10K)', min: 1000, max: 10000 },
  { label: 'Micro (10K-100K)', min: 10000, max: 100000 },
  { label: 'Macro (100K-1M)', min: 100000, max: 1000000 },
  { label: 'Mega (1M+)', min: 1000000, max: undefined },
] as const

const ER_PRESETS = [0.5, 1, 3, 5] as const

const CATEGORY_OPTIONS = [
  'Health/beauty',
  'Digital creator',
  'Beauty, cosmetic & personal care',
  'Blogger',
  'Personal blog',
  'Product/service',
  'Shopping & retail',
  'Art',
  'Fashion designer',
  'Entrepreneur',
]

const LAST_POST_OPTIONS = [
  { label: '7일 이내', value: 7 },
  { label: '30일 이내', value: 30 },
  { label: '90일 이내', value: 90 },
  { label: '180일 이내', value: 180 },
] as const

const CAMPAIGN_OPTIONS = [
  { label: '참여 없음', value: '0' },
  { label: '1-2회', value: '1-2' },
  { label: '3-5회', value: '3-5' },
  { label: '5회 이상', value: '5plus' },
] as const

// ─── Sub-components ──────────────────────────────────────────

function RangeInput({
  min,
  max,
  onMinChange,
  onMaxChange,
  placeholderMin = '최소',
  placeholderMax = '최대',
}: {
  min: number | undefined
  max: number | undefined
  onMinChange: (v: number | undefined) => void
  onMaxChange: (v: number | undefined) => void
  placeholderMin?: string
  placeholderMax?: string
}) {
  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        placeholder={placeholderMin}
        value={min ?? ''}
        onChange={e => onMinChange(e.target.value ? Number(e.target.value) : undefined)}
        className="h-8 text-sm"
      />
      <span className="text-muted-foreground text-xs shrink-0">~</span>
      <Input
        type="number"
        placeholder={placeholderMax}
        value={max ?? ''}
        onChange={e => onMaxChange(e.target.value ? Number(e.target.value) : undefined)}
        className="h-8 text-sm"
      />
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────

interface AdvancedFilterPanelProps {
  filters: CreatorFilters
  onChange: (filters: CreatorFilters) => void
  onApply: () => void
  onReset: () => void
  totalCount: number
  loading?: boolean
}

interface CreatorGroupOption {
  id: string
  name: string
}

export function AdvancedFilterPanel({
  filters,
  onChange,
  onApply,
  onReset,
  totalCount,
  loading,
}: AdvancedFilterPanelProps) {
  const [groups, setGroups] = useState<CreatorGroupOption[]>([])

  useEffect(() => {
    fetch('/api/brand/creator-groups')
      .then(res => res.json())
      .then((data: CreatorGroupOption[]) => {
        if (Array.isArray(data)) setGroups(data)
      })
      .catch(() => {/* ignore */})
  }, [])

  const activeCount = countActiveFilters(filters)

  const update = useCallback(
    (partial: Partial<CreatorFilters>) => {
      onChange({ ...filters, ...partial })
    },
    [filters, onChange],
  )

  const toggleInArray = <T,>(arr: T[] | undefined, item: T): T[] => {
    if (!arr) return [item]
    return arr.includes(item) ? arr.filter(v => v !== item) : [...arr, item]
  }

  const isTierActive = (min: number, max: number | undefined) =>
    filters.followersMin === min && filters.followersMax === max

  const setTier = (min: number, max: number | undefined) => {
    if (isTierActive(min, max)) {
      update({ followersMin: undefined, followersMax: undefined })
    } else {
      update({ followersMin: min, followersMax: max })
    }
  }

  return (
    <div className="border rounded-lg bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">상세 필터</span>
          {activeCount > 0 && (
            <Badge variant="default" className="text-xs px-1.5 py-0">
              {activeCount}
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onReset} className="text-xs gap-1">
          <RotateCcw className="h-3.5 w-3.5" />
          전체 초기화
        </Button>
      </div>

      {/* Accordion sections */}
      <div className="px-4 overflow-y-auto flex-1">
        <Accordion type="multiple" defaultValue={['basic']}>
          {/* 1. 기본 정보 */}
          <AccordionItem value="basic">
            <AccordionTrigger className="text-sm">기본 정보</AccordionTrigger>
            <AccordionContent className="space-y-4">
              {/* Follower tier buttons */}
              <div>
                <Label className="text-xs mb-1.5 block">팔로워 구간</Label>
                <div className="flex gap-2 flex-wrap">
                  {TIER_PRESETS.map(t => (
                    <Button
                      key={t.label}
                      variant={isTierActive(t.min, t.max) ? 'default' : 'outline'}
                      size="sm"
                      className="text-xs"
                      onClick={() => setTier(t.min, t.max)}
                    >
                      {t.label}
                    </Button>
                  ))}
                </div>
                <div className="mt-2">
                  <RangeInput
                    min={filters.followersMin}
                    max={filters.followersMax}
                    onMinChange={v => update({ followersMin: v })}
                    onMaxChange={v => update({ followersMax: v })}
                  />
                </div>
              </div>

              {/* Following */}
              <div>
                <Label className="text-xs mb-1.5 block">팔로잉</Label>
                <RangeInput
                  min={filters.followingMin}
                  max={filters.followingMax}
                  onMinChange={v => update({ followingMin: v })}
                  onMaxChange={v => update({ followingMax: v })}
                />
              </div>

              {/* Posts count */}
              <div>
                <Label className="text-xs mb-1.5 block">게시물 수</Label>
                <RangeInput
                  min={filters.postsCountMin}
                  max={filters.postsCountMax}
                  onMinChange={v => update({ postsCountMin: v })}
                  onMaxChange={v => update({ postsCountMax: v })}
                />
              </div>

              {/* Account type */}
              <div>
                <Label className="text-xs mb-1.5 block">계정 유형</Label>
                <div className="flex gap-3">
                  {(
                    [
                      { label: '비즈니스', value: 'BUSINESS' },
                      { label: '개인', value: 'PERSONAL' },
                      { label: '인증', value: 'VERIFIED' },
                    ] as const
                  ).map(opt => (
                    <label key={opt.value} className="flex items-center gap-1.5 text-xs">
                      <Checkbox
                        checked={filters.accountTypes?.includes(opt.value) ?? false}
                        onCheckedChange={() =>
                          update({
                            accountTypes: toggleInArray(filters.accountTypes, opt.value) as CreatorFilters['accountTypes'],
                          })
                        }
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Last post */}
              <div>
                <Label className="text-xs mb-1.5 block">최근 게시물</Label>
                <Select
                  value={filters.lastPostWithinDays ? String(filters.lastPostWithinDays) : ''}
                  onValueChange={v =>
                    update({ lastPostWithinDays: v ? (Number(v) as 7 | 30 | 90 | 180) : undefined })
                  }
                >
                  <SelectTrigger className="w-full h-8 text-xs">
                    <SelectValue placeholder="기간 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {LAST_POST_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={String(o.value)}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 2. 성과 지표 */}
          <AccordionItem value="performance">
            <AccordionTrigger className="text-sm">성과 지표</AccordionTrigger>
            <AccordionContent className="space-y-4">
              {/* Engagement rate */}
              <div>
                <Label className="text-xs mb-1.5 block">참여율 (%)</Label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {ER_PRESETS.map(p => (
                    <Button
                      key={p}
                      variant={filters.erMin === p ? 'default' : 'outline'}
                      size="sm"
                      className="text-xs"
                      onClick={() =>
                        update({
                          erMin: filters.erMin === p ? undefined : p,
                        })
                      }
                    >
                      {p}%+
                    </Button>
                  ))}
                </div>
                <RangeInput
                  min={filters.erMin}
                  max={filters.erMax}
                  onMinChange={v => update({ erMin: v })}
                  onMaxChange={v => update({ erMax: v })}
                  placeholderMin="최소 %"
                  placeholderMax="최대 %"
                />
              </div>

              {/* Avg feed likes */}
              <div>
                <Label className="text-xs mb-1.5 block">평균 피드 좋아요</Label>
                <RangeInput
                  min={filters.avgFeedLikesMin}
                  max={filters.avgFeedLikesMax}
                  onMinChange={v => update({ avgFeedLikesMin: v })}
                  onMaxChange={v => update({ avgFeedLikesMax: v })}
                />
              </div>

              {/* Avg feed comments */}
              <div>
                <Label className="text-xs mb-1.5 block">평균 피드 댓글</Label>
                <RangeInput
                  min={filters.avgFeedCommentsMin}
                  max={filters.avgFeedCommentsMax}
                  onMinChange={v => update({ avgFeedCommentsMin: v })}
                  onMaxChange={v => update({ avgFeedCommentsMax: v })}
                />
              </div>

              {/* Avg reel views */}
              <div>
                <Label className="text-xs mb-1.5 block">평균 릴스 조회수</Label>
                <RangeInput
                  min={filters.avgReelViewsMin}
                  max={filters.avgReelViewsMax}
                  onMinChange={v => update({ avgReelViewsMin: v })}
                  onMaxChange={v => update({ avgReelViewsMax: v })}
                />
              </div>

              {/* Avg reel likes */}
              <div>
                <Label className="text-xs mb-1.5 block">평균 릴스 좋아요</Label>
                <RangeInput
                  min={filters.avgReelLikesMin}
                  max={filters.avgReelLikesMax}
                  onMinChange={v => update({ avgReelLikesMin: v })}
                  onMaxChange={v => update({ avgReelLikesMax: v })}
                />
              </div>

              {/* Estimated reach */}
              <div>
                <Label className="text-xs mb-1.5 block">예상 도달</Label>
                <RangeInput
                  min={filters.estimatedReachMin}
                  max={filters.estimatedReachMax}
                  onMinChange={v => update({ estimatedReachMin: v })}
                  onMaxChange={v => update({ estimatedReachMax: v })}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 3. 콘텐츠 */}
          <AccordionItem value="content">
            <AccordionTrigger className="text-sm">콘텐츠</AccordionTrigger>
            <AccordionContent className="space-y-4">
              {/* Category multi-select */}
              <div>
                <Label className="text-xs mb-1.5 block">카테고리</Label>
                <div className="flex gap-1.5 flex-wrap">
                  {CATEGORY_OPTIONS.map(cat => (
                    <Badge
                      key={cat}
                      variant={filters.categories?.includes(cat) ? 'default' : 'outline'}
                      className="cursor-pointer text-xs"
                      onClick={() =>
                        update({
                          categories: toggleInArray(filters.categories, cat),
                        })
                      }
                    >
                      {cat}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Include keywords */}
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Label className="text-xs">포함 키워드</Label>
                  <div className="flex gap-1">
                    {(['OR', 'AND'] as const).map(op => (
                      <Button
                        key={op}
                        variant={
                          (filters.includeKeywordsMode || 'OR') === op ? 'default' : 'outline'
                        }
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => update({ includeKeywordsMode: op })}
                      >
                        {op}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  {[0, 1, 2].map(i => {
                    const kws = filters.includeKeywords || ['', '', '']
                    return (
                      <Input
                        key={i}
                        placeholder={`키워드 ${i + 1}`}
                        value={kws[i] || ''}
                        onChange={e => {
                          const next = [...(filters.includeKeywords || ['', '', ''])]
                          while (next.length < 3) next.push('')
                          next[i] = e.target.value
                          update({ includeKeywords: next })
                        }}
                        className="h-8 text-sm"
                      />
                    )
                  })}
                </div>
              </div>

              {/* Exclude keywords */}
              <div>
                <Label className="text-xs mb-1.5 block">제외 키워드</Label>
                <div className="flex gap-2">
                  {[0, 1, 2].map(i => {
                    const kws = filters.excludeKeywords || ['', '', '']
                    return (
                      <Input
                        key={i}
                        placeholder={`제외 ${i + 1}`}
                        value={kws[i] || ''}
                        onChange={e => {
                          const next = [...(filters.excludeKeywords || ['', '', ''])]
                          while (next.length < 3) next.push('')
                          next[i] = e.target.value
                          update({ excludeKeywords: next })
                        }}
                        className="h-8 text-sm"
                      />
                    )
                  })}
                </div>
              </div>

              {/* Languages */}
              <div>
                <Label className="text-xs mb-1.5 block">언어</Label>
                <div className="flex gap-3">
                  {(
                    [
                      { label: '한국어', value: 'ko' },
                      { label: '영어', value: 'en' },
                      { label: '일본어', value: 'ja' },
                    ] as const
                  ).map(opt => (
                    <label key={opt.value} className="flex items-center gap-1.5 text-xs">
                      <Checkbox
                        checked={filters.languages?.includes(opt.value) ?? false}
                        onCheckedChange={() =>
                          update({
                            languages: toggleInArray(filters.languages, opt.value) as CreatorFilters['languages'],
                          })
                        }
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 4. 오디언스 */}
          <AccordionItem value="audience">
            <AccordionTrigger className="text-sm">오디언스</AccordionTrigger>
            <AccordionContent className="space-y-4">
              <p className="text-xs text-muted-foreground">
                오디언스 데이터는 인스타그램 비즈니스 계정에서만 제공됩니다.
              </p>

              {/* Age group checkboxes */}
              <div>
                <Label className="text-xs mb-1.5 block">연령대</Label>
                <div className="flex gap-3">
                  {(
                    [
                      { label: '10대', value: '10s' },
                      { label: '20대', value: '20s' },
                      { label: '30대', value: '30s' },
                      { label: '40대+', value: '40plus' },
                    ] as const
                  ).map(opt => (
                    <label key={opt.value} className="flex items-center gap-1.5 text-xs">
                      <Checkbox
                        checked={filters.audienceAgeGroups?.includes(opt.value) ?? false}
                        onCheckedChange={() =>
                          update({
                            audienceAgeGroups: toggleInArray(
                              filters.audienceAgeGroups,
                              opt.value,
                            ) as CreatorFilters['audienceAgeGroups'],
                          })
                        }
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Valid followers */}
              <div>
                <Label className="text-xs mb-1.5 block">유효 팔로워</Label>
                <RangeInput
                  min={filters.validFollowersMin}
                  max={filters.validFollowersMax}
                  onMinChange={v => update({ validFollowersMin: v })}
                  onMaxChange={v => update({ validFollowersMax: v })}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 5. 크넥 데이터 */}
          <AccordionItem value="cnec">
            <AccordionTrigger className="text-sm">크넥 데이터</AccordionTrigger>
            <AccordionContent className="space-y-4">
              {/* CNEC status */}
              <div>
                <Label className="text-xs mb-1.5 block">크넥 상태</Label>
                <div className="flex gap-2">
                  {(
                    [
                      { label: '전체', value: 'ALL' },
                      { label: '인증회원', value: 'VERIFIED' },
                      { label: '미가입', value: 'NOT_JOINED' },
                    ] as const
                  ).map(opt => (
                    <Button
                      key={opt.value}
                      variant={
                        (filters.cnecStatus || 'ALL') === opt.value ? 'default' : 'outline'
                      }
                      size="sm"
                      className="text-xs"
                      onClick={() => update({ cnecStatus: opt.value })}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Previous proposal */}
              <div>
                <Label className="text-xs mb-1.5 block">제안 이력</Label>
                <div className="flex gap-2">
                  {(
                    [
                      { label: '전체', value: 'ALL' },
                      { label: '제안함', value: 'PROPOSED' },
                      { label: '제안 없음', value: 'NEVER' },
                    ] as const
                  ).map(opt => (
                    <Button
                      key={opt.value}
                      variant={
                        (filters.previousProposalStatus || 'ALL') === opt.value
                          ? 'default'
                          : 'outline'
                      }
                      size="sm"
                      className="text-xs"
                      onClick={() => update({ previousProposalStatus: opt.value })}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Campaign participation */}
              <div>
                <Label className="text-xs mb-1.5 block">캠페인 참여 횟수</Label>
                <Select
                  value={filters.campaignParticipation || ''}
                  onValueChange={v =>
                    update({
                      campaignParticipation: (v || undefined) as CreatorFilters['campaignParticipation'],
                    })
                  }
                >
                  <SelectTrigger className="w-full h-8 text-xs">
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {CAMPAIGN_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Acceptance rate */}
              <div>
                <Label className="text-xs mb-1.5 block">수락률 최소 (%)</Label>
                <Input
                  type="number"
                  placeholder="최소 %"
                  value={filters.acceptanceRateMin ?? ''}
                  onChange={e =>
                    update({
                      acceptanceRateMin: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="h-8 text-sm"
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 6. 비용 */}
          <AccordionItem value="cost">
            <AccordionTrigger className="text-sm">비용</AccordionTrigger>
            <AccordionContent className="space-y-4">
              {/* Estimated CPR */}
              <div>
                <Label className="text-xs mb-1.5 block">예상 CPR (원)</Label>
                <RangeInput
                  min={filters.estimatedCprMin}
                  max={filters.estimatedCprMax}
                  onMinChange={v => update({ estimatedCprMin: v })}
                  onMaxChange={v => update({ estimatedCprMax: v })}
                />
              </div>

              {/* Estimated ad fee */}
              <div>
                <Label className="text-xs mb-1.5 block">예상 광고비 (원)</Label>
                <RangeInput
                  min={filters.estimatedAdFeeMin}
                  max={filters.estimatedAdFeeMax}
                  onMinChange={v => update({ estimatedAdFeeMin: v })}
                  onMaxChange={v => update({ estimatedAdFeeMax: v })}
                />
              </div>

              {/* Group multi-select */}
              {groups.length > 0 && (
                <div>
                  <Label className="text-xs mb-1.5 block">그룹</Label>
                  <div className="flex gap-1.5 flex-wrap">
                    {groups.map(g => (
                      <Badge
                        key={g.id}
                        variant={filters.groupIds?.includes(g.id) ? 'default' : 'outline'}
                        className="cursor-pointer text-xs"
                        onClick={() =>
                          update({
                            groupIds: toggleInArray(filters.groupIds, g.id),
                          })
                        }
                      >
                        {g.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* 7. 연락처 */}
          <AccordionItem value="contact">
            <AccordionTrigger className="text-sm">연락처</AccordionTrigger>
            <AccordionContent className="space-y-3">
              <label className="flex items-center gap-2 text-xs">
                <Checkbox
                  checked={filters.hasEmail ?? false}
                  onCheckedChange={checked => update({ hasEmail: checked === true })}
                />
                이메일 보유
              </label>
              <label className="flex items-center gap-2 text-xs">
                <Checkbox
                  checked={filters.hasPhone ?? false}
                  onCheckedChange={checked => update({ hasPhone: checked === true })}
                />
                전화번호 보유
              </label>
              <label className="flex items-center gap-2 text-xs">
                <Checkbox
                  checked={filters.hasIgUsername ?? false}
                  onCheckedChange={checked => update({ hasIgUsername: checked === true })}
                />
                인스타그램 유저네임 보유
              </label>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Bottom sticky bar */}
      <div className="sticky bottom-0 border-t bg-background px-4 py-3">
        <Button
          className={cn('w-full', loading && 'opacity-70')}
          onClick={onApply}
          disabled={loading}
        >
          {loading ? '검색 중...' : `필터 적용 (${totalCount.toLocaleString()}명)`}
        </Button>
      </div>
    </div>
  )
}
