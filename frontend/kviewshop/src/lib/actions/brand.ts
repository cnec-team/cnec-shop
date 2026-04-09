'use server'

import { prisma } from '@/lib/db'
import { ShippingFeeType } from '@/generated/prisma/client'
import { auth } from '@/lib/auth'
import { sendNotification } from '@/lib/notifications'
import {
  shippingStartMessage,
  deliveryCompleteMessage,
  campaignApprovedMessage,
  campaignStartedMessage,
} from '@/lib/notifications/templates'

async function requireBrand() {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  const brand = await prisma.brand.findFirst({
    where: { userId: session.user.id },
  })

  if (!brand) throw new Error('Brand not found')
  return { user: session.user, brand }
}

// ==================== Auth Helper (exposed for client) ====================

export async function getBrandSession() {
  const session = await auth()
  if (!session?.user) return null

  const brand = await prisma.brand.findFirst({
    where: { userId: session.user.id },
  })

  return brand
}

// ==================== Dashboard ====================

export async function getBrandDashboardData(brandId: string) {
  const { brand } = await requireBrand()
  if (brand.id !== brandId) throw new Error('Forbidden')

  const [campaigns, orders, productCount, conversions] = await Promise.all([
    prisma.campaign.findMany({
      where: { brandId: brand.id },
      select: {
        id: true,
        type: true,
        status: true,
        title: true,
        description: true,
        startAt: true,
        endAt: true,
        soldCount: true,
        totalStock: true,
        targetParticipants: true,
        commissionRate: true,
        recruitmentType: true,
        brandId: true,
        createdAt: true,
      },
    }),
    prisma.order.findMany({
      where: { brandId: brand.id },
      select: {
        id: true,
        totalAmount: true,
        status: true,
        creatorId: true,
      },
    }),
    prisma.product.count({
      where: { brandId: brand.id, status: 'ACTIVE' },
    }),
    prisma.conversion.findMany({
      where: { status: 'CONFIRMED' },
      select: { commissionAmount: true, orderId: true },
    }),
  ])

  const campaignIds = campaigns.map((c) => c.id)
  const orderIds = orders.map((o) => o.id)

  // Filter conversions to only those for this brand's orders
  const brandConversions = conversions.filter((c) =>
    orderIds.includes(c.orderId)
  )
  const totalCommission = brandConversions.reduce(
    (sum, c) => sum + Number(c.commissionAmount),
    0
  )

  // Get participations for brand's campaigns
  const participations = campaignIds.length > 0
    ? await prisma.campaignParticipation.findMany({
        where: {
          campaignId: { in: campaignIds },
          status: 'APPROVED',
        },
        select: { creatorId: true },
      })
    : []

  const uniqueCreatorIds = [...new Set(participations.map((p) => p.creatorId))]

  // Get visits count
  let totalVisits = 0
  if (uniqueCreatorIds.length > 0) {
    totalVisits = await prisma.shopVisit.count({
      where: { creatorId: { in: uniqueCreatorIds } },
    })
  }

  // Calculate stats
  const validOrders = orders.filter((o) => o.status !== 'CANCELLED')
  const totalRevenue = validOrders.reduce(
    (sum, o) => sum + Number(o.totalAmount),
    0
  )
  const totalOrders = validOrders.length
  const activeCampaigns = campaigns.filter(
    (c) => c.status === 'ACTIVE' || c.status === 'RECRUITING'
  ).length

  const stats = {
    totalVisits,
    totalOrders,
    totalRevenue,
    totalCommission,
    conversionRate:
      totalVisits > 0
        ? Math.round((totalOrders / totalVisits) * 10000) / 100
        : 0,
    activeCampaigns,
    activeCreators: uniqueCreatorIds.length,
    productCount,
  }

  // Active gonggu campaign
  const activeGonggu = campaigns.find(
    (c) => c.type === 'GONGGU' && c.status === 'ACTIVE'
  )

  // Creator sales ranking from orders
  const creatorSalesMap = new Map<
    string,
    { totalSales: number; orderCount: number }
  >()
  for (const order of validOrders) {
    if (order.creatorId) {
      const existing = creatorSalesMap.get(order.creatorId) ?? {
        totalSales: 0,
        orderCount: 0,
      }
      existing.totalSales += Number(order.totalAmount)
      existing.orderCount += 1
      creatorSalesMap.set(order.creatorId, existing)
    }
  }

  const topCreatorIds = Array.from(creatorSalesMap.entries())
    .sort((a, b) => b[1].totalSales - a[1].totalSales)
    .slice(0, 10)
    .map(([id]) => id)

  let creatorRankings: Array<{
    creator: { id: string; displayName: string | null }
    totalSales: number
    orderCount: number
  }> = []

  if (topCreatorIds.length > 0) {
    const creators = await prisma.creator.findMany({
      where: { id: { in: topCreatorIds } },
      select: { id: true, displayName: true },
    })

    creatorRankings = creators
      .map((creator) => ({
        creator,
        ...(creatorSalesMap.get(creator.id) ?? {
          totalSales: 0,
          orderCount: 0,
        }),
      }))
      .sort((a, b) => b.totalSales - a.totalSales)
  }

  return {
    stats,
    activeGonggu: activeGonggu
      ? {
          ...activeGonggu,
          startAt: activeGonggu.startAt?.toISOString() ?? null,
          endAt: activeGonggu.endAt?.toISOString() ?? null,
          createdAt: activeGonggu.createdAt.toISOString(),
        }
      : null,
    creatorRankings,
  }
}

