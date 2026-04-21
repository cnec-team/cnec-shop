import { redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { RefundsClient } from './RefundsClient'

export default async function AdminRefundsPage() {
  const user = await getAuthUser()
  if (!user) redirect('/ko/login')
  if (user.role !== 'super_admin') redirect('/ko')

  const requests = await prisma.billingPayment.findMany({
    where: { status: 'REFUND_REQUESTED' },
    orderBy: { refundRequestedAt: 'desc' },
    include: { brand: true },
  })

  return <RefundsClient requests={JSON.parse(JSON.stringify(requests))} />
}
