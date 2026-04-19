import { Suspense } from 'react'
import { UnsubscribeForm } from '@/components/unsubscribe/UnsubscribeForm'

export default function UnsubscribePage() {
  return (
    <div className="max-w-lg mx-auto py-20 px-4">
      <Suspense fallback={<p className="text-center">로딩 중...</p>}>
        <UnsubscribeForm />
      </Suspense>
    </div>
  )
}