// ==================== Campaigns ====================

export async function getBrandCampaigns(
  brandId: string,
  type: 'ALWAYS' | 'GONGGU'
) {
  const { brand } = await requireBrand()
  if (brand.id !== brandId) throw new Error('Forbidden')

  const campaigns = await prisma.campaign.findMany({
    where: { brandId: brand.id, type },
    orderBy: { createdAt: 'desc' },
    include: {
      products: {
        include: {
          product: true,
        },
      },
    },
  })

  return campaigns.map((c) => ({
    ...c,
    startAt: c.startAt?.toISOString() ?? null,
    endAt: c.endAt?.toISOString() ?? null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    products: c.products.map((cp) => ({
      ...cp,
      product: cp.product,
    })),
  }))
}

export async function getActiveProducts(brandId: string) {
  const { brand } = await requireBrand()
  if (brand.id !== brandId) throw new Error('Forbidden')

  return prisma.product.findMany({
    where: { brandId: brand.id, status: 'ACTIVE' },
    orderBy: { name: 'asc' },
  })
}

export async function createCampaign(data: {
  brandId: string
  type: string
  title: string
  description?: string
  recruitmentType: string
  commissionRate: number
  totalStock?: number
  targetParticipants?: number
  conditions?: string
  startAt?: string
  endAt?: string
  products: Array<{
    productId: string
    campaignPrice: number
    perCreatorLimit?: number
  }>
}) {
  const { brand } = await requireBrand()
  if (brand.id !== data.brandId) throw new Error('Forbidden')

  // Convert commission rate: if > 1 treat as percentage (e.g. 10 → 0.10)
  const commRate = data.commissionRate > 1
    ? data.commissionRate / 100
    : data.commissionRate
  const clampedCommRate = Math.min(Math.max(commRate, 0), 0.9999)

  const campaign = await prisma.campaign.create({
    data: {
      brandId: brand.id,
      type: data.type as any,
      title: data.title,
      description: data.description ?? null,
      status: 'DRAFT',
      recruitmentType: data.recruitmentType,
      commissionRate: clampedCommRate,
      soldCount: 0,
      totalStock: data.totalStock ?? null,
      targetParticipants: data.targetParticipants ?? null,
      conditions: data.conditions ?? null,
      startAt: data.startAt ? new Date(data.startAt) : null,
      endAt: data.endAt ? new Date(data.endAt) : null,
    },
  })

  if (data.products.length > 0) {
    await prisma.campaignProduct.createMany({
      data: data.products.map((p) => ({
        campaignId: campaign.id,
        productId: p.productId,
        campaignPrice: p.campaignPrice,
        perCreatorLimit: p.perCreatorLimit ?? null,
      })),
    })
  }

  return campaign
}

// ==================== Creators ====================

export async function getBrandCreatorsData(brandId: string) {
  const { brand } = await requireBrand()
  if (brand.id !== brandId) throw new Error('Forbidden')

  // Get brand campaigns
  const campaigns = await prisma.campaign.findMany({
    where: { brandId: brand.id },
    select: { id: true, title: true, type: true, status: true },
  })

  const campaignIds = campaigns.map((c) => c.id)
  if (campaignIds.length === 0) {
    return { creators: [], pendingCount: 0 }
  }

  // Get participations with creator data
  const participations = await prisma.campaignParticipation.findMany({
    where: { campaignId: { in: campaignIds } },
    select: {
      id: true,
      campaignId: true,
      creatorId: true,
      status: true,
      appliedAt: true,
    },
  })

  const pendingCount = participations.filter((p) => p.status === 'PENDING').length

  // Get orders per creator
  const orders = await prisma.order.findMany({
    where: { brandId: brand.id, status: { not: 'CANCELLED' } },
    select: { creatorId: true, totalAmount: true },
  })

  const ordersByCreator = new Map<string, { count: number; total: number }>()
  for (const order of orders) {
    if (!order.creatorId) continue
    const existing = ordersByCreator.get(order.creatorId) ?? {
      count: 0,
      total: 0,
    }
    existing.count += 1
    existing.total += Number(order.totalAmount)
    ordersByCreator.set(order.creatorId, existing)
  }

  // Get unique creator IDs
  const creatorIds = [...new Set(participations.map((p) => p.creatorId))]
  if (creatorIds.length === 0) {
    return { creators: [], pendingCount }
  }

  const creators = await prisma.creator.findMany({
    where: { id: { in: creatorIds } },
    select: {
      id: true,
      shopId: true,
      displayName: true,
      profileImageUrl: true,
      instagramHandle: true,
      youtubeHandle: true,
      tiktokHandle: true,
      skinType: true,
      skinConcerns: true,
    },
  })

  const campaignMap = new Map(campaigns.map((c) => [c.id, c]))

  const creatorData = creators.map((creator) => {
    const creatorParticipations = participations
      .filter((p) => p.creatorId === creator.id)
      .map((p) => ({
        campaign: campaignMap.get(p.campaignId) ?? null,
        status: p.status,
        appliedAt: p.appliedAt.toISOString(),
      }))

    const orderStats = ordersByCreator.get(creator.id) ?? {
      count: 0,
      total: 0,
    }

    return {
      creator,
      campaigns: creatorParticipations,
      totalOrders: orderStats.count,
      totalSales: orderStats.total,
    }
  })

  return { creators: creatorData, pendingCount }
}

