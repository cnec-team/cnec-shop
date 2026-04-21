import { prisma } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import { sendNotification, normalizePhone, isValidEmail } from '@/lib/notifications'
import { creatorApplicationSubmittedMessage } from '@/lib/notifications/templates'
import bcrypt from 'bcryptjs'
import { jwtVerify } from 'jose'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret')

const baseFields = {
  name: z.string().min(1, '이름을 입력해주세요'),
  email: z.string().email('올바른 이메일을 입력해주세요'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다').regex(/^(?=.*[A-Za-z])(?=.*\d)/, '영문과 숫자를 조합해주세요'),
  phone: z.string().optional(),
  verificationToken: z.string().optional(),
}

const brandSignupSchema = z.object({
  ...baseFields,
  role: z.literal('brand_admin'),
  companyName: z.string().min(1, '회사명을 입력해주세요'),
  businessNumber: z.string().regex(/^\d{3}-?\d{2}-?\d{5}$/, '올바른 사업자번호를 입력해주세요').optional().or(z.literal('')),
})

const creatorSignupSchema = z.object({
  ...baseFields,
  role: z.literal('creator'),
  displayName: z.string().min(1, '활동명을 입력해주세요'),
  shopId: z.string().regex(/^[a-z0-9_-]{2,30}$/, '샵 ID는 영문 소문자, 숫자, 밑줄 2~30자'),
  instagramHandle: z.string().optional().or(z.literal('')),
  refCode: z.string().optional(),
})

const buyerSignupSchema = z.object({
  ...baseFields,
  role: z.literal('buyer'),
  refCode: z.string().optional(),
})

// Legacy fields for backwards compatibility
const legacySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  role: z.enum(['buyer', 'creator', 'brand_admin']),
  companyName: z.string().optional(),
  businessNumber: z.string().optional(),
  shopId: z.string().optional(),
  shopName: z.string().optional(),
  instagram: z.string().optional(),
  tiktok: z.string().optional(),
  youtube: z.string().optional(),
  profileImageUrl: z.string().optional(),
  refCode: z.string().optional(),
  phone: z.string().optional(),
  verificationToken: z.string().optional(),
  displayName: z.string().optional(),
  instagramHandle: z.string().optional(),
})

