import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyCronSecret, logCronJob } from '@/lib/notifications/trigger-utils'
import { sendNotification } from '@/lib/notifications'
import { cartReminderMessage } from '@/lib/notifications/templates'

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
        try {
          const topProduct = cart.items[0]?.product?.name ?? '상품'
          const totalAmount = cart.items.reduce((s: number, i: any) => s + Number(i.product?.salePrice ?? i.product?.price ?? 0) * i.quantity, 0)
          const tmpl = cartReminderMessage({
            buyerName: cart.buyer?.user?.name ?? '고객',
            itemCount: cart.items.length,
            topProductName: topProduct,
            totalAmount,
            recipientEmail: cart.buyer?.user?.email ?? undefined,
          })
          await sendNotification({
            userId: cart.buyer?.userId,
            ...tmpl.inApp,
            email: cart.buyer?.user?.email ?? undefined,
            emailTemplate: cart.buyer?.user?.email ? tmpl.email : undefined,
          })
        } catch { /* 알림 실패 무시 */ }
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
