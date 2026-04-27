'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { sendNotification, normalizePhone, isValidEmail } from '@/lib/notifications'
import { settlementConfirmedMessage, creatorApprovedMessage, creatorRejectedMessage, brandApprovedTemplate, brandRejectedTemplate, brandStatusChangedTemplate, creatorSuspendedMessage, creatorReactivatedMessage, creatorGradeChangedMessage } from '@/lib/notifications/templates'

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

  const brands = await prisma.brand.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { email: true, phone: true, name: true } },
      _count: {
        select: {
          products: true,
          campaigns: { where: { status: { in: ['RECRUITING', 'ACTIVE'] } } },
          orders: true,
        },
      },
    },
  })

  // 총 매출 집계
  const brandIds = brands.map(b => b.id)
  const salesAgg = await prisma.order.groupBy({
    by: ['brandId'],
    where: { brandId: { in: brandIds }, status: { notIn: ['CANCELLED', 'REFUNDED'] } },
    _sum: { totalAmount: true },
  })
  const salesMap = new Map(salesAgg.map(s => [s.brandId, Number(s._sum.totalAmount || 0)]))

  return brands.map(b => ({
    id: b.id,
    userId: b.userId,
    brandName: b.brandName,
    companyName: b.companyName,
    representativeName: b.representativeName,
    businessNumber: b.businessNumber,
    businessRegistrationUrl: b.businessRegistrationUrl,
    logoUrl: b.logoUrl,
    description: b.description,
    contactEmail: b.contactEmail,
    contactPhone: b.contactPhone,
    platformFeeRate: Number(b.platformFeeRate || 0),
    creatorCommissionRate: b.creatorCommissionRate,
    defaultShippingFee: Number(b.defaultShippingFee || 0),
    freeShippingThreshold: Number(b.freeShippingThreshold || 0),
    defaultCourier: b.defaultCourier,
    returnAddress: b.returnAddress,
    approved: b.approved,
    approvedAt: b.approvedAt,
    mocraStatus: b.mocraStatus,
    createdAt: b.createdAt,
    user: b.user,
    productCount: b._count.products,
    activeCampaignCount: b._count.campaigns,
    orderCount: b._count.orders,
    totalSales: salesMap.get(b.id) || 0,
  }))
}

export async function getAdminBrandDetail(brandId: string) {
  await requireAdmin()

  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    include: {
      user: { select: { email: true, phone: true, name: true } },
      products: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, price: true, status: true, thumbnailUrl: true },
      },
      campaigns: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, status: true, type: true, startAt: true, endAt: true },
      },
    },
  })
  if (!brand) throw new Error('브랜드를 찾을 수 없습니다')

  const recentOrders = await prisma.order.findMany({
    where: { brandId },
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: { id: true, orderNumber: true, totalAmount: true, status: true, createdAt: true },
  })

  const salesAgg = await prisma.order.aggregate({
    where: { brandId, status: { notIn: ['CANCELLED', 'REFUNDED'] } },
    _sum: { totalAmount: true },
    _count: true,
  })

  return {
    ...brand,
    platformFeeRate: Number(brand.platformFeeRate || 0),
    defaultShippingFee: Number(brand.defaultShippingFee || 0),
    freeShippingThreshold: Number(brand.freeShippingThreshold || 0),
    products: brand.products.map(p => ({ ...p, price: Number(p.price || 0) })),
    recentOrders: recentOrders.map(o => ({ ...o, totalAmount: Number(o.totalAmount || 0) })),
    totalSales: Number(salesAgg._sum.totalAmount || 0),
    totalOrders: salesAgg._count,
  }
}

export async function approveBrand(id: string) {
  await requireAdmin()
  const brand = await prisma.brand.update({
    where: { id },
    data: { approved: true, approvedAt: new Date() },
    select: { id: true, userId: true, companyName: true },
  })

  // Trial 자동 생성 (승인 시점에 3일 체험 시작)
  try {
    const now = new Date()
    const trialEndsAt = new Date(now)
    trialEndsAt.setDate(trialEndsAt.getDate() + 3)

    await prisma.brandSubscription.upsert({
      where: { brandId: brand.id },
      create: {
        brandId: brand.id,
        plan: 'TRIAL',
        planV3: 'TRIAL',
        status: 'ACTIVE',
        trialStartedAt: now,
        trialEndsAt,
        trialUsedCampaigns: 0,
        trialUsedMessages: 0,
        trialUsedDetailViews: 0,
        currentMonthCampaigns: 0,
        currentMonthMessages: 0,
        currentMonthResetAt: now,
        shopCommissionRate: 10.0,
        startedAt: now,
      },
      update: {},
    })
  } catch { /* ignore — 이미 구독이 있으면 건드리지 않음 */ }

  if (brand.userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: brand.userId },
        select: { email: true },
      })
      const brandName = brand.companyName ?? '브랜드'
      const tmpl = brandApprovedTemplate({
        brandName,
        recipientEmail: user?.email && isValidEmail(user.email) ? user.email : undefined,
      })
      await sendNotification({
        userId: brand.userId,
        ...tmpl.inApp,
        email: user?.email && isValidEmail(user.email) ? user.email : undefined,
        emailTemplate: user?.email && isValidEmail(user.email) ? tmpl.email : undefined,
      })
    } catch { /* ignore */ }
  }

  return brand
}

export async function updateBrandStatus(brandId: string, action: 'approve' | 'suspend' | 'reject') {
  await requireAdmin()

  const brand = await prisma.brand.findUnique({ where: { id: brandId }, select: { id: true, userId: true, companyName: true } })
  if (!brand) throw new Error('브랜드를 찾을 수 없습니다')

  const brandName = brand.companyName ?? '브랜드'
  let brandUser: { email: string | null } | null = null
  if (brand.userId) {
    brandUser = await prisma.user.findUnique({
      where: { id: brand.userId },
      select: { email: true },
    })
  }
  const brandEmail = brandUser?.email && isValidEmail(brandUser.email) ? brandUser.email : undefined

  if (action === 'approve') {
    await prisma.brand.update({ where: { id: brandId }, data: { approved: true, approvedAt: new Date() } })

    // Trial 자동 생성
    try {
      const now = new Date()
      const trialEndsAt = new Date(now)
      trialEndsAt.setDate(trialEndsAt.getDate() + 3)
      await prisma.brandSubscription.upsert({
        where: { brandId },
        create: {
          brandId,
          plan: 'TRIAL',
          planV3: 'TRIAL',
          status: 'ACTIVE',
          trialStartedAt: now,
          trialEndsAt,
          trialUsedCampaigns: 0,
          trialUsedMessages: 0,
          trialUsedDetailViews: 0,
          currentMonthCampaigns: 0,
          currentMonthMessages: 0,
          currentMonthResetAt: now,
          shopCommissionRate: 10.0,
          startedAt: now,
        },
        update: {},
      })
    } catch { /* ignore */ }

    if (brand.userId) {
      try {
        const tmpl = brandApprovedTemplate({ brandName, recipientEmail: brandEmail })
        await sendNotification({
          userId: brand.userId,
          ...tmpl.inApp,
          email: brandEmail,
          emailTemplate: brandEmail ? tmpl.email : undefined,
        })
      } catch { /* ignore */ }
    }
  } else if (action === 'suspend') {
    await prisma.brand.update({ where: { id: brandId }, data: { approved: false } })
    if (brand.userId) {
      try {
        const tmpl = brandStatusChangedTemplate({ brandName, status: '정지', recipientEmail: brandEmail })
        await sendNotification({
          userId: brand.userId,
          ...tmpl.inApp,
          email: brandEmail,
          emailTemplate: brandEmail ? tmpl.email : undefined,
        })
      } catch { /* ignore */ }
    }
  } else if (action === 'reject') {
    await prisma.brand.update({ where: { id: brandId }, data: { approved: false } })
    if (brand.userId) {
      try {
        const tmpl = brandRejectedTemplate({ brandName, recipientEmail: brandEmail })
        await sendNotification({
          userId: brand.userId,
          ...tmpl.inApp,
          email: brandEmail,
          emailTemplate: brandEmail ? tmpl.email : undefined,
        })
      } catch { /* ignore */ }
    }
  }

  return { success: true }
}

