import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-helpers'

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser()
  if (!authUser || authUser.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const cronSecret = process.env.CRON_SECRET || ''

    const res = await fetch(`${siteUrl}/api/cron/sync-creators`, {
      headers: {
        Authorization: `Bearer ${cronSecret}`,
      },
    })

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('[sync-now] Error:', error)
    return NextResponse.json({ error: 'Sync trigger failed' }, { status: 500 })
  }
}
