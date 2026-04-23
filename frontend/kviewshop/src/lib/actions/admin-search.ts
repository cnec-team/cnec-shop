'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'super_admin') {
    throw new Error('Forbidden')
  }
  return session.user
}

export async function searchAdmin(query: string, limit: number = 5) {
  await requireAdmin()

  if (!query || query.trim().length < 1) {
    return { brands: [], creators: [], orders: [], campaigns: [] }
  }

  const q = query.trim()

  const [brands, creators, orders, campaigns] = await Promise.all([
    prisma.brand.findMany({
      where: {
        OR: [
          { brandName: { contains: q, mode: 'insensitive' } },
          { companyName: { contains: q, mode: 'insensitive' } },
          { businessNumber: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        brandName: true,
        companyName: true,
        logoUrl: true,
        approved: true,
        businessNumber: true,
      },
      take: limit,
    }),
    prisma.creator.findMany({
      where: {
        OR: [
          { displayName: { contains: q, mode: 'insensitive' } },
          { username: { contains: q, mode: 'insensitive' } },
          { instagramHandle: { contains: q, mode: 'insensitive' } },
          { user: { email: { contains: q, mode: 'insensitive' } } },
        ],
      },
      select: {
        id: true,
        displayName: true,
        username: true,
        profileImageUrl: true,
        status: true,
        instagramHandle: true,
      },
      take: limit,
    }),
    prisma.order.findMany({
      where: {
        OR: [
          { orderNumber: { contains: q, mode: 'insensitive' } },
          { buyerName: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        orderNumber: true,
        buyerName: true,
        totalAmount: true,
        status: true,
        createdAt: true,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.campaign.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { brand: { brandName: { contains: q, mode: 'insensitive' } } },
        ],
      },
      select: {
        id: true,
        title: true,
        status: true,
        endAt: true,
        brand: { select: { brandName: true } },
      },
      take: limit,
    }),
  ])

  return {
    brands: brands.map(b => ({
      id: b.id,
      name: b.brandName || b.companyName || '알 수 없음',
      logoUrl: b.logoUrl,
      status: b.approved ? 'APPROVED' : 'PENDING',
      businessNumber: b.businessNumber,
    })),
    creators: creators.map(c => ({
      id: c.id,
      name: c.displayName || c.username || '알 수 없음',
      profileImageUrl: c.profileImageUrl,
      status: c.status || 'ACTIVE',
      instagramHandle: c.instagramHandle,
    })),
    orders: orders.map(o => ({
      id: o.id,
      orderNumber: o.orderNumber,
      buyerName: o.buyerName,
      totalAmount: Number(o.totalAmount || 0),
      status: o.status,
      createdAt: o.createdAt.toISOString(),
    })),
    campaigns: campaigns.map(c => ({
      id: c.id,
      name: c.title || '제목 없음',
      brandName: c.brand?.brandName || '알 수 없음',
      status: c.status,
      endAt: c.endAt?.toISOString() || null,
    })),
  }
}
