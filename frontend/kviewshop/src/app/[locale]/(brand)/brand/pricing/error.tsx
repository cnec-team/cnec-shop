'use client'

import { Button } from '@/components/ui/button'

export default function PricingError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center space-y-4">
        <h2 className="text-xl font-semibold">페이지를 불러올 수 없습니다</h2>
        <p className="text-muted-foreground text-sm">잠시 후 다시 시도해주세요</p>
        <Button onClick={reset} variant="outline">다시 시도</Button>
      </div>
    </div>
  )
}
