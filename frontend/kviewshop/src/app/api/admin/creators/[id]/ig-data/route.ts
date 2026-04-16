import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getAuthUser()
  if (!authUser || authUser.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const creator = await prisma.creator.findUnique({ where: { id }, select: { id: true } })
  if (!creator) {
    return NextResponse.json({ error: '크리에이터를 찾을 수 없습니다' }, { status: 404 })
  }

  await prisma.creator.update({
    where: { id },
    data: {
      igFollowers: null,
      igFollowing: null,
      igPostsCount: null,
      igBio: null,
      igCategory: null,
      igVerified: false,
      igExternalUrl: null,
      igIsBusinessAccount: false,
      igEngagementRate: null,
      igDataImportedAt: null,
      igProfileImageR2Url: null,
      igTier: null,
      igRecentPostThumbnails: undefined,
    },
  })

  return NextResponse.json({ success: true })
}
