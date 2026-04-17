'use client'

import { Bell } from 'lucide-react'

interface InAppPreviewProps {
  title: string
  body: string
}

export function InAppPreview({ title, body }: InAppPreviewProps) {
  return (
    <div className="border rounded-lg p-3 bg-white">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-blue-100 p-2 shrink-0">
          <Bell className="h-4 w-4 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{title || '제목 없음'}</p>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-3 whitespace-pre-wrap">
            {body || '내용 없음'}
          </p>
          <p className="text-[10px] text-muted-foreground mt-2">방금 전</p>
        </div>
      </div>
    </div>
  )
}
