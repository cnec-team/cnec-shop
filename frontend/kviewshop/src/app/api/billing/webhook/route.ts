import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyTossBillingWebhook } from '@/lib/toss/billing-webhook-verify'

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('toss-signature')

    if (!verifyTossBillingWebhook(rawBody, signature)) {
      console.warn('[billing/webhook] 서명 검증 실패')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const body = JSON.parse(rawBody)
    const { eventType, data } = body

    const orderId = data?.orderId
    if (!orderId) return NextResponse.json({ error: 'orderId 없음' }, { status: 400 })

    // orderId 접두사로 내 주문인지 확인
    if (!orderId.startsWith('PRO_SUB_') && !orderId.startsWith('STD_CHG_')) {
      return NextResponse.json({ received: true, note: 'not my order' })
    }

    const payment = await prisma.billingPayment.findUnique({ where: { orderId } })
    if (!payment) return NextResponse.json({ received: true, note: 'payment not found' })

    if (eventType === 'PAYMENT_STATUS_CHANGED' && data.status === 'DONE') {
      if (payment.status === 'CONFIRMED') {
        await prisma.billingPayment.update({
          where: { id: payment.id },
          data: {
            status: 'WEBHOOK_CONFIRMED',
            webhookReceivedAt: new Date(),
            rawWebhook: body,
          },
        })
      }
    }

    if (
      eventType === 'CANCEL_STATUS_CHANGED' ||
      (eventType === 'PAYMENT_STATUS_CHANGED' && data.status === 'CANCELED')
    ) {
      const cancelAmount = Number(data.cancels?.[0]?.cancelAmount ?? data.totalAmount)
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
