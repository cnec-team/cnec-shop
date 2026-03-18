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

  // Check for existing application
  const existingApplication = await prisma.creatorApplication.findFirst({
    where: { buyerId: buyer.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      status: true,
      desiredUsername: true,
      displayName: true,
      rejectionReason: true,
      createdCreatorId: true,
      createdAt: true,
    },
  })

  // Also check if buyer already has a creator account
  const existingCreator = await prisma.creator.findFirst({
    where: { userId: buyer.userId },
    select: { id: true, status: true, shopId: true },
  })

  // Default criteria
  const criteria = {
    minOrders: 3,
    minReviews: 2,
    minSpent: 50000,
    minAccountAgeDays: 30,
  }

  return {
    criteria,
    existingApplication: existingApplication
      ? {
          ...existingApplication,
          createdAt: existingApplication.createdAt.toISOString(),
        }
      : null,
    existingCreator,
  }
}

export async function checkUsernameAvailability(username: string) {
  const lower = username.toLowerCase()
  // Check both username and shopId uniqueness
  const existing = await prisma.creator.findFirst({
    where: {
      OR: [
        { username: lower },
        { shopId: { equals: lower, mode: 'insensitive' } },
      ],
    },
    select: { id: true },
  })
  if (existing) return false

  // Also check pending applications with same desired username
  const pendingApp = await prisma.creatorApplication.findFirst({
    where: {
      desiredUsername: lower,
      status: 'pending',
    },
    select: { id: true },
  })
  return !pendingApp
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

  // Check for existing pending/approved application
  const existingApp = await prisma.creatorApplication.findFirst({
    where: {
      buyerId: buyer.id,
      status: { in: ['pending', 'approved'] },
    },
  })
  if (existingApp) throw new Error('이미 신청이 진행 중입니다.')

  // Check if buyer already has a creator account
  const existingCreator = await prisma.creator.findFirst({
    where: { userId: buyer.userId },
    select: { id: true },
  })
  if (existingCreator) throw new Error('이미 크리에이터 계정이 있습니다.')

  // Check username/shopId availability
  const isAvailable = await checkUsernameAvailability(data.desiredUsername)
  if (!isAvailable) throw new Error('이 사용자명은 이미 사용 중입니다.')

  // Create application record
  const application = await prisma.creatorApplication.create({
    data: {
      buyerId: buyer.id,
      desiredUsername: data.desiredUsername.toLowerCase(),
      displayName: data.displayName,
      bio: data.bio || null,
      instagramUrl: data.instagramUrl || null,
      youtubeUrl: data.youtubeUrl || null,
      tiktokUrl: data.tiktokUrl || null,
      followerCount: data.followerCount || null,
      motivation: data.motivation || null,
      contentPlan: data.contentPlan || null,
      status: 'pending',
    },
  })

  return { id: application.id, success: true }
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

  // Fetch existing reviews by this buyer
  const reviews = await prisma.productReview.findMany({
    where: { buyerId: buyer.id },
    orderBy: { createdAt: 'desc' },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          nameKo: true,
          nameEn: true,
          imageUrl: true,
          images: true,
        },
      },
    },
  })

  // Fetch reviewed productId+orderId pairs for duplicate prevention
  const reviewedKeys = new Set(
    reviews.map((r) => `${r.orderId}:${r.productId}`)
  )

  // Fetch delivered orders with items that haven't been reviewed yet
  const deliveredOrders = await prisma.order.findMany({
    where: {
      buyerId: buyer.id,
      status: { in: ['DELIVERED', 'COMPLETED'] },
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      orderNumber: true,
      createdAt: true,
      items: {
        select: {
          id: true,
          productId: true,
          productName: true,
          productImage: true,
          product: {
            select: {
              id: true,
              name: true,
              nameKo: true,
              nameEn: true,
              imageUrl: true,
              images: true,
            },
          },
        },
      },
    },
  })

  // Filter to only items not yet reviewed
  const pendingOrders = deliveredOrders
    .map((order) => ({
      ...order,
      createdAt: order.createdAt.toISOString(),
      items: order.items.filter(
        (item) => !reviewedKeys.has(`${order.id}:${item.productId}`)
      ),
    }))
    .filter((order) => order.items.length > 0)

  return {
    reviews: reviews.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      pointsAwardedAt: r.pointsAwardedAt?.toISOString() ?? null,
    })),
    pendingOrders,
  }
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

  // Validate rating
  if (data.rating < 1 || data.rating > 5) throw new Error('Rating must be 1-5')

  // Duplicate check: same buyer + order + product
  if (data.orderId) {
    const existing = await prisma.productReview.findFirst({
      where: {
        buyerId: buyer.id,
        orderId: data.orderId,
        productId: data.productId,
      },
    })
    if (existing) throw new Error('이미 이 상품에 대한 리뷰를 작성했습니다.')
  }

  const pointsEarned = data.instagramPostUrl ? 1000 : 500

  const review = await prisma.productReview.create({
    data: {
      productId: data.productId,
      buyerId: buyer.id,
      orderId: data.orderId || null,
      rating: data.rating,
      title: data.title || null,
      content: data.content,
      instagramPostUrl: data.instagramPostUrl || null,
      isVerifiedPurchase: !!data.orderId,
      pointsAwarded: pointsEarned,
      pointsAwardedAt: new Date(),
    },
  })

  // TODO: Award points to buyer's point balance when BuyerPoint model is available

  return { id: review.id, pointsEarned }
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
