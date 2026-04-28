import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { jwtVerify } from 'jose'
import { sendNotification, normalizePhone, isValidEmail } from '@/lib/notifications'
import { creatorApplicationSubmittedMessage } from '@/lib/notifications/templates'

const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret')

const schema = z.object({
  displayName: z.string().min(1, '활동명을 입력해주세요'),
  shopId: z.string().regex(/^[a-z0-9_-]{2,30}$/, '샵 ID 형식이 올바르지 않습니다'),
  instagramHandle: z.string().optional().or(z.literal('')),
  tiktok: z.string().optional().or(z.literal('')),
  youtube: z.string().optional().or(z.literal('')),
  bio: z.string().max(50).optional().or(z.literal('')),
  primaryCategory: z.string().optional().or(z.literal('')),
  categories: z.array(z.string()).optional(),
  termsAgreedAt: z.string(),
  privacyAgreedAt: z.string(),
  marketingAgreedAt: z.string().optional(),
  refCode: z.string().optional(),
  // 본인확인 관련 (새 플로우)
  verificationToken: z.string().optional(),
  name: z.string().min(1).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { creator: true },
    })

    if (!user || user.role !== 'creator' || !user.creator) {
      return NextResponse.json({ error: '크리에이터 계정이 아닙니다' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || '입력값을 확인해주세요' }, { status: 400 })
    }

    const data = parsed.data

    // 본인인증 토큰 검증 및 phone/CI 업데이트
    if (data.verificationToken) {
      try {
        const { payload } = await jwtVerify(data.verificationToken, JWT_SECRET)
        const phone = payload.phone as string
        const ci = (payload.ci as string) || null
        const isIdentity = payload.type === 'identity_verification'

        if (!phone) {
          return NextResponse.json({ error: '인증 정보가 유효하지 않습니다' }, { status: 400 })
        }

        // CI 중복 체크
        if (ci) {
          const existingCI = await prisma.user.findUnique({ where: { ci } })
          if (existingCI && existingCI.id !== user.id) {
            return NextResponse.json({ error: '이미 가입된 사용자입니다' }, { status: 409 })
          }
        }

        const now = new Date()
        await prisma.user.update({
          where: { id: user.id },
          data: {
            phone,
            ci,
            phoneVerifiedAt: isIdentity ? now : null,
            phoneReachable: true,
            phoneReachableAt: now,
            ...(data.name ? { name: data.name } : {}),
          },
        })
      } catch {
        return NextResponse.json({ error: '인증 토큰이 만료되었습니다. 다시 인증해주세요.' }, { status: 400 })
      }
    } else if (data.name) {
      // 토큰 없이 이름만 업데이트
      await prisma.user.update({
        where: { id: user.id },
        data: { name: data.name },
      })
    }

    // shopId 중복 체크
    const existingShop = await prisma.creator.findUnique({ where: { shopId: data.shopId } })
    if (existingShop && existingShop.id !== user.creator.id) {
      return NextResponse.json({ error: '이미 사용 중인 샵 ID입니다' }, { status: 409 })
    }

    const now = new Date()

    // Creator 프로필 업데이트
    const updatedCreator = await prisma.creator.update({
      where: { id: user.creator.id },
      data: {
        displayName: data.displayName,
        shopId: data.shopId,
        instagramHandle: data.instagramHandle || null,
        tiktokHandle: data.tiktok || null,
        youtubeHandle: data.youtube || null,
        bio: data.bio || null,
        primaryCategory: data.primaryCategory || null,
        categories: data.categories || [],
        submittedAt: now,
      },
    })

    // User 약관 동의 업데이트
    await prisma.user.update({
      where: { id: user.id },
      data: {
        termsAgreedAt: new Date(data.termsAgreedAt),
        privacyAgreedAt: new Date(data.privacyAgreedAt),
        marketingAgreedAt: data.marketingAgreedAt ? new Date(data.marketingAgreedAt) : null,
      },
    })

    // 가입 알림 발송
    try {
      const tmpl = creatorApplicationSubmittedMessage({
        creatorName: data.displayName || user.name,
        recipientEmail: isValidEmail(user.email) ? user.email : undefined,
      })
      sendNotification({
        userId: user.id,
        ...tmpl.inApp,
        phone: normalizePhone(user.phone),
        email: isValidEmail(user.email) ? user.email : undefined,
        kakaoTemplate: normalizePhone(user.phone) ? tmpl.kakao : undefined,
        emailTemplate: isValidEmail(user.email) ? tmpl.email : undefined,
      })
    } catch { /* ignore */ }

    // 추천 코드 처리
    if (data.refCode) {
      try {
        await prisma.creatorReferral.updateMany({
          where: { referralCode: data.refCode, referredId: null },
          data: {
            referredId: updatedCreator.id,
            status: 'SIGNUP_COMPLETE',
            updatedAt: now,
          },
        })
      } catch { /* ignore */ }
    }

    return NextResponse.json({
      success: true,
      creatorId: updatedCreator.id,
      redirectTo: '/creator/pending',
    })
  } catch (error) {
    console.error('Complete social profile error:', error)
    return NextResponse.json({ error: '프로필 저장 중 오류가 발생했습니다' }, { status: 500 })
  }
}