async function verifyIdentityToken(token: string): Promise<{ ci: string | null; phone: string; name: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    if (payload.type !== 'identity_verification') return null
    return {
      ci: (payload.ci as string) || null,
      phone: payload.phone as string,
      name: payload.name as string,
    }
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const limited = await rateLimit(`register:${ip}`, 3, 60)
    if (limited) {
      return NextResponse.json({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 })
    }

    const body = await req.json()
    const role = body.role

    // Try new Zod schemas first, fallback to legacy
    let validatedData: z.infer<typeof legacySchema>

    if (role === 'brand_admin') {
      const parsed = brandSignupSchema.safeParse(body)
      if (parsed.success) {
        validatedData = { ...body, ...parsed.data }
      } else {
        const legacy = legacySchema.safeParse(body)
        if (!legacy.success) {
          const firstError = parsed.error.issues[0]
          return NextResponse.json({ error: firstError?.message || '입력값을 확인해주세요' }, { status: 400 })
        }
        validatedData = legacy.data
      }
    } else if (role === 'creator') {
      const parsed = creatorSignupSchema.safeParse(body)
      if (parsed.success) {
        validatedData = { ...body, ...parsed.data }
      } else {
        const legacy = legacySchema.safeParse(body)
        if (!legacy.success) {
          const firstError = parsed.error.issues[0]
          return NextResponse.json({ error: firstError?.message || '입력값을 확인해주세요' }, { status: 400 })
        }
        validatedData = legacy.data
      }
    } else if (role === 'buyer') {
      const parsed = buyerSignupSchema.safeParse(body)
      if (!parsed.success) {
        const legacy = legacySchema.safeParse(body)
        if (!legacy.success) {
          return NextResponse.json({ error: '입력값을 확인해주세요' }, { status: 400 })
        }
        validatedData = legacy.data
      } else {
        validatedData = { ...body, ...parsed.data }
      }
    } else {
      return NextResponse.json({ error: '올바르지 않은 역할입니다' }, { status: 400 })
    }

    // 본인인증 토큰 검증
    let verifiedIdentity: { ci: string | null; phone: string; name: string } | null = null
    if (validatedData.verificationToken) {
      verifiedIdentity = await verifyIdentityToken(validatedData.verificationToken)
      if (!verifiedIdentity) {
        return NextResponse.json({ error: '본인인증 토큰이 만료되었거나 유효하지 않습니다. 다시 인증해주세요.' }, { status: 400 })
      }

      // CI 중복 체크
      if (verifiedIdentity.ci) {
        const existingCi = await prisma.user.findUnique({ where: { ci: verifiedIdentity.ci } })
        if (existingCi) {
          return NextResponse.json({ error: '이미 가입된 사용자입니다.' }, { status: 409 })
        }
      }
    }

    // 이메일 중복 체크
    const existing = await prisma.user.findUnique({ where: { email: validatedData.email } })
    if (existing) {
      return NextResponse.json({ error: '이미 가입된 이메일입니다' }, { status: 400 })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(validatedData.password, 12)

    // 전화번호 결정: 본인인증 > 직접입력
    const phone = verifiedIdentity?.phone || validatedData.phone || null

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        name: validatedData.name,
        passwordHash,
        role: validatedData.role as 'buyer' | 'creator' | 'brand_admin',
        phone,
        ci: verifiedIdentity?.ci || null,
        phoneVerifiedAt: verifiedIdentity ? new Date() : null,
      }
    })

    // Create role-specific profile
    if (validatedData.role === 'brand_admin') {
      await prisma.brand.create({
        data: {
          userId: user.id,
          companyName: validatedData.companyName || null,
          businessNumber: validatedData.businessNumber?.replace(/-/g, '') || null,
          approved: false,
        }
      })
    } else if (validatedData.role === 'creator') {
      const shopId = validatedData.shopId || null
      const displayName = validatedData.displayName || validatedData.shopName || validatedData.name

      const creator = await prisma.creator.create({
        data: {
          userId: user.id,
          shopId,
          displayName,
          instagramHandle: validatedData.instagramHandle || validatedData.instagram || null,
          tiktokHandle: validatedData.tiktok || null,
          youtubeHandle: validatedData.youtube || null,
          profileImageUrl: validatedData.profileImageUrl || null,
          themeColor: '#1a1a1a',
          status: 'PENDING',
          submittedAt: new Date(),
        }
      })

      // Send application submitted notification
      try {
        const creatorName = displayName || validatedData.name
        const tmpl = creatorApplicationSubmittedMessage({
          creatorName,
          recipientEmail: isValidEmail(validatedData.email) ? validatedData.email : undefined,
        })
        sendNotification({
          userId: user.id,
          ...tmpl.inApp,
          phone: normalizePhone(phone),
          email: isValidEmail(validatedData.email) ? validatedData.email : undefined,
          kakaoTemplate: normalizePhone(phone) ? tmpl.kakao : undefined,
          emailTemplate: isValidEmail(validatedData.email) ? tmpl.email : undefined,
        })
      } catch { /* ignore */ }

      // Handle referral
      if (validatedData.refCode && creator.id) {
        try {
          await prisma.creatorReferral.updateMany({
            where: {
              referralCode: validatedData.refCode,
              referredId: null,
            },
            data: {
              referredId: creator.id,
              status: 'SIGNUP_COMPLETE',
              updatedAt: new Date(),
            }
          })
        } catch {
          // 추천 코드 처리 실패는 무시
        }
      }

      return NextResponse.json({
        success: true,
        userId: user.id,
        creatorId: creator.id,
        redirectTo: '/creator/pending',
      })
    } else if (validatedData.role === 'buyer') {
      await prisma.buyer.create({
        data: {
          userId: user.id,
          nickname: validatedData.name,
          phone: phone || null,
        }
      })
    }

    return NextResponse.json({
      success: true,
      userId: user.id,
      redirectTo: validatedData.role === 'brand_admin' ? '/brand' : undefined,
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: '회원가입 중 오류가 발생했습니다' }, { status: 500 })
  }
}
