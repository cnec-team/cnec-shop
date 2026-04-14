'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { sendNotification } from '@/lib/notifications'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'super_admin') {
    throw new Error('Forbidden')
  }
  return session.user
}

// ==================== Brands ====================

export async function getAdminBrands() {
  await requireAdmin()
  return prisma.brand.findMany({
    orderBy: { createdAt: 'desc' },
  })
}

export async function approveBrand(id: string) {
  await requireAdmin()
  const brand = await prisma.brand.update({
    where: { id },
    data: { approved: true },
    select: { id: true, userId: true, companyName: true },
  })

  // 브랜드에게 승인 알림
  if (brand.userId) {
    sendNotification({
      userId: brand.userId,
      type: 'SYSTEM',
      title: '브랜드 승인 완료',
      message: `${brand.companyName ?? '브랜드'}가 승인되었어요. 지금 바로 상품을 등록해보세요!`,
      linkUrl: '/brand/products/new',
    })
  }

  return brand
}

// ==================== Creators ====================

export async function getAdminCreators() {
  await requireAdmin()
  return prisma.creator.findMany({
    orderBy: { createdAt: 'desc' },
  })
}

// ==================== Dashboard Stats ====================

export async function getAdminDashboardStats() {
  await requireAdmin()

  const [
    totalBrands,
    totalCreators,
    orders,
    activeCampaigns,
    pendingSettlements,
  ] = await Promise.all([
    prisma.brand.count(),
    prisma.creator.count(),
    prisma.order.findMany({ select: { totalAmount: true } }),
    prisma.campaign.count({
      where: { status: { in: ['RECRUITING', 'ACTIVE'] } },
    }),
    prisma.settlement.count({ where: { status: 'PENDING' } }),
  ])

  const totalGMV = orders.reduce(
    (sum, o) => sum + Number(o.totalAmount || 0),
    0
  )

  return {
    totalBrands,
    totalCreators,
    totalOrders: orders.length,
    totalGMV,
    activeCampaigns,
    pendingSettlements,
  }
}

// ==================== Guides ====================

export async function getAdminGuides() {
  await requireAdmin()
  return prisma.guide.findMany({
    orderBy: { displayOrder: 'asc' },
  })
}

export async function createGuide(data: {
  title: string
  category: string
  targetGrade: string
  displayOrder: number
  isPublished: boolean
  content: any
}) {
  await requireAdmin()
  return prisma.guide.create({
    data: {
      title: data.title,
      category: data.category,
      targetGrade: data.targetGrade,
      displayOrder: data.displayOrder,
      isPublished: data.isPublished,
      content: data.content,
      contentType: 'json',
    },
  })
}

export async function updateGuide(
  id: string,
  data: {
    title: string
    category: string
    targetGrade: string
    displayOrder: number
    isPublished: boolean
    content: any
  }
) {
  await requireAdmin()
  return prisma.guide.update({
    where: { id },
    data: {
      title: data.title,
      category: data.category,
      targetGrade: data.targetGrade,
      displayOrder: data.displayOrder,
      isPublished: data.isPublished,
      content: data.content,
    },
  })
}

export async function deleteGuide(id: string) {
  await requireAdmin()
  return prisma.guide.delete({ where: { id } })
}

// ==================== System Settings ====================

const SETTING_DEFAULTS: Record<string, string> = {
  site_name: 'CNEC Shop',
  site_url: 'https://www.cnecshop.com',
  default_commission: '25',
  min_commission: '20',
  max_commission: '30',
  mocra_threshold_warning: '800000',
  mocra_threshold_danger: '1000000',
  maintenance_mode: 'false',
  allow_new_signups: 'true',
  platform_fee_rate: '0.05',
  min_settlement_amount: '1000',
  settlement_day: '20',
  referral_reward_inviter: '5000',
  referral_reward_invitee: '3000',
}

export async function getAdminSettings() {
  await requireAdmin()

  const rows = await prisma.systemSetting.findMany()
  const map: Record<string, string> = { ...SETTING_DEFAULTS }
  for (const row of rows) {
    map[row.key] = row.value
  }
  return map
}

