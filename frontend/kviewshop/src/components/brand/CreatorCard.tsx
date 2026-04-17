'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { User, BadgeCheck, BookmarkPlus } from 'lucide-react'
import { formatFollowerCount } from '@/lib/utils/format'
import { CreatorContentPreview } from './CreatorContentPreview'
import type { CreatorWithIg } from './types'

interface CreatorCardProps {
  creator: CreatorWithIg
  isSelected: boolean
  onSelect: (id: string) => void
  onPropose: (id: string, type: 'GONGGU' | 'CREATOR_PICK') => void
  onSaveToGroup: (id: string) => void
}

export function CreatorCard({ creator, isSelected, onSelect, onPropose, onSaveToGroup }: CreatorCardProps) {
  const router = useRouter()

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
              <AvatarImage src={creator.igProfileImageR2Url || creator.igProfilePicUrl || creator.profileImageUrl || creator.profileImage || undefined} />
              <AvatarFallback><User className="h-6 w-6" /></AvatarFallback>
            </Avatar>
          </CreatorContentPreview>

          <div className="flex-1 min-w-0 pl-4">
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-sm truncate">
                @{creator.instagramHandle}
              </span>
              {creator.igVerified && <BadgeCheck className="h-4 w-4 text-blue-500 flex-shrink-0" />}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {creator.displayName}
            </p>
          </div>

          <div onClick={e => e.stopPropagation()}>
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

        {creator.igCategory && (
          <Badge variant="secondary" className="mt-2 text-xs">{creator.igCategory}</Badge>
        )}
        {creator.igBio && (
          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{creator.igBio}</p>
        )}

        <div className="flex gap-2 mt-3" onClick={e => e.stopPropagation()}>
          <Button size="sm" className="flex-1" onClick={() => onPropose(creator.id, 'GONGGU')}>
            공구 제안
          </Button>
          <Button size="sm" variant="outline" className="flex-1" onClick={() => onPropose(creator.id, 'CREATOR_PICK')}>
            픽 제안
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
