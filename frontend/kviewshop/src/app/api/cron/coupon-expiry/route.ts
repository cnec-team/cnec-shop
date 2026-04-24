import { NextResponse } from 'next/server'
import { verifyCronSecret, logCronJob } from '@/lib/notifications/trigger-utils'

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const log = await logCronJob('coupon-expiry')
  let processed = 0
  let failed = 0
  try {
    // TODO: Implement coupon expiry notification when coupon model is available
    // Query coupons expiring within 3 days, send couponExpiringMessage

    await log.complete(processed, failed)
    return NextResponse.json({ success: true, processed, failed })
  } catch (e) {
    await log.fail(String(e))
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
