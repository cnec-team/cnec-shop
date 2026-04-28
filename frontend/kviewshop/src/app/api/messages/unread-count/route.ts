import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'

export async function GET() {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isBrand = user.role === 'brand_admin'
  const isCreator = user.role === 'creator'
  if (!isBrand && !isCreator) {
    return NextResponse.json({ unreadCount: 0 })
  }

  let participantId: string | null = null
  if (isBrand) {
    const brand = await prisma.brand.findFirst({ where: { userId: user.id }, select: { id: true } })
    participantId = brand?.id ?? null
  } else {
    const creator = await prisma.creator.findFirst({ where: { userId: user.id }, select: { id: true } })
    participantId = creator?.id ?? null
  }
  if (!participantId) {
    return NextResponse.json({ unreadCount: 0 })
  }

  const result = await prisma.conversation.aggregate({
    where: isBrand
      ? { brandId: participantId, status: 'ACTIVE' }
      : { creatorId: participantId, status: 'ACTIVE' },
    _sum: { brandUnreadCount: true, creatorUnreadCount: true },
  })

  const unreadCount = isBrand
    ? result._sum.brandUnreadCount ?? 0
    : result._sum.creatorUnreadCount ?? 0

  return NextResponse.json({ unreadCount })
}
