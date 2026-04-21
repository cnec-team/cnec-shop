import { prisma } from '@/lib/db'

export async function rollbackPlanAfterRefund(paymentId: string): Promise<void> {
  const payment = await prisma.billingPayment.findUnique({ where: { id: paymentId } })
  if (!payment) throw new Error('결제를 찾을 수 없어요')
  if (!payment.subscriptionId) return

  const snapshot = payment.priorPlanSnapshot as Record<string, unknown> | null

  if (!snapshot) {
    await prisma.brandSubscription.update({
      where: { id: payment.subscriptionId },
      data: {
        planV3: 'TRIAL',
        proBillingCycle: null,
        proStartedAt: null,
        proExpiresAt: null,
        shopCommissionRate: 10.0,
      },
    })
    return
  }

  if (payment.purpose === 'PRO_SUBSCRIPTION') {
    await prisma.brandSubscription.update({
      where: { id: payment.subscriptionId },
      data: {
        planV3: (snapshot.planV3 as any) ?? 'STANDARD',
        proBillingCycle: (snapshot.proBillingCycle as any) ?? null,
        proStartedAt: snapshot.proStartedAt
          ? new Date(snapshot.proStartedAt as string)
          : null,
        proExpiresAt: snapshot.proExpiresAt
          ? new Date(snapshot.proExpiresAt as string)
          : null,
        shopCommissionRate: snapshot.shopCommissionRate
          ? Number(snapshot.shopCommissionRate)
          : 10.0,
      },
    })
  } else if (payment.purpose === 'STANDARD_CHARGE') {
    const sub = await prisma.brandSubscription.findUnique({
      where: { id: payment.subscriptionId },
    })
    if (!sub) return
    const newBalance = Math.max(0, Number(sub.prepaidBalance) - Number(payment.amount))
    await prisma.brandSubscription.update({
      where: { id: payment.subscriptionId },
      data: { prepaidBalance: newBalance },
    })
  }
}
