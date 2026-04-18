import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import { sendEmail } from '@/lib/notifications/email'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const limited = await rateLimit(`forgot:${ip}`, 3, 60)
  if (limited) {
    return NextResponse.json({ error: 'too_many_requests' }, { status: 429 })
  }

  const { email } = await req.json()
  if (!email) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    include: { buyer: { select: { id: true } } },
  })

  // 이메일 존재 노출 방지 (항상 성공 응답)
  if (!user || !user.buyer) {
    return NextResponse.json({ success: true })
  }

  // 기존 미사용 토큰 무효화
  await prisma.passwordResetToken.updateMany({
    where: { buyerId: user.buyer.id, usedAt: null },
    data: { usedAt: new Date() },
  })

  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1시간

  await prisma.passwordResetToken.create({
    data: {
      token,
      buyerId: user.buyer.id,
      expiresAt,
    },
  })

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cnecshop.com'
  const resetUrl = `${baseUrl}/ko/buyer/reset-password?token=${token}`

  await sendEmail({
    to: email,
    subject: '[크넥샵] 비밀번호 재설정',
    html: `
      <div style="max-width:480px;margin:0 auto;font-family:sans-serif;">
        <h2 style="color:#1a1a1a;">비밀번호 재설정</h2>
        <p>안녕하세요 ${user.name}님,</p>
        <p>비밀번호 재설정 링크입니다 (1시간 유효):</p>
        <p style="margin:24px 0;">
          <a href="${resetUrl}" style="background:#1a1a1a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">
            비밀번호 재설정
          </a>
        </p>
        <p style="color:#888;font-size:14px;">요청하지 않았다면 무시해주세요.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
        <p style="color:#aaa;font-size:12px;">CNEC Shop</p>
      </div>
    `,
  })

  return NextResponse.json({ success: true })
}
