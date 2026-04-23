import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { getPhoneVerificationProvider } from '@/lib/phone-verification'
import { SignJWT } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret')

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const limited = await rateLimit(`phone-verify:${ip}`, 10, 300) // 5분에 10회
    if (limited) {
      return NextResponse.json(
        { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
        { status: 429 },
      )
    }

    const { requestId, code, phoneNumber } = await req.json()
    if (!requestId || !code) {
      return NextResponse.json({ error: '인증번호를 입력해주세요.' }, { status: 400 })
    }

    const provider = getPhoneVerificationProvider()
    const result = await provider.verifyCode(requestId, code)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // 인증 성공 시 JWT 토큰 발급 (가입 시 검증용, 5분 유효)
    const verificationToken = await new SignJWT({
      phone: phoneNumber?.replace(/-/g, '') || '',
      type: 'phone_verification',
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
