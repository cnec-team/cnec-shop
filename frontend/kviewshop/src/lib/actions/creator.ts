'use server'

import { prisma } from '@/lib/db'
import { Prisma } from '@/generated/prisma/client'
import { auth } from '@/lib/auth'
import { sendNotification } from '@/lib/notifications'

async function requireCreator() {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  const creator = await prisma.creator.findFirst({
    where: { userId: session.user.id },
  })

  if (!creator) throw new Error('Creator not found')
  return { user: session.user, creator }
}

// ==================== Dashboard ====================

export async function getCreatorDashboardStats(creatorId: string) {
  const { creator } = await requireCreator()
  if (creator.id !== creatorId) throw new Error('Forbidden')

  const [visitsCount, conversions, pendingSettlements] = await Promise.all([
    prisma.shopVisit.count({ where: { creatorId: creator.id } }),
    prisma.conversion.findMany({
      where: { creatorId: creator.id, status: 'CONFIRMED' },
    }),
    prisma.settlement.findMany({
      where: { creatorId: creator.id, status: 'PENDING' },
    }),
  ])

  const totalOrders = conversions.length
  const totalRevenue = conversions.reduce((sum, c) => sum + Number(c.orderAmount), 0)
  const totalEarnings = conversions.reduce((sum, c) => sum + Number(c.commissionAmount), 0)
  const conversionRate = visitsCount > 0 ? (totalOrders / visitsCount) * 100 : 0
  const pendingSettlement = pendingSettlements.reduce((sum, s) => sum + Number(s.netAmount), 0)

  return {
    totalVisits: visitsCount,
    totalOrders,
    totalRevenue,
    totalEarnings,
    conversionRate,
    pendingSettlement,
    activeGonggu: 0,
    activePicks: 0,
  }
}

export async function getCreatorPointBalance() {
  const { creator } = await requireCreator()

  const latestPoint = await prisma.creatorPoint.findFirst({
    where: { creatorId: creator.id },
    orderBy: { createdAt: 'desc' },
  })

  return latestPoint?.balanceAfter ?? 0
}

export async function getCreatorGradeData() {
  const { creator } = await requireCreator()

  const gradeRecord = await prisma.creatorGrade.findFirst({
    where: { creatorId: creator.id },
  })

  return {
    grade: gradeRecord?.grade ?? 'ROOKIE',
    monthlySales: gradeRecord?.monthlySales ?? 0,
    commissionBonusRate: gradeRecord?.commissionBonusRate ?? 0,
    nextGrade: null as string | null,
    amountToNext: 0,
  }
}

export async function getCreatorRankings(period: 'weekly' | 'monthly') {
  // Rankings would typically be computed, returning empty for now
  return { rankings: [] as Array<{ rank: number; displayName: string; profileImage: string | null; totalSales: number }> }
}

// ==================== Orders ====================

export async function getCreatorOrders(creatorId: string) {
  const { creator } = await requireCreator()
  if (creator.id !== creatorId) throw new Error('Forbidden')

  return prisma.order.findMany({
    where: { creatorId: creator.id },
    orderBy: { createdAt: 'desc' },
    include: {
      brand: {
        select: {
          companyName: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              name: true,
              nameEn: true,
              nameKo: true,
            },
          },
        },
      },
    },
  })
}

// ==================== Live Sessions ====================

export async function getCreatorLiveSessions(creatorId: string) {
  const { creator } = await requireCreator()
  if (creator.id !== creatorId) throw new Error('Forbidden')

  return prisma.liveSession.findMany({
    where: { creatorId: creator.id },
    orderBy: { scheduledAt: 'desc' },
  })
}

export async function getCreatorBotSettings(creatorId: string) {
  const { creator } = await requireCreator()
  if (creator.id !== creatorId) throw new Error('Forbidden')

  return prisma.liveBotSetting.findFirst({
    where: { creatorId: creator.id },
  })
}

export async function createLiveSession(data: {
  creatorId: string
  title: string
  description: string
  platform: string
  externalUrl?: string
  scheduledAt: string
  chatEnabled: boolean
  botEnabled: boolean
}) {
  const { creator } = await requireCreator()
  if (creator.id !== data.creatorId) throw new Error('Forbidden')

  return prisma.liveSession.create({
    data: {
      creatorId: creator.id,
      title: data.title,
      description: data.description,
      platform: data.platform,
      scheduledAt: new Date(data.scheduledAt),
      chatEnabled: data.chatEnabled,
      botEnabled: data.botEnabled,
    },
  })
}

