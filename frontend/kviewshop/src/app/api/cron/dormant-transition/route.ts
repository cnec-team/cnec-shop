import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyCronSecret, logCronJob } from '@/lib/notifications/trigger-utils'
import { sendNotification } from '@/lib/notifications'
import { dormantTransitionedMessage } from '@/lib/notifications/templates'

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
        try {
          const tmpl = dormantTransitionedMessage({
            userName: user.name ?? '회원',
            transitionedAt: new Date(),
            recipientEmail: user.email ?? undefined,
          })
          await sendNotification({
            userId: user.id,
            ...tmpl.inApp,
            email: user.email ?? undefined,
            emailTemplate: user.email ? tmpl.email : undefined,
          })
        } catch { /* 알림 실패 무시 */ }
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
