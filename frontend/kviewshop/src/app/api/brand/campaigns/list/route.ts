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
    select: { id: true, title: true, type: true, status: true, startAt: true, endAt: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ campaigns })
}