export async function getPendingParticipations(brandId: string) {
  const { brand } = await requireBrand()
  if (brand.id !== brandId) throw new Error('Forbidden')

  const campaigns = await prisma.campaign.findMany({
    where: { brandId: brand.id },
    select: {
      id: true,
      title: true,
      type: true,
      status: true,
      commissionRate: true,
      recruitmentType: true,
    },
  })

  const campaignIds = campaigns.map((c) => c.id)
  if (campaignIds.length === 0) return []

  const participations = await prisma.campaignParticipation.findMany({
    where: {
      campaignId: { in: campaignIds },
      status: 'PENDING',
    },
    orderBy: { appliedAt: 'asc' },
  })

  const creatorIds = [...new Set(participations.map((p) => p.creatorId))]
  const creators = creatorIds.length > 0
    ? await prisma.creator.findMany({
        where: { id: { in: creatorIds } },
      })
    : []

  const creatorMap = new Map(creators.map((c) => [c.id, c]))
  const campaignMap = new Map(campaigns.map((c) => [c.id, c]))

  return participations.map((p) => ({
    participation: {
      ...p,
      appliedAt: p.appliedAt.toISOString(),
      approvedAt: p.approvedAt?.toISOString() ?? null,
    },
    creator: creatorMap.get(p.creatorId) ?? null,
    campaign: campaignMap.get(p.campaignId) ?? null,
  }))
}

export async function handleParticipationAction(
  participationId: string,
  action: 'APPROVED' | 'REJECTED'
) {
  await requireBrand()

  const updateData: Record<string, unknown> = { status: action }
  if (action === 'APPROVED') {
    updateData.approvedAt = new Date()
  }

  const participation = await prisma.campaignParticipation.update({
    where: { id: participationId },
    data: updateData,
  })

  // 캠페인 승인 알림 → 크리에이터
  if (action === 'APPROVED') {
    try {
      const campaign = await prisma.campaign.findUnique({
        where: { id: participation.campaignId },
        select: { title: true, brandId: true },
      })
      if (campaign) {
        const brand = await prisma.brand.findUnique({
          where: { id: campaign.brandId },
          select: { brandName: true },
        })
        const creator = await prisma.creator.findUnique({
          where: { id: participation.creatorId },
          select: { userId: true, displayName: true, phone: true, email: true },
        })
        if (creator) {
          const template = campaignApprovedMessage({
            creatorName: creator.displayName ?? '',
            brandName: brand?.brandName ?? '',
            campaignTitle: campaign.title ?? '',
          })
          await sendNotification({
            userId: creator.userId,
            type: template.inApp.type,
            title: template.inApp.title,
            message: template.inApp.message,
            linkUrl: template.inApp.linkUrl,
            phone: creator.phone ?? undefined,
            email: creator.email ?? undefined,
            receiverName: creator.displayName ?? undefined,
            kakaoTemplate: template.kakao,
            emailTemplate: template.email,
          })
        }
      }
    } catch (err) {
      console.error('[brand/handleParticipationAction] 알림 발송 실패:', err)
    }
  }

  return participation
}

