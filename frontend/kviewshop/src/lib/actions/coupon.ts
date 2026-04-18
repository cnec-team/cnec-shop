'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

async function requireBuyer() {
  const session = await auth()
  if (!session?.user) throw new Error('로그인이 필요합니다')
  const buyer = await prisma.buyer.findFirst({ where: { userId: session.user.id } })
  if (!buyer) throw new Error('구매자 정보를 찾을 수 없습니다')
  return { user: session.user, buyer }
}

export async function getMyCoupons(filter: 'available' | 'used' | 'expired' = 'available') {
  const { buyer } = await requireBuyer()
  const now = new Date()

  if (filter === 'available') {
    return prisma.coupon.findMany({
      where: { buyerId: buyer.id, usedAt: null, expiresAt: { gt: now } },
      orderBy: { expiresAt: 'asc' },
    })
  }
  if (filter === 'used') {
    return prisma.coupon.findMany({
      where: { buyerId: buyer.id, usedAt: { not: null } },
      orderBy: { usedAt: 'desc' },
    })
  }
  // expired
  return prisma.coupon.findMany({
    where: { buyerId: buyer.id, usedAt: null, expiresAt: { lte: now } },
    orderBy: { expiresAt: 'desc' },
  })
}

export async function getCouponCounts() {
  const { buyer } = await requireBuyer()
  const now = new Date()

  const [available, used, expired] = await Promise.all([
    prisma.coupon.count({ where: { buyerId: buyer.id, usedAt: null, expiresAt: { gt: now } } }),
    prisma.coupon.count({ where: { buyerId: buyer.id, usedAt: { not: null } } }),
    prisma.coupon.count({ where: { buyerId: buyer.id, usedAt: null, expiresAt: { lte: now } } }),
  ])

  return { available, used, expired }
}

export async function registerCoupon(code: string) {
  const { buyer } = await requireBuyer()

  // 쿠폰 코드로 검색 - 여기서는 간단한 시스템 쿠폰 검증
  // 실제 쿠폰 발급은 어드민에서 처리
  const existing = await prisma.coupon.findFirst({
    where: { buyerId: buyer.id, code },
  })
  if (existing) throw new Error('이미 등록된 쿠폰입니다')

  // 코드 기반 쿠폰 검증은 별도 시스템 필요
  throw new Error('유효하지 않은 쿠폰 코드입니다')
}
