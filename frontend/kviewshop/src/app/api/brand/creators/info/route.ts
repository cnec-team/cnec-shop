import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser()
  if (!authUser || authUser.role !== 'brand_admin') {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 401 })
  }

  const body = await request.json()
  const { creatorIds } = body as { creatorIds: string[] }

  if (!creatorIds || creatorIds.length === 0) {
    return NextResponse.json({ creators: [] })
  }

  const creators = await prisma.creator.findMany({
    where: { id: { in: creatorIds.slice(0, 50) } },
    select: {
      id: true,
      displayName: true,
      igUsername: true,
      cnecJoinStatus: true,
      hasBrandEmail: true,
      brandContactEmail: true,
      hasPhone: true,
      cnecVerificationStatus: true,
    },
  })

  return NextResponse.json({
    creators: creators.map(c => ({
      id: c.id,
      displayName: c.displayName,
      igUsername: c.igUsername,
      cnecJoinStatus: c.cnecJoinStatus ?? 'NOT_JOINED',
      hasBrandEmail: c.hasBrandEmail ?? false,
      brandContactEmail: c.brandContactEmail,
      hasPhone: c.hasPhone ?? false,
      cnecVerificationStatus: c.cnecVerificationStatus ?? null,
    })),
  })
}
