'use client'

import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  User,
  BadgeCheck,
  BookmarkPlus,
  ShieldCheck,
  Star,
  Mail,
  MessageSquare,
  Sparkles,
  Clock,
  Instagram,
} from 'lucide-react'
import { formatFollowerCount } from '@/lib/utils/format'
import { CreatorContentPreview } from './CreatorContentPreview'
import { getCreatorProfileImage } from '@/lib/utils/image'
import type { CreatorWithIg } from './types'

interface CreatorCardProps {
  creator: CreatorWithIg
  isSelected: boolean
  onSelect: (id: string) => void
  onPropose: (id: string, type: 'GONGGU' | 'PRODUCT_PICK') => void
  onSaveToGroup: (id: string) => void
}

function formatLastActivity(dateStr: string | null): string | null {
  if (!dateStr) return null
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1) return '방금 전 활동'
  if (hours < 24) return `${hours}시간 전 활동`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}일 전 활동`
  if (days < 30) return `${Math.floor(days / 7)}주 전 활동`
  return `${Math.floor(days / 30)}개월 전 활동`
}

export function CreatorCard({ creator, isSelected, onSelect, onPropose, onSaveToGroup }: CreatorCardProps) {
  const router = useRouter()
  const lastActivity = formatLastActivity(creator.igDataImportedAt)

  return (
    <TooltipProvider>
      <div
        className="relative rounded-2xl border bg-white shadow-sm hover:shadow-md transition-all p-6 cursor-pointer"
        onClick={() => router.push(`/brand/creators/${creator.id}`)}
      >
        {/* Top row: checkbox + send icons + bookmark */}
        <div className="flex items-center justify-between mb-4">
          <div onClick={e => e.stopPropagation()}>
            <Checkbox checked={isSelected} onCheckedChange={() => onSelect(creator.id)} />
          </div>
          <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
            {creator.canSendEmail && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center justify-center h-7 w-7 rounded-full hover:bg-emerald-50 transition-colors">
                    <Mail className="h-4 w-4 text-emerald-600" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>이메일 발송 가능</TooltipContent>
              </Tooltip>
            )}
            {creator.canSendAlimtalk && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center justify-center h-7 w-7 rounded-full hover:bg-emerald-50 transition-colors">
                    <MessageSquare className="h-4 w-4 text-emerald-600" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>알림톡 발송 가능</TooltipContent>
              </Tooltip>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onSaveToGroup(creator.id)}>
              <BookmarkPlus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Profile image centered */}
        <div className="flex justify-center mb-3">
          <CreatorContentPreview thumbnails={creator.igRecentPostThumbnails as string[] | null}>
            <Avatar className="h-24 w-24 ring-2 ring-white shadow-md cursor-pointer">
              <AvatarImage src={getCreatorProfileImage(creator)} />
              <AvatarFallback><User className="h-10 w-10" /></AvatarFallback>
            </Avatar>
          </CreatorContentPreview>
        </div>

        {/* Name */}
        <div className="text-center mb-1">
          <div className="flex items-center justify-center gap-1">
            <span className="text-lg font-semibold text-gray-900">
              {creator.displayName || creator.instagramHandle}
            </span>
            {creator.igVerified && <BadgeCheck className="h-4 w-4 text-blue-500 flex-shrink-0" />}
          </div>
        </div>

        {/* Handle */}
        <div className="flex items-center justify-center gap-1 mb-3">
          <Instagram className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-sm text-gray-500">@{creator.instagramHandle}</span>
        </div>

        {/* Trust signal badges */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-3">
          {creator.cnecIsPartner && (
            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-1 text-xs font-medium">
              <ShieldCheck className="h-4 w-4" />
              크넥 파트너
            </span>
          )}
          {creator.showStarRating && creator.starRating !== null && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-3 py-1 text-xs font-medium">
                  <Star className="h-4 w-4" fill="currentColor" />
                  {creator.starRating.toFixed(1)} · 협업 {creator.cnecTotalTrials}회
                </span>
              </TooltipTrigger>
              <TooltipContent>정산 완료한 협업 비율로 계산해요</TooltipContent>
            </Tooltip>
          )}
          {creator.cnecIsPartner && creator.cnecTotalTrials === 0 && (
            <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-1 text-xs font-medium">
              <Sparkles className="h-4 w-4" />
              신규 파트너
            </span>
          )}
        </div>

        {/* Category badges */}
        {creator.igCategory && (
          <div className="flex items-center justify-center gap-1.5 flex-wrap mb-4">
            {creator.igCategory.split(/[,/]/).map((cat, i) => (
              <span key={i} className="bg-gray-100 text-gray-700 rounded-md px-2 py-0.5 text-xs">
                {cat.trim()}
              </span>
            ))}
          </div>
        )}

        {/* Stats 3-column */}
        <div className="grid grid-cols-3 gap-2 border-t border-gray-100 pt-4 text-center mb-3">
          <div>
            <p className="text-xl font-bold text-gray-900">{formatFollowerCount(creator.igFollowers ?? 0)}</p>
            <p className="text-xs text-gray-500">팔로워</p>
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{creator.igEngagementRate?.toFixed(1) ?? '-'}%</p>
            <p className="text-xs text-gray-500">평균 반응률</p>
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{formatFollowerCount(creator.igPostsCount ?? 0)}</p>
            <p className="text-xs text-gray-500">게시물</p>
          </div>
        </div>

        {/* Last activity */}
        {lastActivity && (
          <div className="flex items-center justify-center gap-1 mb-4">
            <Clock className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs text-gray-500">{lastActivity}</span>
          </div>
        )}

        {/* CTA buttons */}
        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
          <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => onPropose(creator.id, 'GONGGU')}>
            공동구매 제안하기
          </Button>
          <Button size="sm" variant="outline" className="flex-1 border-gray-200 text-gray-700" onClick={() => router.push(`/brand/creators/${creator.id}`)}>
            프로필 보기
          </Button>
        </div>
      </div>
    </TooltipProvider>
  )
}
