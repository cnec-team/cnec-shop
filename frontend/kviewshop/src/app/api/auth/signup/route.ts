import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/[a-zA-Z]/).regex(/[0-9]/),
  name: z.string().min(2),
  phone: z.string().optional(),
  agreeAge: z.literal(true),
  agreeTerms: z.literal(true),
  agreePrivacy: z.literal(true),
  agreeElectronic: z.literal(true),
  marketingOptIn: z.boolean(),
})

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const limited = await rateLimit(`signup:${ip}`, 3, 60)
  if (limited) {
    return NextResponse.json({ error: 'too_many_requests' }, { status: 429 })
  }

  const body = await req.json()
  const parsed = signupSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_input', details: parsed.error.issues },
      { status: 400 }
    )
  }

  const email = parsed.data.email.trim().toLowerCase()

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'email_exists' }, { status: 400 })
  }

  const hashedPassword = await bcrypt.hash(parsed.data.password, 12)
  const cookieStore = await cookies()
  const lastShopId = cookieStore.get('last_shop_id')?.value ?? null

  // User + Buyer 생성
  const user = await prisma.user.create({
    data: {
      email,
      name: parsed.data.name,
      passwordHash: hashedPassword,
      role: 'buyer',
      phone: parsed.data.phone || null,
    },
  })

  const buyer = await prisma.buyer.create({
    data: {
      userId: user.id,
      nickname: parsed.data.name,
      phone: parsed.data.phone || null,
      pointsBalance: 3000,
      totalPointsEarned: 3000,
      tier: 'ROOKIE',
      createdVia: 'EMAIL',
      createdAtShopId: lastShopId,
      marketingConsent: parsed.data.marketingOptIn,
    },
  })

  // 3000P 기록
  await prisma.pointsHistory.create({
    data: {
      buyerId: buyer.id,
      amount: 3000,
      balanceAfter: 3000,
      type: 'signup_bonus',
      description: '가입 축하 포인트',
    },
  })

  // 신규 가입 쿠키
  cookieStore.set('welcome_new_signup', '1', {
    maxAge: 300,
    sameSite: 'lax',
    path: '/',
  })

  return NextResponse.json({ success: true, buyerId: buyer.id })
}
