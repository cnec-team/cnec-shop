'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

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
  return prisma.brand.update({
    where: { id },
    data: { approved: true },
  })
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
  site_url: 'https://cnecshop.netlify.app',
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
