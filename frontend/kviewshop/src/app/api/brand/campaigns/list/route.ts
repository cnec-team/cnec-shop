import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'

export async function GET() {
  const authUser = await getAuthUser()
  if (!authUser || authUser.role !== 'brand_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const brand = await prisma.brand.findFirst({
    where: { userId: authUser.id },
    select: { id: true },
  })
  if (!brand) {
    return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
  }

  const campaigns = await prisma.campaign.findMany({
    where: {
      brandId: brand.id,
      status: { in: ['RECRUITING', 'ACTIVE'] },
    },
    select: { id: true, title: true, type: true, status: true, startAt: true, endAt: true, commissionRate: true },
    orderBy: { createdAt: 'desc' },
  })

  // commissionRate: DB는 비율(0.25=25%) → 프론트에서 퍼센트로 표시하도록 변환
  const serialized = campaigns.map(c => ({
    ...c,
    commissionRate: c.commissionRate ? Number(c.commissionRate) * 100 : null,
  }))

  return NextResponse.json({ campaigns: serialized })
}
