import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyCronSecret, logCronJob } from '@/lib/notifications/trigger-utils'

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const log = await logCronJob('cart-reminder')
  let processed = 0
  let failed = 0
  try {
    const now = new Date()
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000)

    const carts = await prisma.cart.findMany({
      where: {
        updatedAt: {
          gte: fortyEightHoursAgo,
          lte: twentyFourHoursAgo,
        },
        reminderSentAt: null,
        buyer: {
          user: {
            marketingAgreedAt: { not: null },
          },
        },
      },
      include: {
        buyer: { include: { user: true } },
        items: { include: { product: true } },
      },
    })

    for (const cart of carts) {
      try {
        // TODO: Send cartReminderMessage (#46) to user
        await prisma.cart.update({
          where: { id: cart.id },
          data: { reminderSentAt: new Date() },
        })
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