export async function getCreatorPerformance(
  brandId: string,
  period: 'this_month' | 'last_month' | 'all'
) {
  const { brand } = await requireBrand()
  if (brand.id !== brandId) throw new Error('Forbidden')

  function getMonthRange(p: string): {
    start: Date | null
    end: Date | null
  } {
    const now = new Date()
    if (p === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      return { start, end }
    }
    if (p === 'last_month') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
      return { start, end }
    }
    return { start: null, end: null }
  }

  const { start, end } = getMonthRange(period)

  const orderWhere: Record<string, unknown> = {
    brandId: brand.id,
    status: { not: 'CANCELLED' },
  }
  if (start && end) {
    orderWhere.createdAt = { gte: start, lte: end }
  }

  const orders = await prisma.order.findMany({
    where: orderWhere as any,
    select: { id: true, creatorId: true, totalAmount: true },
  })

  // Group by creator
  const creatorMap = new Map<string, { count: number; total: number }>()
  for (const order of orders) {
    if (!order.creatorId) continue
    const existing = creatorMap.get(order.creatorId) ?? {
      count: 0,
      total: 0,
    }
    existing.count += 1
    existing.total += Number(order.totalAmount)
    creatorMap.set(order.creatorId, existing)
  }

  const creatorIds = Array.from(creatorMap.keys())
  if (creatorIds.length === 0) return []

  const creators = await prisma.creator.findMany({
    where: { id: { in: creatorIds } },
  })

  // Get visits per creator
  const visitWhere: Record<string, unknown> = {
    creatorId: { in: creatorIds },
  }
  if (start && end) {
    visitWhere.visitedAt = { gte: start, lte: end }
  }

  const visitCounts = await Promise.all(
    creatorIds.map(async (cid) => {
      const where: Record<string, unknown> = { creatorId: cid }
      if (start && end) {
        where.visitedAt = { gte: start, lte: end }
      }
      const count = await prisma.shopVisit.count({ where: where as any })
      return { creatorId: cid, count }
    })
  )

  const visitMap = new Map(visitCounts.map((v) => [v.creatorId, v.count]))

  return creators.map((creator) => {
    const orderStats = creatorMap.get(creator.id) ?? { count: 0, total: 0 }
    const visitCount = visitMap.get(creator.id) ?? 0
    return {
      creator,
      orderCount: orderStats.count,
      totalSales: orderStats.total,
      visitCount,
      conversionRate:
        visitCount > 0
          ? Math.round((orderStats.count / visitCount) * 10000) / 100
          : 0,
    }
  })
}

// ==================== Orders ====================

export async function getBrandOrders(
  brandId: string,
  statusFilter?: string
) {
  const { brand } = await requireBrand()
  if (brand.id !== brandId) throw new Error('Forbidden')

  const where: Record<string, unknown> = { brandId: brand.id }
  if (statusFilter && statusFilter !== 'ALL') {
    where.status = statusFilter
  }

  return prisma.order.findMany({
    where: where as any,
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: {
          product: {
            select: { name: true },
          },
        },
      },
      creator: true,
    },
  })
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: string,
  trackingNumber?: string,
  courierCode?: string
) {
  await requireBrand()

  const updateData: Record<string, unknown> = { status: newStatus }

  if (newStatus === 'SHIPPING') {
    updateData.shippedAt = new Date()
    if (trackingNumber) updateData.trackingNumber = trackingNumber
    if (courierCode) updateData.courierCode = courierCode
  }
  if (newStatus === 'DELIVERED') {
    updateData.deliveredAt = new Date()
  }
  if (newStatus === 'CONFIRMED') {
    updateData.confirmedAt = new Date()
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: updateData,
    include: {
      items: { select: { productName: true } },
    },
  })

  // 배송 완료 알림 → 구매자
  if (newStatus === 'DELIVERED') {
    try {
      const productName = updatedOrder.items[0]?.productName ?? '상품'
      const buyerUser = updatedOrder.buyerId
        ? await prisma.user.findUnique({ where: { id: updatedOrder.buyerId }, select: { phone: true, email: true } })
        : null
      const template = deliveryCompleteMessage({
        buyerName: updatedOrder.buyerName ?? '',
        orderNumber: updatedOrder.orderNumber ?? '',
        productName,
      })
      if (updatedOrder.buyerId) {
        await sendNotification({
          userId: updatedOrder.buyerId,
          type: template.inApp.type,
          title: template.inApp.title,
          message: template.inApp.message,
          linkUrl: template.inApp.linkUrl,
          phone: updatedOrder.buyerPhone ?? buyerUser?.phone ?? undefined,
          email: updatedOrder.buyerEmail ?? buyerUser?.email ?? undefined,
          receiverName: updatedOrder.buyerName ?? undefined,
          kakaoTemplate: template.kakao,
          emailTemplate: template.email,
        })
      }
    } catch (err) {
      console.error('[brand/updateOrderStatus] 알림 발송 실패:', err)
    }
  }

  return updatedOrder
}

export async function cancelOrder(orderId: string, cancelReason: string) {
  await requireBrand()

  return prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancelReason,
    },
  })
}

