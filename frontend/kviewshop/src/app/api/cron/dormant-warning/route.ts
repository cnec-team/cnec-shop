import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyCronSecret, logCronJob } from '@/lib/notifications/trigger-utils'
import { sendNotification } from '@/lib/notifications'
import { dormantWarningMessage } from '@/lib/notifications/templates'

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
        try {
          const dormantDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('ko-KR')
          const tmpl = dormantWarningMessage({
            userName: user.name ?? '회원',
            dormantDate,
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
