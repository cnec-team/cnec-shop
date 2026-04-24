import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyCronSecret, logCronJob } from '@/lib/notifications/trigger-utils'

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
      },
    })

    for (const order of delayedOrders) {
      try {
        // TODO: Send shippingDelayedMessage (#32) to brand
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