// ==================== Creators ====================

export async function getAdminCreators() {
  await requireAdmin()

  const creators = await prisma.creator.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { email: true, phone: true } },
      grade: true,
      _count: {
        select: {
          shopItems: true,
          shopVisits: true,
        },
      },
    },
  })

  // 통계 집계
  const creatorIds = creators.map(c => c.id)

  const [orderAgg, commissionAgg, campaignAgg] = await Promise.all([
    prisma.order.groupBy({
      by: ['creatorId'],
      where: { creatorId: { in: creatorIds }, status: { notIn: ['CANCELLED', 'REFUNDED'] } },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.conversion.groupBy({
      by: ['creatorId'],
      where: { creatorId: { in: creatorIds } },
      _sum: { commissionAmount: true },
    }),
    prisma.campaignParticipation.groupBy({
      by: ['creatorId'],
      where: { creatorId: { in: creatorIds } },
      _count: true,
    }),
  ])

  const orderMap = new Map(orderAgg.map(o => [o.creatorId, { sales: Number(o._sum.totalAmount || 0), count: o._count }]))
  const commissionMap = new Map(commissionAgg.map(c => [c.creatorId, Number(c._sum.commissionAmount || 0)]))
  const campaignMap = new Map(campaignAgg.map(c => [c.creatorId, c._count]))

  return creators.map(c => ({
    id: c.id,
    userId: c.userId,
    displayName: c.displayName,
    username: c.username,
    shopId: c.shopId,
    profileImage: c.profileImage,
    profileImageUrl: c.profileImageUrl,
    bio: c.bio,
    instagramHandle: c.instagramHandle,
    youtubeHandle: c.youtubeHandle,
    tiktokHandle: c.tiktokHandle,
    skinType: c.skinType,
    personalColor: c.personalColor,
    skinConcerns: c.skinConcerns,
    ageRange: c.ageRange,
    status: c.status,
    country: c.country,
    createdAt: c.createdAt,
    user: c.user,
    grade: c.grade ? { grade: c.grade.grade, monthlySales: c.grade.monthlySales, commissionBonusRate: Number(c.grade.commissionBonusRate || 0) } : null,
    totalSales: orderMap.get(c.id)?.sales || 0,
    orderCount: orderMap.get(c.id)?.count || 0,
    totalCommission: commissionMap.get(c.id) || 0,
    shopVisitCount: c._count.shopVisits,
    shopItemCount: c._count.shopItems,
    campaignCount: campaignMap.get(c.id) || 0,
  }))
}

export async function getAdminCreatorDetail(creatorId: string) {
  await requireAdmin()

  const creator = await prisma.creator.findUnique({
    where: { id: creatorId },
    include: {
      user: { select: { email: true, phone: true } },
      grade: true,
    },
  })
  if (!creator) throw new Error('크리에이터를 찾을 수 없습니다')

  const [recentOrders, participations, orderAgg, commissionAgg, shopVisitCount, shopItemCount, campaignCount] = await Promise.all([
    prisma.order.findMany({
      where: { creatorId },
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { id: true, orderNumber: true, totalAmount: true, status: true, createdAt: true },
    }),
    prisma.campaignParticipation.findMany({
      where: { creatorId },
      orderBy: { appliedAt: 'desc' },
      include: { campaign: { select: { id: true, title: true, status: true, type: true } } },
    }),
    prisma.order.aggregate({
      where: { creatorId, status: { notIn: ['CANCELLED', 'REFUNDED'] } },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.conversion.aggregate({
      where: { creatorId },
      _sum: { commissionAmount: true },
    }),
    prisma.shopVisit.count({ where: { creatorId } }),
    prisma.creatorShopItem.count({ where: { creatorId } }),
    prisma.campaignParticipation.count({ where: { creatorId } }),
  ])

  return {
    ...creator,
    grade: creator.grade ? { grade: creator.grade.grade, monthlySales: creator.grade.monthlySales, commissionBonusRate: Number(creator.grade.commissionBonusRate || 0) } : null,
    recentOrders: recentOrders.map(o => ({ ...o, totalAmount: Number(o.totalAmount || 0) })),
    participations,
    totalSales: Number(orderAgg._sum.totalAmount || 0),
    orderCount: orderAgg._count,
    totalCommission: Number(commissionAgg._sum.commissionAmount || 0),
    shopVisitCount,
    shopItemCount,
    campaignCount,
  }
}

export async function updateCreatorStatus(creatorId: string, status: 'ACTIVE' | 'SUSPENDED') {
  await requireAdmin()

  const creator = await prisma.creator.findUnique({
    where: { id: creatorId },
    select: { id: true, userId: true, displayName: true, user: { select: { email: true, phone: true } } },
  })
  if (!creator) throw new Error('크리에이터를 찾을 수 없습니다')

  await prisma.creator.update({ where: { id: creatorId }, data: { status } })

  if (creator.userId) {
    try {
      const creatorEmail = isValidEmail(creator.user?.email) ? creator.user!.email! : undefined
      const creatorPhone = normalizePhone(creator.user?.phone)
      const creatorName = creator.displayName || ''

      if (status === 'SUSPENDED') {
        const tmpl = creatorSuspendedMessage({ creatorName, reason: '관리자에 의한 정지', recipientEmail: creatorEmail })
        await sendNotification({
          userId: creator.userId,
          type: tmpl.inApp.type,
          title: tmpl.inApp.title,
          message: tmpl.inApp.message,
          linkUrl: tmpl.inApp.linkUrl,
          phone: creatorPhone,
          receiverName: creatorName,
          kakaoTemplate: tmpl.kakao,
          email: creatorEmail,
          emailTemplate: tmpl.email,
        })
      } else {
        const tmpl = creatorReactivatedMessage({ creatorName, recipientEmail: creatorEmail })
        await sendNotification({
          userId: creator.userId,
          type: tmpl.inApp.type,
          title: tmpl.inApp.title,
          message: tmpl.inApp.message,
          linkUrl: tmpl.inApp.linkUrl,
          email: creatorEmail,
          emailTemplate: tmpl.email,
        })
      }
    } catch { /* ignore */ }
  }

  return { success: true }
}

export async function updateCreatorGrade(creatorId: string, grade: string) {
  await requireAdmin()

  const creator = await prisma.creator.findUnique({
    where: { id: creatorId },
    select: { id: true, userId: true, displayName: true, user: { select: { email: true } } },
  })
  if (!creator) throw new Error('크리에이터를 찾을 수 없습니다')

  await prisma.creatorGrade.upsert({
    where: { creatorId },
    create: { creatorId, grade, gradeUpdatedAt: new Date() },
    update: { grade, gradeUpdatedAt: new Date() },
  })

  if (creator.userId) {
    try {
      const creatorEmail = isValidEmail(creator.user?.email) ? creator.user!.email! : undefined
      const creatorName = creator.displayName || ''
      const tmpl = creatorGradeChangedMessage({ creatorName, grade, recipientEmail: creatorEmail })
      await sendNotification({
        userId: creator.userId,
        type: tmpl.inApp.type,
        title: tmpl.inApp.title,
        message: tmpl.inApp.message,
        linkUrl: tmpl.inApp.linkUrl,
        email: creatorEmail,
        emailTemplate: tmpl.email,
      })
    } catch { /* ignore */ }
  }

  return { success: true }
}

// ==================== Creator Approval ====================

export async function getCreatorApprovalStats() {
  await requireAdmin()

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const [
    creatorPending,
    creatorTodayNew,
    brandPending,
    brandTodayNew,
    avgReviewTime,
  ] = await Promise.all([
    prisma.creator.count({ where: { status: 'PENDING' } }),
    prisma.creator.count({ where: { status: 'PENDING', submittedAt: { gte: todayStart } } }),
    prisma.brand.count({ where: { approved: false, approvedAt: null } }),
    prisma.brand.count({ where: { approved: false, approvedAt: null, createdAt: { gte: todayStart } } }),
    prisma.creator.findMany({
      where: { reviewedAt: { not: null }, submittedAt: { not: null } },
      select: { submittedAt: true, reviewedAt: true },
      take: 100,
      orderBy: { reviewedAt: 'desc' },
    }),
  ])

  let avgHours: number | null = null
  if (avgReviewTime.length > 0) {
    const totalMs = avgReviewTime.reduce((sum, c) => {
      if (!c.submittedAt || !c.reviewedAt) return sum
      return sum + (new Date(c.reviewedAt).getTime() - new Date(c.submittedAt).getTime())
    }, 0)
    avgHours = Math.round(totalMs / avgReviewTime.length / (1000 * 60 * 60) * 10) / 10
  }

  return { creatorPending, creatorTodayNew, brandPending, brandTodayNew, avgReviewHours: avgHours }
}

export async function getAdminCreatorApprovals(filters: {
  status?: string
  category?: string
  followerRange?: string
  search?: string
  page?: number
} = {}) {
  await requireAdmin()

  const where: Record<string, unknown> = {}

  if (filters.status && filters.status !== 'all') {
    where.status = filters.status
  }
  if (filters.category && filters.category !== 'all') {
    where.primaryCategory = filters.category
  }
  if (filters.followerRange && filters.followerRange !== 'all') {
    const ranges: Record<string, { gte?: number; lt?: number }> = {
      '0-1000': { lt: 1000 },
      '1000-10000': { gte: 1000, lt: 10000 },
      '10000-100000': { gte: 10000, lt: 100000 },
      '100000+': { gte: 100000 },
    }
    const range = ranges[filters.followerRange]
    if (range) {
      where.igFollowers = range
    }
  }
  if (filters.search) {
    const s = filters.search
    where.OR = [
      { displayName: { contains: s, mode: 'insensitive' } },
      { instagramHandle: { contains: s, mode: 'insensitive' } },
      { user: { email: { contains: s, mode: 'insensitive' } } },
      { user: { name: { contains: s, mode: 'insensitive' } } },
    ]
  }

  const pageSize = 20
  const page = filters.page || 1

  const [creators, total] = await Promise.all([
    prisma.creator.findMany({
      where,
      orderBy: [{ submittedAt: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { email: true, phone: true, name: true } },
      },
    }),
    prisma.creator.count({ where }),
  ])

  return {
    creators: creators.map(c => ({
      id: c.id,
      userId: c.userId,
      displayName: c.displayName,
      shopId: c.shopId,
      profileImageUrl: c.profileImageUrl,
      instagramHandle: c.instagramHandle,
      youtubeHandle: c.youtubeHandle,
      tiktokHandle: c.tiktokHandle,
      igFollowers: c.igFollowers,
      primaryCategory: c.primaryCategory,
      categories: c.categories,
      bio: c.bio,
      status: c.status,
      submittedAt: c.submittedAt,
      reviewedAt: c.reviewedAt,
      rejectionReason: c.rejectionReason,
      createdAt: c.createdAt,
      user: c.user,
    })),
    total,
    pageSize,
  }
}

export async function getCreatorApprovalDetail(creatorId: string) {
  await requireAdmin()

  const creator = await prisma.creator.findUnique({
    where: { id: creatorId },
    include: {
      user: { select: { email: true, phone: true, name: true, createdAt: true, ci: true, phoneReachable: true } },
    },
  })
  if (!creator) throw new Error('크리에이터를 찾을 수 없습니다')

  return {
    id: creator.id,
    userId: creator.userId,
    displayName: creator.displayName,
    shopId: creator.shopId,
    profileImage: creator.profileImage,
    profileImageUrl: creator.profileImageUrl,
    instagramHandle: creator.instagramHandle,
    youtubeHandle: creator.youtubeHandle,
    tiktokHandle: creator.tiktokHandle,
    igFollowers: creator.igFollowers,
    igEngagementRate: creator.igEngagementRate ? Number(creator.igEngagementRate) : null,
    igCategory: creator.igCategory,
    igBio: creator.igBio,
    igVerified: creator.igVerified,
    primaryCategory: creator.primaryCategory,
    categories: creator.categories,
    bio: creator.bio,
    skinType: creator.skinType,
    personalColor: creator.personalColor,
    skinConcerns: creator.skinConcerns,
    ageRange: creator.ageRange,
    status: creator.status,
    submittedAt: creator.submittedAt,
    reviewedAt: creator.reviewedAt,
    reviewedBy: creator.reviewedBy,
    rejectionReason: creator.rejectionReason,
    approvalNote: creator.approvalNote,
    onboardingCompleted: creator.onboardingCompleted,
    createdAt: creator.createdAt,
    user: creator.user,
  }
}

export async function approveCreator(creatorId: string, note?: string) {
  const admin = await requireAdmin()

  const creator = await prisma.creator.findUnique({
    where: { id: creatorId },
    select: { id: true, userId: true, displayName: true, username: true },
  })
  if (!creator) throw new Error('크리에이터를 찾을 수 없습니다')

  await prisma.creator.update({
    where: { id: creatorId },
    data: {
      status: 'APPROVED',
      reviewedAt: new Date(),
      reviewedBy: admin.id,
      approvalNote: note || null,
      rejectionReason: null,
    },
  })

  // 가입 축하 포인트 3,000원 지급
  try {
    await prisma.creatorPoint.create({
      data: {
        creatorId,
        amount: 3000,
        pointType: 'SIGNUP_BONUS',
        balanceAfter: 3000,
        description: '가입 축하 포인트',
      },
    })
  } catch { /* 포인트 테이블이 없을 수 있음 */ }

  // 알림 발송
  if (creator.userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: creator.userId },
        select: { email: true, phone: true },
      })
      const creatorName = creator.displayName || creator.username || '크리에이터'
      const tmpl = creatorApprovedMessage({
        creatorName,
        recipientEmail: user?.email && isValidEmail(user.email) ? user.email : undefined,
      })

      await sendNotification({
        userId: creator.userId,
        ...tmpl.inApp,
        phone: normalizePhone(user?.phone),
        email: user?.email && isValidEmail(user.email) ? user.email : undefined,
        kakaoTemplate: normalizePhone(user?.phone) ? tmpl.kakao : undefined,
        emailTemplate: user?.email && isValidEmail(user.email) ? tmpl.email : undefined,
      })
    } catch { /* 알림 실패 무시 */ }
  }

  return { success: true }
}

