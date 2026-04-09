'use server'

import { prisma } from '@/lib/db'
import { sendNotification } from '@/lib/notifications'
import {
  orderCompleteMessage,
  newOrderBrandMessage,
  saleOccurredMessage,
} from '@/lib/notifications/templates'

// ==================== Checkout ====================

export async function getCreatorByShopId(shopId: string) {
  return prisma.creator.findFirst({
    where: {
      shopId: { equals: shopId, mode: 'insensitive' },
    },
  })
}

export async function getCheckoutProducts(productIds: string[]) {
  if (productIds.length === 0) return []
  return prisma.product.findMany({
    where: { id: { in: productIds } },
    include: {
      brand: {
        select: {
          id: true,
          brandName: true,
        },
      },
    },
  })
}

export async function createOrder(data: {
  orderNumber: string
  creatorId: string
  brandId: string
  buyerId?: string | null
  buyerName: string
  buyerPhone: string
  buyerEmail: string
  shippingAddress: string
  shippingDetail?: string
  shippingZipcode?: string
  totalAmount: number
  shippingFee: number
  items: Array<{
    productId: string
    campaignId?: string | null
    quantity: number
    unitPrice: number
    totalPrice: number
    productName?: string | null
    productImage?: string | null
  }>
  conversionType: 'DIRECT' | 'INDIRECT'
}) {
  // ---- Resolve commission rates from DB ----
  const campaignIds = [...new Set(data.items.map((i) => i.campaignId).filter(Boolean))] as string[]
  const productIds = [...new Set(data.items.map((i) => i.productId))]

  // Fetch campaign commission rates
  const campaigns = campaignIds.length > 0
    ? await prisma.campaign.findMany({
        where: { id: { in: campaignIds } },
        select: { id: true, commissionRate: true },
      })
    : []
  const campaignRateMap = new Map(campaigns.map((c) => [c.id, Number(c.commissionRate)]))

  // Fetch product default commission rates
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, defaultCommissionRate: true },
  })
  const productRateMap = new Map(products.map((p) => [p.id, Number(p.defaultCommissionRate)]))

  // Fetch brand fallback rate
  let brandFallbackRate = 0.03
  if (data.brandId) {
    const brand = await prisma.brand.findUnique({
      where: { id: data.brandId },
      select: { platformFeeRate: true },
    })
    if (brand?.platformFeeRate) {
      brandFallbackRate = Number(brand.platformFeeRate)
    }
  }

  // Determine commission rate per item:
  // 1. Campaign item → Campaign.commissionRate
  // 2. Non-campaign item → Product.defaultCommissionRate
  // 3. Fallback → Brand.platformFeeRate or 0.03
  function getCommissionRate(item: { productId: string; campaignId?: string | null }): number {
    if (item.campaignId) {
      const campaignRate = campaignRateMap.get(item.campaignId)
      if (campaignRate !== undefined && campaignRate > 0) return campaignRate
    }
    const productRate = productRateMap.get(item.productId)
    if (productRate !== undefined && productRate > 0) return productRate
    return brandFallbackRate
  }

  // ---- Create order ----
  const order = await prisma.order.create({
    data: {
      orderNumber: data.orderNumber,
      creatorId: data.creatorId,
      brandId: data.brandId,
      buyerId: data.buyerId || undefined,
      buyerName: data.buyerName,
      buyerPhone: data.buyerPhone,
      buyerEmail: data.buyerEmail,
      shippingAddress: data.shippingAddress,
      totalAmount: data.totalAmount,
      shippingFee: data.shippingFee,
      status: 'PENDING',
    },
  })

  // Create order items
  const orderItems = await Promise.all(
    data.items.map((item) =>
      prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          productName: item.productName,
          productImage: item.productImage,
        },
      })
    )
  )

  // Create conversions with DB-resolved commission rates
  await prisma.conversion.createMany({
    data: orderItems.map((orderItem, index) => {
      const sourceItem = data.items[index]
      const rate = getCommissionRate(sourceItem)
      return {
        orderId: order.id,
        orderItemId: orderItem.id,
        creatorId: data.creatorId,
        conversionType: data.conversionType,
        orderAmount: orderItem.totalPrice,
        commissionRate: rate,
        commissionAmount: Math.round(Number(orderItem.totalPrice) * rate),
        status: 'PENDING',
      }
    }),
  })

  // --- 3채널 알림 발송 ---
  try {
    const firstItemName = data.items[0]?.productName || '상품'
    const totalQty = data.items.reduce((sum, i) => sum + i.quantity, 0)

    // 구매자 정보
    const buyerUser = data.buyerId
      ? await prisma.user.findUnique({ where: { id: data.buyerId }, select: { phone: true, email: true } })
      : null

    // 주문 완료 → 구매자
    if (data.buyerId) {
      const orderTemplate = orderCompleteMessage({
        buyerName: data.buyerName,
        orderNumber: order.orderNumber ?? '',
        productName: firstItemName,
        totalAmount: Number(data.totalAmount),
      })
      await sendNotification({
        userId: data.buyerId,
        type: orderTemplate.inApp.type,
        title: orderTemplate.inApp.title,
        message: orderTemplate.inApp.message,
        linkUrl: orderTemplate.inApp.linkUrl,
        phone: buyerUser?.phone ?? undefined,
        email: data.buyerEmail || (buyerUser?.email ?? undefined),
        receiverName: data.buyerName,
        kakaoTemplate: orderTemplate.kakao,
        emailTemplate: orderTemplate.email,
      })
    }

    // 주문 발생 → 브랜드
    const brand = await prisma.brand.findUnique({
      where: { id: data.brandId },
      select: { userId: true, brandName: true, contactPhone: true, contactEmail: true },
    })
    if (brand) {
      const brandTemplate = newOrderBrandMessage({
        brandName: brand.brandName ?? '',
        orderNumber: order.orderNumber ?? '',
        productName: firstItemName,
        quantity: totalQty,
        totalAmount: Number(data.totalAmount),
        buyerName: data.buyerName,
      })
      await sendNotification({
        userId: brand.userId,
        type: brandTemplate.inApp.type,
        title: brandTemplate.inApp.title,
        message: brandTemplate.inApp.message,
        linkUrl: brandTemplate.inApp.linkUrl,
        phone: brand.contactPhone ?? undefined,
        email: brand.contactEmail ?? undefined,
        receiverName: brand.brandName ?? undefined,
        kakaoTemplate: brandTemplate.kakao,
        emailTemplate: brandTemplate.email,
      })
    }

    // 판매 발생 → 크리에이터
    const creator = await prisma.creator.findUnique({
      where: { id: data.creatorId },
      select: { userId: true, displayName: true, phone: true, email: true },
    })
    if (creator) {
      const firstRate = orderItems.length > 0
        ? getCommissionRate(data.items[0])
        : 0
      const commissionAmount = Math.round(Number(data.totalAmount) * firstRate)
      const saleTemplate = saleOccurredMessage({
        creatorName: creator.displayName ?? '',
        productName: firstItemName,
        orderAmount: Number(data.totalAmount),
        commissionAmount,
      })
      await sendNotification({
        userId: creator.userId,
        type: saleTemplate.inApp.type,
        title: saleTemplate.inApp.title,
        message: saleTemplate.inApp.message,
        linkUrl: saleTemplate.inApp.linkUrl,
        phone: creator.phone ?? undefined,
        email: creator.email ?? undefined,
        receiverName: creator.displayName ?? undefined,
        kakaoTemplate: saleTemplate.kakao,
        emailTemplate: saleTemplate.email,
      })
    }
  } catch (err) {
    console.error('[shop/createOrder] 알림 발송 실패:', err)
  }

  return { id: order.id, orderNumber: order.orderNumber }
}

// ==================== Order Lookup ====================

export async function lookupOrder(orderNumber: string, buyerPhone: string) {
  const order = await prisma.order.findFirst({
    where: {
      orderNumber: orderNumber.trim(),
      buyerPhone: buyerPhone.trim(),
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              thumbnailUrl: true,
              images: true,
              brand: {
                select: {
                  id: true,
                  brandName: true,
                },
              },
            },
          },
        },
      },
    },
  })

  return order
}
