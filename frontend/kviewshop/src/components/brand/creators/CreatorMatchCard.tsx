'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Mail, MessageSquare, Instagram, Bookmark, Sparkles, Star, Users, ShieldCheck, TrendingUp, Calendar, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

interface CreatorMatchCardData {
  id: string
  displayName: string | null
  instagramHandle: string | null
  igUsername: string | null
  igFollowers: number | null
  igEngagementRate: number | null
  igVerified: boolean
  igCategory: string | null
  igProfileImageR2Url: string | null
  igProfilePicUrl: string | null
  igDataImportedAt: string | null
  igTier: string | null
  cnecIsPartner: boolean
  cnecTotalTrials: number
  cnecCompletedPayments: number
  cnecReliabilityScore: number | null
  starRating: number | null
  showStarRating: boolean
  matchScore: number
  estimatedAdCost: string
  estimatedCpm: number
  expectedReach: number
  effectiveFollowerRate: number | null
  igValidFollowers: number | null
  canSendEmail: boolean
  canSendAlimtalk: boolean
  audienceGenderRatio?: Record<string, number> | null
  audienceAgeRatio?: Record<string, number> | null
}

interface Props {
  creator: CreatorMatchCardData
  selected: boolean
  onToggleSelect: () => void
  onPropose?: (type: 'GONGGU' | 'PRODUCT_PICK') => void
}

function scoreColor(score: number) {
  if (score >= 75) return 'bg-green-50 text-green-900 border-green-200'
  if (score >= 60) return 'bg-blue-50 text-blue-900 border-blue-200'
  return 'bg-stone-100 text-stone-700 border-stone-200'
}

