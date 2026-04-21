import { prisma } from '@/lib/db'
import { addMonths, addYears } from 'date-fns'

export async function applyBillingPaymentSuccess(paymentId: string): Promise<void> {
  const payment = await prisma.billingPayment.findUnique({
    where: { id: paymentId },
    include: { subscription: true },
  })
  if (!payment) throw new Error('결제 정보를 찾을 수 없어요')

  const existingSub =
    payment.subscription ??
    (await prisma.brandSubscription.findUnique({
      where: { brandId: payment.brandId },
    }))

  // 환불 대비 스냅샷 저장
  const priorSnapshot = existingSub
    ? {
        planV3: existingSub.planV3,
        proBillingCycle: existingSub.proBillingCycle,
        proStartedAt: existingSub.proStartedAt,
        proExpiresAt: existingSub.proExpiresAt,
        prepaidBalance: existingSub.prepaidBalance.toString(),
        shopCommissionRate: existingSub.shopCommissionRate.toString(),
      }
    : null

  await prisma.billingPayment.update({
    where: { id: paymentId },
    data: { priorPlanSnapshot: priorSnapshot as any },
  })

  if (payment.purpose === 'STANDARD_CHARGE') {
    if (existingSub) {
      await prisma.brandSubscription.update({
        where: { id: existingSub.id },
        data: {
          planV3: existingSub.planV3 ?? 'STANDARD',
          prepaidBalance: { increment: Number(payment.amount) },
        },
      })
    } else {
      await prisma.brandSubscription.create({
        data: {
          brandId: payment.brandId,
          plan: 'STANDARD',
          planV3: 'STANDARD',
          prepaidBalance: Number(payment.amount),
          startedAt: new Date(),
        },
      })
    }
    return
  }

  if (payment.purpose === 'PRO_SUBSCRIPTION') {
    const now = new Date()

    if (existingSub) {
      const baseDate =
        existingSub.proExpiresAt && existingSub.proExpiresAt > now
          ? existingSub.proExpiresAt
          : now
      const newExpires =
        payment.billingCycle === 'QUARTERLY'
          ? addMonths(baseDate, 3)
          : addYears(baseDate, 1)

      await prisma.brandSubscription.update({
        where: { id: existingSub.id },
        data: {
          planV3: 'PRO',
          proBillingCycle: payment.billingCycle,
          proStartedAt: existingSub.proStartedAt ?? now,
          proExpiresAt: newExpires,
          shopCommissionRate: 8.0,
        },
      })
    } else {
      const expires =
        payment.billingCycle === 'QUARTERLY' ? addMonths(now, 3) : addYears(now, 1)

      await prisma.brandSubscription.create({
        data: {
          brandId: payment.brandId,
          plan: 'PRO',
          planV3: 'PRO',
          proBillingCycle: payment.billingCycle,
          proStartedAt: now,
          proExpiresAt: expires,
          shopCommissionRate: 8.0,
          startedAt: now,
        },
      })
    }
  }
}