export async function rejectCreator(creatorId: string, reason: string) {
  const admin = await requireAdmin()

  if (!reason || reason.trim().length === 0) {
    throw new Error('거절 사유를 입력해주세요')
  }

  const creator = await prisma.creator.findUnique({
    where: { id: creatorId },
    select: { id: true, userId: true, displayName: true, username: true },
  })
  if (!creator) throw new Error('크리에이터를 찾을 수 없습니다')

  await prisma.creator.update({
    where: { id: creatorId },
    data: {
      status: 'REJECTED',
      reviewedAt: new Date(),
      reviewedBy: admin.id,
      rejectionReason: reason,
    },
  })

  // 알림 발송
  if (creator.userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: creator.userId },
        select: { email: true, phone: true },
      })
      const creatorName = creator.displayName || creator.username || '크리에이터'
      const tmpl = creatorRejectedMessage({
        creatorName,
        reason,
        recipientEmail: user?.email && isValidEmail(user.email) ? user.email : undefined,
      })

      await sendNotification({
        userId: creator.userId,
        ...tmpl.inApp,
        phone: normalizePhone(user?.phone),
        email: user?.email && isValidEmail(user.email) ? user.email : undefined,
        kakaoTemplate: normalizePhone(user?.phone) ? tmpl.kakao : undefined,
        emailTemplate: user?.email && isValidEmail(user.email) ? tmpl.email : undefined,
      })
    } catch { /* 알림 실패 무시 */ }
  }

  return { success: true }
}

