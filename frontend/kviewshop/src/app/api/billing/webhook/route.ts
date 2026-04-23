import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getPayment } from '@/lib/toss/billing-client'

/**
 * 토스페이먼츠 웹훅 수신
 * 검증: paymentKey 재조회 방식 (토스는 웹훅 시크릿 미발급)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })

    const { eventType, data } = body
    console.log('[billing/webhook]', { eventType, orderId: data?.orderId })

    const orderId = data?.orderId
    const paymentKey = data?.paymentKey
    if (!orderId || !paymentKey) {
      return NextResponse.json({ error: 'MISSING_IDENTIFIERS' }, { status: 400 })
    }

    if (
      !orderId.startsWith('PRO_SUB_') &&
      !orderId.startsWith('STD_SUB_') &&
      !orderId.startsWith('STD_CHG_')
    ) {
      return NextResponse.json({ received: true, note: 'not my order' })
    }

    const payment = await prisma.billingPayment.findUnique({ where: { orderId } })
    if (!payment) return NextResponse.json({ received: true, note: 'payment not found' })

    if (payment.paymentKey && payment.paymentKey !== paymentKey) {
      console.warn('[billing/webhook] paymentKey mismatch')
      return NextResponse.json({ error: 'PAYMENT_KEY_MISMATCH' }, { status: 400 })
    }

    // 토스 API 재조회로 진위 검증
    let tossResult
    try {
      tossResult = await getPayment(paymentKey)
    } catch (err) {
      console.error('[billing/webhook] verify failed', err)
      return NextResponse.json({ error: 'VERIFY_FAILED' }, { status: 500 })
    }

    if (tossResult.orderId !== orderId || tossResult.totalAmount !== Number(payment.amount)) {
      console.warn('[billing/webhook] re-query mismatch')
      return NextResponse.json({ error: 'VERIFICATION_MISMATCH' }, { status: 400 })
    }

    if (eventType === 'PAYMENT_STATUS_CHANGED') {
      if (tossResult.status === 'DONE' && payment.status === 'CONFIRMED') {
        await prisma.billingPayment.update({
          where: { id: payment.id },
          data: {
            status: 'WEBHOOK_CONFIRMED',
            webhookReceivedAt: new Date(),
            paymentKey: payment.paymentKey ?? paymentKey,
            rawWebhook: body,
          },
        })
      } else if (tossResult.status === 'ABORTED' || tossResult.status === 'EXPIRED') {
        await prisma.billingPayment.update({
          where: { id: payment.id },
          data: { status: 'FAILED', rawWebhook: body },
        })
      }
    }

    if (
      eventType === 'CANCEL_STATUS_CHANGED' ||
      (eventType === 'PAYMENT_STATUS_CHANGED' &&
        (tossResult.status === 'CANCELED' || tossResult.status === 'PARTIAL_CANCELED'))
    ) {
      const cancelAmount = Number(tossResult.cancels?.[0]?.cancelAmount ?? tossResult.totalAmount)
      const isPartial = cancelAmount < Number(payment.amount)
      await prisma.billingPayment.update({
        where: { id: payment.id },
        data: {
          status: isPartial ? 'PARTIALLY_REFUNDED' : 'REFUNDED',
          refundedAt: new Date(),
          refundedAmount: cancelAmount,
          rawWebhook: body,
        },
      })
    }

    return NextResponse.json({ received: true })
  } catch (error: unknown) {
    console.error('[billing/webhook]', error)
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 })
  }
}
