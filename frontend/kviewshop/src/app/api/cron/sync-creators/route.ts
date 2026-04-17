import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { fetchInstagramProfiles } from '@/lib/apify/client'
import { apifyToCreatorFields } from '@/lib/apify/transformer'

const BATCH_SIZE = 100

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const start = Date.now()

  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const creators = await prisma.creator.findMany({
      where: {
        instagramHandle: { not: null },
        OR: [
          { igLastSyncedAt: null },
          { igLastSyncedAt: { lt: thirtyDaysAgo } },
        ],
      },
      select: { id: true, instagramHandle: true },
      take: BATCH_SIZE,
      orderBy: { igLastSyncedAt: { sort: 'asc', nulls: 'first' } },
    })

    if (creators.length === 0) {
      return NextResponse.json({
        synced: 0,
        failed: 0,
        total: 0,
        duration: Date.now() - start,
        message: 'No creators to sync',
      })
    }

    // Mark as SYNCING
    const ids = creators.map(c => c.id)
    await prisma.creator.updateMany({
      where: { id: { in: ids } },
      data: { igSyncStatus: 'SYNCING' },
    })

    const usernames = creators
      .map(c => c.instagramHandle)
      .filter((h): h is string => h !== null)

    let synced = 0
    let failed = 0

    try {
      const profiles = await fetchInstagramProfiles(usernames)
      const profileMap = new Map(profiles.map(p => [p.username.toLowerCase(), p]))

      for (const creator of creators) {
        const handle = creator.instagramHandle?.toLowerCase()
        if (!handle) continue

        const profile = profileMap.get(handle)
        if (!profile) {
          await prisma.creator.update({
            where: { id: creator.id },
            data: { igSyncStatus: 'FAILED' },
          })
          failed++
          continue
        }

        try {
          const fields = apifyToCreatorFields(profile)
          await prisma.creator.update({
            where: { id: creator.id },
            data: fields,
          })
          synced++
        } catch (err) {
          console.error(`[sync-creators] Failed to update ${handle}:`, err)
          await prisma.creator.update({
            where: { id: creator.id },
            data: { igSyncStatus: 'FAILED' },
          })
          failed++
        }
      }
    } catch (err) {
      console.error('[sync-creators] Apify batch failed:', err)
      // Mark all as failed
      await prisma.creator.updateMany({
        where: { id: { in: ids } },
        data: { igSyncStatus: 'FAILED' },
      })
      failed = creators.length
    }

    return NextResponse.json({
      synced,
      failed,
      total: creators.length,
      duration: Date.now() - start,
    })
  } catch (error) {
    console.error('[sync-creators] Error:', error)
    return NextResponse.json(
      { error: 'Sync failed' },
      { status: 500 },
    )
  }
}