export async function handleShippingStart(
  orderId: string,
  trackingNumber: string,
  courierCode?: string
) {
  await requireBrand()

  const updateData: Record<string, unknown> = {
    status: 'SHIPPING',
    shippedAt: new Date(),
    trackingNumber: trackingNumber.trim(),
  }
  if (courierCode) {
    updateData.courierCode = courierCode
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: updateData,
    include: {
      items: { select: { productName: true } },
    },
  })

  // 배송 시작 알림 → 구매자
  try {
    const productName = updatedOrder.items[0]?.productName ?? '상품'
    const buyerUser = updatedOrder.buyerId
      ? await prisma.user.findUnique({ where: { id: updatedOrder.buyerId }, select: { phone: true, email: true } })
      : null
    const template = shippingStartMessage({
      buyerName: updatedOrder.buyerName ?? '',
      orderNumber: updatedOrder.orderNumber ?? '',
      productName,
      trackingNumber: trackingNumber.trim(),
      courierName: courierCode,
    })
    const notifyUserId = updatedOrder.buyerId ?? updatedOrder.buyerEmail
    if (notifyUserId) {
      await sendNotification({
        userId: updatedOrder.buyerId ?? '',
        type: template.inApp.type,
        title: template.inApp.title,
        message: template.inApp.message,
        linkUrl: template.inApp.linkUrl,
        phone: updatedOrder.buyerPhone ?? buyerUser?.phone ?? undefined,
        email: updatedOrder.buyerEmail ?? buyerUser?.email ?? undefined,
        receiverName: updatedOrder.buyerName ?? undefined,
        kakaoTemplate: template.kakao,
        emailTemplate: template.email,
      })
    }
  } catch (err) {
    console.error('[brand/handleShippingStart] 알림 발송 실패:', err)
  }

  return updatedOrder
}

export async function updateTrackingInfo(
  orderId: string,
  trackingNumber: string,
  courierCode?: string
) {
  await requireBrand()

  const updateData: Record<string, unknown> = {
    trackingNumber: trackingNumber.trim(),
  }
  if (courierCode) {
    updateData.courierCode = courierCode
  }

  return prisma.order.update({
    where: { id: orderId },
    data: updateData,
  })
}

// ==================== Products ====================

export async function getBrandProducts(
  brandId: string,
  statusFilter?: string,
  categoryFilter?: string
) {
  const { brand } = await requireBrand()
  if (brand.id !== brandId) throw new Error('Forbidden')

  const where: Record<string, unknown> = { brandId: brand.id }
  if (statusFilter && statusFilter !== 'ALL') {
    where.status = statusFilter
  }
  if (categoryFilter && categoryFilter !== 'ALL') {
    where.category = categoryFilter
  }

  return prisma.product.findMany({
    where: where as any,
    orderBy: { createdAt: 'desc' },
  })
}

export async function getBrandProductById(productId: string) {
  const { brand } = await requireBrand()

  const product = await prisma.product.findUnique({
    where: { id: productId },
  })

  if (!product || product.brandId !== brand.id) {
    return null
  }

  return product
}

export async function updateProduct(
  productId: string,
  data: {
    name?: string
    category?: string
    description?: string | null
    originalPrice?: number
    salePrice?: number
    stock?: number
    images?: string[]
    thumbnailUrl?: string | null
    volume?: string | null
    ingredients?: string | null
    howToUse?: string | null
    shippingFeeType?: string
    shippingFee?: number
    freeShippingThreshold?: number | null
    courier?: string | null
    shippingInfo?: string | null
    returnPolicy?: string | null
    status?: string
    allowCreatorPick?: boolean
    defaultCommissionRate?: number
  }
) {
  const { brand } = await requireBrand()

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { brandId: true },
  })
  if (!product || product.brandId !== brand.id) throw new Error('Forbidden')

  const updateData: Record<string, unknown> = {}

  if (data.name !== undefined) updateData.name = data.name
  if (data.category !== undefined) updateData.category = data.category
  if (data.description !== undefined) updateData.description = data.description
  if (data.originalPrice !== undefined) updateData.originalPrice = data.originalPrice
  if (data.salePrice !== undefined) updateData.salePrice = data.salePrice
  if (data.stock !== undefined) updateData.stock = data.stock
  if (data.images !== undefined) updateData.images = data.images
  if (data.thumbnailUrl !== undefined) updateData.thumbnailUrl = data.thumbnailUrl
  if (data.volume !== undefined) updateData.volume = data.volume
  if (data.ingredients !== undefined) updateData.ingredients = data.ingredients
  if (data.howToUse !== undefined) updateData.howToUse = data.howToUse
  if (data.shippingFeeType !== undefined) updateData.shippingFeeType = data.shippingFeeType
  if (data.shippingFee !== undefined) updateData.shippingFee = data.shippingFee
  if (data.freeShippingThreshold !== undefined) updateData.freeShippingThreshold = data.freeShippingThreshold
  if (data.courier !== undefined) updateData.courier = data.courier
  if (data.shippingInfo !== undefined) updateData.shippingInfo = data.shippingInfo
  if (data.returnPolicy !== undefined) updateData.returnPolicy = data.returnPolicy
  if (data.status !== undefined) updateData.status = data.status
  if (data.allowCreatorPick !== undefined) updateData.allowCreatorPick = data.allowCreatorPick
  if (data.defaultCommissionRate !== undefined) {
    const rate = data.defaultCommissionRate > 1
      ? data.defaultCommissionRate / 100
      : data.defaultCommissionRate
    updateData.defaultCommissionRate = Math.min(Math.max(rate, 0), 0.9999)
  }

  return prisma.product.update({
    where: { id: productId },
    data: updateData as any,
  })
}

