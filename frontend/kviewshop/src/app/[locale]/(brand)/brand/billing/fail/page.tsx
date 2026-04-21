import { Suspense } from 'react'
import { FailClient } from './FailClient'

export default function FailPage() {
  return (
    <Suspense fallback={<div />}>
      <FailClient />
    </Suspense>
  )
}
