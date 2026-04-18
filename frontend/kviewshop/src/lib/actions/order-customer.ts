'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { sendNotification } from '@/lib/notifications'
import { incrementStock } from '@/lib/stock'

async function requireBuyer() {
  const session = await auth()
  if (!session?.user) throw new Error('로그인이 필요합니다')
  const buyer = await prisma.buyer.findFirst({ where: { userId: session.user.id } })
  if (!buyer) throw new Error('구매자 정보를 찾을 수 없습니다')
  return { user: session.user, buyer }
}

export async function cancelOrder(orderId: string, reason?: string) {
  const { buyer } = await requireBuyer()

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { id: orderId, buyerId: buyer.id },
      include: {
        items: true,
        creator: { select: { userId: true, shopId: true } },
        brand: { select: { userId: true, brandName: true } },
      },
    })

    if (!order) throw new Error('주문을 찾을 수 없습니다')
    if (order.status !== 'PAID') throw new Error('취소할 수 없는 주문 상태입니다')

    // 24시간 제한 체크
    const hoursSincePaid = order.paidAt
      ? (Date.now() - new Date(order.paidAt).getTime()) / (1000 * 60 * 60)
      : 999
    if (hoursSincePaid > 24) {
      throw new Error('결제 후 24시간이 지나 취소할 수 없습니다. 교환/반품을 신청해주세요.')
    }

    // 주문 취소
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: reason || '구매자 취소',
      },
    })

    // Conversion 취소
    await tx.conversion.updateMany({
      where: { orderId, status: 'PENDING' },
      data: { status: 'CANCELLED' },
    })

    // 재고 복원
    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      })
    }

    // PortOne V2 결제 취소 API
    const portOneSecret = process.env.PORTONE_API_SECRET
    if (portOneSecret && order.pgTransactionId) {
      try {
        await fetch(`https://api.portone.io/payments/${order.pgTransactionId}/cancel`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `PortOne ${portOneSecret}`,
          },
          body: JSON.stringify({
            reason: reason || '구매자 취소',
          }),
        })
      } catch (e) {
        console.error('[cancelOrder] PortOne cancel failed:', e)
      }
    }

    // 알림
    try {
      if (order.creator?.userId) {
        await sendNotification({
          userId: order.creator.userId,
          type: 'ORDER',
          title: '주문이 취소됐어요',
          message: `주문 ${order.orderNumber}이 취소되었습니다.`,
          linkUrl: '/creator/sales',
        })
      }
      if (order.brand?.userId) {
        await sendNotification({
          userId: order.brand.userId,
          type: 'ORDER',
          title: '주문이 취소됐어요',
          message: `주문 ${order.orderNumber}이 취소되었습니다.`,
          linkUrl: '/brand/orders',
        })
      }
    } catch {}

    return { success: true }
  })
}

export async function reorderFromOrder(orderId: string) {
  const { buyer } = await requireBuyer()

  const order = await prisma.order.findFirst({
    where: { id: orderId, buyerId: buyer.id },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, status: true, stock: true } },
        },
      },
      creator: { select: { id: true, shopId: true } },
    },
  })

  if (!order) throw new Error('주문을 찾을 수 없습니다')
  if (!order.creator) throw new Error('크리에이터 정보를 찾을 수 없습니다')

  let added = 0
  let skipped = 0
  const skippedItems: { name: string; reason: string }[] = []

  for (const item of order.items) {
    if (item.product.status !== 'ACTIVE') {
      skipped++
      skippedItems.push({ name: item.product.name || '상품', reason: '판매 중단' })
      continue
    }
    if ((item.product.stock ?? 0) <= 0) {
      skipped++
      skippedItems.push({ name: item.product.name || '상품', reason: '품절' })
      continue
    }

    // 공구 캠페인 케이스: 종료된 공구는 일반가로
    let campaignId: string | null = item.campaignId ?? null
    if (campaignId) {
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        select: { status: true, endAt: true },
      })
      if (!campaign || campaign.status !== 'ACTIVE' || (campaign.endAt && campaign.endAt < new Date())) {
        campaignId = null
      }
    }

    // 카트에 추가 (기존 addToCart 대신 직접 처리)
    const existingCart = await prisma.cart.findUnique({
      where: { buyerId_shopId: { buyerId: buyer.id, shopId: order.creator.id } },
    })

    let cartId: string
    if (existingCart) {
      cartId = existingCart.id
    } else {
      const newCart = await prisma.cart.create({
        data: { buyerId: buyer.id, shopId: order.creator.id },
      })
      cartId = newCart.id
    }

    // 기존 아이템 확인
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId,
        productId: item.productId,
        campaignId: campaignId,
      },
    })

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: { increment: item.quantity } },
      })
    } else {
      await prisma.cartItem.create({
        data: {
          cartId,
          productId: item.productId,
          campaignId,
          quantity: item.quantity,
        },
      })
    }
    added++
  }

  return { added, skipped, skippedItems, shopId: order.creator.shopId }
}
