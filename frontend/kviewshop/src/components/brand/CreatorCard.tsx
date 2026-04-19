'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { User, BadgeCheck, BookmarkPlus, ShieldCheck, Star, MessageSquare } from 'lucide-react'
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

export function CreatorCard({ creator, isSelected, onSelect, onPropose, onSaveToGroup }: CreatorCardProps) {
  const router = useRouter()

  const scorePercent = creator.cnecReliabilityScore !== null
    ? (creator.cnecReliabilityScore <= 1
        ? Math.round(creator.cnecReliabilityScore * 100)
        : Math.round(creator.cnecReliabilityScore))
    : null
  const starCount = scorePercent !== null ? Math.round(scorePercent / 20) : 0

  return (
    <Card
      className="relative hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => router.push(`/brand/creators/${creator.id}`)}
    >
      <div className="absolute top-3 left-3 z-10" onClick={e => e.stopPropagation()}>
        <Checkbox checked={isSelected} onCheckedChange={() => onSelect(creator.id)} />
      </div>

      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <CreatorContentPreview thumbnails={creator.igRecentPostThumbnails as string[] | null}>
            <Avatar className="h-12 w-12 cursor-pointer">
              <AvatarImage src={getCreatorProfileImage(creator)} />
              <AvatarFallback><User className="h-6 w-6" /></AvatarFallback>
            </Avatar>
          </CreatorContentPreview>

          <div className="flex-1 min-w-0 pl-4">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-medium text-sm truncate">
                @{creator.instagramHandle}
              </span>
              {creator.igVerified && <BadgeCheck className="h-4 w-4 text-blue-500 flex-shrink-0" />}
              {creator.cnecIsPartner && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 text-xs px-1.5 py-0 h-5 gap-0.5 flex-shrink-0">
                  <ShieldCheck className="h-3 w-3" />
                  CNEC 파트너
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {creator.displayName}
            </p>
          </div>

          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
            {creator.hasPhone && creator.phoneForAlimtalk && (
              <span title="알림톡 발송 가능">
                <MessageSquare className="h-4 w-4 text-green-600" />
              </span>
            )}
            <Button variant="ghost" size="icon" onClick={() => onSaveToGroup(creator.id)}>
              <BookmarkPlus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-3 text-center">
          <div>
            <p className="text-sm font-semibold">{formatFollowerCount(creator.igFollowers ?? 0)}</p>
            <p className="text-xs text-muted-foreground">팔로워</p>
          </div>
          <div>
            <p className="text-sm font-semibold">{creator.igEngagementRate?.toFixed(1) ?? '-'}%</p>
            <p className="text-xs text-muted-foreground">참여율</p>
          </div>
          <div>
            <p className="text-sm font-semibold">{formatFollowerCount(creator.igPostsCount ?? 0)}</p>
            <p className="text-xs text-muted-foreground">게시물</p>
          </div>
        </div>

        {scorePercent !== null && (
          <div className="flex items-center gap-1.5 mt-2">
            <div className="flex">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className={`h-3.5 w-3.5 ${i < starCount ? 'text-yellow-500 fill-current' : 'text-muted-foreground'}`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">({scorePercent}점)</span>
            <span className="text-xs text-muted-foreground">
              {creator.cnecTotalTrials > 0
                ? `협업 ${creator.cnecTotalTrials}회 · 정산 ${creator.cnecCompletedPayments}건`
                : '신규'}
            </span>
          </div>
        )}

        {scorePercent === null && creator.cnecTotalTrials > 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            협업 {creator.cnecTotalTrials}회 · 정산 {creator.cnecCompletedPayments}건
          </p>
        )}

        {creator.igCategory && (
          <Badge variant="secondary" className="mt-2 text-xs">{creator.igCategory}</Badge>
        )}
        {creator.igBio && (
          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{creator.igBio}</p>
        )}

        <div className="flex gap-2 mt-3" onClick={e => e.stopPropagation()}>
          <Button size="sm" className="flex-1" onClick={() => onPropose(creator.id, 'GONGGU')}>
            공구 초대
          </Button>
          <Button size="sm" variant="outline" className="flex-1" onClick={() => onPropose(creator.id, 'PRODUCT_PICK')}>
            추천 요청
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
