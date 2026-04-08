'use client'

import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <AlertCircle className="h-10 w-10 text-destructive" />
      <p className="text-sm text-muted-foreground">{error.message || '오류가 발생했습니다'}</p>
      <Button variant="outline" size="sm" onClick={reset}>다시 시도</Button>
    </div>
  )
}