export async function bulkApproveCreators(ids: string[]) {
  const admin = await requireAdmin()

  if (!ids || ids.length === 0) throw new Error('선택된 크리에이터가 없습니다')

  const creators = await prisma.creator.findMany({
    where: { id: { in: ids }, status: 'PENDING' },
    select: { id: true, userId: true, displayName: true, username: true },
  })

  if (creators.length === 0) throw new Error('승인 대기 중인 크리에이터가 없습니다')

  // 일괄 상태 업데이트
  await prisma.creator.updateMany({
    where: { id: { in: creators.map(c => c.id) } },
    data: {
      status: 'APPROVED',
      reviewedAt: new Date(),
      reviewedBy: admin.id,
      rejectionReason: null,
    },
  })

  // 각 크리에이터에게 알림 발송 (비동기, 실패 무시)
  for (const creator of creators) {
    try {
      await prisma.creatorPoint.create({
        data: { creatorId: creator.id, amount: 3000, pointType: 'SIGNUP_BONUS', balanceAfter: 3000, description: '가입 축하 포인트' },
      })
    } catch { /* ignore */ }

    if (creator.userId) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: creator.userId },
          select: { email: true, phone: true },
        })
        const creatorName = creator.displayName || creator.username || '크리에이터'
        const tmpl = creatorApprovedMessage({
          creatorName,
          recipientEmail: user?.email && isValidEmail(user.email) ? user.email : undefined,
        })
        sendNotification({
          userId: creator.userId,
          ...tmpl.inApp,
          phone: normalizePhone(user?.phone),
          email: user?.email && isValidEmail(user.email) ? user.email : undefined,
          kakaoTemplate: normalizePhone(user?.phone) ? tmpl.kakao : undefined,
          emailTemplate: user?.email && isValidEmail(user.email) ? tmpl.email : undefined,
        })
      } catch { /* ignore */ }
    }
  }

  return { success: true, count: creators.length }
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

