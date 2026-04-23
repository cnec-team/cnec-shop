'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { sendNotification, isValidEmail } from '@/lib/notifications'
import { exchangeRequestedTemplate, refundRequestedTemplate } from '@/lib/notifications/templates'

async function requireBuyer() {
  const session = await auth()
  if (!session?.user) throw new Error('로그인이 필요합니다')
  const buyer = await prisma.buyer.findFirst({ where: { userId: session.user.id } })
  if (!buyer) throw new Error('구매자 정보를 찾을 수 없습니다')
  return { user: session.user, buyer }
}

export async function requestExchange(data: {
  orderId: string
  itemIds: string[]
  reason: string
  details: string
  images: string[]
}) {
  const { buyer } = await requireBuyer()

  const order = await prisma.order.findFirst({
    where: {
      id: data.orderId,
      buyerId: buyer.id,
      status: { in: ['DELIVERED', 'CONFIRMED'] },
    },
    include: {
      brand: { select: { id: true, userId: true, brandName: true } },
    },
  })

  if (!order) throw new Error('교환 신청할 수 없는 주문입니다')

  const inquiry = await prisma.orderInquiry.create({
    data: {
      orderId: data.orderId,
      buyerId: buyer.id,
      category: 'EXCHANGE',
      title: `교환 신청 - ${data.reason}`,
      content: `사유: ${data.reason}\n\n${data.details}\n\n교환 요청 상품 ID: ${data.itemIds.join(', ')}`,
      status: 'OPEN',
      assignedTo: 'BRAND',
      brandId: order.brand?.id || null,
      images: data.images,
    },
  })

  try {
    if (order.brand?.userId) {
      const brandUser = await prisma.user.findUnique({
        where: { id: order.brand.userId },
        select: { email: true },
      })
      const brandEmail = brandUser?.email && isValidEmail(brandUser.email) ? brandUser.email : undefined
      const exchTmpl = exchangeRequestedTemplate({
        orderNumber: order.orderNumber ?? '',
        reason: data.reason,
        recipientEmail: brandEmail,
      })
      await sendNotification({
        userId: order.brand.userId,
        ...exchTmpl.inApp,
        email: brandEmail,
        emailTemplate: brandEmail ? exchTmpl.email : undefined,
      })
    }
  } catch {}

  return { id: inquiry.id, success: true }
}

export async function requestRefund(data: {
  orderId: string
  itemIds: string[]
  refundType: 'FULL' | 'PARTIAL'
  reason: string
  details: string
  images: string[]
  refundBank?: string
  refundAccount?: string
  refundHolder?: string
}) {
  const { buyer } = await requireBuyer()

  const order = await prisma.order.findFirst({
    where: {
      id: data.orderId,
      buyerId: buyer.id,
      status: { in: ['DELIVERED', 'CONFIRMED'] },
    },
    include: {
      items: true,
      brand: { select: { id: true, userId: true, brandName: true } },
    },
  })

  if (!order) throw new Error('환불 신청할 수 없는 주문입니다')

  // 환불 금액 계산
  let refundAmount = 0
  if (data.refundType === 'FULL') {
    refundAmount = Number(order.totalAmount)
  } else {
    const selectedItems = order.items.filter(i => data.itemIds.includes(i.id))
    refundAmount = selectedItems.reduce((sum, i) => sum + Number(i.totalPrice), 0)
  }

  const bankInfo = data.refundBank
    ? `\n환불 계좌: ${data.refundBank} ${data.refundAccount} (${data.refundHolder})`
    : ''

  const inquiry = await prisma.orderInquiry.create({
    data: {
      orderId: data.orderId,
      buyerId: buyer.id,
      category: 'REFUND',
      title: `${data.refundType === 'FULL' ? '전체' : '부분'} 환불 신청 - ${data.reason}`,
      content: `사유: ${data.reason}\n\n${data.details}\n\n환불 유형: ${data.refundType}\n예상 환불금액: ${refundAmount.toLocaleString()}원${bankInfo}\n\n환불 요청 상품 ID: ${data.itemIds.join(', ')}`,
      status: 'OPEN',
      assignedTo: 'BRAND',
      brandId: order.brand?.id || null,
      images: data.images,
    },
  })

  try {
    if (order.brand?.userId) {
      const refundBrandUser = await prisma.user.findUnique({
        where: { id: order.brand.userId },
        select: { email: true },
      })
      const refundBrandEmail = refundBrandUser?.email && isValidEmail(refundBrandUser.email) ? refundBrandUser.email : undefined
      const refTmpl = refundRequestedTemplate({
        orderNumber: order.orderNumber ?? '',
        refundType: data.refundType === 'FULL' ? '전체' : '부분',
        recipientEmail: refundBrandEmail,
      })
      await sendNotification({
        userId: order.brand.userId,
        ...refTmpl.inApp,
        email: refundBrandEmail,
        emailTemplate: refundBrandEmail ? refTmpl.email : undefined,
      })
    }
  } catch {}

  return { id: inquiry.id, success: true, estimatedRefund: refundAmount }
}
