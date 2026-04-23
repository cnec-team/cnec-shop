'use client'

import { useState } from 'react'
import { PricingHero } from './components/PricingHero'
import { PricingCards } from './components/PricingCards'
import { ComparisonTable } from './components/ComparisonTable'
import { PlanCalculator } from './components/PlanCalculator'
import { PricingFAQ } from './components/PricingFAQ'
import { PricingCTA } from './components/PricingCTA'
import type { BillingCycle, PlanTier } from './components/types'

interface PricingPageClientProps {
  currentTier?: PlanTier
}

export function PricingPageClient({ currentTier }: PricingPageClientProps) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly')

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <PricingHero billingCycle={billingCycle} onBillingChange={setBillingCycle} />
        <PricingCards billingCycle={billingCycle} currentTier={currentTier} />
      </div>

      <section className="bg-muted/30 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <ComparisonTable />
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-5xl px-4 md:px-6">
          <PlanCalculator billingCycle={billingCycle} />
        </div>
      </section>

      <section className="py-16 md:py-24 bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 md:px-6">
          <PricingFAQ />
        </div>
      </section>

      <PricingCTA />
    </div>
  )
}