export async function saveBotSettings(data: {
  creatorId: string
  isEnabled: boolean
  welcomeMessage: string
  productLinkInterval: number
  scheduledMessages: unknown
  autoResponses: unknown
}) {
  const { creator } = await requireCreator()
  if (creator.id !== data.creatorId) throw new Error('Forbidden')

  const existing = await prisma.liveBotSetting.findFirst({
    where: { creatorId: creator.id },
  })

  if (existing) {
    return prisma.liveBotSetting.update({
      where: { id: existing.id },
      data: {
        isEnabled: data.isEnabled,
        welcomeMessage: data.welcomeMessage,
        productLinkInterval: data.productLinkInterval,
        scheduledMessages: data.scheduledMessages as any,
        autoResponses: data.autoResponses as any,
      },
    })
  } else {
    return prisma.liveBotSetting.create({
      data: {
        creatorId: creator.id,
        isEnabled: data.isEnabled,
        welcomeMessage: data.welcomeMessage,
        productLinkInterval: data.productLinkInterval,
        scheduledMessages: data.scheduledMessages as any,
        autoResponses: data.autoResponses as any,
      },
    })
  }
}

// ==================== Campaigns ====================

export async function getAvailableCampaigns() {
  await requireCreator()

  const [campaigns, brands, campaignProducts, participations] = await Promise.all([
    prisma.campaign.findMany({
      where: { status: { in: ['RECRUITING', 'ACTIVE'] } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.brand.findMany(),
    prisma.campaignProduct.findMany({
      include: {
        product: {
          select: {
            id: true,
            name: true,
            nameKo: true,
            thumbnailUrl: true,
            imageUrl: true,
            images: true,
          },
        },
      },
    }),
    prisma.campaignParticipation.findMany({
      where: { status: { in: ['PENDING', 'APPROVED'] } },
      select: { campaignId: true },
    }),
  ])

  const brandMap: Record<string, { id: string; brandName: string; companyName: string; logoUrl: string | null }> = {}
  for (const b of brands) {
    brandMap[b.id] = { id: b.id, brandName: b.brandName ?? '', companyName: b.companyName ?? '', logoUrl: b.logoUrl ?? null }
  }

  const productsByCampaign: Record<string, typeof campaignProducts> = {}
  for (const cp of campaignProducts) {
    if (!productsByCampaign[cp.campaignId]) {
      productsByCampaign[cp.campaignId] = []
    }
    productsByCampaign[cp.campaignId].push(cp)
  }

  const participantCounts: Record<string, number> = {}
  for (const p of participations) {
    participantCounts[p.campaignId] = (participantCounts[p.campaignId] ?? 0) + 1
  }

  return campaigns.map((c) => ({
    ...c,
    startAt: c.startAt?.toISOString() ?? null,
    endAt: c.endAt?.toISOString() ?? null,
    createdAt: c.createdAt.toISOString(),
    brand: brandMap[c.brandId] ?? null,
    products: productsByCampaign[c.id] ?? [],
    participantCount: participantCounts[c.id] ?? 0,
  }))
}

export async function applyCampaignParticipation(data: {
  campaignId: string
  status: 'PENDING' | 'APPROVED'
  message?: string
}) {
  const { creator } = await requireCreator()

  const participation = await prisma.campaignParticipation.create({
    data: {
      campaignId: data.campaignId,
      creatorId: creator.id,
      status: data.status,
      message: data.message ?? null,
    },
  })

  // Notify the brand that a creator has applied
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: data.campaignId },
      select: { title: true, brand: { select: { userId: true } } },
    })
    if (campaign?.brand?.userId) {
      sendNotification({
        userId: campaign.brand.userId,
        type: 'CAMPAIGN',
        title: '공구 참여 신청',
        message: `${creator.displayName ?? creator.username ?? '크리에이터'}님이 "${campaign.title}" 공구에 참여를 신청했습니다.`,
        linkUrl: '/brand/creators/pending',
      })
    }
  } catch {
    // Don't fail the participation if notification fails
  }

  return participation
}

export async function addCampaignShopItems(campaignId: string, productIds: string[]) {
  const { creator } = await requireCreator()

  for (const productId of productIds) {
    await prisma.creatorShopItem.create({
      data: {
        creatorId: creator.id,
        productId,
        campaignId,
        type: 'GONGGU',
        displayOrder: 0,
        isVisible: true,
      },
    })
  }
}