export async function getAdminDashboardCharts(period: '7d' | '30d' | '90d') {
  await requireAdmin()

  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  startDate.setHours(0, 0, 0, 0)

  // Previous period for comparison
  const prevStart = new Date(startDate)
  prevStart.setDate(prevStart.getDate() - days)

  // Daily orders for the period
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: startDate }, status: { notIn: ['CANCELLED', 'REFUNDED'] } },
    select: { totalAmount: true, createdAt: true, brandId: true, creatorId: true },
  })

  // Previous period orders for comparison
  const prevOrders = await prisma.order.findMany({
    where: { createdAt: { gte: prevStart, lt: startDate }, status: { notIn: ['CANCELLED', 'REFUNDED'] } },
    select: { totalAmount: true },
  })

  const prevGMV = prevOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0)
  const prevOrderCount = prevOrders.length

  // Daily aggregation
  const dailyMap = new Map<string, { sales: number; orders: number }>()
  for (let d = new Date(startDate); d <= new Date(); d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10)
    dailyMap.set(key, { sales: 0, orders: 0 })
  }
  for (const o of orders) {
    const key = new Date(o.createdAt).toISOString().slice(0, 10)
    const existing = dailyMap.get(key)
    if (existing) {
      existing.sales += Number(o.totalAmount || 0)
      existing.orders += 1
    }
  }
  const dailySales = Array.from(dailyMap.entries()).map(([date, data]) => ({
    date, sales: data.sales, orders: data.orders,
  }))

  // Daily signups
  const users = await prisma.user.findMany({
    where: { createdAt: { gte: startDate } },
    select: { createdAt: true, role: true },
  })
  const signupMap = new Map<string, { brand: number; creator: number; buyer: number }>()
  for (const [key] of dailyMap) {
    signupMap.set(key, { brand: 0, creator: 0, buyer: 0 })
  }
  for (const u of users) {
    const key = new Date(u.createdAt).toISOString().slice(0, 10)
    const existing = signupMap.get(key)
    if (existing) {
      if (u.role === 'brand_admin') existing.brand += 1
      else if (u.role === 'creator') existing.creator += 1
      else if (u.role === 'buyer') existing.buyer += 1
    }
  }
  const dailySignups = Array.from(signupMap.entries()).map(([date, data]) => ({
    date, ...data,
  }))

  // Brand TOP 5
  const brandSalesMap = new Map<string, number>()
  for (const o of orders) {
    if (o.brandId) {
      brandSalesMap.set(o.brandId, (brandSalesMap.get(o.brandId) || 0) + Number(o.totalAmount || 0))
    }
  }
  const topBrandIds = Array.from(brandSalesMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const brandNames = await prisma.brand.findMany({
    where: { id: { in: topBrandIds.map(b => b[0]) } },
    select: { id: true, brandName: true, companyName: true },
  })
  const brandNameMap = new Map(brandNames.map(b => [b.id, b.brandName || b.companyName || '알 수 없음']))
  const topBrands = topBrandIds.map(([id, sales]) => ({
    name: brandNameMap.get(id) || '알 수 없음', sales,
  }))

  // Creator TOP 5
  const creatorSalesMap = new Map<string, number>()
  for (const o of orders) {
    if (o.creatorId) {
      creatorSalesMap.set(o.creatorId, (creatorSalesMap.get(o.creatorId) || 0) + Number(o.totalAmount || 0))
    }
  }
  const topCreatorIds = Array.from(creatorSalesMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const creatorNames = await prisma.creator.findMany({
    where: { id: { in: topCreatorIds.map(c => c[0]) } },
    select: { id: true, displayName: true, username: true },
  })
  const creatorNameMap = new Map(creatorNames.map(c => [c.id, c.displayName || c.username || '알 수 없음']))
  const topCreators = topCreatorIds.map(([id, sales]) => ({
    name: creatorNameMap.get(id) || '알 수 없음', sales,
  }))

  // Product TOP 5
  const orderItems = await prisma.orderItem.findMany({
    where: { order: { createdAt: { gte: startDate }, status: { notIn: ['CANCELLED', 'REFUNDED'] } } },
    select: { productId: true, quantity: true, totalPrice: true },
  })
  const productMap = new Map<string, { qty: number; sales: number }>()
  for (const item of orderItems) {
    if (!item.productId) continue
    const existing = productMap.get(item.productId) || { qty: 0, sales: 0 }
    existing.qty += item.quantity
    existing.sales += Number(item.totalPrice || 0)
    productMap.set(item.productId, existing)
  }
  const topProductIds = Array.from(productMap.entries()).sort((a, b) => b[1].sales - a[1].sales).slice(0, 5)
  const productNames = await prisma.product.findMany({
    where: { id: { in: topProductIds.map(p => p[0]) } },
    select: { id: true, name: true },
  })
  const productNameMap = new Map(productNames.map(p => [p.id, p.name || '알 수 없음']))
  const topProducts = topProductIds.map(([id, data]) => ({
    name: productNameMap.get(id) || '알 수 없음', quantity: data.qty, sales: data.sales,
  }))

  // Campaign type comparison
  const campaignOrders = await prisma.order.findMany({
    where: { createdAt: { gte: startDate }, status: { notIn: ['CANCELLED', 'REFUNDED'] } },
    select: { totalAmount: true, items: { select: { product: { select: { campaignProducts: { select: { campaign: { select: { type: true } } } } } } } } },
  })
  let gongguSales = 0
  let alwaysSales = 0
  for (const o of campaignOrders) {
    const amount = Number(o.totalAmount || 0)
    const types = new Set<string>()
    for (const item of o.items) {
      for (const cp of (item.product?.campaignProducts || [])) {
        if (cp.campaign?.type) types.add(cp.campaign.type)
      }
    }
    if (types.has('GONGGU')) gongguSales += amount
    else if (types.has('ALWAYS')) alwaysSales += amount
  }

  return {
    dailySales,
    dailySignups,
    topBrands,
    topCreators,
    topProducts,
    campaignTypeSales: { gonggu: gongguSales, always: alwaysSales },
    comparison: {
      prevGMV,
      prevOrderCount,
      currentGMV: orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0),
      currentOrderCount: orders.length,
    },
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

export async function confirmSettlement(settlementId: string) {
  await requireAdmin()

  const settlement = await prisma.settlement.update({
    where: { id: settlementId },
    data: {
      status: 'CONFIRMED',
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          creator: { select: { displayName: true, username: true } },
        },
      },
    },
  })

  // 크리에이터에게 정산 확정 알림 (3채널 - CNECSHOP_012)
  try {
    const user = settlement.user
    if (user) {
      const creatorEmail = isValidEmail(user.email) ? user.email! : undefined
      const creatorPhone = normalizePhone(user.phone)
      const creatorName = user.creator?.displayName
        ?? user.creator?.username
        ?? user.name
        ?? '크리에이터'
      const period = settlement.periodStart && settlement.periodEnd
        ? `${(settlement.periodStart as Date).toISOString().slice(0, 10)} ~ ${(settlement.periodEnd as Date).toISOString().slice(0, 10)}`
        : '이번 기간'

      const tmpl = settlementConfirmedMessage({
        creatorName,
        period,
        netAmount: Number(settlement.netAmount ?? 0),
        paymentDate: settlement.paidAt
          ? (settlement.paidAt as Date).toISOString().slice(0, 10)
          : '확인 후 안내',
        recipientEmail: creatorEmail,
      })

      sendNotification({
        userId: user.id,
        ...tmpl.inApp,
        phone: creatorPhone,
        email: creatorEmail,
        kakaoTemplate: creatorPhone ? tmpl.kakao : undefined,
        emailTemplate: creatorEmail ? tmpl.email : undefined,
      })
    }
  } catch {
    // 알림 실패가 정산 확정에 영향 주지 않음
  }

  return settlement
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
  brandId?: string
  sort?: string
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
  if (filters.brandId && filters.brandId !== 'all') {
    where.brandId = filters.brandId
  }
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { brand: { companyName: { contains: filters.search, mode: 'insensitive' } } },
    ]
  }

  let orderBy: Record<string, string> | Array<Record<string, unknown>> = { createdAt: 'desc' }
  if (filters.sort === 'deadline') {
    orderBy = { endAt: 'asc' }
  } else if (filters.sort === 'name') {
    orderBy = [{ brand: { companyName: 'asc' } }, { createdAt: 'desc' }]
  }

  const campaigns = await prisma.campaign.findMany({
    where,
    orderBy,
    include: {
      brand: { select: { id: true, companyName: true, logoUrl: true } },
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

export async function getAdminCampaignStats(filters: { brandId?: string; type?: string } = {}) {
  await requireAdmin()

  const where: Record<string, unknown> = {}
  if (filters.brandId && filters.brandId !== 'all') {
    where.brandId = filters.brandId
  }
  if (filters.type && filters.type !== 'all') {
    where.type = filters.type
  }

  const counts = await prisma.campaign.groupBy({
    by: ['status'],
    where,
    _count: true,
  })

  const stats: Record<string, number> = { DRAFT: 0, RECRUITING: 0, ACTIVE: 0, ENDED: 0 }
  for (const c of counts) {
    stats[c.status] = c._count
  }
  return stats
}

export async function getAdminCampaignDetail(campaignId: string) {
  await requireAdmin()

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      brand: { select: { id: true, companyName: true, brandName: true } },
      products: {
        include: {
          product: { select: { id: true, name: true, thumbnailUrl: true, price: true, status: true } },
        },
      },
      participations: true,
    },
  })
  if (!campaign) throw new Error('캠페인을 찾을 수 없습니다')

  // Get creator info for participations
  const creatorIds = campaign.participations.map(p => p.creatorId)
  const creators = await prisma.creator.findMany({
    where: { id: { in: creatorIds } },
    select: { id: true, displayName: true, shopId: true, profileImageUrl: true },
  })
  const creatorMap = new Map(creators.map(c => [c.id, c]))

  // Get per-creator order stats for this campaign
  const orders = await prisma.order.findMany({
    where: {
      creatorId: { in: creatorIds },
      items: { some: { product: { campaignProducts: { some: { campaignId } } } } },
      status: { notIn: ['CANCELLED', 'REFUNDED'] },
    },
    select: { id: true, creatorId: true, totalAmount: true },
  })

  const creatorSalesMap = new Map<string, { count: number; sales: number }>()
  for (const o of orders) {
    if (!o.creatorId) continue
    const existing = creatorSalesMap.get(o.creatorId) || { count: 0, sales: 0 }
    existing.count += 1
    existing.sales += Number(o.totalAmount || 0)
    creatorSalesMap.set(o.creatorId, existing)
  }

  // Per-creator commissions
  const conversions = await prisma.conversion.findMany({
    where: { creatorId: { in: creatorIds } },
    select: { creatorId: true, commissionAmount: true },
  })
  const commissionMap = new Map<string, number>()
  for (const cv of conversions) {
    commissionMap.set(cv.creatorId, (commissionMap.get(cv.creatorId) || 0) + Number(cv.commissionAmount || 0))
  }

  // Overall stats
  const totalOrders = orders.length
  const totalSales = orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0)
  const totalCommission = conversions.reduce((sum, cv) => sum + Number(cv.commissionAmount || 0), 0)

  // Shop visits for participating creators
  const shopVisitCount = await prisma.shopVisit.count({
    where: { creatorId: { in: creatorIds } },
  })

  return {
    ...campaign,
    commissionRate: Number(campaign.commissionRate),
    products: campaign.products.map(cp => ({
      ...cp,
      campaignPrice: Number(cp.campaignPrice),
      product: { ...cp.product, price: cp.product.price ? Number(cp.product.price) : null },
    })),
    participations: campaign.participations.map(p => {
      const creator = creatorMap.get(p.creatorId)
      const sales = creatorSalesMap.get(p.creatorId)
      const commission = commissionMap.get(p.creatorId) || 0
      return {
        ...p,
        creator: creator || null,
        orderCount: sales?.count || 0,
        totalSales: sales?.sales || 0,
        commission,
      }
    }).sort((a, b) => b.totalSales - a.totalSales),
    stats: {
      totalOrders,
      totalSales,
      totalCommission,
      avgOrderAmount: totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0,
      shopVisitCount,
      conversionRate: shopVisitCount > 0 ? ((totalOrders / shopVisitCount) * 100).toFixed(1) : null,
    },
  }
}

