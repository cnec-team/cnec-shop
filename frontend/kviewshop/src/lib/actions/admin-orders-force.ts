'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { logAuditAction } from '@/lib/audit'
import { sendNotification } from '@/lib/notifications'
import { incrementStock } from '@/lib/stock'
import { cancelTossPayment } from '@/lib/toss/payment-cancel'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'super_admin') {
    throw new Error('Forbidden')
  }
  return session.user
}

export async function getOrderForceDetail(orderId: string) {
  await requireAdmin()

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        select: {
          id: true,
          productId: true,
          quantity: true,
          totalPrice: true,
          product: { select: { name: true } },
        },
      },
      brand: { select: { id: true, brandName: true, companyName: true, userId: true } },
      creator: { select: { id: true, displayName: true, username: true } },
      buyer: { select: { user: { select: { name: true, email: true } } } },
    },
  })
  if (!order) throw new Error('NOT_FOUND')

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    totalAmount: Number(order.totalAmount || 0),
    shippingFee: Number(order.shippingFee || 0),
    buyerName: order.buyerName || order.buyer?.user?.name || '비회원',
    buyerEmail: order.buyerEmail || order.buyer?.user?.email || '',
    buyerPhone: order.buyerPhone || '',
    paymentMethod: order.paymentMethod,
    paymentKey: order.paymentKey,
    paymentIntentId: order.paymentIntentId,
    paidAt: order.paidAt?.toISOString() || null,
    shippedAt: order.shippedAt?.toISOString() || null,
    deliveredAt: order.deliveredAt?.toISOString() || null,
    creatorRevenue: Number(order.creatorRevenue || 0),
    brandName: order.brand?.brandName || order.brand?.companyName || null,
    brandUserId: order.brand?.userId || null,
    creatorName: order.creator?.displayName || order.creator?.username || null,
    items: order.items.map(i => ({
      id: i.id,
      productId: i.productId,
      productName: i.product?.name || '상품',
      quantity: i.quantity,
      totalPrice: Number(i.totalPrice || 0),
    })),
    updatedAt: order.updatedAt.toISOString(),
    refundedAt: order.refundedAt?.toISOString() || null,
    cancelledAt: order.cancelledAt?.toISOString() || null,
  }
}

export async function forceCancelOrder(params: {
  orderId: string
  refundType: 'FULL' | 'PARTIAL'
  refundAmount?: number
  reason: string
}) {
  const admin = await requireAdmin()
  const { orderId, refundType, refundAmount, reason } = params

  if (!reason || reason.length < 20) throw new Error('사유는 20자 이상 입력해주세요')

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { select: { productId: true, quantity: true } },
      brand: { select: { userId: true, brandName: true } },
      buyer: { select: { userId: true, user: { select: { name: true } } } },
    },
  })
  if (!order) throw new Error('NOT_FOUND')
  if (order.status === 'CANCELLED' || order.status === 'REFUNDED') {
    throw new Error('이미 취소/환불된 주문이에요')
  }

  const totalAmount = Number(order.totalAmount || 0)
  const actualRefundAmount = refundType === 'FULL' ? totalAmount : (refundAmount || 0)

  if (actualRefundAmount <= 0) throw new Error('환불 금액이 유효하지 않아요')
  if (actualRefundAmount > totalAmount) throw new Error('환불 금액이 결제 금액을 초과해요')

  // 토스페이먼츠 취소 API 호출 (DB 트랜잭션 밖에서)
  const paymentKey = order.paymentKey || order.pgTransactionId
  let pgCancelId = ''

  if (paymentKey) {
    const cancelResult = await cancelTossPayment({
      paymentKey,
      cancelReason: reason,
      cancelAmount: refundType === 'PARTIAL' ? actualRefundAmount : undefined,
    })
    if (!cancelResult.success) {
      throw new Error(`토스 취소 실패: ${cancelResult.error}`)
    }
    pgCancelId = cancelResult.transactionKey
  }

  // DB 업데이트 (트랜잭션)
  const now = new Date()
  const newStatus = refundType === 'FULL' ? 'REFUNDED' : 'PAID' // 부분 환불은 PAID 유지

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: newStatus,
        refundedBy: admin.id,
        refundReason: reason,
        refundedAt: now,
        refundType,
        refundedAmount: actualRefundAmount,
        pgCancelId,
        cancelledAt: refundType === 'FULL' ? now : undefined,
        cancelReason: refundType === 'FULL' ? reason : undefined,
      },
    })

    // 전액 환불 시 재고 복원
    if (refundType === 'FULL') {
      for (const item of order.items) {
        if (item.productId) {
          await incrementStock(item.productId, item.quantity)
        }
      }
    }
  })

  // AuditLog
  await logAuditAction({
    actorId: admin.id!,
    actorRole: 'super_admin',
    action: 'ORDER_FORCE_CANCEL',
    targetType: 'ORDER',
    targetId: orderId,
    payload: {
      before: { status: order.status, totalAmount },
      after: { status: newStatus, refundType, refundedAmount: actualRefundAmount, pgCancelId },
    },
    reason,
  })

  // 알림
  try {
    if (order.buyer?.userId) {
      await sendNotification({
        userId: order.buyer.userId,
        type: 'ORDER',
        title: '주문 취소/환불 안내',
        message: `주문번호 ${order.orderNumber}이 환불되었어요. 환불 금액: ₩${actualRefundAmount.toLocaleString()}`,
        linkUrl: '/buyer/orders',
      })
    }
    if (order.brand?.userId) {
      await sendNotification({
        userId: order.brand.userId,
        type: 'ORDER',
        title: '주문 강제 취소 안내',
        message: `주문번호 ${order.orderNumber}이 관리자에 의해 환불되었어요. 금액: ₩${actualRefundAmount.toLocaleString()}`,
        linkUrl: '/brand/orders',
      })
    }
  } catch {}

  return { success: true as const, pgCancelId }
}
