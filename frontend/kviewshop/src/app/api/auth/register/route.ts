import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password, name, role, companyName, businessNumber, shopId, shopName, instagram, tiktok, youtube, profileImageUrl, refCode, phone } = body

    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: '필수 항목을 입력해주세요' }, { status: 400 })
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
