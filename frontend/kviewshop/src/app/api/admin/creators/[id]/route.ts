import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'

export async function PATCH(
  request: NextRequest,
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

  const body = await request.json()
  const allowedFields = [
    'igFollowers', 'igFollowing', 'igPostsCount', 'igBio', 'igCategory',
    'igVerified', 'igExternalUrl', 'igIsBusinessAccount', 'igEngagementRate', 'igTier',
  ] as const

  const data: Record<string, unknown> = {}
  for (const field of allowedFields) {
    if (field in body) {
      data[field] = body[field]
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: '수정할 데이터가 없습니다' }, { status: 400 })
  }

  // Decimal 변환
  if (data.igEngagementRate !== undefined && data.igEngagementRate !== null) {
    data.igEngagementRate = Number(data.igEngagementRate)
  }

  const updated = await prisma.creator.update({ where: { id }, data })

  return NextResponse.json({
    ...updated,
    igEngagementRate: updated.igEngagementRate ? Number(updated.igEngagementRate) : null,
    totalSales: Number(updated.totalSales),
    totalEarnings: Number(updated.totalEarnings),
    totalRevenue: Number(updated.totalRevenue),
  })
}
