'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { SampleRequestStatus, SampleRequestDecision, Prisma } from '@/generated/prisma/client'
import { sendNotification } from '@/lib/notifications'

// ==================== Auth Helpers ====================

async function requireCreator() {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  const creator = await prisma.creator.findFirst({
    where: { userId: session.user.id },
  })

  if (!creator) throw new Error('Creator not found')
  return { user: session.user, creator }
}

async function requireBrand() {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  const brand = await prisma.brand.findFirst({
    where: { userId: session.user.id },
  })

  if (!brand) throw new Error('Brand not found')
  return { user: session.user, brand }
}

// ==================== 크리에이터용 ====================

/** 0. 크리에이터 배송 정보 조회 (이름, 전화번호, 주소) */
export async function getCreatorShippingInfo() {
  const { creator } = await requireCreator()

  const data = await prisma.creator.findUnique({
    where: { id: creator.id },
    select: { displayName: true, username: true, phone: true, defaultShippingAddress: true },
  })

  const addr = data?.defaultShippingAddress as { address?: string } | null
  return {
    name: data?.displayName || data?.username || '',
    phone: data?.phone || '',
    address: addr?.address ?? '',
  }
}

/** @deprecated Use getCreatorShippingInfo instead */
export async function getCreatorShippingAddress() {
  const info = await getCreatorShippingInfo()
  return { address: info.address }
}

/** 1. 체험 신청 */
export async function requestProductTrial(data: {
  productId: string
  message?: string
  shippingAddress?: Prisma.InputJsonValue
}) {
  const { creator } = await requireCreator()

  const product = await prisma.product.findUnique({
    where: { id: data.productId },
    select: { id: true, brandId: true, allowTrial: true, isActive: true, status: true, name: true },
  })

  if (!product) return { success: false, error: '상품을 찾을 수 없습니다.' }
  if (!product.allowTrial) return { success: false, error: '체험 신청이 불가능한 상품입니다.' }
  if (!product.isActive || product.status !== 'ACTIVE') return { success: false, error: '비활성 상품입니다.' }

  const existing = await prisma.sampleRequest.findFirst({
    where: {
      creatorId: creator.id,
      productId: data.productId,
      status: { in: [SampleRequestStatus.pending, SampleRequestStatus.approved, SampleRequestStatus.shipped, SampleRequestStatus.received] },
    },
  })

  if (existing) return { success: false, error: '이미 진행중인 체험 신청이 있습니다.' }

  const trial = await prisma.sampleRequest.create({
    data: {
      creatorId: creator.id,
      brandId: product.brandId,
      productId: data.productId,
      status: SampleRequestStatus.pending,
      message: data.message ?? null,
      shippingAddress: data.shippingAddress ?? Prisma.JsonNull,
    },
  })

  // 크리에이터 기본 배송지가 없으면 저장
  if (data.shippingAddress) {
    const current = await prisma.creator.findUnique({
      where: { id: creator.id },
      select: { defaultShippingAddress: true },
    })
    if (!current?.defaultShippingAddress) {
      await prisma.creator.update({
        where: { id: creator.id },
        data: { defaultShippingAddress: data.shippingAddress },
      })
    }
  }

  // 브랜드에게 알림
  try {
    const brand = await prisma.brand.findUnique({
      where: { id: product.brandId },
      select: { userId: true },
    })
    if (brand?.userId) {
      sendNotification({
        userId: brand.userId,
        type: 'CAMPAIGN',
        title: '제품 체험 신청',
        message: `${creator.displayName ?? creator.username ?? '크리에이터'}님이 "${product.name ?? '상품'}" 체험을 신청했습니다.`,
        linkUrl: '/brand/trial',
      })
    }
  } catch {
    // 알림 실패가 주요 로직에 영향 주지 않음
  }

  return { success: true, trialId: trial.id }
}

/** 2. 체험 신청 취소 (pending 상태에서만) */
export async function cancelProductTrial(trialId: string) {
  const { creator } = await requireCreator()

  const trial = await prisma.sampleRequest.findUnique({ where: { id: trialId } })
  if (!trial) return { success: false, error: '신청을 찾을 수 없습니다.' }
  if (trial.creatorId !== creator.id) return { success: false, error: '권한이 없습니다.' }
  if (trial.status !== SampleRequestStatus.pending) return { success: false, error: '대기중인 신청만 취소할 수 있습니다.' }

  await prisma.sampleRequest.update({
    where: { id: trialId },
    data: { status: SampleRequestStatus.cancelled },
  })

  return { success: true }
}