// ==================== Sample Requests ====================

interface SampleFilters {
  status?: string
  brandId?: string
  search?: string
}

export async function getAdminSampleRequests(filters: SampleFilters = {}) {
  await requireAdmin()

  const where: Record<string, unknown> = {}

  if (filters.status && filters.status !== 'all') {
    where.status = filters.status
  }
  if (filters.brandId && filters.brandId !== 'all') {
    where.brandId = filters.brandId
  }
  if (filters.search) {
    where.OR = [
      { creator: { displayName: { contains: filters.search, mode: 'insensitive' } } },
      { creator: { shopId: { contains: filters.search, mode: 'insensitive' } } },
      { brand: { brandName: { contains: filters.search, mode: 'insensitive' } } },
      { brand: { companyName: { contains: filters.search, mode: 'insensitive' } } },
    ]
  }

  const samples = await prisma.sampleRequest.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      creator: { select: { id: true, displayName: true, shopId: true, profileImageUrl: true, instagramHandle: true, youtubeHandle: true, tiktokHandle: true } },
      brand: { select: { id: true, brandName: true, companyName: true } },
      product: { select: { id: true, name: true, thumbnailUrl: true } },
    },
  })

  return samples
}

export async function getAdminSampleStats() {
  await requireAdmin()

  const counts = await prisma.sampleRequest.groupBy({
    by: ['status'],
    _count: true,
  })

  const stats: Record<string, number> = { pending: 0, approved: 0, shipped: 0, received: 0, decided: 0, rejected: 0, cancelled: 0 }
  for (const c of counts) {
    stats[c.status] = c._count
  }

  // Conversion rate: received → decided(PROCEED)
  const decidedProceed = await prisma.sampleRequest.count({ where: { status: 'decided', decision: 'PROCEED' } })
  const totalReceived = stats.received + stats.decided

  return {
    ...stats,
    decidedProceed,
    conversionRate: totalReceived > 0 ? ((decidedProceed / totalReceived) * 100).toFixed(1) : null,
  }
}

export async function getAdminSampleDetail(sampleId: string) {
  await requireAdmin()

  const sample = await prisma.sampleRequest.findUnique({
    where: { id: sampleId },
    include: {
      creator: { select: { id: true, displayName: true, shopId: true, profileImageUrl: true, instagramHandle: true, youtubeHandle: true, tiktokHandle: true } },
      brand: { select: { id: true, brandName: true, companyName: true } },
      product: { select: { id: true, name: true, thumbnailUrl: true, price: true } },
    },
  })
  if (!sample) throw new Error('샘플 신청을 찾을 수 없습니다')

  return {
    ...sample,
    product: sample.product ? { ...sample.product, price: sample.product.price ? Number(sample.product.price) : null } : null,
  }
}