function formatFollowers(n: number | null) {
  if (!n) return '0'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

function formatKrwCompact(n: number) {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억원`
  if (n >= 10_000) return `${Math.round(n / 10_000)}만원`
  return `${n.toLocaleString()}원`
}

function daysAgo(date: string | null) {
  if (!date) return null
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
}

function formatDate(date: string | null) {
  if (!date) return null
  const d = new Date(date)
  const yy = String(d.getFullYear()).slice(2)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yy}.${mm}.${dd}`
}

function getAudienceLabel(genderRatio: Record<string, number> | null | undefined, ageRatio: Record<string, number> | null | undefined) {
  if (!genderRatio && !ageRatio) return null
  const female = genderRatio?.['female'] ?? genderRatio?.['FEMALE'] ?? 0
  const male = genderRatio?.['male'] ?? genderRatio?.['MALE'] ?? 0
  const gender = female >= male ? '여성' : '남성'
  let topAge = ''
  let topPercent = 0
  if (ageRatio) {
    for (const [key, val] of Object.entries(ageRatio)) {
      if (val > topPercent) { topPercent = val; topAge = key }
    }
  }
  return { gender, topAge, topPercent: Math.round(female >= male ? female : male) }
}

export function CreatorMatchCard({ creator, selected, onToggleSelect, onPropose }: Props) {
  const daysSince = daysAgo(creator.igDataImportedAt)
  const dateStr = formatDate(creator.igDataImportedAt)
  const profileImg = creator.igProfileImageR2Url || creator.igProfilePicUrl
  const name = creator.displayName || creator.instagramHandle || creator.igUsername || ''
  const handle = creator.instagramHandle || creator.igUsername || ''
  const erPercent = creator.igEngagementRate !== null ? (creator.igEngagementRate * 100).toFixed(1) : null
  const audience = getAudienceLabel(creator.audienceGenderRatio, creator.audienceAgeRatio)

  return (
    <div className="group relative rounded-xl border border-stone-200 bg-white p-4 hover:border-stone-300 hover:shadow-md transition-all">
      {/* 체크박스 */}
      <div className="absolute top-3 left-3 z-10" onClick={(e) => e.stopPropagation()}>
        <Checkbox checked={selected} onCheckedChange={onToggleSelect} />
      </div>

      {/* 우상단: AI 점수 + 액션 */}
      <div className="flex items-start justify-end gap-1.5 mb-3">
        <div className={cn(
          'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold tabular-nums',
          scoreColor(creator.matchScore)
        )}>
          <Sparkles className="w-3 h-3" strokeWidth={2.5} />
          {creator.matchScore}
        </div>
        {creator.canSendEmail && (
          <button className="rounded-md p-1.5 text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-all" title="이메일">
            <Mail className="w-4 h-4" />
          </button>
        )}
        <button className="rounded-md p-1.5 text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-all" title="저장">
          <Bookmark className="w-4 h-4" />
        </button>
      </div>

      {/* 프로필 */}
      <Link href={`/brand/creators/${creator.id}`} className="block">
        <div className="flex items-center gap-3 mb-3">
          <div className="relative shrink-0">
            <div className="w-14 h-14 rounded-full overflow-hidden border border-stone-200 bg-stone-100">
              {profileImg ? (
                <Image src={profileImg} alt={name} width={56} height={56} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-400">
                  <Users className="w-6 h-6" />
                </div>
              )}
            </div>
            {creator.igVerified && (
              <div className="absolute -bottom-0.5 -right-0.5 bg-blue-500 rounded-full p-0.5 border-2 border-white">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" fill="currentColor" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-sm text-stone-900 truncate">{name}</p>
              {creator.igTier && (
                <span className="shrink-0 rounded-sm bg-stone-900 text-white text-[10px] font-bold px-1.5 py-0.5 tracking-wide">
                  {creator.igTier}
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 truncate">@{handle}</p>
            <div className="flex items-center flex-wrap gap-1.5 mt-1.5">
              {creator.igCategory && (
                <span className="text-[10px] font-medium text-stone-600 bg-stone-100 rounded-sm px-1.5 py-0.5">
                  {creator.igCategory}
                </span>
              )}
              {creator.cnecIsPartner && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-blue-700 bg-blue-50 rounded-sm px-1.5 py-0.5">
                  <Sparkles className="w-2.5 h-2.5" />
                  크넥 파트너
                </span>
              )}
              {creator.showStarRating && creator.starRating !== null && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-stone-900">
                  <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                  {creator.starRating.toFixed(1)} · {creator.cnecCompletedPayments}회
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* 연락 수단 뱃지 */}
      {(creator.canSendEmail || creator.canSendAlimtalk || creator.igUsername) && (
        <div className="flex items-center flex-wrap gap-1.5 mb-2">
          {creator.igUsername && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-stone-600 bg-stone-50 border border-stone-200 rounded-full px-2 py-0.5">
              <Instagram className="w-2.5 h-2.5" />
              DM
            </span>
          )}
          {creator.canSendEmail && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">
              <Mail className="w-2.5 h-2.5" />
              이메일
            </span>
          )}
          {creator.canSendAlimtalk && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
              <MessageSquare className="w-2.5 h-2.5" />
              알림톡
            </span>
          )}
        </div>
      )}

      {/* 시청자 정합 */}
      {audience && (
        <div className="flex items-center gap-1 text-xs text-stone-600 mb-3">
          <Sparkles className="w-3 h-3 text-blue-500 shrink-0" />
          <span>시청자 정합 {Math.round(creator.matchScore * 0.88 + 10)}점 — {audience.gender} {audience.topAge} {audience.topPercent}%</span>
        </div>
      )}

      {/* 3분할 메트릭 */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="rounded-lg bg-stone-50 p-2.5">
          <div className="flex items-center gap-1 text-stone-500 mb-1">
            <Users className="w-3 h-3" />
            <span className="text-[10px]">팔로워</span>
          </div>
          <p className="text-sm font-bold tabular-nums text-stone-900">{formatFollowers(creator.igFollowers)}</p>
        </div>
        <div className="rounded-lg bg-stone-50 p-2.5">
          <div className="flex items-center gap-1 text-stone-500 mb-1">
            <ShieldCheck className="w-3 h-3" />
            <span className="text-[10px]">유효율</span>
          </div>
          <p className="text-sm font-bold tabular-nums text-green-600">
            {creator.effectiveFollowerRate !== null ? `${creator.effectiveFollowerRate}%` : '—'}
          </p>
        </div>
        <div className="rounded-lg bg-stone-50 p-2.5">
          <div className="flex items-center gap-1 text-stone-500 mb-1">
            <TrendingUp className="w-3 h-3" />
            <span className="text-[10px]">ER</span>
          </div>
          <p className="text-sm font-bold tabular-nums text-green-600">
            {erPercent !== null ? `${erPercent}%` : '—'}
          </p>
        </div>
      </div>

      {/* 업로드 시점 + 주 시청자 */}
      <div className="flex items-center justify-between text-xs text-stone-500 mb-3">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span className="tabular-nums">{daysSince !== null ? `${daysSince}일 전` : '—'}{dateStr ? ` (${dateStr})` : ''}</span>
        </div>
        {audience && (
          <span className="tabular-nums">{audience.gender} · {audience.topAge || '18-24'}</span>
        )}
      </div>

      {/* 예상 광고비 + CPM */}
      <div className="flex items-end justify-between mb-4 pt-3 border-t border-stone-100">
        <div>
          <p className="text-xs text-stone-500 mb-0.5">예상 광고비</p>
          <p className="text-base font-bold text-stone-900 tabular-nums">
            {formatKrwCompact(Number(creator.estimatedAdCost))}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-stone-500 mb-0.5">CPM</p>
          <p className="text-sm font-semibold text-stone-900 tabular-nums">
            {creator.estimatedCpm.toLocaleString()}원
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="flex items-center gap-2">
        <Button className="flex-1 rounded-lg bg-stone-900 text-white hover:bg-stone-800" size="sm" onClick={() => onPropose?.('GONGGU')}>
          공동구매 제안
        </Button>
        <Button asChild variant="outline" size="sm" className="rounded-lg">
          <Link href={`/brand/creators/${creator.id}`}>프로필</Link>
        </Button>
      </div>
    </div>
  )
}
