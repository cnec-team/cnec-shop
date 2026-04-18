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

export async function writeReview(data: {
  orderItemId: string
  rating: number
  title?: string
  content: string
  images?: string[]
  instagramUrl?: string
}) {
  const { buyer } = await requireBuyer()

  if (data.rating < 1 || data.rating > 5) throw new Error('별점은 1~5점이어야 합니다')
  if (data.content.length < 20) throw new Error('후기는 20자 이상 작성해주세요')

  // orderItem 조회 및 소유권 검증
  const orderItem = await prisma.orderItem.findUnique({
    where: { id: data.orderItemId },
    include: {
      order: { select: { id: true, buyerId: true, status: true } },
    },
  })

  if (!orderItem || orderItem.order.buyerId !== buyer.id) {
    throw new Error('주문 상품을 찾을 수 없습니다')
  }

  if (!['DELIVERED', 'CONFIRMED'].includes(orderItem.order.status)) {
    throw new Error('배송완료 또는 구매확정 주문만 후기를 작성할 수 있습니다')
  }

  // 중복 체크
  const existing = await prisma.productReview.findUnique({
    where: { orderItemId: data.orderItemId },
  })
  if (existing) throw new Error('이미 이 상품에 대한 후기를 작성하셨어요')

  // 포인트 계산
  let pointsEarned = 300 // 기본 텍스트
  if (data.images && data.images.length > 0) pointsEarned = 500 // 이미지 포함
  if (data.instagramUrl) pointsEarned += 500 // 인스타 연동

  // 트랜잭션: 리뷰 생성 + 포인트 지급
  const review = await prisma.$transaction(async (tx) => {
    const r = await tx.productReview.create({
      data: {
        productId: orderItem.productId,
        buyerId: buyer.id,
        orderId: orderItem.order.id,
        orderItemId: data.orderItemId,
        rating: data.rating,
        title: data.title || null,
        content: data.content,
        images: data.images || [],
        instagramPostUrl: data.instagramUrl || null,
        isVerifiedPurchase: true,
        pointsAwarded: pointsEarned,
        pointsAwardedAt: new Date(),
      },
    })

    // 포인트 지급
    const updatedBuyer = await tx.buyer.update({
      where: { id: buyer.id },
      data: {
        pointsBalance: { increment: pointsEarned },
        totalPointsEarned: { increment: pointsEarned },
        totalReviews: { increment: 1 },
      },
    })

    await tx.pointsHistory.create({
      data: {
        buyerId: buyer.id,
        amount: pointsEarned,
        balanceAfter: updatedBuyer.pointsBalance,
        type: 'review_reward',
        referenceId: r.id,
        description: `후기 작성 포인트${data.instagramUrl ? ' (인스타 포함)' : ''}`,
      },
    })

    return r
  })

  return { id: review.id, pointsEarned }
}

export async function getReviewableItems(orderId: string) {
  const { buyer } = await requireBuyer()

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      buyerId: buyer.id,
      status: { in: ['DELIVERED', 'CONFIRMED'] },
    },
    include: {
      items: {
        include: {
          product: {
            select: { id: true, name: true, imageUrl: true, images: true },
          },
        },
      },
    },
  })

  if (!order) return []

  // 이미 리뷰 작성한 orderItemId 조회
  const existingReviews = await prisma.productReview.findMany({
    where: {
      orderItemId: { in: order.items.map(i => i.id) },
    },
    select: { orderItemId: true },
  })

  const reviewedItemIds = new Set(existingReviews.map(r => r.orderItemId))

  return order.items
    .filter(item => !reviewedItemIds.has(item.id))
    .map(item => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName || item.product?.name || '상품',
      productImage: item.productImage || item.product?.imageUrl || item.product?.images?.[0] || null,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
    }))
}
