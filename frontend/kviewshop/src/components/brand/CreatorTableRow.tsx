'use client'

import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { TableRow, TableCell } from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { User, BadgeCheck, BookmarkPlus, ShieldCheck, Star, Sparkles, Mail, MessageSquare } from 'lucide-react'
import { formatFollowerCount } from '@/lib/utils/format'
import { CreatorContentPreview } from './CreatorContentPreview'
import { getCreatorProfileImage } from '@/lib/utils/image'
import type { CreatorWithIg } from './types'

interface CreatorTableRowProps {
  creator: CreatorWithIg
  isSelected: boolean
  onSelect: (id: string) => void
  onPropose: (id: string, type: 'GONGGU' | 'PRODUCT_PICK') => void
  onSaveToGroup: (id: string) => void
}

export function CreatorTableRow({ creator, isSelected, onSelect, onPropose, onSaveToGroup }: CreatorTableRowProps) {
  const router = useRouter()

  return (
    <TooltipProvider>
      <TableRow
        className="cursor-pointer hover:bg-muted/50"
        onClick={() => router.push(`/brand/creators/${creator.id}`)}
      >
        <TableCell onClick={e => e.stopPropagation()}>
          <Checkbox checked={isSelected} onCheckedChange={() => onSelect(creator.id)} />
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <CreatorContentPreview thumbnails={creator.igRecentPostThumbnails as string[] | null}>
              <Avatar className="h-8 w-8">
                <AvatarImage src={getCreatorProfileImage(creator)} />
                <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
              </Avatar>
            </CreatorContentPreview>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium">@{creator.instagramHandle}</span>
                {creator.igVerified && <BadgeCheck className="h-3.5 w-3.5 text-blue-500" />}
              </div>
              <span className="text-xs text-muted-foreground">{creator.displayName}</span>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant="secondary" className="text-xs">{creator.igCategory || '-'}</Badge>
        </TableCell>
        <TableCell>
          <div className="flex flex-col gap-1">
            {creator.cnecIsPartner && (
              <span className="inline-flex items-center gap-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs w-fit px-1.5 py-0">
                <ShieldCheck className="h-3 w-3" />
                파트너
              </span>
            )}
            {creator.showStarRating && creator.starRating !== null && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center gap-0.5 text-xs text-amber-700">
                    <Star className="h-3 w-3" fill="currentColor" />
                    {creator.starRating.toFixed(1)}
                  </span>
                </TooltipTrigger>
                <TooltipContent>정산 완료한 협업 비율로 계산해요</TooltipContent>
              </Tooltip>
            )}
            {creator.cnecIsPartner && creator.cnecTotalTrials === 0 && (
              <span className="inline-flex items-center gap-0.5 text-xs text-green-700">
                <Sparkles className="h-3 w-3" />
                신규
              </span>
            )}
            {!creator.cnecIsPartner && (
              <span className="text-xs text-muted-foreground">-</span>
            )}
          </div>
        </TableCell>
        <TableCell className="text-right">
          {creator.cnecTotalTrials > 0 ? `${creator.cnecTotalTrials}회` : (
            <span className="text-xs text-muted-foreground">-</span>
          )}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1">
            {creator.canSendEmail && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Mail className="h-3.5 w-3.5 text-emerald-600" />
                </TooltipTrigger>
                <TooltipContent>이메일 발송 가능</TooltipContent>
              </Tooltip>
            )}
            {creator.canSendAlimtalk && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                </TooltipTrigger>
                <TooltipContent>알림톡 발송 가능</TooltipContent>
              </Tooltip>
            )}
            {!creator.canSendEmail && !creator.canSendAlimtalk && (
              <span className="text-xs text-muted-foreground">-</span>
            )}
          </div>
        </TableCell>
        <TableCell className="text-right">{formatFollowerCount(creator.igFollowers ?? 0)}</TableCell>
        <TableCell className="text-right">{creator.igEngagementRate?.toFixed(1) ?? '-'}%</TableCell>
        <TableCell className="text-right">{creator.igPostsCount ?? '-'}</TableCell>
        <TableCell onClick={e => e.stopPropagation()}>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={() => onPropose(creator.id, 'GONGGU')}>제안</Button>
            <Button size="sm" variant="ghost" onClick={() => onSaveToGroup(creator.id)}>
              <BookmarkPlus className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    </TooltipProvider>
  )
}
