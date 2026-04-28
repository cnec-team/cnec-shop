import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sp = request.nextUrl.searchParams
  const page = Math.max(1, parseInt(sp.get('page') || '1', 10))
  const limit = Math.min(50, Math.max(1, parseInt(sp.get('limit') || '20', 10)))
  const status = sp.get('status') || 'ACTIVE'

  const isBrand = user.role === 'brand_admin'
  const isCreator = user.role === 'creator'
  if (!isBrand && !isCreator) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // brandId 또는 creatorId 조회
  let participantId: string | null = null
  if (isBrand) {
    const brand = await prisma.brand.findFirst({ where: { userId: user.id }, select: { id: true } })
    participantId = brand?.id ?? null
  } else {
    const creator = await prisma.creator.findFirst({ where: { userId: user.id }, select: { id: true } })
    participantId = creator?.id ?? null
  }
  if (!participantId) {
    return NextResponse.json({ conversations: [], total: 0, page, totalPages: 0 })
  }

  const where = {
    ...(isBrand ? { brandId: participantId } : { creatorId: participantId }),
    status,
  }

  const [conversations, total] = await Promise.all([
    prisma.conversation.findMany({
      where,
      orderBy: { lastMessageAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        brand: { select: { id: true, brandName: true, logoUrl: true } },
        creator: {
          select: {
            id: true, displayName: true, igUsername: true,
            igProfileImageR2Url: true, profileImageUrl: true,
          },
        },
      },
    }),
    prisma.conversation.count({ where }),
  ])

  const result = conversations.map(c => {
    const partner = isBrand
      ? {
          id: c.creator.id,
          name: c.creator.displayName || c.creator.igUsername || '',
          avatarUrl: c.creator.igProfileImageR2Url || c.creator.profileImageUrl || null,
        }
      : {
          id: c.brand.id,
          name: c.brand.brandName || '',
          avatarUrl: c.brand.logoUrl || null,
        }

    return {
      id: c.id,
      partner,
      lastMessageText: c.lastMessageText,
      lastMessageAt: c.lastMessageAt,
      unreadCount: isBrand ? c.brandUnreadCount : c.creatorUnreadCount,
      status: c.status,
    }
  })

  return NextResponse.json({
    conversations: result,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  })
}
