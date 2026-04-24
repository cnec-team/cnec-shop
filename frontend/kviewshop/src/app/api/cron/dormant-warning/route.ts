import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyCronSecret, logCronJob } from '@/lib/notifications/trigger-utils'

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const log = await logCronJob('dormant-warning')
  let processed = 0
  let failed = 0
  try {
    const warningDate = new Date()
    warningDate.setDate(warningDate.getDate() - 335)

    const users = await prisma.user.findMany({
      where: {
        lastLoginAt: { lt: warningDate },
        dormantWarnedAt: null,
        dormantAt: null,
      },
    })

    for (const user of users) {
      try {
        // TODO: Send dormantWarningMessage (#44) to user
        await prisma.user.update({
          where: { id: user.id },
          data: { dormantWarnedAt: new Date() },
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
