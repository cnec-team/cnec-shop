import { NextResponse } from 'next/server'
import { verifyCronSecret, logCronJob } from '@/lib/notifications/trigger-utils'

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const log = await logCronJob('monthly-report')
  let processed = 0
  let failed = 0
  try {
    // TODO: Implement generateCreatorMonthlyReport
    // Aggregate last month's sales, commission, top products for each creator
    // Send monthly report email

    await log.complete(processed, failed)
    return NextResponse.json({ success: true, processed, failed })
  } catch (e) {
    await log.fail(String(e))
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
