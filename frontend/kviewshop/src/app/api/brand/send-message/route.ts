import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'
import { sendEmail } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser || authUser.role !== 'brand_admin') {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 401 })
    }

    const brand = await prisma.brand.findFirst({
      where: { userId: authUser.id },
      select: {
        id: true,
        brandName: true,
        brandInstagramHandle: true,
        brandInstagramHandleStatus: true,
      },
    })
    if (!brand) {
      return NextResponse.json({ error: '브랜드를 찾을 수 없습니다' }, { status: 404 })
    }

    const body = await request.json()
    const { creatorId, channel, to, subject, body: messageBody, igUsername } = body as {
      creatorId: string
      channel: 'email' | 'dm'
      to?: string
      subject?: string
      body: string
      igUsername?: string
    }

    if (!messageBody?.trim()) {
      return NextResponse.json({ error: '메시지를 입력해주세요' }, { status: 400 })
    }

    const creator = await prisma.creator.findUnique({
      where: { id: creatorId },
      select: { id: true, displayName: true, igUsername: true, brandContactEmail: true, cnecEmail1: true, cnecEmail2: true, cnecEmail3: true },
    })
    if (!creator) {
      return NextResponse.json({ error: '크리에이터를 찾을 수 없습니다' }, { status: 404 })
    }

    if (channel === 'email') {
      // 서버에서 직접 이메일 조회 (클라이언트에 이메일 노출하지 않음)
      const recipientEmail = creator.brandContactEmail || creator.cnecEmail1 || creator.cnecEmail2 || creator.cnecEmail3
      if (!recipientEmail) {
        return NextResponse.json({ error: '이메일 주소가 없습니다' }, { status: 400 })
      }

      const brandNameStr = brand.brandName ?? '크넥 브랜드'
      const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1c1917; color: white; padding: 20px; border-radius: 12px 12px 0 0;">
            <h2 style="margin: 0; font-size: 16px;">${brandNameStr}에서 보낸 메시지</h2>
          </div>
          <div style="padding: 24px; border: 1px solid #e7e5e4; border-top: none; border-radius: 0 0 12px 12px;">
            <div style="white-space: pre-line; font-size: 14px; color: #292524; line-height: 1.7;">${messageBody}</div>
            <hr style="border: none; border-top: 1px solid #e7e5e4; margin: 24px 0;" />
            <p style="font-size: 12px; color: #78716c;">
              이 메시지는 크넥샵(cnecshop.com)을 통해 발송되었습니다.
            </p>
          </div>
        </div>
      `

      try {
        const result = await sendEmail({
          to: recipientEmail,
          subject: subject || `[크넥] ${brandNameStr} 협업 제안`,
          html,
        })
        if (!result.success) {
          return NextResponse.json({ error: '이메일 발송에 실패했습니다' }, { status: 500 })
        }
      } catch (err) {
        console.error('[send-message] email error:', err)
        return NextResponse.json({ error: '이메일 발송 중 오류가 발생했습니다' }, { status: 500 })
      }

      return NextResponse.json({ success: true, channel: 'email' })
    }

    if (channel === 'dm') {
      const targetIg = igUsername || creator.igUsername
      if (!targetIg) {
        return NextResponse.json({ error: '인스타 아이디가 없습니다' }, { status: 400 })
      }

      // DM은 proposalId가 필수이므로, 간단한 제안 레코드를 먼저 생성
      const proposal = await prisma.creatorProposal.create({
        data: {
          brandId: brand.id,
          creatorId,
          type: 'PRODUCT_PICK',
          message: messageBody.trim(),
          status: 'PENDING',
          useInstagramDm: true,
          dmStatus: 'PENDING',
          dmQueuedAt: new Date(),
          inAppStatus: 'SKIPPED',
          emailStatus: 'SKIPPED',
          kakaoStatus: 'SKIPPED',
        },
      })

      // DM 큐에 추가
      await prisma.dmSendQueue.create({
        data: {
          brandId: brand.id,
          creatorId,
          proposalId: proposal.id,
          instagramUsername: targetIg,
          messageBody: messageBody.trim(),
          status: 'PENDING',
          brandInstagramAccount: brand.brandInstagramHandle,
        },
      })

      return NextResponse.json({ success: true, channel: 'dm', igUsername: targetIg })
    }

    return NextResponse.json({ error: '지원하지 않는 채널입니다' }, { status: 400 })
  } catch (error) {
    console.error('[send-message] error:', error)
    return NextResponse.json({ error: '메시지 발송 중 오류가 발생했습니다' }, { status: 500 })
  }
}
