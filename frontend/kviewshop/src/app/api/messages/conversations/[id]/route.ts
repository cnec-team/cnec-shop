import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const sp = request.nextUrl.searchParams
  const page = Math.max(1, parseInt(sp.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(sp.get('limit') || '50', 10)))

  const isBrand = user.role === 'brand_admin'
  const isCreator = user.role === 'creator'
  if (!isBrand && !isCreator) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 참가자 ID 조회
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

  // 대화 조회 + 권한 확인
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      brand: { select: { id: true, brandName: true, logoUrl: true } },
      creator: {
        select: {
          id: true, displayName: true, igUsername: true,
          igProfileImageR2Url: true, profileImageUrl: true,
        },
      },
    },
  })

  if (!conversation) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // 권한: 이 대화의 참가자인지 확인
  if (isBrand && conversation.brandId !== participantId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (isCreator && conversation.creatorId !== participantId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 메시지 조회 (최신순 → 역순으로 반환)
  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.message.count({ where: { conversationId: id } }),
  ])

  // 읽음 처리: 상대방이 보낸 메시지 중 안 읽은 것
  const otherRole = isBrand ? 'CREATOR' : 'BRAND'
  await prisma.message.updateMany({
    where: {
      conversationId: id,
      senderRole: otherRole,
      readAt: null,
    },
    data: { readAt: new Date() },
  })

  // unread 카운터 리셋
  if (isBrand) {
    await prisma.conversation.update({
      where: { id },
      data: { brandUnreadCount: 0 },
    })
  } else {
    await prisma.conversation.update({
      where: { id },
      data: { creatorUnreadCount: 0 },
    })
  }

  const partner = isBrand
    ? {
        id: conversation.creator.id,
        name: conversation.creator.displayName || conversation.creator.igUsername || '',
        avatarUrl: conversation.creator.igProfileImageR2Url || conversation.creator.profileImageUrl || null,
      }
    : {
        id: conversation.brand.id,
        name: conversation.brand.brandName || '',
        avatarUrl: conversation.brand.logoUrl || null,
      }

  return NextResponse.json({
    conversation: {
      id: conversation.id,
      partner,
      status: conversation.status,
    },
    messages: messages.reverse().map(m => ({
      id: m.id,
      senderRole: m.senderRole,
      type: m.type,
      content: m.content,
      proposalId: m.proposalId,
      readAt: m.readAt,
      createdAt: m.createdAt,
      attachments: m.attachments,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  })
}
