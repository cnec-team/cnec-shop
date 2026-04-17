'use client'

import { Mail } from 'lucide-react'

interface EmailPreviewProps {
  brandName: string
  subject: string
  body: string
}

export function EmailPreview({ brandName, subject, body }: EmailPreviewProps) {
  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      {/* Email header */}
      <div className="bg-gray-50 px-4 py-3 border-b space-y-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Mail className="h-3 w-3" />
          <span>보낸 사람: {brandName} &lt;no-reply@cnecshop.com&gt;</span>
        </div>
        <p className="text-sm font-semibold">{subject || '제목 없음'}</p>
      </div>
      {/* Email body */}
      <div className="p-4 space-y-4">
        <p className="text-sm whitespace-pre-wrap leading-relaxed">
          {body || '내용 없음'}
        </p>
        <div className="pt-2">
          <div className="inline-block bg-blue-600 text-white text-sm px-6 py-2 rounded-md">
            자세히 보기
          </div>
        </div>
        <div className="border-t pt-3 text-[10px] text-muted-foreground">
          본 메일은 크넥샵에서 발송되었습니다.
        </div>
      </div>
    </div>
  )
}
