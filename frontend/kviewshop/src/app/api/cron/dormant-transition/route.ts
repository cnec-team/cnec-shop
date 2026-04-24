import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyCronSecret, logCronJob } from '@/lib/notifications/trigger-utils'

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const log = await logCronJob('dormant-transition')
  let processed = 0
  let failed = 0
  try {
    const dormantDate = new Date()
    dormantDate.setDate(dormantDate.getDate() - 365)

    const users = await prisma.user.findMany({
      where: {
        lastLoginAt: { lt: dormantDate },
        dormantAt: null,
      },
    })

    for (const user of users) {
      try {
        // TODO: Send dormantTransitionedMessage (#45) to user
        await prisma.user.update({
          where: { id: user.id },
          data: { dormantAt: new Date() },
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
