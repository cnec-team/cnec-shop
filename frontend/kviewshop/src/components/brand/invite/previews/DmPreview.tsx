'use client'

import { ChevronLeft, Phone, Video } from 'lucide-react'

interface DmPreviewProps {
  brandHandle: string
  creatorHandle: string
  body: string
}

export function DmPreview({ brandHandle, creatorHandle, body }: DmPreviewProps) {
  return (
    <div className="max-w-[280px] mx-auto rounded-lg overflow-hidden border">
      {/* Instagram DM header */}
      <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 px-3 py-2 flex items-center gap-2">
        <ChevronLeft className="h-4 w-4 text-white" />
        <div className="flex items-center gap-2 flex-1">
          <div className="h-6 w-6 bg-white/30 rounded-full" />
          <span className="text-xs font-semibold text-white">
            @{creatorHandle || 'creator'}
          </span>
        </div>
        <Phone className="h-3.5 w-3.5 text-white" />
        <Video className="h-3.5 w-3.5 text-white" />
      </div>
      {/* Chat area */}
      <div className="bg-white p-3 min-h-[120px]">
        <div className="flex justify-end">
          <div className="bg-blue-500 text-white rounded-2xl rounded-br-md px-3 py-2 max-w-[200px]">
            <p className="text-xs whitespace-pre-wrap">
              {body || '메시지 내용'}
            </p>
          </div>
        </div>
        <p className="text-right text-[9px] text-muted-foreground mt-1">
          @{brandHandle || 'brand'} · 방금
        </p>
      </div>
    </div>
  )
}
