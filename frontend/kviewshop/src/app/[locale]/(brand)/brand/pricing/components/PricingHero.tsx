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
        매출이 되는 가격
      </h1>
      <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-lg mx-auto">
        구독료 하나로 캠페인, 메시지, 크리에이터 데이터까지 모두.
      </p>
      <div className="mt-8">
        <BillingCycleToggle value={billingCycle} onChange={onBillingChange} />
      </div>
    </section>
  )
}
