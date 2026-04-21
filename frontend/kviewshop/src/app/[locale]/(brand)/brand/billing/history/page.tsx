import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { BillingHistoryClient } from './BillingHistoryClient'

export default async function BillingHistoryPage() {
  const user = await getAuthUser()
  if (!user) redirect('/ko/login')

  const brand = await prisma.brand.findUnique({ where: { userId: user.id } })
  if (!brand) redirect('/ko')

  const payments = await prisma.billingPayment.findMany({
    where: { brandId: brand.id },
    orderBy: { requestedAt: 'desc' },
    take: 50,
  })

  return (
    <BillingHistoryClient payments={JSON.parse(JSON.stringify(payments))} />
  )
}
