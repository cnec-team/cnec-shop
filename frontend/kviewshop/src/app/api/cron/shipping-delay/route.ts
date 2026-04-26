import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyCronSecret, logCronJob } from '@/lib/notifications/trigger-utils'
import { sendNotification } from '@/lib/notifications'
import { shippingDelayedMessage } from '@/lib/notifications/templates'

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const log = await logCronJob('shipping-delay')
  let processed = 0
  let failed = 0
  try {
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

    const delayedOrders = await prisma.order.findMany({
      where: {
        status: 'PAID',
        paidAt: { lt: threeDaysAgo },
        trackingNumber: null,
      },
      include: {
        buyer: { include: { user: true } },
        brand: true,
        items: { include: { product: true }, take: 1 },
      },
    })

    for (const order of delayedOrders) {
      try {
        try {
          const firstItem = order.items?.[0]
          const tmpl = shippingDelayedMessage({
            buyerName: order.buyerName ?? order.buyer?.user?.name ?? '고객',
            orderNumber: order.orderNumber ?? order.id,
            productName: firstItem?.product?.name ?? firstItem?.productName ?? '상품',
            recipientEmail: order.buyerEmail ?? order.buyer?.user?.email ?? undefined,
          })
          await sendNotification({
            userId: order.buyer?.userId ?? order.buyerId ?? undefined,
            ...tmpl.inApp,
            email: order.buyerEmail ?? order.buyer?.user?.email ?? undefined,
            emailTemplate: (order.buyerEmail ?? order.buyer?.user?.email) ? tmpl.email : undefined,
          })
        } catch { /* 알림 실패 무시 */ }
        processed++
      } catch {
        failed++
      }
    }

    await log.complete(processed, failed)
    return NextResponse.json({ success: true, processed, failed })
  } catch (e) {
    await log.fail(String(e))
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
