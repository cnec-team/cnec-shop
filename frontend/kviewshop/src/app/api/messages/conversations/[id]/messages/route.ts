import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const { content } = body as { content: string }

  if (!content?.trim()) {
    return NextResponse.json({ error: '메시지를 입력해주세요' }, { status: 400 })
  }

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

  // 대화 조회 + 권한
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

  const senderRole = isBrand ? 'BRAND' : 'CREATOR'
  const now = new Date()
  const preview = content.trim().substring(0, 200)

  // 트랜잭션: 메시지 생성 + 대화 업데이트
  const message = await prisma.$transaction(async (tx) => {
    const msg = await tx.message.create({
      data: {
        conversationId: id,
        senderRole,
        senderUserId: user.id,
        type: 'TEXT',
        content: content.trim(),
      },
    })

    // 상대방 unread 카운터 증가
    const updateData: Record<string, unknown> = {
      lastMessageAt: now,
      lastMessageText: preview,
    }
    if (isBrand) {
      updateData.creatorUnreadCount = { increment: 1 }
    } else {
      updateData.brandUnreadCount = { increment: 1 }
    }

    await tx.conversation.update({
      where: { id },
      data: updateData as any,
    })

    return msg
  })

  // 알림 생성 (비동기 — 메시지 저장 후)
  try {
    if (isBrand) {
      // 브랜드 → 크리에이터: 인앱 알림
      const brand = await prisma.brand.findFirst({
        where: { userId: user.id },
        select: { brandName: true },
      })
      const creator = await prisma.creator.findUnique({
        where: { id: conversation.creatorId },
        select: { userId: true },
      })
      if (creator?.userId) {
        await prisma.notification.create({
          data: {
            userId: creator.userId,
            type: 'CAMPAIGN',
            title: `${brand?.brandName || '브랜드'}님의 새 메시지`,
            message: preview,
            linkUrl: `/creator/messages?c=${id}`,
          },
        })
      }
    } else {
      // 크리에이터 → 브랜드: 인앱 알림
      const creator = await prisma.creator.findFirst({
        where: { userId: user.id },
        select: { displayName: true, igUsername: true },
      })
      const brand = await prisma.brand.findUnique({
        where: { id: conversation.brandId },
        select: { userId: true },
      })
      if (brand?.userId) {
        const creatorLabel = creator?.displayName || creator?.igUsername || '크리에이터'
        await prisma.notification.create({
          data: {
            userId: brand.userId,
            type: 'CAMPAIGN',
            title: `${creatorLabel}님의 새 메시지`,
            message: preview,
            linkUrl: `/brand/messages?c=${id}`,
          },
        })
      }
    }
  } catch (err) {
    console.error('[messages] notification error:', err)
  }

  return NextResponse.json({
    message: {
      id: message.id,
      senderRole: message.senderRole,
      type: message.type,
      content: message.content,
      readAt: message.readAt,
      createdAt: message.createdAt,
    },
  })
}
