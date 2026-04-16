'use client'

import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { TableRow, TableCell } from '@/components/ui/table'
import { User, BadgeCheck, BookmarkPlus } from 'lucide-react'
import { formatFollowerCount } from '@/lib/utils/format'
import { CreatorContentPreview } from './CreatorContentPreview'
import type { CreatorWithIg } from './types'

interface CreatorTableRowProps {
  creator: CreatorWithIg
  isSelected: boolean
  onSelect: (id: string) => void
  onPropose: (id: string, type: 'GONGGU' | 'CREATOR_PICK') => void
  onSaveToGroup: (id: string) => void
}

export function CreatorTableRow({ creator, isSelected, onSelect, onPropose, onSaveToGroup }: CreatorTableRowProps) {
  const router = useRouter()

  return (
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
              <AvatarImage src={creator.igProfileImageR2Url || undefined} />
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
  )
}