/** 3. 수령 확인 */
export async function confirmTrialReceived(trialId: string) {
  const { creator } = await requireCreator()

  const trial = await prisma.sampleRequest.findUnique({
    where: { id: trialId },
    include: { product: { select: { name: true, brandId: true } } },
  })
  if (!trial) return { success: false, error: '신청을 찾을 수 없습니다.' }
  if (trial.creatorId !== creator.id) return { success: false, error: '권한이 없습니다.' }
  if (trial.status !== SampleRequestStatus.shipped) return { success: false, error: '발송된 상태에서만 수령 확인이 가능합니다.' }

  await prisma.sampleRequest.update({
    where: { id: trialId },
    data: {
      status: SampleRequestStatus.received,
      receivedAt: new Date(),
    },
  })

  // 브랜드에게 수령 확인 알림
  try {
    if (trial.product?.brandId) {
      const brand = await prisma.brand.findUnique({
        where: { id: trial.product.brandId },
        select: { userId: true },
      })
      if (brand?.userId) {
        sendNotification({
          userId: brand.userId,
          type: 'TRIAL',
          title: '체험 상품 수령 확인',
          message: `${creator.displayName ?? creator.username ?? '크리에이터'}님이 "${trial.product.name ?? '상품'}" 샘플을 수령했습니다.`,
          linkUrl: '/brand/trial',
        })
      }
    }
  } catch {
    // 알림 실패가 주요 로직에 영향 주지 않음
  }

  return { success: true }
}

/** 4. 체험 결정 (공구 전환 / 패스) */
export async function decideProductTrial(data: {
  trialId: string
  decision: 'PROCEED' | 'PASS'
  passReason?: string
  feedback?: string
  convertTo?: 'campaign' | 'pick'
  campaignId?: string
}) {
  const { creator } = await requireCreator()

  const trial = await prisma.sampleRequest.findUnique({
    where: { id: data.trialId },
    include: { product: { select: { name: true } } },
  })
  if (!trial) return { success: false, error: '신청을 찾을 수 없습니다.' }
  if (trial.creatorId !== creator.id) return { success: false, error: '권한이 없습니다.' }
  if (trial.status !== SampleRequestStatus.received) return { success: false, error: '수령 완료 상태에서만 결정할 수 있습니다.' }

  const decision = data.decision === 'PROCEED'
    ? SampleRequestDecision.PROCEED
    : SampleRequestDecision.PASS

  let convertedTo: string | null = null

  if (data.decision === 'PROCEED' && trial.productId) {
    if (data.convertTo === 'pick') {
      const shopItem = await prisma.creatorShopItem.create({
        data: {
          creatorId: creator.id,
          productId: trial.productId,
          type: 'PICK',
        },
      })
      convertedTo = shopItem.id
    } else if (data.convertTo === 'campaign' && data.campaignId) {
      const participation = await prisma.campaignParticipation.create({
        data: {
          campaignId: data.campaignId,
          creatorId: creator.id,
          status: 'PENDING',
        },
      })
      convertedTo = participation.id
    }
  }

  await prisma.sampleRequest.update({
    where: { id: data.trialId },
    data: {
      status: SampleRequestStatus.decided,
      decision,
      decidedAt: new Date(),
      passReason: data.decision === 'PASS' ? (data.passReason ?? null) : null,
      feedback: data.feedback ?? null,
      convertedTo,
    },
  })

  // 브랜드에게 알림
  try {
    const brand = await prisma.brand.findUnique({
      where: { id: trial.brandId },
      select: { userId: true },
    })
    if (brand?.userId) {
      const productName = trial.product?.name ?? '상품'
      const creatorName = creator.displayName ?? creator.username ?? '크리에이터'
      const msg = data.decision === 'PROCEED'
        ? `${creatorName}님이 "${productName}" 체험 후 공구/픽 전환했습니다.`
        : `${creatorName}님이 "${productName}" 체험 후 패스했습니다.`
      sendNotification({
        userId: brand.userId,
        type: 'CAMPAIGN',
        title: data.decision === 'PROCEED' ? '체험 후 전환' : '체험 후 패스',
        message: msg,
        linkUrl: '/brand/trial',
      })
    }
  } catch {
    // 알림 실패가 주요 로직에 영향 주지 않음
  }

  return { success: true }
}

/** 5. 내 체험 목록 조회 */
export async function getMyTrials(filters?: {
  status?: string
  page?: number
  limit?: number
}) {
  const { creator } = await requireCreator()

  const page = filters?.page ?? 1
  const limit = filters?.limit ?? 20
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = { creatorId: creator.id }
  if (filters?.status) {
    where.status = filters.status
  }

  const [trials, total] = await Promise.all([
    prisma.sampleRequest.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            nameKo: true,
            imageUrl: true,
            thumbnailUrl: true,
            images: true,
            category: true,
            price: true,
            volume: true,
          },
        },
        brand: {
          select: {
            id: true,
            companyName: true,
            logoUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.sampleRequest.count({ where }),
  ])

  return { trials, total }
}

