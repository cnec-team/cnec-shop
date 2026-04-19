import { prisma } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const limited = await rateLimit(`register:${ip}`, 3, 60)
    if (limited) {
      return NextResponse.json({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 })
    }

    const body = await req.json()
    const { email, password, name, role, companyName, businessNumber, shopId, shopName, instagram, tiktok, youtube, profileImageUrl, refCode, phone } = body

    const missing: string[] = []
    if (!email) missing.push('email')
    if (!password) missing.push('password')
    if (!name) missing.push('name')
    if (!role) missing.push('role')
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `필수 항목이 누락되었습니다: ${missing.join(', ')}` },
        { status: 400 }
      )
    }

    const validRoles = ['buyer', 'creator', 'brand_admin']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: `올바르지 않은 역할입니다: ${role}` },
        { status: 400 }
      )
    }

    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: '비밀번호는 8자 이상이어야 합니다' },
        { status: 400 }
      )
    }

    // Check duplicate email
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: '이미 가입된 이메일입니다' }, { status: 400 })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: { email, name, passwordHash, role, phone: phone || null }
    })

    // Create role-specific profile
    if (role === 'brand_admin') {
      await prisma.brand.create({
        data: {
          userId: user.id,
          companyName: companyName || null,
          businessNumber: businessNumber || null,
          approved: false,
        }
      })
    } else if (role === 'creator') {
      const creator = await prisma.creator.create({
        data: {
          userId: user.id,
          shopId: shopId || null,
          displayName: shopName || name,
          instagramHandle: instagram || null,
          tiktokHandle: tiktok || null,
          youtubeHandle: youtube || null,
          profileImageUrl: profileImageUrl || null,
          themeColor: '#1a1a1a',
        }
      })

      // Handle referral
      if (refCode && creator.id) {
        await prisma.creatorReferral.updateMany({
          where: {
            referralCode: refCode,
            referredId: null,
          },
          data: {
            referredId: creator.id,
            status: 'SIGNUP_COMPLETE',
            updatedAt: new Date(),
          }
        })
      }

      return NextResponse.json({ success: true, userId: user.id, creatorId: creator.id })
    } else if (role === 'buyer') {
      // 구매자 프로필 생성 (회원가입 시 바로 생성)
      await prisma.buyer.create({
        data: {
          userId: user.id,
          nickname: name,
          phone: phone || null,
        }
      })
    }

    return NextResponse.json({ success: true, userId: user.id })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: '회원가입 중 오류가 발생했습니다' }, { status: 500 })
  }
}
