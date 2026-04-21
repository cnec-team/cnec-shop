import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import { SignJWT } from 'jose'

const PORTONE_V2_API_SECRET = process.env.PORTONE_V2_API_SECRET || process.env.PORTONE_API_SECRET || ''
const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret')

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const limited = await rateLimit(`verify-identity:${ip}`, 5, 60)
    if (limited) {
      return NextResponse.json({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 })
    }

    const { identityVerificationId } = await req.json()
    if (!identityVerificationId) {
      return NextResponse.json({ error: '인증 ID가 필요합니다.' }, { status: 400 })
    }

    // PortOne REST API로 본인인증 결과 조회
    const portonRes = await fetch(
      `https://api.portone.io/identity-verifications/${encodeURIComponent(identityVerificationId)}`,
      {
        headers: {
          Authorization: `PortOne ${PORTONE_V2_API_SECRET}`,
        },
      },
    )

    if (!portonRes.ok) {
      const errBody = await portonRes.text()
      console.error('PortOne identity verification failed:', errBody)
      return NextResponse.json({ error: '본인인증 조회에 실패했습니다.' }, { status: 400 })
    }

    const portonData = await portonRes.json()
    const verified = portonData.verifiedCustomer
    if (!verified) {
      return NextResponse.json({ error: '본인인증이 완료되지 않았습니다.' }, { status: 400 })
    }

    const { ci, phoneNumber, name } = verified

    // CI 중복 체크
    if (ci) {
      const existingUser = await prisma.user.findUnique({ where: { ci } })
      if (existingUser) {
        return NextResponse.json({ error: '이미 가입된 사용자입니다.' }, { status: 409 })
      }
    }

    // 인증 토큰 생성 (5분 유효)
    const verificationToken = await new SignJWT({
      ci: ci || null,
      phone: phoneNumber,
      name,
      type: 'identity_verification',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('5m')
      .setIssuedAt()
      .sign(JWT_SECRET)

    return NextResponse.json({
      phoneNumber,
      ci: ci || null,
      verifiedAt: new Date().toISOString(),
      verificationToken,
    })
  } catch (error) {
    console.error('Identity verification error:', error)
    return NextResponse.json({ error: '본인인증 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
