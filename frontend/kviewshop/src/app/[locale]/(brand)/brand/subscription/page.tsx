import { getAuthUser } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { resolveBrandPlan } from '@/lib/pricing/v3/plan-resolver'
import { redirect } from 'next/navigation'
import BrandSubscriptionPage from './SubscriptionPageLegacy'

export default async function SubscriptionPage() {
  const authUser = await getAuthUser()
  if (authUser && authUser.role === 'brand_admin') {
    const brand = await prisma.brand.findUnique({
      where: { userId: authUser.id },
    })
    if (brand) {
      const subscription = await prisma.brandSubscription.findUnique({
        where: { brandId: brand.id },
      })
      const plan = resolveBrandPlan(subscription)
      if (plan.version === 'v3') {
        redirect('/brand/pricing')
      }
    }
  }

  // v2 레거시 UI 그대로 렌더링
  return <BrandSubscriptionPage />
}
