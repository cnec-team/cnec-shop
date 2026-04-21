import { Suspense } from 'react'
import { SuccessClient } from './SuccessClient'

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="p-24 text-center text-muted-foreground">
          결제를 확정하고 있어요...
        </div>
      }
    >
      <SuccessClient />
    </Suspense>
  )
}
