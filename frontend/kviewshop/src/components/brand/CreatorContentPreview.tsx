'use client'

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'

interface CreatorContentPreviewProps {
  thumbnails: string[] | null
  children: React.ReactNode
}

export function CreatorContentPreview({ thumbnails, children }: CreatorContentPreviewProps) {
  if (!thumbnails || thumbnails.length === 0) {
    return <>{children}</>
  }

  return (
    <HoverCard openDelay={200}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent className="w-64 p-2" side="right">
        <p className="text-xs font-medium mb-2">최근 게시물</p>
        <div className="grid grid-cols-3 gap-1">
          {thumbnails.slice(0, 6).map((url, i) => (
            <div key={i} className="aspect-square rounded overflow-hidden bg-muted">
              <img src={url} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