export async function createProduct(data: {
  brandId: string
  name: string
  category: string
  description?: string
  originalPrice: number
  salePrice: number
  stock: number
  images: string[]
  thumbnailUrl?: string
  volume?: string
  ingredients?: string
  howToUse?: string
  detailUrl?: string
  shippingFeeType: string
  shippingFee: number
  freeShippingThreshold?: number
  courier?: string
  shippingInfo?: string
  returnPolicy?: string
  status: string
  allowCreatorPick: boolean
  defaultCommissionRate: number
}) {
  const { brand } = await requireBrand()
  if (brand.id !== data.brandId) throw new Error('Forbidden')

  // Convert commission rate: if > 1 treat as percentage (e.g. 10 → 0.10)
  const rate = data.defaultCommissionRate > 1
    ? data.defaultCommissionRate / 100
    : data.defaultCommissionRate
  const clampedRate = Math.min(Math.max(rate, 0), 0.9999)

  return prisma.product.create({
    data: {
      brandId: brand.id,
      name: data.name,
      category: data.category,
      description: data.description ?? null,
      originalPrice: data.originalPrice,
      salePrice: data.salePrice,
      stock: data.stock,
      images: data.images,
      thumbnailUrl: data.thumbnailUrl ?? null,
      volume: data.volume ?? null,
      ingredients: data.ingredients ?? null,
      howToUse: data.howToUse ?? null,
      detailUrl: data.detailUrl ?? null,
      shippingFeeType: data.shippingFeeType as ShippingFeeType | undefined,
      shippingFee: data.shippingFee,
      freeShippingThreshold: data.freeShippingThreshold ?? null,
      courier: data.courier ?? null,
      shippingInfo: data.shippingInfo ?? null,
      returnPolicy: data.returnPolicy ?? null,
      status: data.status,
      allowCreatorPick: data.allowCreatorPick,
      defaultCommissionRate: clampedRate,
    },
  })
}

export async function bulkCreateProducts(
  brandId: string,
  products: Array<{
    name: string
    category: string
    originalPrice: number
    salePrice: number
    stock: number
    defaultCommissionRate: number
    description?: string
    images: string[]
    thumbnailUrl?: string
    allowCreatorPick: boolean
    status: string
    shippingFeeType: string
    shippingFee: number
  }>
) {
  const { brand } = await requireBrand()
  if (brand.id !== brandId) throw new Error('Forbidden')

  return prisma.product.createMany({
    data: products.map((p) => {
      const rate = p.defaultCommissionRate > 1
        ? p.defaultCommissionRate / 100
        : p.defaultCommissionRate
      return {
        brandId: brand.id,
        name: p.name,
        category: p.category,
        originalPrice: p.originalPrice,
        salePrice: p.salePrice,
        stock: p.stock,
        defaultCommissionRate: Math.min(Math.max(rate, 0), 0.9999),
        description: p.description ?? null,
        images: p.images,
        thumbnailUrl: p.thumbnailUrl ?? null,
        allowCreatorPick: p.allowCreatorPick,
        status: p.status,
        shippingFeeType: p.shippingFeeType as ShippingFeeType,
        shippingFee: p.shippingFee,
      }
    }),
  })
}

// ==================== Settings ====================

export async function getBrandSettings() {
  const { brand } = await requireBrand()
  return brand
}

