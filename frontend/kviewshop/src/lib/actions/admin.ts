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