// ==================== 브랜드용 ====================

/** 6. 체험 신청 목록 조회 (브랜드) */
export async function getBrandTrialRequests(filters?: {
  status?: string
  page?: number
  limit?: number
}) {
  const { brand } = await requireBrand()

  const page = filters?.page ?? 1
  const limit = filters?.limit ?? 20
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = { brandId: brand.id }
  if (filters?.status) {
    where.status = filters.status
  }

  const [trials, total] = await Promise.all([
    prisma.sampleRequest.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            displayName: true,
            username: true,
            profileImage: true,
            profileImageUrl: true,
            instagramHandle: true,
            skinType: true,
            phone: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            nameKo: true,
            imageUrl: true,
            thumbnailUrl: true,
            images: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.sampleRequest.count({ where }),
  ])

  return { trials, total }
}

/** 6-1. 체험 신청 엑셀 데이터 (브랜드) */
export async function exportBrandTrialRequests(filters?: {
  status?: string
}) {
  const { brand } = await requireBrand()

  const where: Record<string, unknown> = { brandId: brand.id }
  if (filters?.status) {
    where.status = filters.status
  }

  const trials = await prisma.sampleRequest.findMany({
    where,
    include: {
      creator: {
        select: {
          displayName: true,
          username: true,
          instagramHandle: true,
          phone: true,
        },
      },
      product: {
        select: {
          name: true,
          nameKo: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return trials.map((t) => {
    const addr = t.shippingAddress as { address?: string } | null
    return {
      creatorName: t.creator.displayName || t.creator.username || '',
      instagram: t.creator.instagramHandle || '',
      phone: t.creator.phone || '',
      productName: t.product?.nameKo || t.product?.name || '',
      shippingAddress: addr?.address || '',
      status: t.status,
      trackingNumber: t.trackingNumber || '',
      feedback: t.feedback || '',
      decision: t.decision || '',
      createdAt: t.createdAt.toISOString(),
    }
  })
}

/** 7. 체험 승인 */
export async function approveTrialRequest(trialId: string) {
  const { brand } = await requireBrand()

  const trial = await prisma.sampleRequest.findUnique({
    where: { id: trialId },
    include: { creator: { select: { userId: true } } },
  })
  if (!trial) return { success: false, error: '신청을 찾을 수 없습니다.' }
  if (trial.brandId !== brand.id) return { success: false, error: '권한이 없습니다.' }
  if (trial.status !== SampleRequestStatus.pending) return { success: false, error: '대기중인 신청만 승인할 수 있습니다.' }

  await prisma.sampleRequest.update({
    where: { id: trialId },
    data: {
      status: SampleRequestStatus.approved,
      respondedAt: new Date(),
    },
  })

  // 크리에이터에게 알림
  try {
    if (trial.creator?.userId) {
      sendNotification({
        userId: trial.creator.userId,
        type: 'CAMPAIGN',
        title: '체험 신청 승인',
        message: '체험 신청이 승인되었습니다! 브랜드에서 샘플을 보내드립니다.',
        linkUrl: '/creator/trial/my',
      })
    }
  } catch {
    // 알림 실패가 주요 로직에 영향 주지 않음
  }

  return { success: true }
}

/** 8. 체험 거절 */
export async function rejectTrialRequest(data: {
  trialId: string
  rejectReason?: string
}) {
  const { brand } = await requireBrand()

  const trial = await prisma.sampleRequest.findUnique({
    where: { id: data.trialId },
    include: { creator: { select: { userId: true } } },
  })
  if (!trial) return { success: false, error: '신청을 찾을 수 없습니다.' }
  if (trial.brandId !== brand.id) return { success: false, error: '권한이 없습니다.' }
  if (trial.status !== SampleRequestStatus.pending) return { success: false, error: '대기중인 신청만 거절할 수 있습니다.' }

  await prisma.sampleRequest.update({
    where: { id: data.trialId },
    data: {
      status: SampleRequestStatus.rejected,
      rejectReason: data.rejectReason ?? null,
      respondedAt: new Date(),
    },
  })

  // 크리에이터에게 알림
  try {
    if (trial.creator?.userId) {
      sendNotification({
        userId: trial.creator.userId,
        type: 'CAMPAIGN',
        title: '체험 신청 결과',
        message: '이번 체험은 아쉽게 매칭되지 않았어요.',
        linkUrl: '/creator/trial/my',
      })
    }
  } catch {
    // 알림 실패가 주요 로직에 영향 주지 않음
  }

  return { success: true }
}

/** 9. 샘플 발송 처리 */
export async function shipTrialSample(data: {
  trialId: string
  trackingNumber: string
}) {
  const { brand } = await requireBrand()

  const trial = await prisma.sampleRequest.findUnique({
    where: { id: data.trialId },
    include: { creator: { select: { userId: true } } },
  })
  if (!trial) return { success: false, error: '신청을 찾을 수 없습니다.' }
  if (trial.brandId !== brand.id) return { success: false, error: '권한이 없습니다.' }
  if (trial.status !== SampleRequestStatus.approved) return { success: false, error: '승인된 신청만 발송 처리할 수 있습니다.' }

  await prisma.sampleRequest.update({
    where: { id: data.trialId },
    data: {
      status: SampleRequestStatus.shipped,
      trackingNumber: data.trackingNumber,
      shippedAt: new Date(),
    },
  })

  // 크리에이터에게 알림
  try {
    if (trial.creator?.userId) {
      sendNotification({
        userId: trial.creator.userId,
        type: 'CAMPAIGN',
        title: '샘플 발송 완료',
        message: `샘플이 발송되었습니다. 송장번호: ${data.trackingNumber}`,
        linkUrl: '/creator/trial/my',
      })
    }
  } catch {
    // 알림 실패가 주요 로직에 영향 주지 않음
  }

  return { success: true }
}

// ==================== 공통 ====================

/** 10. 체험 가능 상품 목록 (크리에이터용 카탈로그) */
export async function getTrialableProducts(filters?: {
  category?: string
  brandId?: string
  page?: number
  limit?: number
}) {
  const { creator } = await requireCreator()

  const page = filters?.page ?? 1
  const limit = filters?.limit ?? 20
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {
    allowTrial: true,
    isActive: true,
    status: 'ACTIVE',
  }
  if (filters?.category) where.category = filters.category
  if (filters?.brandId) where.brandId = filters.brandId

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        nameKo: true,
        imageUrl: true,
        thumbnailUrl: true,
        images: true,
        category: true,
        description: true,
        descriptionKo: true,
        price: true,
        originalPrice: true,
        salePrice: true,
        volume: true,
        brand: {
          select: {
            id: true,
            companyName: true,
            logoUrl: true,
          },
        },
        sampleRequests: {
          where: { creatorId: creator.id },
          select: { id: true, status: true },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ])

  const productsWithTrialStatus = products.map((p) => {
    const existingTrial = p.sampleRequests[0] ?? null
    const { sampleRequests: _sr, ...rest } = p
    return { ...rest, existingTrial }
  })

  return { products: productsWithTrialStatus, total }
}

/** 11. 체험 통계 (어드민/브랜드용) */
export async function getTrialStats(brandId?: string) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  const where: Record<string, unknown> = {}
  if (brandId) where.brandId = brandId

  const allTrials = await prisma.sampleRequest.groupBy({
    by: ['status'],
    where,
    _count: { status: true },
  })

  const decidedTrials = await prisma.sampleRequest.groupBy({
    by: ['decision'],
    where: { ...where, status: SampleRequestStatus.decided },
    _count: { decision: true },
  })

  // 평균 응답 시간 계산 (신청→승인/거절)
  const respondedTrials = await prisma.sampleRequest.findMany({
    where: {
      ...where,
      respondedAt: { not: null },
    },
    select: { createdAt: true, respondedAt: true },
  })

  let avgResponseTimeHours: number | null = null
  if (respondedTrials.length > 0) {
    const totalMs = respondedTrials.reduce((sum, t) => {
      return sum + (t.respondedAt!.getTime() - t.createdAt.getTime())
    }, 0)
    avgResponseTimeHours = Math.round(totalMs / respondedTrials.length / (1000 * 60 * 60))
  }

  const statusCounts: Record<string, number> = {}
  for (const row of allTrials) {
    statusCounts[row.status] = row._count.status
  }

  const totalRequests = Object.values(statusCounts).reduce((a, b) => a + b, 0)
  const pendingCount = statusCounts[SampleRequestStatus.pending] ?? 0
  const approvedCount = statusCounts[SampleRequestStatus.approved] ?? 0
  const shippedCount = statusCounts[SampleRequestStatus.shipped] ?? 0
  const receivedCount = statusCounts[SampleRequestStatus.received] ?? 0
  const decidedCount = statusCounts[SampleRequestStatus.decided] ?? 0

  let proceedCount = 0
  let passCount = 0
  for (const row of decidedTrials) {
    if (row.decision === SampleRequestDecision.PROCEED) proceedCount = row._count.decision
    if (row.decision === SampleRequestDecision.PASS) passCount = row._count.decision
  }

  const conversionRate = decidedCount > 0 ? Math.round((proceedCount / decidedCount) * 100) : 0

  return {
    stats: {
      totalRequests,
      pendingCount,
      approvedCount,
      shippedCount,
      receivedCount,
      decidedCount,
      proceedCount,
      passCount,
      conversionRate,
      avgResponseTimeHours,
    },
  }
}

// ==================== 일정 변경 요청 ====================

/** 12. 일정 변경 요청 (크리에이터 또는 브랜드) */
export async function requestScheduleChange(data: {
  trialId: string
  message: string
}) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  const trial = await prisma.sampleRequest.findUnique({
    where: { id: data.trialId },
    include: {
      creator: { select: { userId: true, displayName: true, username: true } },
      brand: { select: { userId: true, companyName: true } },
      product: { select: { name: true } },
    },
  })
  if (!trial) return { success: false, error: '신청을 찾을 수 없습니다.' }

  const isCreator = trial.creator?.userId === session.user.id
  const isBrand = trial.brand?.userId === session.user.id
  if (!isCreator && !isBrand) return { success: false, error: '권한이 없습니다.' }

  await prisma.sampleRequest.update({
    where: { id: data.trialId },
    data: {
      scheduleChangeRequest: data.message,
      scheduleChangeBy: isCreator ? 'creator' : 'brand',
      scheduleChangeStatus: 'pending',
    },
  })

  // 상대방에게 알림
  try {
    const targetUserId = isCreator ? trial.brand?.userId : trial.creator?.userId
    const requesterName = isCreator
      ? (trial.creator?.displayName ?? trial.creator?.username ?? '크리에이터')
      : (trial.brand?.companyName ?? '브랜드')
    const productName = trial.product?.name ?? '상품'

    if (targetUserId) {
      sendNotification({
        userId: targetUserId,
        type: 'CAMPAIGN',
        title: '일정 변경 요청',
        message: `${requesterName}님이 "${productName}" 체험 일정 변경을 요청했습니다: ${data.message}`,
        linkUrl: isCreator ? '/brand/trial' : '/creator/trial/my',
      })
    }
  } catch {
    // 알림 실패가 주요 로직에 영향 주지 않음
  }

  return { success: true }
}

/** 13. 일정 변경 응답 (수락/거절) */
export async function respondScheduleChange(data: {
  trialId: string
  accept: boolean
}) {
  const session = await auth()
  if (!session?.user) throw new Error('Unauthorized')

  const trial = await prisma.sampleRequest.findUnique({
    where: { id: data.trialId },
    include: {
      creator: { select: { userId: true } },
      brand: { select: { userId: true } },
    },
  })
  if (!trial) return { success: false, error: '신청을 찾을 수 없습니다.' }
  if (trial.scheduleChangeStatus !== 'pending') return { success: false, error: '대기중인 요청이 아닙니다.' }

  const isCreator = trial.creator?.userId === session.user.id
  const isBrand = trial.brand?.userId === session.user.id
  if (!isCreator && !isBrand) return { success: false, error: '권한이 없습니다.' }

  // 요청자 본인이 아닌 상대방만 응답 가능
  if (trial.scheduleChangeBy === 'creator' && isCreator) return { success: false, error: '본인의 요청에는 응답할 수 없습니다.' }
  if (trial.scheduleChangeBy === 'brand' && isBrand) return { success: false, error: '본인의 요청에는 응답할 수 없습니다.' }

  await prisma.sampleRequest.update({
    where: { id: data.trialId },
    data: {
      scheduleChangeStatus: data.accept ? 'accepted' : 'rejected',
    },
  })

  // 요청자에게 알림
  try {
    const requesterUserId = trial.scheduleChangeBy === 'creator'
      ? trial.creator?.userId
      : trial.brand?.userId
    if (requesterUserId) {
      sendNotification({
        userId: requesterUserId,
        type: 'CAMPAIGN',
        title: data.accept ? '일정 변경 수락' : '일정 변경 거절',
        message: data.accept
          ? '일정 변경 요청이 수락되었습니다.'
          : '일정 변경 요청이 거절되었습니다.',
        linkUrl: trial.scheduleChangeBy === 'creator' ? '/creator/trial/my' : '/brand/trial',
      })
    }
  } catch {
    // 알림 실패가 주요 로직에 영향 주지 않음
  }

  return { success: true }
}