export async function updateBrandSettings(data: {
  section?: string
  // General
  brandName?: string
  businessNumber?: string
  contactEmail?: string
  contactPhone?: string
  // Commission
  creatorCommissionRate?: number
  enableTieredCommission?: boolean
  tier1Rate?: number
  tier2Rate?: number
  tier3Rate?: number
  tier4Rate?: number
  // Settlement
  settlementCycle?: string
  minimumPayout?: number
  bankName?: string
  accountNumber?: string
  accountHolder?: string
  // Shipping countries
  shippingCountries?: string[]
  // Certifications
  certifications?: unknown
  // Brand lines
  brandLines?: unknown
  // Product & Shipping defaults
  defaultShippingFee?: number
  freeShippingThreshold?: number
  defaultCourier?: string
  returnAddress?: string
  exchangePolicy?: string
}) {
  const { brand } = await requireBrand()

  const updateData: Record<string, unknown> = {}
  const section = data.section

  if (section === 'shipping' || !section) {
    if (data.shippingCountries !== undefined) {
      updateData.shippingCountries = data.shippingCountries
    }
  }

  if (section === 'certifications' || !section) {
    if (data.certifications !== undefined) {
      updateData.certifications = data.certifications
    }
  }

  if (section === 'brand_lines' || !section) {
    if (data.brandLines !== undefined) {
      updateData.brandLines = data.brandLines
    }
  }

  if (section === 'product_shipping' || !section) {
    if (data.defaultShippingFee !== undefined)
      updateData.defaultShippingFee = data.defaultShippingFee
    if (data.freeShippingThreshold !== undefined)
      updateData.freeShippingThreshold = data.freeShippingThreshold
    if (data.defaultCourier !== undefined)
      updateData.defaultCourier = data.defaultCourier
    if (data.returnAddress !== undefined)
      updateData.returnAddress = data.returnAddress
    if (data.exchangePolicy !== undefined)
      updateData.exchangePolicy = data.exchangePolicy
  }

  if (
    section === 'general' ||
    section === 'commission' ||
    section === 'settlement' ||
    !section
  ) {
    if (data.brandName !== undefined) updateData.brandName = data.brandName
    if (data.businessNumber !== undefined)
      updateData.businessNumber = data.businessNumber
    if (data.contactEmail !== undefined)
      updateData.contactEmail = data.contactEmail
    if (data.contactPhone !== undefined)
      updateData.contactPhone = data.contactPhone
    if (data.creatorCommissionRate !== undefined)
      updateData.creatorCommissionRate = data.creatorCommissionRate
    if (data.enableTieredCommission !== undefined)
      updateData.enableTieredCommission = data.enableTieredCommission
    if (data.tier1Rate !== undefined) updateData.tier1Rate = data.tier1Rate
    if (data.tier2Rate !== undefined) updateData.tier2Rate = data.tier2Rate
    if (data.tier3Rate !== undefined) updateData.tier3Rate = data.tier3Rate
    if (data.tier4Rate !== undefined) updateData.tier4Rate = data.tier4Rate
    if (data.settlementCycle !== undefined)
      updateData.settlementCycle = data.settlementCycle
    if (data.minimumPayout !== undefined)
      updateData.minimumPayout = data.minimumPayout
    if (data.bankName !== undefined) updateData.bankName = data.bankName
    if (data.accountNumber !== undefined)
      updateData.accountNumber = data.accountNumber
    if (data.accountHolder !== undefined)
      updateData.accountHolder = data.accountHolder
  }

  return prisma.brand.update({
    where: { id: brand.id },
    data: updateData,
  })
}

// ==================== Settlements ====================

export async function getBrandSettlements(brandId: string) {
  const { brand } = await requireBrand()
  if (brand.id !== brandId) throw new Error('Forbidden')

  // Get orders for this brand
  const orders = await prisma.order.findMany({
    where: {
      brandId: brand.id,
      status: { in: ['CONFIRMED', 'DELIVERED'] },
    },
    select: { id: true, creatorId: true, totalAmount: true },
  })

  const orderIds = orders.map((o) => o.id)

  // Get conversions
  const conversions =
    orderIds.length > 0
      ? await prisma.conversion.findMany({
          where: { orderId: { in: orderIds } },
        })
      : []

  // Group by creator
  const creatorMap = new Map<
    string,
    { count: number; sales: number; commission: number }
  >()
  for (const conv of conversions) {
    const existing = creatorMap.get(conv.creatorId) ?? {
      count: 0,
      sales: 0,
      commission: 0,
    }
    existing.count += 1
    existing.sales += Number(conv.orderAmount)
    existing.commission += Number(conv.commissionAmount)
    creatorMap.set(conv.creatorId, existing)
  }

  const creatorIds = Array.from(creatorMap.keys())
  const creators =
    creatorIds.length > 0
      ? await prisma.creator.findMany({
          where: { id: { in: creatorIds } },
          select: { id: true, displayName: true },
        })
      : []

  const creatorNameMap = new Map(
    creators.map((c) => [c.id, c.displayName])
  )

  const platformFeeRate = Number(brand.platformFeeRate)

  const settlements = Array.from(creatorMap.entries()).map(([id, data]) => {
    const platformFee = Math.round(data.sales * platformFeeRate)
    return {
      creatorName: creatorNameMap.get(id) ?? '알 수 없음',
      orderCount: data.count,
      totalSales: data.sales,
      commissionAmount: data.commission,
      platformFee,
      netAmount: data.sales - data.commission - platformFee,
    }
  })

  settlements.sort((a, b) => b.totalSales - a.totalSales)

  const totalRevenue = settlements.reduce((sum, r) => sum + r.totalSales, 0)
  const totalCommission = settlements.reduce(
    (sum, r) => sum + r.commissionAmount,
    0
  )

  return {
    settlements,
    totalRevenue,
    totalPending: totalCommission,
    totalPaid: 0,
  }
}

// ==================== Support ====================

export async function getBrandSupportTickets() {
  const { brand } = await requireBrand()

  const tickets = await prisma.supportTicket.findMany({
    where: { brandId: brand.id },
    orderBy: { createdAt: 'desc' },
  })

  return tickets.map((t) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }))
}

export async function replySupportTicket(ticketId: string, response: string) {
  await requireBrand()

  return prisma.supportTicket.update({
    where: { id: ticketId },
    data: {
      response,
      status: 'resolved',
    },
  })
}

// ==================== Campaign Status ====================

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['RECRUITING', 'ENDED'],
  RECRUITING: ['ACTIVE', 'ENDED'],
  ACTIVE: ['ENDED'],
  ENDED: [],
}

