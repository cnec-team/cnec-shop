import { getAuthUser } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { resolveBrandPlan } from '@/lib/pricing/v3/plan-resolver'
import { redirect } from 'next/navigation'
import { PricingHero } from './components/PricingHero'
import { PricingCards } from './components/PricingCards'
import { ComparisonTable } from './components/ComparisonTable'
import { PricingFAQ } from './components/PricingFAQ'

export default async function BrandPricingPage() {
  const authUser = await getAuthUser()
  if (!authUser || authUser.role !== 'brand_admin') {
    redirect('/login')
  }

  const brand = await prisma.brand.findUnique({
    where: { userId: authUser.id },
  })
  if (!brand) redirect('/login')

  const subscription = await prisma.brandSubscription.findUnique({
    where: { brandId: brand.id },
  })
  const currentPlan = resolveBrandPlan(subscription)

  // v2 레거시 사용자는 기존 구독 페이지로
  if (currentPlan.version === 'v2') {
    redirect('/brand/subscription')
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <PricingHero />
      <PricingCards
        currentPlan={currentPlan}
      />
      <ComparisonTable />
      <PricingFAQ />
    </div>
  )
}
