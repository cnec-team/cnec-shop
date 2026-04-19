'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { sendNotification } from '@/lib/notifications'

async function requireBrand() {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  const brand = await prisma.brand.findFirst({
    where: { userId: session.user.id },
  })

  if (!brand) throw new Error('Brand not found')
  return { user: session.user, brand }
}

// ==================== 목록 조회 ====================

export async function getBrandInquiries(filters?: {
  status?: string
  category?: string
  period?: string
  search?: string
}) {
  const { brand } = await requireBrand()

  const where: Record<string, unknown> = { brandId: brand.id }

  if (filters?.status && filters.status !== 'all') {
    where.status = filters.status
  }

  if (filters?.category && filters.category !== 'all') {
    where.category = filters.category
  }

  if (filters?.period) {
    const now = new Date()
    const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 }
    const days = daysMap[filters.period]
    if (days) {
      const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
      where.createdAt = { gte: from }
    }
  }

  if (filters?.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { order: { orderNumber: { contains: filters.search, mode: 'insensitive' } } },
    ]
  }

  const inquiries = await prisma.orderInquiry.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      order: {
        select: {
          orderNumber: true,
          buyerName: true,
          buyerEmail: true,
          buyerPhone: true,
        },
      },
      buyer: { select: { nickname: true } },
      answers: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  })

  return inquiries.map((i) => ({
    id: i.id,
    category: i.category,
    title: i.title,
    status: i.status,
    assignedTo: i.assignedTo,
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
    orderNumber: i.order?.orderNumber || null,
    buyerName: i.buyer?.nickname || i.guestName || i.order?.buyerName || '고객',
    hasAnswer: i.answers.length > 0,
    lastAnswerAt: i.answers[0]?.createdAt?.toISOString() || null,
  }))
}

// ==================== 상세 조회 ====================

export async function getBrandInquiryDetail(inquiryId: string) {
  const { brand } = await requireBrand()

  const inquiry = await prisma.orderInquiry.findFirst({
    where: { id: inquiryId, brandId: brand.id },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalAmount: true,
          buyerName: true,
          buyerEmail: true,
          buyerPhone: true,
          items: {
            take: 3,
            include: {
              product: {
                select: { name: true, imageUrl: true },
              },
            },
          },
        },
      },
      buyer: { select: { id: true, nickname: true, userId: true } },
      answers: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!inquiry) throw new Error('문의를 찾을 수 없습니다')

  return {
    id: inquiry.id,
    category: inquiry.category,
    title: inquiry.title,
    content: inquiry.content,
    status: inquiry.status,
    assignedTo: inquiry.assignedTo,
    images: inquiry.images,
    guestName: inquiry.guestName,
    guestEmail: inquiry.guestEmail,
    guestPhone: inquiry.guestPhone,
    createdAt: inquiry.createdAt.toISOString(),
    updatedAt: inquiry.updatedAt.toISOString(),
    order: inquiry.order
      ? {
          id: inquiry.order.id,
          orderNumber: inquiry.order.orderNumber,
          status: inquiry.order.status,
          totalAmount: Number(inquiry.order.totalAmount),
          buyerName: inquiry.order.buyerName,
          buyerEmail: inquiry.order.buyerEmail,
          buyerPhone: inquiry.order.buyerPhone,
          items: inquiry.order.items.map((item) => ({
            productName: item.product?.name || item.productName || '상품',
            productImage: item.product?.imageUrl || null,
            quantity: item.quantity,
            unitPrice: Number(item.unitPrice),
          })),
        }
      : null,
    buyerName: inquiry.buyer?.nickname || inquiry.guestName || inquiry.order?.buyerName || '고객',
    buyerId: inquiry.buyerId,
    answers: inquiry.answers.map((a) => ({
      id: a.id,
      answerBy: a.answerBy,
      answerByType: a.answerByType,
      content: a.content,
      images: a.images,
      createdAt: a.createdAt.toISOString(),
    })),
  }
}

// ==================== 답변 등록 ====================

export async function answerBrandInquiry(
  inquiryId: string,
  content: string,
  images?: string[]
) {
  const { brand } = await requireBrand()

  const inquiry = await prisma.orderInquiry.findFirst({
    where: { id: inquiryId, brandId: brand.id, status: { in: ['OPEN', 'ANSWERED'] } },
    include: {
      buyer: { select: { userId: true } },
    },
  })

  if (!inquiry) throw new Error('문의를 찾을 수 없습니다')

  const answer = await prisma.orderInquiryAnswer.create({
    data: {
      inquiryId,
      answerBy: brand.id,
      answerByType: 'BRAND',
      content,
      images: images || [],
    },
  })

  await prisma.orderInquiry.update({
    where: { id: inquiryId },
    data: { status: 'ANSWERED' },
  })

  // Buyer 알림
  if (inquiry.buyer?.userId) {
    try {
      await sendNotification({
        userId: inquiry.buyer.userId,
        type: 'ORDER',
        title: '문의에 답변이 도착했어요',
        message: `${brand.brandName || brand.companyName}에서 답변했어요`,
        linkUrl: `/me/inquiries/${inquiryId}`,
      })
    } catch {}
  }

  return { id: answer.id, success: true }
}

// ==================== 문의 종료 ====================

export async function closeBrandInquiry(inquiryId: string) {
  const { brand } = await requireBrand()

  const inquiry = await prisma.orderInquiry.findFirst({
    where: { id: inquiryId, brandId: brand.id },
  })

  if (!inquiry) throw new Error('문의를 찾을 수 없습니다')

  await prisma.orderInquiry.update({
    where: { id: inquiryId },
    data: { status: 'CLOSED' },
  })

  return { success: true }
}

// ==================== 미답변 건수 ====================

export async function getBrandInquiryCount() {
  const { brand } = await requireBrand()

  const count = await prisma.orderInquiry.count({
    where: { brandId: brand.id, status: 'OPEN' },
  })

  return count
}