export async function getCreatorCampaignDetail(campaignId: string) {
  const { creator } = await requireCreator()

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      brand: {
        select: {
          id: true,
          brandName: true,
          companyName: true,
          logoUrl: true,
          description: true,
          defaultShippingFee: true,
          freeShippingThreshold: true,
        },
      },
      products: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              nameKo: true,
              description: true,
              descriptionKo: true,
              originalPrice: true,
              salePrice: true,
              images: true,
              thumbnailUrl: true,
              imageUrl: true,
              volume: true,
              shippingFeeType: true,
              shippingFee: true,
              freeShippingThreshold: true,
            },
          },
        },
      },
    },
  })

  if (!campaign) return null

  const [participantCount, myParticipation] = await Promise.all([
    prisma.campaignParticipation.count({
      where: {
        campaignId: campaign.id,
        status: { in: ['PENDING', 'APPROVED'] },
      },
    }),
    prisma.campaignParticipation.findFirst({
      where: { campaignId: campaign.id, creatorId: creator.id },
      select: { id: true, status: true, appliedAt: true, approvedAt: true },
    }),
  ])

  return {
    id: campaign.id,
    brandId: campaign.brandId,
    type: campaign.type,
    title: campaign.title,
    description: campaign.description,
    status: campaign.status,
    recruitmentType: campaign.recruitmentType,
    commissionRate: Number(campaign.commissionRate),
    totalStock: campaign.totalStock,
    soldCount: campaign.soldCount,
    targetParticipants: campaign.targetParticipants,
    conditions: campaign.conditions,
    startAt: campaign.startAt?.toISOString() ?? null,
    endAt: campaign.endAt?.toISOString() ?? null,
    createdAt: campaign.createdAt.toISOString(),
    brand: campaign.brand
      ? {
          id: campaign.brand.id,
          brandName: campaign.brand.brandName,
          companyName: campaign.brand.companyName,
          logoUrl: campaign.brand.logoUrl,
          description: campaign.brand.description,
          defaultShippingFee: campaign.brand.defaultShippingFee
            ? Number(campaign.brand.defaultShippingFee)
            : 0,
          freeShippingThreshold: campaign.brand.freeShippingThreshold
            ? Number(campaign.brand.freeShippingThreshold)
            : null,
        }
      : null,
    products: campaign.products.map((cp) => ({
      id: cp.id,
      productId: cp.productId,
      campaignPrice: Number(cp.campaignPrice),
      perCreatorLimit: cp.perCreatorLimit,
      product: cp.product
        ? {
            id: cp.product.id,
            name: cp.product.name ?? cp.product.nameKo ?? '',
            description: cp.product.description ?? cp.product.descriptionKo ?? '',
            originalPrice: cp.product.originalPrice
              ? Number(cp.product.originalPrice)
              : null,
            salePrice: cp.product.salePrice ? Number(cp.product.salePrice) : null,
            images: cp.product.images ?? [],
            thumbnailUrl: cp.product.thumbnailUrl,
            imageUrl: cp.product.imageUrl,
            volume: cp.product.volume,
            shippingFeeType: cp.product.shippingFeeType,
            shippingFee: cp.product.shippingFee
              ? Number(cp.product.shippingFee)
              : 0,
            freeShippingThreshold: cp.product.freeShippingThreshold
              ? Number(cp.product.freeShippingThreshold)
              : null,
          }
        : null,
    })),
    participantCount,
    myParticipation: myParticipation
      ? {
          id: myParticipation.id,
          status: myParticipation.status,
          appliedAt: myParticipation.appliedAt.toISOString(),
          approvedAt: myParticipation.approvedAt?.toISOString() ?? null,
        }
      : null,
  }
}

export async function getMyParticipations(creatorId: string) {
  const { creator } = await requireCreator()
  if (creator.id !== creatorId) throw new Error('Forbidden')

  const participations = await prisma.campaignParticipation.findMany({
    where: { creatorId: creator.id },
    orderBy: { appliedAt: 'desc' },
    include: {
      campaign: {
        include: {
          brand: {
            select: {
              id: true,
              brandName: true,
              companyName: true,
            },
          },
        },
      },
    },
  })

  return participations.map((p) => ({
    ...p,
    appliedAt: p.appliedAt.toISOString(),
    approvedAt: p.approvedAt?.toISOString() ?? null,
    campaign: p.campaign ? {
      ...p.campaign,
      startAt: p.campaign.startAt?.toISOString() ?? null,
      endAt: p.campaign.endAt?.toISOString() ?? null,
      createdAt: p.campaign.createdAt.toISOString(),
    } : null,
  }))
}

// ==================== Collections ====================

