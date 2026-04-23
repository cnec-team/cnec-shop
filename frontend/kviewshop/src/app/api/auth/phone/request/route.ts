import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { getPhoneVerificationProvider } from '@/lib/phone-verification'

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const limited = await rateLimit(`phone-request:${ip}`, 5, 300) // 5분에 5회
    if (limited) {
      return NextResponse.json(
        { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
        { status: 429 },
      )
    }

    const { phoneNumber } = await req.json()
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return NextResponse.json({ error: '전화번호를 입력해주세요.' }, { status: 400 })
    }

    const cleaned = phoneNumber.replace(/-/g, '')
    if (!/^01[016789]\d{7,8}$/.test(cleaned)) {
      return NextResponse.json({ error: '유효한 휴대폰 번호를 입력해주세요.' }, { status: 400 })
    }

    const provider = getPhoneVerificationProvider()
    const result = await provider.requestCode(cleaned)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ requestId: result.requestId })
  } catch (error) {
    console.error('[PhoneVerification] Request error:', error)
    return NextResponse.json({ error: '인증번호 발송 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
