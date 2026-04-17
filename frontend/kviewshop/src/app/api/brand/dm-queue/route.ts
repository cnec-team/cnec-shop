import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser || authUser.role !== 'brand_admin') {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 401 })
    }

    const brand = await prisma.brand.findFirst({
      where: { userId: authUser.id },
      select: { id: true, brandInstagramDailySentCount: true, brandInstagramLastUsedAt: true },
    })
    if (!brand) {
      return NextResponse.json({ error: '브랜드를 찾을 수 없습니다' }, { status: 404 })
    }

    const sp = request.nextUrl.searchParams
    const status = sp.get('status') || 'PENDING'
    const page = Math.max(1, parseInt(sp.get('page') || '1', 10))
    const limit = 20

    type DmStatus = 'PENDING' | 'IN_PROGRESS' | 'SENT' | 'FAILED' | 'SKIPPED'
    const where = {
      brandId: brand.id,
      status: status as DmStatus,
    }

    const [items, total] = await Promise.all([
      prisma.dmSendQueue.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              displayName: true,
              instagramHandle: true,
              igProfilePicUrl: true,
              igProfileImageR2Url: true,
            },
          },
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.dmSendQueue.count({ where }),
    ])

    // Today's send count
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todaySentCount = await prisma.dmSendQueue.count({
      where: {
        brandId: brand.id,
        status: 'SENT',
        sentAt: { gte: today },
      },
    })

    return NextResponse.json({
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      todaySentCount,
      dailyLimit: 50,
    })
  } catch (error) {
    console.error('DM 큐 조회 오류:', error)
    return NextResponse.json({ error: 'DM 큐 조회 중 오류가 발생했습니다' }, { status: 500 })
  }
}