export async function updateAdminSettings(settings: Record<string, string>) {
  await requireAdmin()

  const ops = Object.entries(settings).map(([key, value]) =>
    prisma.systemSetting.upsert({
      where: { key },
      create: { key, value: String(value) },
      update: { value: String(value) },
    })
  )

  await prisma.$transaction(ops)
  return { success: true }
}

// Public: get specific settings without auth (for landing page, etc.)
export async function getPublicSettings(keys: string[]) {
  const rows = await prisma.systemSetting.findMany({
    where: { key: { in: keys } },
  })
  const map: Record<string, string> = {}
  for (const key of keys) {
    map[key] = SETTING_DEFAULTS[key] ?? ''
  }
  for (const row of rows) {
    map[row.key] = row.value
  }
  return map
}

// Public: get platform stats for landing page
export async function getPlatformStats() {
  try {
    const [products, creators, brands, orders] = await Promise.all([
      prisma.product.count({ where: { status: 'ACTIVE' } }),
      prisma.creator.count({ where: { status: 'ACTIVE' } }),
      prisma.brand.count(),
      prisma.order.count(),
    ])

    return { products, creators, brands, orders }
  } catch (error) {
    console.error('getPlatformStats error:', error)
    return { products: 0, creators: 0, brands: 0, orders: 0 }
  }
}

// ==================== Settlements ====================

export async function getAdminSettlements() {
  await requireAdmin()
  return prisma.settlement.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true, role: true } },
    },
  })
}

// ==================== Orders ====================

interface OrderFilters {
  status?: string
  period?: string // 'today' | '7days' | '30days' | 'all'
  search?: string
  page?: number
}

export async function getAdminOrders(filters: OrderFilters = {}) {
  await requireAdmin()

  const where: Record<string, unknown> = {}

  if (filters.status && filters.status !== 'all') {
    where.status = filters.status
  }

  if (filters.period && filters.period !== 'all') {
    const now = new Date()
    const start = new Date()
    if (filters.period === 'today') start.setHours(0, 0, 0, 0)
    else if (filters.period === '7days') start.setDate(now.getDate() - 7)
    else if (filters.period === '30days') start.setDate(now.getDate() - 30)
    where.createdAt = { gte: start }
  }

  if (filters.search) {
    const s = filters.search
    where.OR = [
      { orderNumber: { contains: s, mode: 'insensitive' } },
      { buyerName: { contains: s, mode: 'insensitive' } },
      { customerName: { contains: s, mode: 'insensitive' } },
      { buyerPhone: { contains: s } },
      { customerPhone: { contains: s } },
    ]
  }

  const pageSize = 20
  const page = filters.page || 1

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, thumbnailUrl: true } },
          },
        },
        creator: { select: { id: true, username: true, displayName: true } },
        brand: { select: { id: true, companyName: true } },
        buyer: { select: { id: true, nickname: true } },
      },
    }),
    prisma.order.count({ where }),
  ])

  // Convert Decimal fields to numbers
  const serialized = orders.map(order => ({
    ...order,
    totalAmount: Number(order.totalAmount),
    subtotal: order.subtotal ? Number(order.subtotal) : null,
    productAmount: order.productAmount ? Number(order.productAmount) : null,
    shippingFee: Number(order.shippingFee),
    creatorRevenue: order.creatorRevenue ? Number(order.creatorRevenue) : null,
    platformRevenue: order.platformRevenue ? Number(order.platformRevenue) : null,
    brandRevenue: order.brandRevenue ? Number(order.brandRevenue) : null,
    items: order.items.map(item => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
    })),
  }))

  return { orders: serialized, total, pageSize }
}