export async function getCreatorCollections(creatorId: string) {
  const { creator } = await requireCreator()
  if (creator.id !== creatorId) throw new Error('Forbidden')

  const [collections, items] = await Promise.all([
    prisma.collection.findMany({
      where: { creatorId: creator.id },
      orderBy: { displayOrder: 'asc' },
    }),
    prisma.creatorShopItem.findMany({
      where: { creatorId: creator.id },
      orderBy: { displayOrder: 'asc' },
      include: {
        product: true,
        campaign: { select: { id: true, status: true, title: true } },
      },
    }),
  ])

  const cols = collections.map((col) => ({
    ...col,
    items: items.filter((item) => item.collectionId === col.id),
  }))

  return { collections: cols, allItems: items }
}

export async function createCollection(data: {
  creatorId: string
  name: string
  description?: string
  displayOrder: number
}) {
  const { creator } = await requireCreator()
  if (creator.id !== data.creatorId) throw new Error('Forbidden')

  return prisma.collection.create({
    data: {
      creatorId: creator.id,
      name: data.name,
      description: data.description ?? null,
      isVisible: true,
      displayOrder: data.displayOrder,
    },
  })
}

export async function toggleCollectionVisibility(collectionId: string, isVisible: boolean) {
  await requireCreator()
  return prisma.collection.update({
    where: { id: collectionId },
    data: { isVisible },
  })
}

export async function toggleShopItemVisibility(itemId: string, isVisible: boolean) {
  const { creator } = await requireCreator()
  const item = await prisma.creatorShopItem.findUnique({
    where: { id: itemId },
    select: { creatorId: true },
  })
  if (!item || item.creatorId !== creator.id) throw new Error('Forbidden')
  return prisma.creatorShopItem.update({
    where: { id: itemId },
    data: { isVisible },
  })
}

export async function deleteCollection(collectionId: string) {
  await requireCreator()

  // Remove collection_id from items first
  await prisma.creatorShopItem.updateMany({
    where: { collectionId },
    data: { collectionId: null },
  })

  return prisma.collection.delete({
    where: { id: collectionId },
  })
}

export async function updateCollectionOrder(collectionId: string, displayOrder: number) {
  await requireCreator()
  return prisma.collection.update({
    where: { id: collectionId },
    data: { displayOrder },
  })
}

export async function addItemToCollection(itemId: string, collectionId: string) {
  await requireCreator()
  return prisma.creatorShopItem.update({
    where: { id: itemId },
    data: { collectionId },
  })
}

export async function removeItemFromCollection(itemId: string) {
  await requireCreator()
  return prisma.creatorShopItem.update({
    where: { id: itemId },
    data: { collectionId: null },
  })
}

export async function updateItemOrder(itemId: string, displayOrder: number) {
  await requireCreator()
  return prisma.creatorShopItem.update({
    where: { id: itemId },
    data: { displayOrder },
  })
}

// ==================== Products (Browse) ====================

export async function getPickableProducts(creatorId: string) {
  const { creator } = await requireCreator()
  if (creator.id !== creatorId) throw new Error('Forbidden')

  // Fetch active campaigns and their product IDs
  const [brands, campaigns, campaignProducts, shopItems] = await Promise.all([
    prisma.brand.findMany(),
    prisma.campaign.findMany({
      where: { status: { in: ['RECRUITING', 'ACTIVE'] } },
    }),
    prisma.campaignProduct.findMany({
      include: { product: true },
    }),
    prisma.creatorShopItem.findMany({
      where: { creatorId: creator.id },
      select: { productId: true },
    }),
  ])

  // Build set of product IDs that have an active (RECRUITING/ACTIVE) campaign
  const activeCampaignProductIds = new Set<string>()
  for (const cp of campaignProducts) {
    if (campaigns.some((c) => c.id === cp.campaignId)) {
      activeCampaignProductIds.add(cp.productId)
    }
  }

  // Fetch products: ACTIVE status + isActive AND (allowCreatorPick=true OR has active campaign)
  const products = await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
      isActive: true,
      OR: [
        { allowCreatorPick: true },
        { id: { in: Array.from(activeCampaignProductIds) } },
      ],
    },
  })

  const brandMap: Record<string, { brandName: string; logoUrl: string | null; description: string | null }> = {}
  for (const b of brands) {
    brandMap[b.id] = { brandName: b.brandName ?? '', logoUrl: b.logoUrl ?? null, description: b.description ?? null }
  }

  const campaignMap: Record<
    string,
    {
      id: string
      type: string
      commissionRate: number
      recruitmentType: string | null
      campaignProduct: { campaignPrice: number }
    }
  > = {}
  for (const cp of campaignProducts) {
    const campaign = campaigns.find((c) => c.id === cp.campaignId)
    if (campaign) {
      campaignMap[cp.productId] = {
        id: campaign.id,
        type: campaign.type,
        commissionRate: Number(campaign.commissionRate),
        recruitmentType: campaign.recruitmentType,
        campaignProduct: { campaignPrice: Number(cp.campaignPrice) },
      }
    }
  }

  const myShopItemProductIds = new Set(shopItems.map((i) => i.productId))

  return {
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      nameKo: p.nameKo,
      nameEn: p.nameEn,
      originalPrice: Number(p.originalPrice),
      salePrice: Number(p.salePrice),
      images: p.images,
      imageUrl: p.imageUrl,
      category: p.category,
      defaultCommissionRate: Number(p.defaultCommissionRate),
      brandId: p.brandId,
      brand: brandMap[p.brandId] ?? null,
      activeCampaign: campaignMap[p.id] ?? null,
      allowTrial: p.allowTrial,
      volume: p.volume,
      description: p.description,
      descriptionKo: p.descriptionKo,
    })),
    myShopItemProductIds: Array.from(myShopItemProductIds),
  }
}

