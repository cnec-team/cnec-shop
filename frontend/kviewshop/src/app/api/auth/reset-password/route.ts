import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const limited = await rateLimit(`reset-pw:${ip}`, 5, 60)
  if (limited) {
    return NextResponse.json({ error: 'too_many_requests' }, { status: 429 })
  }

  const { token, password } = await req.json()

  if (!token || !password || typeof password !== 'string' || password.length < 8) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 })
  }

  // 영문 + 숫자 검증
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return NextResponse.json({ error: 'password_requirements' }, { status: 400 })
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { buyer: { include: { user: true } } },
  })

  if (!resetToken) {
    return NextResponse.json({ error: 'invalid_token' }, { status: 400 })
  }

  if (resetToken.usedAt) {
    return NextResponse.json({ error: 'token_used' }, { status: 400 })
  }

  if (resetToken.expiresAt < new Date()) {
    return NextResponse.json({ error: 'token_expired' }, { status: 400 })
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  // 비밀번호 업데이트 + 토큰 사용 처리 + 잠금 해제
  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.buyer.userId },
      data: { passwordHash: hashedPassword },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
    prisma.buyer.update({
      where: { id: resetToken.buyerId },
      data: { failedLoginCount: 0, lockedUntil: null },
    }),
  ])

  return NextResponse.json({ success: true })
}
