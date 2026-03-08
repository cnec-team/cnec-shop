'use server'

import { prisma } from '@/lib/db'

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
  commissionRates: Record<string, number>
}) {
  // Create order
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

  // Create conversions
  await prisma.conversion.createMany({
    data: orderItems.map((item) => ({
      orderId: order.id,
      orderItemId: item.id,
      creatorId: data.creatorId,
      conversionType: data.conversionType,
      orderAmount: item.totalPrice,
      commissionRate: data.commissionRates[item.productId] || 0.03,
      commissionAmount: Math.round(
        Number(item.totalPrice) * (data.commissionRates[item.productId] || 0.03)
      ),
      status: 'PENDING',
    })),
  })

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
