import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyCronSecret, logCronJob } from '@/lib/notifications/trigger-utils'

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const log = await logCronJob('low-stock-check')
  let processed = 0
  let failed = 0
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const lowStockProducts = await prisma.product.findMany({
      where: {
        stock: { gt: 0, lte: 5 },
        isActive: true,
        OR: [
          { lastLowStockAlertAt: null },
          { lastLowStockAlertAt: { lt: twentyFourHoursAgo } },
        ],
      },
      include: {
        brand: { include: { user: true } },
      },
    })

    for (const product of lowStockProducts) {
      try {
        // TODO: Send lowStockAlertMessage (#54) to brand
        await prisma.product.update({
          where: { id: product.id },
          data: { lastLowStockAlertAt: new Date() },
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
