import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const isBrand = user.role === 'brand_admin'
  const isCreator = user.role === 'creator'
  if (!isBrand && !isCreator) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const conversation = await prisma.conversation.findUnique({ where: { id } })
  if (!conversation) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (isBrand && conversation.brandId !== participantId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (isCreator && conversation.creatorId !== participantId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const otherRole = isBrand ? 'CREATOR' : 'BRAND'

  await prisma.message.updateMany({
    where: { conversationId: id, senderRole: otherRole, readAt: null },
    data: { readAt: new Date() },
  })

  await prisma.conversation.update({
    where: { id },
    data: isBrand ? { brandUnreadCount: 0 } : { creatorUnreadCount: 0 },
  })

  return NextResponse.json({ success: true })
}