export async function addProductToShop(productId: string) {
  const { creator } = await requireCreator()

  const item = await prisma.creatorShopItem.create({
    data: {
      creatorId: creator.id,
      productId,
      type: 'PICK',
      displayOrder: 0,
      isVisible: true,
    },
  })

  // 브랜드에게 상품 추천 알림
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { name: true, brand: { select: { userId: true } } },
  })
  if (product?.brand?.userId) {
    sendNotification({
      userId: product.brand.userId,
      type: 'CAMPAIGN',
      title: '상품 추천 추가',
      message: `${creator.displayName ?? creator.username ?? '크리에이터'}님이 "${product.name ?? '상품'}"을 픽했어요.`,
      linkUrl: '/brand/creators',
    })
  }

  return item
}

export async function applyGongguProduct(data: {
  productId: string
  campaignId: string
  recruitmentType: string
}) {
  const { creator } = await requireCreator()

  const status = data.recruitmentType === 'OPEN' ? 'APPROVED' : 'PENDING'

  const participation = await prisma.campaignParticipation.create({
    data: {
      campaignId: data.campaignId,
      creatorId: creator.id,
      status,
    },
  })

  if (data.recruitmentType === 'OPEN') {
    await prisma.creatorShopItem.create({
      data: {
        creatorId: creator.id,
        productId: data.productId,
        campaignId: data.campaignId,
        type: 'GONGGU',
        displayOrder: 0,
        isVisible: true,
      },
    })
  }

  return { participation, isOpen: data.recruitmentType === 'OPEN' }
}

export async function triggerMissionCheck(missionKey: string) {
  const { creator } = await requireCreator()

  const existing = await prisma.creatorMission.findFirst({
    where: { creatorId: creator.id, missionKey },
  })

  if (existing?.isCompleted) return { alreadyCompleted: true }

  // Mission logic would go here
  return { alreadyCompleted: false }
}

// ==================== Points ====================

export async function getCreatorPoints(page: number, limit: number) {
  const { creator } = await requireCreator()

  const [history, total] = await Promise.all([
    prisma.creatorPoint.findMany({
      where: { creatorId: creator.id },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.creatorPoint.count({ where: { creatorId: creator.id } }),
  ])

  const latestPoint = await prisma.creatorPoint.findFirst({
    where: { creatorId: creator.id },
    orderBy: { createdAt: 'desc' },
  })

  return {
    balance: latestPoint?.balanceAfter ?? 0,
    history: history.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
    })),
    total,
  }
}

export async function withdrawPoints(amount: number) {
  const { creator } = await requireCreator()

  const latestPoint = await prisma.creatorPoint.findFirst({
    where: { creatorId: creator.id },
    orderBy: { createdAt: 'desc' },
  })

  const balance = latestPoint?.balanceAfter ?? 0
  if (amount > balance) throw new Error('Insufficient balance')

  const point = await prisma.creatorPoint.create({
    data: {
      creatorId: creator.id,
      pointType: 'WITHDRAW',
      amount: -amount,
      balanceAfter: balance - amount,
      description: '포인트 출금',
    },
  })

  // 크리에이터에게 출금 완료 알림
  sendNotification({
    userId: creator.userId,
    type: 'SETTLEMENT',
    title: '포인트 출금 요청',
    message: `₩${amount.toLocaleString('ko-KR')} 출금이 요청되었어요. 잔액: ₩${(balance - amount).toLocaleString('ko-KR')}`,
    linkUrl: '/creator/points',
  })

  return { success: true, point }
}

