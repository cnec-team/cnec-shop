import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'
import { sendEmail } from '@/lib/notifications'

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
      // 브랜드 → 크리에이터: 인앱 알림 + 이메일 알림 (단방향)
      const brand = await prisma.brand.findFirst({
        where: { userId: user.id },
        select: { brandName: true },
      })
      const creator = await prisma.creator.findUnique({
        where: { id: conversation.creatorId },
        select: { userId: true, brandContactEmail: true, cnecEmail1: true, cnecEmail2: true, cnecEmail3: true },
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

        // 이메일 단방향 알림 (답장 불가, CTA 버튼만)
        const recipientEmail = creator.brandContactEmail || creator.cnecEmail1 || creator.cnecEmail2 || creator.cnecEmail3
        if (recipientEmail) {
          const brandName = brand?.brandName || '브랜드'
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cnecshop.com'
          const replyLink = `${siteUrl}/creator/messages?c=${id}`
          sendEmail({
            to: recipientEmail,
            subject: `[크넥] ${brandName}님의 새 메시지`,
            html: `
              <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
                <div style="background:#1c1917;color:white;padding:20px;border-radius:12px 12px 0 0;">
                  <h2 style="margin:0;font-size:16px;">${brandName}님의 새 메시지</h2>
                </div>
                <div style="padding:24px;border:1px solid #e7e5e4;border-top:none;border-radius:0 0 12px 12px;">
                  <div style="white-space:pre-line;font-size:14px;color:#292524;line-height:1.7;">${preview}</div>
                  <hr style="border:none;border-top:1px solid #e7e5e4;margin:24px 0;" />
                  <div style="text-align:center;margin:24px 0;">
                    <a href="${replyLink}" style="display:inline-block;background:#1c1917;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">크넥샵에서 답장하기</a>
                  </div>
                  <p style="font-size:11px;color:#a8a29e;text-align:center;">이 메일에는 답장할 수 없습니다. 위 버튼을 눌러 크넥샵에서 답장해주세요.</p>
                </div>
              </div>`,
          }).catch(err => console.error('[messages] email notification error:', err))
        }
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