export async function updateAdminSampleNote(sampleId: string, adminNote: string) {
  await requireAdmin()
  await prisma.sampleRequest.update({ where: { id: sampleId }, data: { adminNote } })
  return { success: true }
}

export async function getAdminBrandList() {
  await requireAdmin()
  return prisma.brand.findMany({
    where: { approved: true },
    select: { id: true, brandName: true, companyName: true, logoUrl: true },
    orderBy: { companyName: 'asc' },
  })
}

// ==================== Dashboard V2 (Redesign) ====================

import {
  nowKst,
  startOfDayKst,
  startOfMonthKst,
  startOfYesterdayKst,
  yesterdaySameTimeKst,
  startOfLastMonthKst,
  lastMonthSameTimeKst,
  daysAgoStartKst,
} from '@/lib/utils/timezone'
import { format, subDays } from 'date-fns'
import { ko } from 'date-fns/locale'
import { toZonedTime } from 'date-fns-tz'

const KST_TZ = 'Asia/Seoul'

export async function getAdminKpiStats() {
  await requireAdmin()

  const now = nowKst()
  const todayStart = startOfDayKst()
  const yesterdayStart = startOfYesterdayKst()
  const yesterdaySameTime = yesterdaySameTimeKst()
  const monthStart = startOfMonthKst()
  const lastMonthStart = startOfLastMonthKst()
  const lastMonthSameTime = lastMonthSameTimeKst()

  const [
    todayOrders,
    yesterdayOrders,
    monthOrders,
    lastMonthOrders,
    activeCampaigns,
    activeCreators,
    activeBrands,
    newCreatorsThisMonth,
    newBrandsThisMonth,
  ] = await Promise.all([
    // 오늘 주문 (PAID)
    prisma.order.findMany({
      where: { status: 'PAID', paidAt: { gte: todayStart, lte: now } },
      select: { totalAmount: true },
    }),
    // 어제 같은 시점까지 주문
    prisma.order.findMany({
      where: { status: 'PAID', paidAt: { gte: yesterdayStart, lte: yesterdaySameTime } },
      select: { totalAmount: true },
    }),
    // 이번 달 주문
    prisma.order.findMany({
      where: { status: 'PAID', paidAt: { gte: monthStart, lte: now } },
      select: { totalAmount: true },
    }),
    // 지난 달 같은 시점까지 주문
    prisma.order.findMany({
      where: { status: 'PAID', paidAt: { gte: lastMonthStart, lte: lastMonthSameTime } },
      select: { totalAmount: true },
    }),
    // 활성 캠페인
    prisma.campaign.count({
      where: { status: 'ACTIVE', endAt: { gte: now } },
    }),
    // 활성 크리에이터
    prisma.creator.count({
      where: { onboardingStatus: 'APPROVED' },
    }),
    // 승인 브랜드
    prisma.brand.count({
      where: { approved: true },
    }),
    // 이번 달 신규 크리에이터
    prisma.creator.count({
      where: { createdAt: { gte: monthStart } },
    }),
    // 이번 달 신규 브랜드
    prisma.brand.count({
      where: { createdAt: { gte: monthStart } },
    }),
  ])

  const sumAmount = (orders: { totalAmount: unknown }[]) =>
    orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0)

  return {
    todayGmv: sumAmount(todayOrders),
    todayGmvPrev: sumAmount(yesterdayOrders),
    todayOrders: todayOrders.length,
    todayOrdersPrev: yesterdayOrders.length,
    monthGmv: sumAmount(monthOrders),
    monthGmvPrev: sumAmount(lastMonthOrders),
    activeCampaigns,
    activeCreators,
    activeBrands,
    newCreatorsThisMonth,
    newBrandsThisMonth,
  }
}

export async function getAdminPendingQueue() {
  await requireAdmin()

  const now = nowKst()
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const twentyFourHoursLater = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  const [
    pendingCreatorApprovals,
    pendingBrandApprovals,
    pendingSettlementsData,
    failedPayments,
    lowStockProducts,
    expiringCampaigns,
  ] = await Promise.all([
    prisma.creator.count({
      where: { onboardingStatus: 'PENDING' },
    }),
    prisma.brand.count({
      where: { approved: false },
    }),
    prisma.settlement.findMany({
      where: { status: 'PENDING' },
      select: { netAmount: true },
    }),
    prisma.order.count({
      where: { createdAt: { gte: twentyFourHoursAgo }, status: 'CANCELLED' },
    }),
    prisma.product.count({
      where: { stock: { lte: 10 }, isActive: true, status: 'ACTIVE' },
    }),
    prisma.campaign.count({
      where: { status: 'ACTIVE', endAt: { gte: now, lte: twentyFourHoursLater } },
    }),
  ])

  const pendingSettlementTotal = pendingSettlementsData.reduce(
    (sum, s) => sum + Number(s.netAmount || 0), 0
  )

  return {
    pendingCreatorApprovals,
    pendingBrandApprovals,
    pendingSettlements: pendingSettlementsData.length,
    pendingSettlementTotal,
    failedPayments,
    lowStockProducts,
    expiringCampaigns,
  }
}

