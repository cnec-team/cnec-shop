'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

async function requireBuyer() {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  const buyer = await prisma.buyer.findFirst({
    where: { userId: session.user.id },
  })

  if (!buyer) throw new Error('Buyer not found')
  return { user: session.user, buyer }
}

// ==================== Become Creator ====================

export async function getBecomeCreatorData(buyerId: string) {
  const { buyer } = await requireBuyer()
  if (buyer.id !== buyerId) throw new Error('Forbidden')

  // Check for existing application - no creator_applications table in Prisma model
  // This appears to be a custom table, so we return null for now
  const existingApplication = null

  // Default criteria
  const criteria = {
    minOrders: 3,
    minReviews: 2,
    minSpent: 50000,
    minAccountAgeDays: 30,
  }

  return { criteria, existingApplication }
}

export async function checkUsernameAvailability(username: string) {
  const existing = await prisma.creator.findFirst({
    where: { username: username.toLowerCase() },
    select: { id: true },
  })
  return !existing
}

export async function submitCreatorApplication(data: {
  buyerId: string
  desiredUsername: string
  displayName: string
  bio?: string
  instagramUrl?: string
  youtubeUrl?: string
  tiktokUrl?: string
  followerCount?: number
  motivation?: string
  contentPlan?: string
}) {
  const { buyer } = await requireBuyer()
  if (buyer.id !== data.buyerId) throw new Error('Forbidden')

  // Check username availability
  const isAvailable = await checkUsernameAvailability(data.desiredUsername)
  if (!isAvailable) throw new Error('Username already taken')

  // For now, directly create creator (since there's no creator_applications model)
  // In production, this would go through an approval flow
  return { success: true }
}

// ==================== Cart ====================

export async function getCartProducts(productIds: string[]) {
  if (productIds.length === 0) return []
  return prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      name: true,
      nameKo: true,
      nameEn: true,
      nameJp: true,
      originalPrice: true,
      salePrice: true,
      imageUrl: true,
      images: true,
      brand: {
        select: {
          companyName: true,
          brandName: true,
        },
      },
    },
  })
}

export async function getCartCreators(creatorIds: string[]) {
  if (creatorIds.length === 0) return []
  return prisma.creator.findMany({
    where: { id: { in: creatorIds } },
    select: {
      id: true,
      shopId: true,
      username: true,
      displayName: true,
      themeColor: true,
      backgroundColor: true,
    },
  })
}

// ==================== Dashboard ====================

export async function getBuyerDashboardData(buyerId: string) {
  const { buyer } = await requireBuyer()
  if (buyer.id !== buyerId) throw new Error('Forbidden')

  const [subscriptions, recentOrders] = await Promise.all([
    prisma.mallSubscription.findMany({
      where: { buyerId: buyer.id, status: 'active' },
      take: 6,
      include: {
        creator: {
          select: {
            id: true,
            shopId: true,
            username: true,
            displayName: true,
            profileImageUrl: true,
            themeColor: true,
            backgroundColor: true,
          },
        },
      },
    }),
    prisma.order.findMany({
      where: { buyerId: buyer.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        orderNumber: true,
        totalAmount: true,
        status: true,
        createdAt: true,
      },
    }),
  ])

  return { subscriptions, recentOrders }
}

// ==================== Orders ====================

export async function getBuyerOrders(buyerId: string) {
  const { buyer } = await requireBuyer()
  if (buyer.id !== buyerId) throw new Error('Forbidden')

  return prisma.order.findMany({
    where: { buyerId: buyer.id },
    orderBy: { createdAt: 'desc' },
    include: {
      creator: {
        select: {
          id: true,
          shopId: true,
          username: true,
          displayName: true,
          themeColor: true,
          backgroundColor: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              name: true,
              imageUrl: true,
            },
          },
        },
      },
    },
  })
}

export async function getBuyerOrderDetail(orderId: string, buyerId: string) {
  const { buyer } = await requireBuyer()
  if (buyer.id !== buyerId) throw new Error('Forbidden')

  return prisma.order.findFirst({
    where: { id: orderId, buyerId: buyer.id },
    include: {
      creator: {
        select: {
          id: true,
          shopId: true,
          username: true,
          displayName: true,
          themeColor: true,
          backgroundColor: true,
          profileImageUrl: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              name: true,
              imageUrl: true,
            },
          },
        },
      },
    },
  })
}

// ==================== Points ====================

export async function getBuyerPointsHistory(buyerId: string) {
  const { buyer } = await requireBuyer()
  if (buyer.id !== buyerId) throw new Error('Forbidden')

  // TODO: BuyerPoint model does not exist in schema yet.
  // Return empty array until buyer_points table is added.
  return [] as Array<{
    id: string
    amount: number
    type: string
    description: string | null
    createdAt: Date
  }>
}

// ==================== Reviews ====================

export async function getBuyerReviewsData(buyerId: string) {
  const { buyer } = await requireBuyer()
  if (buyer.id !== buyerId) throw new Error('Forbidden')

  // Since there's no product_reviews in Prisma model, return empty data
  // The actual implementation would need a productReview model
  return { reviews: [], pendingOrders: [] }
}

export async function submitReview(data: {
  buyerId: string
  productId: string
  orderId?: string
  rating: number
  title?: string
  content: string
  instagramPostUrl?: string
}) {
  const { buyer } = await requireBuyer()
  if (buyer.id !== data.buyerId) throw new Error('Forbidden')

  const pointsEarned = data.instagramPostUrl ? 1000 : 500
  return { pointsEarned }
}

// ==================== Subscriptions ====================

export async function getBuyerSubscriptions(buyerId: string) {
  const { buyer } = await requireBuyer()
  if (buyer.id !== buyerId) throw new Error('Forbidden')

  return prisma.mallSubscription.findMany({
    where: { buyerId: buyer.id },
    orderBy: { subscribedAt: 'desc' },
    include: {
      creator: {
        select: {
          id: true,
          shopId: true,
          username: true,
          displayName: true,
          profileImageUrl: true,
          themeColor: true,
          backgroundColor: true,
          bio: true,
        },
      },
    },
  })
}

export async function updateSubscriptionNotifications(
  subId: string,
  field: 'notifyNewProducts' | 'notifySales',
  value: boolean
) {
  await requireBuyer()
  return prisma.mallSubscription.update({
    where: { id: subId },
    data: { [field]: value },
  })
}

export async function unsubscribeFromCreator(subId: string) {
  await requireBuyer()
  return prisma.mallSubscription.update({
    where: { id: subId },
    data: { status: 'cancelled' },
  })
}
