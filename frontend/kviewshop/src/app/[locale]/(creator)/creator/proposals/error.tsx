'use client'

import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function ProposalsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="h-16 w-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
        <AlertCircle className="h-8 w-8 text-red-500" />
      </div>
      <h2 className="text-lg font-semibold mb-1">제안 목록을 불러올 수 없습니다</h2>
      <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
        {error.message || '일시적인 오류가 발생했습니다.'}
      </p>
      <Button onClick={reset}>다시 시도</Button>
    </div>
  )
}