export async function getAdminRecentActivity(limit: number = 20) {
  await requireAdmin()

  type ActivityItem = {
    type: string
    title: string
    description: string
    link: string
    createdAt: string
    actorName: string
    iconType: string
  }

  const activities: ActivityItem[] = []

  // 최근 주문
  const recentOrders = await prisma.order.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      orderNumber: true,
      totalAmount: true,
      status: true,
      createdAt: true,
      buyer: { select: { user: { select: { name: true } } } },
    },
  })
  for (const o of recentOrders) {
    activities.push({
      type: o.status === 'CANCELLED' ? 'paymentFailed' : 'newOrder',
      title: o.status === 'CANCELLED' ? '결제 취소' : '신규 주문',
      description: `주문번호 ${o.orderNumber || o.id.slice(0, 8)} · ₩${Number(o.totalAmount || 0).toLocaleString()}`,
      link: `/admin/orders`,
      createdAt: o.createdAt.toISOString(),
      actorName: o.buyer?.user?.name || '비회원',
      iconType: o.status === 'CANCELLED' ? 'paymentFailed' : 'newOrder',
    })
  }

  // 최근 캠페인 생성
  const recentCampaigns = await prisma.campaign.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      createdAt: true,
      brand: { select: { brandName: true, companyName: true } },
    },
  })
  for (const c of recentCampaigns) {
    activities.push({
      type: 'newCampaign',
      title: '신규 캠페인',
      description: c.title || '제목 없음',
      link: `/admin/campaigns`,
      createdAt: c.createdAt.toISOString(),
      actorName: c.brand?.brandName || c.brand?.companyName || '알 수 없음',
      iconType: 'newCampaign',
    })
  }

  // 최근 브랜드 가입
  const recentBrands = await prisma.brand.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      brandName: true,
      companyName: true,
      createdAt: true,
    },
  })
  for (const b of recentBrands) {
    activities.push({
      type: 'newBrand',
      title: '신규 브랜드 가입',
      description: b.brandName || b.companyName || '알 수 없음',
      link: `/admin/brands`,
      createdAt: b.createdAt.toISOString(),
      actorName: b.brandName || b.companyName || '알 수 없음',
      iconType: 'newBrand',
    })
  }

  // 최근 크리에이터 가입
  const recentCreators = await prisma.creator.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      displayName: true,
      username: true,
      createdAt: true,
    },
  })
  for (const c of recentCreators) {
    activities.push({
      type: 'newCreator',
      title: '신규 크리에이터 가입',
      description: c.displayName || c.username || '알 수 없음',
      link: `/admin/creators`,
      createdAt: c.createdAt.toISOString(),
      actorName: c.displayName || c.username || '알 수 없음',
      iconType: 'newCreator',
    })
  }

  // 최근 정산 완료
  const recentSettlements = await prisma.settlement.findMany({
    take: 5,
    where: { status: 'COMPLETED' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      netAmount: true,
      createdAt: true,
      user: { select: { name: true } },
    },
  })
  for (const s of recentSettlements) {
    activities.push({
      type: 'settlementComplete',
      title: '정산 완료',
      description: `₩${Number(s.netAmount || 0).toLocaleString()}`,
      link: `/admin/settlements`,
      createdAt: s.createdAt.toISOString(),
      actorName: s.user?.name || '알 수 없음',
      iconType: 'settlementComplete',
    })
  }

  // 시간 역순 정렬 후 limit 적용
  activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  return activities.slice(0, limit)
}

export async function getAdminTopBrands(limit: number = 5) {
  await requireAdmin()

  const monthStart = startOfMonthKst()
  const now = nowKst()

  const orders = await prisma.order.findMany({
    where: { status: 'PAID', paidAt: { gte: monthStart, lte: now } },
    select: { totalAmount: true, brandId: true },
  })

  const brandSalesMap = new Map<string, { gmv: number; orderCount: number }>()
  for (const o of orders) {
    if (!o.brandId) continue
    const existing = brandSalesMap.get(o.brandId) || { gmv: 0, orderCount: 0 }
    existing.gmv += Number(o.totalAmount || 0)
    existing.orderCount += 1
    brandSalesMap.set(o.brandId, existing)
  }

  const topBrandIds = Array.from(brandSalesMap.entries())
    .sort((a, b) => b[1].gmv - a[1].gmv)
    .slice(0, limit)

  if (topBrandIds.length === 0) return []

  const brands = await prisma.brand.findMany({
    where: { id: { in: topBrandIds.map(b => b[0]) } },
    select: {
      id: true,
      brandName: true,
      companyName: true,
      logoUrl: true,
      _count: { select: { campaigns: { where: { status: 'ACTIVE' } } } },
    },
  })

  const brandMap = new Map(brands.map(b => [b.id, b]))

  return topBrandIds.map(([id, data]) => {
    const brand = brandMap.get(id)
    return {
      id,
      name: brand?.brandName || brand?.companyName || '알 수 없음',
      logoUrl: brand?.logoUrl || null,
      monthGmv: data.gmv,
      orderCount: data.orderCount,
      activeCampaignCount: brand?._count?.campaigns || 0,
    }
  })
}

export async function getAdminTopCreators(limit: number = 5) {
  await requireAdmin()

  const monthStart = startOfMonthKst()
  const now = nowKst()

  const orders = await prisma.order.findMany({
    where: { status: 'PAID', paidAt: { gte: monthStart, lte: now } },
    select: { totalAmount: true, creatorId: true },
  })

  const creatorSalesMap = new Map<string, { revenue: number; salesCount: number }>()
  for (const o of orders) {
    if (!o.creatorId) continue
    const existing = creatorSalesMap.get(o.creatorId) || { revenue: 0, salesCount: 0 }
    existing.revenue += Number(o.totalAmount || 0)
    existing.salesCount += 1
    creatorSalesMap.set(o.creatorId, existing)
  }

  const topCreatorIds = Array.from(creatorSalesMap.entries())
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, limit)

  if (topCreatorIds.length === 0) return []

  const creators = await prisma.creator.findMany({
    where: { id: { in: topCreatorIds.map(c => c[0]) } },
    select: {
      id: true,
      displayName: true,
      username: true,
      profileImageUrl: true,
      cnecReliabilityScore: true,
    },
  })

  const creatorMap = new Map(creators.map(c => [c.id, c]))

  return topCreatorIds.map(([id, data]) => {
    const creator = creatorMap.get(id)
    return {
      id,
      name: creator?.displayName || creator?.username || '알 수 없음',
      profileImageUrl: creator?.profileImageUrl || null,
      monthRevenue: data.revenue,
      salesCount: data.salesCount,
      cnecReliabilityScore: creator?.cnecReliabilityScore
        ? Number(creator.cnecReliabilityScore.toString())
        : null,
    }
  })
}

export async function getAdminWeeklyTrend(days: 7 | 30 = 7) {
  await requireAdmin()

  const startDate = daysAgoStartKst(days - 1)
  const now = nowKst()

  const orders = await prisma.order.findMany({
    where: {
      status: { notIn: ['CANCELLED', 'REFUNDED'] },
      createdAt: { gte: startDate, lte: now },
    },
    select: { totalAmount: true, createdAt: true },
  })

  // 일별 맵 초기화 (KST 기준)
  const dailyMap = new Map<string, { gmv: number; orders: number }>()
  for (let i = days - 1; i >= 0; i--) {
    const d = toZonedTime(subDays(now, i), KST_TZ)
    const key = format(d, 'yyyy-MM-dd')
    dailyMap.set(key, { gmv: 0, orders: 0 })
  }

  for (const o of orders) {
    const kstDate = toZonedTime(o.createdAt, KST_TZ)
    const key = format(kstDate, 'yyyy-MM-dd')
    const existing = dailyMap.get(key)
    if (existing) {
      existing.gmv += Number(o.totalAmount || 0)
      existing.orders += 1
    }
  }

  return Array.from(dailyMap.entries()).map(([date, data]) => {
    const d = new Date(date + 'T00:00:00+09:00')
    return {
      date,
      dateLabel: format(toZonedTime(d, KST_TZ), 'M/d (EEE)', { locale: ko }),
      gmv: data.gmv,
      orders: data.orders,
    }
  })
}