export async function updateCampaignStatus(
  campaignId: string,
  newStatus: string
) {
  const { brand } = await requireBrand()

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      products: true,
      participations: {
        where: { status: 'APPROVED' },
        select: { creatorId: true },
      },
    },
  })

  if (!campaign || campaign.brandId !== brand.id) {
    throw new Error('Forbidden')
  }

  const allowed = ALLOWED_TRANSITIONS[campaign.status] ?? []
  if (!allowed.includes(newStatus)) {
    throw new Error(
      `Cannot transition from ${campaign.status} to ${newStatus}`
    )
  }

  // When activating: auto-add campaign products to approved creators' shops
  if (newStatus === 'ACTIVE' && campaign.participations.length > 0) {
    const existingItems = await prisma.creatorShopItem.findMany({
      where: { campaignId: campaign.id },
      select: { creatorId: true, productId: true },
    })
    const existingSet = new Set(
      existingItems.map((i) => `${i.creatorId}:${i.productId}`)
    )

    const newItems: Array<{
      creatorId: string
      productId: string
      campaignId: string
      type: string
      isVisible: boolean
    }> = []

    for (const p of campaign.participations) {
      for (const cp of campaign.products) {
        const key = `${p.creatorId}:${cp.productId}`
        if (!existingSet.has(key)) {
          newItems.push({
            creatorId: p.creatorId,
            productId: cp.productId,
            campaignId: campaign.id,
            type: campaign.type,
            isVisible: true,
          })
        }
      }
    }

    if (newItems.length > 0) {
      await prisma.creatorShopItem.createMany({ data: newItems })
    }
  }

  // When ending: hide campaign shop items
  if (newStatus === 'ENDED') {
    await prisma.creatorShopItem.updateMany({
      where: { campaignId: campaign.id },
      data: { isVisible: false },
    })
  }

  const updatedCampaign = await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: newStatus as any },
  })

  // 캠페인 시작 알림 → 참여 크리에이터들
  if (newStatus === 'ACTIVE' && campaign.participations.length > 0) {
    try {
      const brandInfo = await prisma.brand.findUnique({
        where: { id: campaign.brandId },
        select: { brandName: true },
      })
      const creatorIds = campaign.participations.map((p) => p.creatorId)
      const creators = await prisma.creator.findMany({
        where: { id: { in: creatorIds } },
        select: { id: true, userId: true, displayName: true, phone: true, email: true },
      })
      for (const creator of creators) {
        const template = campaignStartedMessage({
          creatorName: creator.displayName ?? '',
          brandName: brandInfo?.brandName ?? '',
          campaignTitle: campaign.title ?? '',
          endDate: campaign.endAt?.toISOString().slice(0, 10),
        })
        await sendNotification({
          userId: creator.userId,
          type: template.inApp.type,
          title: template.inApp.title,
          message: template.inApp.message,
          linkUrl: template.inApp.linkUrl,
          phone: creator.phone ?? undefined,
          email: creator.email ?? undefined,
          receiverName: creator.displayName ?? undefined,
          kakaoTemplate: template.kakao,
          emailTemplate: template.email,
        })
      }
    } catch (err) {
      console.error('[brand/updateCampaignStatus] 알림 발송 실패:', err)
    }
  }

  return updatedCampaign
}

export async function getBrandCampaignById(campaignId: string) {
  const { brand } = await requireBrand()

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      products: {
        include: { product: true },
      },
      participations: true,
    },
  })

  if (!campaign || campaign.brandId !== brand.id) return null

  // Get order stats for this campaign
  const orderStats = await prisma.orderItem.aggregate({
    where: { campaignId: campaign.id },
    _count: true,
    _sum: { totalPrice: true },
  })

  // Fetch creator profiles for participations
  const creatorIds = [...new Set(campaign.participations.map((p) => p.creatorId))]
  const creators = creatorIds.length > 0
    ? await prisma.creator.findMany({
        where: { id: { in: creatorIds } },
        select: {
          id: true,
          shopId: true,
          displayName: true,
          profileImageUrl: true,
          instagramHandle: true,
          youtubeHandle: true,
          tiktokHandle: true,
          skinType: true,
          skinConcerns: true,
          bio: true,
        },
      })
    : []
  const creatorMap = new Map(creators.map((c) => [c.id, c]))

  return {
    ...campaign,
    startAt: campaign.startAt?.toISOString() ?? null,
    endAt: campaign.endAt?.toISOString() ?? null,
    createdAt: campaign.createdAt.toISOString(),
    updatedAt: campaign.updatedAt.toISOString(),
    participations: campaign.participations.map((p) => ({
      ...p,
      appliedAt: p.appliedAt.toISOString(),
      approvedAt: p.approvedAt?.toISOString() ?? null,
      creator: creatorMap.get(p.creatorId) ?? null,
    })),
    orderCount: orderStats._count,
    totalGMV: Number(orderStats._sum.totalPrice ?? 0),
  }
}
