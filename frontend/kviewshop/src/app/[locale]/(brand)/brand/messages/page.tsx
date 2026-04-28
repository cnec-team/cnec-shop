'use client'

import { Suspense } from 'react'
import { MessageInbox } from '@/components/messages/message-inbox'
import { Skeleton } from '@/components/ui/skeleton'

export default function BrandMessagesPage() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6">
      <Suspense fallback={<Skeleton className="h-[calc(100vh-120px)] rounded-xl" />}>
        <MessageInbox role="brand" />
      </Suspense>
    </div>
  )
}
