import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createHash } from 'crypto'
import { SignJWT } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret')

function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex')
}

export async function POST(req: NextRequest) {
  try {
    const { requestId, code } = await req.json()
    if (!requestId || !code) {
      return NextResponse.json({ error: '인증번호를 입력해주세요.' }, { status: 400 })
    }

    // DB에서 요청 조회
    const record = await prisma.phoneVerificationRequest.findUnique({
      where: { id: requestId },
    })

    if (!record) {
      return NextResponse.json(
        { error: '인증 요청을 찾을 수 없습니다. 다시 요청해주세요.' },
        { status: 400 },
      )
    }

    if (record.verifiedAt) {
      return NextResponse.json(
        { error: '이미 인증된 요청입니다.' },
        { status: 400 },
      )
    }

    if (new Date() > record.expiresAt) {
      return NextResponse.json(
        { error: '인증번호가 만료되었습니다. 다시 요청해주세요.' },
        { status: 400 },
      )
    }

    if (record.attempts >= record.maxAttempts) {
      return NextResponse.json(
        { error: '인증 시도 횟수를 초과했습니다. 다시 요청해주세요.' },
        { status: 400 },
      )
    }

    // attempts 증가 (코드 확인 전에 DB update)
    await prisma.phoneVerificationRequest.update({
      where: { id: requestId },
      data: { attempts: { increment: 1 } },
    })

    // 코드 검증
    if (record.codeHash !== hashCode(code)) {
      return NextResponse.json(
        { error: '인증번호가 일치하지 않습니다.' },
        { status: 400 },
      )
    }

    // 인증 성공 → verifiedAt 기록
    await prisma.phoneVerificationRequest.update({
      where: { id: requestId },
      data: { verifiedAt: new Date() },
    })

    // JWT 토큰 발급 (가입 시 검증용, 5분 유효)
    const verificationToken = await new SignJWT({
      phone: record.phoneNumber,
      type: 'phone_verification',
      requestId: record.id,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('5m')
      .setIssuedAt()
      .sign(JWT_SECRET)

    return NextResponse.json({
      verified: true,
      verificationToken,
    })
  } catch (error) {
    console.error('[PhoneVerification] Verify error:', error)
    return NextResponse.json({ error: '인증 확인 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
