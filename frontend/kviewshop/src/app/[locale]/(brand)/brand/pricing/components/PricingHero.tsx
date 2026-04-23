'use client'

import { BillingCycleToggle } from './BillingCycleToggle'
import type { BillingCycle } from './types'

interface PricingHeroProps {
  billingCycle: BillingCycle
  onBillingChange: (value: BillingCycle) => void
}

export function PricingHero({ billingCycle, onBillingChange }: PricingHeroProps) {
  return (
    <section className="pt-16 pb-12 md:pt-24 md:pb-16 text-center">
      <h1 className="text-[32px] md:text-[48px] font-bold tracking-[-0.03em] leading-tight text-foreground">
        필요한 만큼 시작하세요
      </h1>
      <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-lg mx-auto">
        이용한 만큼 합리적으로. 부담 없이 키워드 검색부터 무제한 운영까지.
      </p>
      <div className="mt-8">
        <BillingCycleToggle value={billingCycle} onChange={onBillingChange} />
      </div>
    </section>
  )
}
