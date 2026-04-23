import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getPhoneVerificationProvider } from '@/lib/phone-verification'
import { createHash, randomBytes } from 'crypto'

const CODE_LENGTH = 6
const CODE_TTL_MS = 3 * 60 * 1000 // 3분
const COOLDOWN_MS = 60 * 1000 // 1분 재요청 차단
const DAILY_LIMIT = 10

function generateCode(): string {
  const bytes = randomBytes(4)
  const num = bytes.readUInt32BE(0) % Math.pow(10, CODE_LENGTH)
  return num.toString().padStart(CODE_LENGTH, '0')
}

function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex')
}

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber } = await req.json()
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return NextResponse.json({ error: '전화번호를 입력해주세요.' }, { status: 400 })
    }

    const cleaned = phoneNumber.replace(/-/g, '')
    if (!/^01[016789]\d{7,8}$/.test(cleaned)) {
      return NextResponse.json({ error: '유효한 휴대폰 번호를 입력해주세요.' }, { status: 400 })
    }

    // 1분 내 재요청 차단
    const recentRequest = await prisma.phoneVerificationRequest.findFirst({
      where: {
        phoneNumber: cleaned,
        createdAt: { gt: new Date(Date.now() - COOLDOWN_MS) },
      },
      orderBy: { createdAt: 'desc' },
    })
    if (recentRequest) {
      return NextResponse.json(
        { error: '잠시 후 다시 요청해주세요. (1분 제한)' },
        { status: 429 },
      )
    }

    // 하루 10회 제한
    const dailyCount = await prisma.phoneVerificationRequest.count({
      where: {
        phoneNumber: cleaned,
        createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    })
    if (dailyCount >= DAILY_LIMIT) {
      return NextResponse.json(
        { error: '일일 인증 요청 횟수를 초과했습니다. 내일 다시 시도해주세요.' },
        { status: 429 },
      )
    }

    const code = generateCode()
    const provider = getPhoneVerificationProvider()
    const sendResult = await provider.sendSms(cleaned, code)

    if (!sendResult.success) {
      return NextResponse.json({ error: sendResult.error }, { status: 500 })
    }

    // DB에 인증 요청 저장 (코드는 sha256 해싱)
    const record = await prisma.phoneVerificationRequest.create({
      data: {
        phoneNumber: cleaned,
        codeHash: hashCode(code),
        provider: process.env.PHONE_VERIFICATION_PROVIDER ?? 'popbill',
        expiresAt: new Date(Date.now() + CODE_TTL_MS),
      },
    })

    return NextResponse.json({ requestId: record.id })
  } catch (error) {
    console.error('[PhoneVerification] Request error:', error)
    return NextResponse.json({ error: '인증번호 발송 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