// ==================== Referral ====================

export async function getCreatorReferralData() {
  const { creator } = await requireCreator()

  const referrals = await prisma.creatorReferral.findMany({
    where: { referrerId: creator.id },
    orderBy: { createdAt: 'desc' },
  })

  // Generate referral code from creator's id/username
  const referralCode = creator.username || creator.id.substring(0, 8)
  const shareLink = `https://www.cnecshop.com/join?ref=${referralCode}`

  const stats = {
    totalInvited: referrals.length,
    signupComplete: referrals.filter((r) => r.status === 'SIGNUP_COMPLETE' || r.status === 'FIRST_SALE_COMPLETE').length,
    firstSaleComplete: referrals.filter((r) => r.status === 'FIRST_SALE_COMPLETE').length,
    totalReward: referrals.reduce((sum, r) => sum + r.referrerRewardTotal, 0),
  }

  return {
    referralCode,
    shareLink,
    stats,
    referrals: referrals.map((r) => ({
      id: r.id,
      referredId: r.referredId,
      status: r.status,
      referrerRewardTotal: r.referrerRewardTotal,
      createdAt: r.createdAt.toISOString(),
    })),
  }
}

// ==================== Sales ====================

export async function getCreatorSalesData(creatorId: string) {
  const { creator } = await requireCreator()
  if (creator.id !== creatorId) throw new Error('Forbidden')

  const [conversions, visitsCount, pendingSettlements, orderItems] = await Promise.all([
    prisma.conversion.findMany({
      where: { creatorId: creator.id },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.shopVisit.count({ where: { creatorId: creator.id } }),
    prisma.settlement.findMany({
      where: { creatorId: creator.id, status: 'PENDING' },
      select: { netAmount: true },
    }),
    prisma.orderItem.findMany({
      include: { product: { select: { name: true } } },
    }),
  ])

  const orderItemMap: Record<string, { product?: { name: string } }> = {}
  for (const item of orderItems) {
    orderItemMap[item.id] = { product: item.product ? { name: item.product.name ?? '' } : undefined }
  }

  return {
    conversions: conversions.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      orderItem: orderItemMap[c.orderItemId] ?? null,
    })),
    totalVisits: visitsCount,
    pendingSettlement: pendingSettlements.reduce((sum, s) => sum + Number(s.netAmount), 0),
  }
}

// ==================== Settings ====================

export async function updateCreatorSettings(data: {
  creatorId: string
  section?: string
  displayName?: string
  email?: string
  phone?: string
  country?: string
  paymentMethod?: string
  paypalEmail?: string
  bankName?: string
  accountNumber?: string
  swiftCode?: string
  notificationSettings?: Record<string, boolean>
  // 배송 정보 (defaultShippingAddress JSON 필드에 저장)
  shippingName?: string
  shippingPhone?: string
  shippingZipcode?: string
  shippingAddress?: string
  shippingAddressDetail?: string
}) {
  const { creator } = await requireCreator()
  if (creator.id !== data.creatorId) throw new Error('Forbidden')

  const updateData: Record<string, any> = {}

  if (data.section === 'profile' || !data.section) {
    updateData.displayName = data.displayName ?? null
    updateData.email = data.email ?? null
    updateData.phone = data.phone ?? null
    updateData.country = data.country ?? null
  }

  if (data.section === 'payment' || !data.section) {
    updateData.paymentMethod = data.paymentMethod ?? null
    updateData.paypalEmail = data.paypalEmail ?? null
    updateData.bankName = data.bankName ?? null
    updateData.accountNumber = data.accountNumber ?? null
    updateData.swiftCode = data.swiftCode ?? null
  }

  if (data.section === 'notifications' || !data.section) {
    updateData.notificationSettings = data.notificationSettings ?? null
  }

  if (data.section === 'shipping' || !data.section) {
    updateData.defaultShippingAddress = {
      name: data.shippingName ?? '',
      phone: data.shippingPhone ?? '',
      zipcode: data.shippingZipcode ?? '',
      address: data.shippingAddress ?? '',
      addressDetail: data.shippingAddressDetail ?? '',
    }
  }

  return prisma.creator.update({
    where: { id: creator.id },
    data: updateData,
  })
}

// ==================== Settlements ====================