export async function getAdminOrderStats() {
  await requireAdmin()

  const counts = await prisma.order.groupBy({
    by: ['status'],
    _count: true,
  })

  const stats: Record<string, number> = {
    PAID: 0, PREPARING: 0, SHIPPING: 0, DELIVERED: 0, CONFIRMED: 0, CANCELLED: 0, REFUNDED: 0,
  }
  for (const c of counts) {
    stats[c.status] = c._count
  }
  return stats
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: string,
  extra?: { trackingNumber?: string; courierCode?: string; cancelReason?: string }
) {
  await requireAdmin()

  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true, status: true, buyerId: true, orderNumber: true } })
  if (!order) throw new Error('주문을 찾을 수 없습니다')

  // Validate transitions
  const allowed: Record<string, string[]> = {
    PAID: ['PREPARING', 'CANCELLED'],
    PREPARING: ['SHIPPING', 'CANCELLED'],
    SHIPPING: ['DELIVERED', 'CANCELLED'],
    DELIVERED: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['CANCELLED'],
  }

  if (!allowed[order.status]?.includes(newStatus)) {
    throw new Error(`${order.status}에서 ${newStatus}로 변경할 수 없습니다`)
  }

  if (newStatus === 'SHIPPING' && !extra?.trackingNumber) {
    throw new Error('배송 시 송장번호가 필요합니다')
  }

  const updateData: Record<string, unknown> = { status: newStatus }

  if (newStatus === 'SHIPPING') {
    updateData.trackingNumber = extra?.trackingNumber
    updateData.courierCode = extra?.courierCode
    updateData.shippedAt = new Date()
  } else if (newStatus === 'DELIVERED') {
    updateData.deliveredAt = new Date()
  } else if (newStatus === 'CONFIRMED') {
    updateData.confirmedAt = new Date()
  } else if (newStatus === 'CANCELLED') {
    updateData.cancelledAt = new Date()
    updateData.cancelReason = extra?.cancelReason || '관리자 취소'
  }

  const updated = await prisma.order.update({ where: { id: orderId }, data: updateData })

  // Send notification to buyer
  if (order.buyerId) {
    const statusLabels: Record<string, string> = {
      PREPARING: '배송 준비가 시작되었습니다',
      SHIPPING: '상품이 발송되었습니다',
      DELIVERED: '상품이 배송 완료되었습니다',
      CANCELLED: '주문이 취소되었습니다',
    }
    const msg = statusLabels[newStatus]
    if (msg) {
      try {
        await sendNotification({
          userId: order.buyerId,
          type: 'ORDER',
          title: `주문 ${order.orderNumber || ''} ${msg}`,
          message: msg,
          linkUrl: `/buyer/orders/${orderId}`,
        })
      } catch { /* ignore notification failures */ }
    }
  }

  return updated
}

// ==================== Campaigns ====================

interface CampaignFilters {
  status?: string
  type?: string
  search?: string
}

export async function getAdminCampaigns(filters: CampaignFilters = {}) {
  await requireAdmin()

  const where: Record<string, unknown> = {}

  if (filters.status && filters.status !== 'all') {
    where.status = filters.status
  }
  if (filters.type && filters.type !== 'all') {
    where.type = filters.type
  }
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { brand: { companyName: { contains: filters.search, mode: 'insensitive' } } },
    ]
  }

  const campaigns = await prisma.campaign.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      brand: { select: { id: true, companyName: true } },
      products: {
        include: {
          product: { select: { id: true, name: true, thumbnailUrl: true, price: true } },
        },
      },
      participations: {
        select: { id: true, creatorId: true, status: true },
      },
    },
  })

  // Serialize Decimal fields
  return campaigns.map(c => ({
    ...c,
    commissionRate: Number(c.commissionRate),
    products: c.products.map(cp => ({
      ...cp,
      campaignPrice: Number(cp.campaignPrice),
      product: {
        ...cp.product,
        price: cp.product.price ? Number(cp.product.price) : null,
      },
    })),
  }))
}

export async function getAdminCampaignStats() {
  await requireAdmin()

  const counts = await prisma.campaign.groupBy({
    by: ['status'],
    _count: true,
  })

  const stats: Record<string, number> = { DRAFT: 0, RECRUITING: 0, ACTIVE: 0, ENDED: 0 }
  for (const c of counts) {
    stats[c.status] = c._count
  }
  return stats
}
