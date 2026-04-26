'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { sendNotification } from '@/lib/notifications'
import { inquiryFollowUpMessage } from '@/lib/notifications/templates'

async function requireBuyer() {
  const session = await auth()
  if (!session?.user) throw new Error('로그인이 필요합니다')
  const buyer = await prisma.buyer.findFirst({ where: { userId: session.user.id } })
  if (!buyer) throw new Error('구매자 정보를 찾을 수 없습니다')
  return { user: session.user, buyer }
}

const CATEGORY_ASSIGN: Record<string, string> = {
  SHIPPING_DELAY: 'BRAND',
  PRODUCT_DEFECT: 'BRAND',
  EXCHANGE: 'BRAND',
  REFUND: 'BRAND',
  PAYMENT: 'CNEC',
  OTHER: 'CNEC',
}

export async function createInquiry(data: {
  orderId: string
  category: string
  title: string
  content: string
  images?: string[]
  guestEmail?: string
  guestPhone?: string
  guestName?: string
}) {
  let buyerId: string | null = null
  let buyerUserId: string | null = null

  // 로그인 사용자 or 비회원
  try {
    const { buyer, user } = await requireBuyer()
    buyerId = buyer.id
    buyerUserId = user.id
  } catch {
    if (!data.guestEmail) throw new Error('로그인이 필요합니다')
  }

  const order = await prisma.order.findFirst({
    where: buyerId
      ? { id: data.orderId, buyerId }
      : { id: data.orderId, buyerEmail: data.guestEmail },
    include: {
      brand: { select: { id: true, userId: true, brandName: true } },
    },
  })

  if (!order) throw new Error('주문을 찾을 수 없습니다')

  const assignedTo = CATEGORY_ASSIGN[data.category] || 'CNEC'

  const inquiry = await prisma.orderInquiry.create({
    data: {
      orderId: data.orderId,
      buyerId,
      guestEmail: data.guestEmail || null,
      guestPhone: data.guestPhone || null,
      guestName: data.guestName || null,
      category: data.category,
      title: data.title,
      content: data.content,
      status: 'OPEN',
      assignedTo,
      brandId: order.brand?.id || null,
      images: data.images || [],
    },
  })

  // 알림
  try {
    if (assignedTo === 'BRAND' && order.brand?.userId) {
      await sendNotification({
        userId: order.brand.userId,
        type: 'ORDER',
        title: '1:1 문의가 접수됐어요',
        message: `[${data.category}] ${data.title}`,
        linkUrl: '/brand/inquiries',
      })
    }
    if (assignedTo === 'CNEC') {
      const admins = await prisma.user.findMany({
        where: { role: 'super_admin' },
        select: { id: true },
      })
      for (const admin of admins) {
        await sendNotification({
          userId: admin.id,
          type: 'ORDER',
          title: '1:1 문의가 접수됐어요',
          message: `[${data.category}] ${data.title}`,
          linkUrl: '/admin/inquiries',
        })
      }
    }
  } catch {}

  return { id: inquiry.id, success: true }
}

export async function getMyInquiries() {
  const { buyer } = await requireBuyer()

  return prisma.orderInquiry.findMany({
    where: { buyerId: buyer.id },
    orderBy: { createdAt: 'desc' },
    include: {
      order: { select: { orderNumber: true } },
      answers: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  })
}

export async function getInquiryDetail(inquiryId: string) {
  const { buyer } = await requireBuyer()

  const inquiry = await prisma.orderInquiry.findFirst({
    where: { id: inquiryId, buyerId: buyer.id },
    include: {
      order: { select: { orderNumber: true, status: true } },
      brand: { select: { brandName: true, companyName: true } },
      answers: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!inquiry) throw new Error('문의를 찾을 수 없습니다')
  return inquiry
}

export async function addInquiryMessage(inquiryId: string, content: string, images?: string[]) {
  const { buyer } = await requireBuyer()

  const inquiry = await prisma.orderInquiry.findFirst({
    where: { id: inquiryId, buyerId: buyer.id, status: { in: ['OPEN', 'ANSWERED'] } },
    include: {
      brand: { select: { userId: true, brandName: true, companyName: true, user: { select: { email: true } } } },
    },
  })

  if (!inquiry) throw new Error('문의를 찾을 수 없습니다')

  const answer = await prisma.orderInquiryAnswer.create({
    data: {
      inquiryId,
      answerBy: buyer.id,
      answerByType: 'BUYER',
      content,
      images: images || [],
    },
  })

  // 상태를 OPEN으로 변경 (추가 질문)
  await prisma.orderInquiry.update({
    where: { id: inquiryId },
    data: { status: 'OPEN' },
  })

  // 브랜드에게 추가 문의 알림
  if (inquiry.brand?.userId) {
    try {
      const brandEmail = inquiry.brand.user?.email ?? undefined
      const brandName = inquiry.brand.brandName ?? inquiry.brand.companyName ?? ''
      const tmpl = inquiryFollowUpMessage({
        brandName,
        buyerName: buyer.nickname ?? '고객',
        inquirySubject: inquiry.title ?? undefined,
        recipientEmail: brandEmail,
      })
      await sendNotification({
        userId: inquiry.brand.userId,
        ...tmpl.inApp,
        email: brandEmail,
        emailTemplate: brandEmail ? tmpl.email : undefined,
      })
    } catch {}
  }

  return answer
}

export async function closeInquiry(inquiryId: string) {
  const { buyer } = await requireBuyer()

  const inquiry = await prisma.orderInquiry.findFirst({
    where: { id: inquiryId, buyerId: buyer.id },
  })

  if (!inquiry) throw new Error('문의를 찾을 수 없습니다')

  await prisma.orderInquiry.update({
    where: { id: inquiryId },
    data: { status: 'CLOSED' },
  })

  return { success: true }
}