export async function getCreatorSettlements(creatorId: string) {
  const { creator } = await requireCreator()
  if (creator.id !== creatorId) throw new Error('Forbidden')

  const settlements = await prisma.settlement.findMany({
    where: { creatorId: creator.id },
    orderBy: { periodStart: 'desc' },
  })

  return settlements.map((s) => ({
    ...s,
    periodStart: s.periodStart?.toISOString() ?? null,
    periodEnd: s.periodEnd?.toISOString() ?? null,
    createdAt: s.createdAt.toISOString(),
  }))
}

// ==================== Shop Profile ====================

export async function getCreatorProfile() {
  const { creator } = await requireCreator()
  return creator
}

export async function updateCreatorShopProfile(data: {
  creatorId: string
  displayName?: string
  bio?: string
  coverImageUrl?: string
  profileImageUrl?: string
  instagramHandle?: string
  youtubeHandle?: string
  tiktokHandle?: string
  skinType?: string
  personalColor?: string
  skinConcerns?: string[]
  scalpConcerns?: string[]
  bannerImageUrl?: string
  bannerLink?: string
}) {
  const { creator } = await requireCreator()
  if (creator.id !== data.creatorId) throw new Error('Forbidden')

  return prisma.creator.update({
    where: { id: creator.id },
    data: {
      displayName: data.displayName ?? null,
      bio: data.bio ?? null,
      coverImageUrl: data.coverImageUrl ?? null,
      profileImageUrl: data.profileImageUrl ?? null,
      instagramHandle: data.instagramHandle ?? null,
      youtubeHandle: data.youtubeHandle ?? null,
      tiktokHandle: data.tiktokHandle ?? null,
      skinType: data.skinType ?? null,
      personalColor: data.personalColor ?? null,
      skinConcerns: data.skinConcerns ?? [],
      scalpConcerns: data.scalpConcerns ?? [],
      bannerImageUrl: data.bannerImageUrl ?? null,
      bannerLink: data.bannerLink ?? null,
    },
  })
}

// ==================== Grade (full) ====================

export async function getCreatorGradeAndRankings(period: 'weekly' | 'monthly') {
  const { creator } = await requireCreator()

  const gradeRecord = await prisma.creatorGrade.findFirst({
    where: { creatorId: creator.id },
  })

  // Rankings - simplified
  return {
    grade: gradeRecord?.grade ?? 'ROOKIE',
    monthlySales: gradeRecord?.monthlySales ?? 0,
    commissionBonusRate: gradeRecord?.commissionBonusRate ?? 0,
    nextGrade: null as string | null,
    amountToNext: 0,
    rankings: [] as Array<{ rank: number; displayName: string; profileImage: string | null; totalSales: number }>,
  }
}

// ==================== Banners ====================

export async function getCreatorBanners(creatorId: string) {
  const { creator } = await requireCreator()
  if (creator.id !== creatorId) throw new Error('Forbidden')

  return prisma.banner.findMany({
    where: { creatorId: creator.id },
    orderBy: { displayOrder: 'asc' },
  })
}

export async function createBanner(data: {
  creatorId: string
  imageUrl: string
  bannerType: string
  linkUrl: string
  linkType: string
  displayOrder: number
}) {
  const { creator } = await requireCreator()
  if (creator.id !== data.creatorId) throw new Error('Forbidden')

  return prisma.banner.create({
    data: {
      creatorId: creator.id,
      imageUrl: data.imageUrl,
      bannerType: data.bannerType,
      linkUrl: data.linkUrl,
      linkType: data.linkType,
      isVisible: true,
      displayOrder: data.displayOrder,
    },
  })
}

export async function updateBanner(bannerId: string, data: {
  imageUrl?: string
  bannerType?: string
  linkUrl?: string
  linkType?: string
  isVisible?: boolean
  displayOrder?: number
}) {
  await requireCreator()
  return prisma.banner.update({
    where: { id: bannerId },
    data,
  })
}

export async function deleteBanner(bannerId: string) {
  await requireCreator()
  return prisma.banner.delete({
    where: { id: bannerId },
  })
}

// ==================== Routines ====================

export async function getCreatorRoutines(creatorId: string) {
  const { creator } = await requireCreator()
  if (creator.id !== creatorId) throw new Error('Forbidden')

  return prisma.beautyRoutine.findMany({
    where: { creatorId: creator.id },
    orderBy: { displayOrder: 'asc' },
  })
}

export async function createRoutine(data: {
  creatorId: string
  name: string
}) {
  const { creator } = await requireCreator()
  if (creator.id !== data.creatorId) throw new Error('Forbidden')

  return prisma.beautyRoutine.create({
    data: {
      creatorId: creator.id,
      name: data.name,
      steps: [],
      isVisible: true,
      displayOrder: 0,
    },
  })
}

