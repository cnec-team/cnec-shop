import { Suspense } from 'react'
import { CheckoutClient } from './CheckoutClient'

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-muted-foreground">
          결제 정보를 준비하고 있어요...
        </div>
      }
    >
      <CheckoutClient />
    </Suspense>
  )
}
