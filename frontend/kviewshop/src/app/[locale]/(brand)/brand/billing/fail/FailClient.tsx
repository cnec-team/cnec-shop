'use client'

import { useSearchParams } from 'next/navigation'
import { AlertCircle } from 'lucide-react'

export function FailClient() {
  const params = useSearchParams()
  const code = params.get('code')
  const message = params.get('message')

  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="h-8 w-8 text-red-500" />
      </div>
      <h1 className="text-2xl font-bold mb-4">결제가 완료되지 않았어요</h1>
      <p className="text-muted-foreground mb-2">
        {message ?? '알 수 없는 오류가 발생했어요'}
      </p>
      {code && (
        <p className="text-xs text-muted-foreground mb-6">오류 코드: {code}</p>
      )}
      <a href="/ko/brand/pricing" className="underline">
        가격 페이지로 돌아가기
      </a>
    </div>
  )
}