export async function updateRoutine(routineId: string, data: {
  name?: string
  steps?: unknown
  isVisible?: boolean
  displayOrder?: number
}) {
  await requireCreator()
  return prisma.beautyRoutine.update({
    where: { id: routineId },
    data: {
      ...data,
      steps: data.steps as Prisma.InputJsonValue | undefined,
    },
  })
}

export async function deleteRoutine(routineId: string) {
  await requireCreator()
  return prisma.beautyRoutine.delete({
    where: { id: routineId },
  })
}

// ==================== Auth Helper (exposed for client) ====================

// ==================== Reels ====================

export async function updateShopItemReels(
  shopItemId: string,
  reelsUrl: string | null,
  reelsCaption?: string
) {
  const { creator } = await requireCreator()

  const shopItem = await prisma.creatorShopItem.findFirst({
    where: { id: shopItemId, creatorId: creator.id },
  })
  if (!shopItem) throw new Error('상품을 찾을 수 없습니다')

  if (reelsUrl && !reelsUrl.includes('instagram.com/reel')) {
    throw new Error('인스타그램 릴스 URL만 입력 가능합니다')
  }

  return prisma.creatorShopItem.update({
    where: { id: shopItemId },
    data: { reelsUrl, reelsCaption: reelsCaption || null },
  })
}

// ==================== Auth Helper (exposed for client) ====================

export async function getCreatorSession() {
  const session = await auth()
  if (!session?.user) return null

  const creator = await prisma.creator.findFirst({
    where: { userId: session.user.id },
  })

  return creator
}

// ==================== Onboarding ====================

export async function getOnboardingData() {
  const { creator } = await requireCreator()
  return {
    id: creator.id,
    shopId: creator.shopId,
    displayName: creator.displayName,
    profileImageUrl: creator.profileImageUrl,
    categories: creator.categories,
    skinType: creator.skinType,
    skinConcerns: creator.skinConcerns,
    snsChannels: creator.snsChannels as Record<string, { url: string; isMain: boolean }> | null,
    instagramHandle: creator.instagramHandle,
    youtubeHandle: creator.youtubeHandle,
    tiktokHandle: creator.tiktokHandle,
    bio: creator.bio,
    sellingExperience: creator.sellingExperience,
    avgRevenue: creator.avgRevenue,
    onboardingStatus: creator.onboardingStatus,
    onboardingCompleted: creator.onboardingCompleted,
  }
}

export async function saveOnboardingStep(data: {
  step: number
  categories?: string[]
  skinType?: string
  skinConcerns?: string[]
  snsChannels?: Record<string, { url: string; isMain: boolean }>
  instagramHandle?: string
  youtubeHandle?: string
  tiktokHandle?: string
  bio?: string
  sellingExperience?: boolean
  avgRevenue?: string
  shopId?: string
  displayName?: string
  profileImageUrl?: string
}) {
  const { creator } = await requireCreator()

  const updateData: Record<string, unknown> = {}

  if (data.step === 0 && data.categories) {
    updateData.categories = data.categories
  }
  if (data.step === 1) {
    if (data.skinType !== undefined) updateData.skinType = data.skinType
    if (data.skinConcerns) updateData.skinConcerns = data.skinConcerns
  }
  if (data.step === 2 && data.snsChannels) {
    updateData.snsChannels = data.snsChannels
    if (data.instagramHandle !== undefined) updateData.instagramHandle = data.instagramHandle
    if (data.youtubeHandle !== undefined) updateData.youtubeHandle = data.youtubeHandle
    if (data.tiktokHandle !== undefined) updateData.tiktokHandle = data.tiktokHandle
  }
  if (data.step === 3) {
    if (data.bio !== undefined) updateData.bio = data.bio
    if (data.sellingExperience !== undefined) updateData.sellingExperience = data.sellingExperience
    if (data.avgRevenue !== undefined) updateData.avgRevenue = data.avgRevenue
  }
  if (data.step === 4) {
    if (data.shopId) updateData.shopId = data.shopId
    if (data.displayName) updateData.displayName = data.displayName
    if (data.profileImageUrl) updateData.profileImageUrl = data.profileImageUrl
    updateData.onboardingStatus = 'COMPLETE'
    updateData.onboardingCompleted = true
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.creator.update({
      where: { id: creator.id },
      data: updateData as Prisma.CreatorUpdateInput,
    })
  }

  return { success: true }
}
