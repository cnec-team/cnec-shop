import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendEmail } from '@/lib/notifications'

/**
 * 미답장 리마인더 Cron
 * - 24시간 미답장 → 이메일 리마인더
 * - 48시간 미답장 → 이메일 리마인더 (2차)
 *
 * Vercel Cron 또는 외부 스케줄러에서 호출
 * Authorization: Bearer {CRON_SECRET}
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const h24ago = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const h48ago = new Date(now.getTime() - 48 * 60 * 60 * 1000)
  const h72ago = new Date(now.getTime() - 72 * 60 * 60 * 1000) // 72시간 이후는 스킵

  // 크리에이터가 안 읽은 대화 (24~72시간)
  const unrepliedConversations = await prisma.conversation.findMany({
    where: {
      creatorUnreadCount: { gt: 0 },
      lastMessageAt: { gte: h72ago, lte: h24ago },
      status: 'ACTIVE',
    },
    include: {
      brand: { select: { brandName: true } },
      creator: {
        select: {
          userId: true,
          displayName: true,
          brandContactEmail: true,
          cnecEmail1: true,
          cnecEmail2: true,
          cnecEmail3: true,
        },
      },
    },
  })

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cnecshop.com'
  let sent24h = 0
  let sent48h = 0

  for (const conv of unrepliedConversations) {
    const recipientEmail = conv.creator.brandContactEmail || conv.creator.cnecEmail1 || conv.creator.cnecEmail2 || conv.creator.cnecEmail3
    if (!recipientEmail) continue

    const brandName = conv.brand.brandName || '브랜드'
    const replyLink = `${siteUrl}/creator/messages?c=${conv.id}`
    const is48h = conv.lastMessageAt && conv.lastMessageAt <= h48ago

    // 24시간 리마인더 or 48시간 리마인더
    const subject = is48h
      ? `[크넥] ${brandName}님의 메시지가 아직 답장을 기다리고 있어요`
      : `[크넥] ${brandName}님의 메시지를 확인해주세요`

    const urgencyNote = is48h
      ? '빠른 응답은 브랜드와의 신뢰를 높이고, 더 많은 협업 기회로 이어집니다.'
      : '브랜드에서 보낸 메시지가 아직 확인되지 않았어요.'

    try {
      await sendEmail({
        to: recipientEmail,
        subject,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
            <div style="background:#1c1917;color:white;padding:20px;border-radius:12px 12px 0 0;">
              <h2 style="margin:0;font-size:16px;">아직 확인하지 않은 메시지가 있어요</h2>
            </div>
            <div style="padding:24px;border:1px solid #e7e5e4;border-top:none;border-radius:0 0 12px 12px;">
              <p style="font-size:14px;color:#292524;line-height:1.7;margin:0 0 16px;">
                ${brandName}님이 보낸 메시지(${conv.creatorUnreadCount}건)가 답장을 기다리고 있어요.
              </p>
              <p style="font-size:13px;color:#78716c;line-height:1.6;margin:0 0 24px;">
                ${urgencyNote}
              </p>
              <div style="text-align:center;margin:24px 0;">
                <a href="${replyLink}" style="display:inline-block;background:#1c1917;color:white;padding:14px 36px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">크넥샵에서 확인하기</a>
              </div>
              <p style="font-size:11px;color:#a8a29e;text-align:center;">
                이 메일에는 답장할 수 없습니다. 위 버튼을 눌러 크넥샵에서 확인해주세요.
              </p>
            </div>
          </div>`,
      })

      if (is48h) sent48h++
      else sent24h++
    } catch (err) {
      console.error(`[message-reminders] email error for conv ${conv.id}:`, err)
    }
  }

  return NextResponse.json({
    processed: unrepliedConversations.length,
    sent24h,
    sent48h,
    timestamp: now.toISOString(),
  })
}
