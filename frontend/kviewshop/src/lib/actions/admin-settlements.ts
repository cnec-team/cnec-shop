'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { logAuditAction } from '@/lib/audit'
import { sendNotification, normalizePhone, isValidEmail } from '@/lib/notifications'
import {
  settlementPaidMessage,
  settlementHeldMessage,
  settlementCancelledMessage,
} from '@/lib/notifications/templates'

// ==================== Auth ====================

async function requireSuperAdmin() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'super_admin') {
    throw new Error('Forbidden')
  }
  return session.user
}

// ==================== Types ====================

interface SettlementListParams {
  status?: 'all' | 'PENDING' | 'PAID' | 'HOLD' | 'CANCELLED'
  brandId?: string
  periodStart?: string
  periodEnd?: string
  q?: string
  sort?: 'createdAt' | 'amount' | 'brandName'
  page?: number
  pageSize?: number
}

// ==================== List ====================

export async function getAdminSettlementList(params: SettlementListParams = {}) {
  await requireSuperAdmin()

  const {
    status = 'all',
    brandId,
    periodStart,
    periodEnd,
    q,
    sort = 'createdAt',
    page = 1,
    pageSize = 20,
  } = params

  const where: Record<string, unknown> = {}

  if (status !== 'all') {
    where.status = status
  }

  if (brandId) {
    where.userId = brandId
  }

  if (periodStart) {
    where.periodStart = { ...(where.periodStart as object || {}), gte: new Date(periodStart) }
  }
  if (periodEnd) {
    where.periodEnd = { ...(where.periodEnd as object || {}), lte: new Date(periodEnd) }
  }

  if (q) {
    where.OR = [
      { id: { contains: q, mode: 'insensitive' } },
      { user: { name: { contains: q, mode: 'insensitive' } } },
      { user: { brand: { brandName: { contains: q, mode: 'insensitive' } } } },
    ]
  }

  let orderBy: Record<string, string>
  switch (sort) {
    case 'amount':
      orderBy = { netAmount: 'desc' }
      break
    case 'brandName':
      orderBy = { user: { name: 'asc' } } as unknown as Record<string, string>
      break
    default:
      orderBy = { createdAt: 'desc' }
  }

  const [items, total] = await Promise.all([
    prisma.settlement.findMany({
      where: where as never,
      orderBy: orderBy as never,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            brand: { select: { id: true, brandName: true, logoUrl: true } },
            creator: { select: { id: true, displayName: true, username: true } },
          },
        },
      },
    }),
    prisma.settlement.count({ where: where as never }),
  ])

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

// ==================== Summary Stats ====================

export async function getSettlementSummary() {
  await requireSuperAdmin()

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [pending, hold, paidThisMonth, cancelledThisMonth] = await Promise.all([
    prisma.settlement.aggregate({
      where: { status: 'PENDING' },
      _count: true,
      _sum: { netAmount: true },
    }),
    prisma.settlement.aggregate({
      where: { status: 'HOLD' },
      _count: true,
      _sum: { netAmount: true },
    }),
    prisma.settlement.aggregate({
      where: { status: 'PAID', paidAt: { gte: monthStart } },
      _count: true,
      _sum: { netAmount: true },
    }),
    prisma.settlement.count({
      where: { status: 'CANCELLED', cancelledAt: { gte: monthStart } },
    }),
  ])

  return {
    pending: { count: pending._count, amount: Number(pending._sum.netAmount ?? 0) },
    hold: { count: hold._count, amount: Number(hold._sum.netAmount ?? 0) },
    paidThisMonth: { count: paidThisMonth._count, amount: Number(paidThisMonth._sum.netAmount ?? 0) },
    cancelledThisMonth: cancelledThisMonth,
  }
}

// ==================== Detail ====================

export async function getAdminSettlementDetail(id: string) {
  await requireSuperAdmin()

  const settlement = await prisma.settlement.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          brand: { select: { id: true, brandName: true, logoUrl: true } },
          creator: { select: { id: true, displayName: true, username: true } },
        },
      },
    },
  })

  if (!settlement) throw new Error('정산을 찾을 수 없어요')

  // 포함 주문 조회 (정산 기간 + 브랜드/크리에이터 매칭)
  let orders: {
    id: string
    orderNumber: string | null
    buyerName: string | null
    customerName: string | null
    totalAmount: unknown
    status: string
    paidAt: Date | null
    items: { productName: string | null }[]
  }[] = []

  if (settlement.periodStart && settlement.periodEnd) {
    const orderWhere: Record<string, unknown> = {
      paidAt: {
        gte: settlement.periodStart,
        lte: settlement.periodEnd,
      },
      status: { in: ['PAID', 'PREPARING', 'SHIPPING', 'DELIVERED', 'CONFIRMED'] },
    }

    if (settlement.user?.brand?.id) {
      orderWhere.brandId = settlement.user.brand.id
    } else if (settlement.creatorId) {
      orderWhere.creatorId = settlement.creatorId
    }

    orders = await prisma.order.findMany({
      where: orderWhere as never,
      orderBy: { paidAt: 'desc' },
      take: 100,
      select: {
        id: true,
        orderNumber: true,
        buyerName: true,
        customerName: true,
        totalAmount: true,
        status: true,
        paidAt: true,
        items: { select: { productName: true } },
      },
    })
  }

  const auditLogs = await prisma.auditLog.findMany({
    where: { targetType: 'Settlement', targetId: id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  return { settlement, orders, auditLogs }
}

// ==================== Force Pay ====================

export async function forcePaySettlement(params: {
  settlementId: string
  paidAmount: number
  paidMemo: string
  paymentProofUrl: string
  expectedStatus: 'PENDING' | 'HOLD'
}) {
  const admin = await requireSuperAdmin()
  const { settlementId, paidAmount, paidMemo, paymentProofUrl, expectedStatus } = params

  if (paidAmount <= 0) throw new Error('지급 금액은 0보다 커야 해요')
  if (!paidMemo || paidMemo.length < 10) throw new Error('메모는 최소 10자 이상 입력해주세요')
  if (!paymentProofUrl) throw new Error('송금 증빙을 업로드해주세요')

  const settlement = await prisma.settlement.findUnique({ where: { id: settlementId } })
  if (!settlement) throw new Error('정산을 찾을 수 없어요')
  if (settlement.status !== expectedStatus) {
    throw new Error(`현재 상태가 ${settlement.status}이에요. 새로고침 후 다시 시도해주세요.`)
  }

  const now = new Date()
  const updated = await prisma.settlement.update({
    where: { id: settlementId },
    data: {
      status: 'PAID',
      paidAt: now,
      paidBy: admin.id,
      paidAmount,
      paidMemo,
      paymentProofUrl,
    },
    include: {
      user: {
        select: {
          id: true, name: true, email: true, phone: true,
          brand: { select: { brandName: true } },
          creator: { select: { displayName: true, username: true } },
        },
      },
    },
  })

  await logAuditAction({
    actorId: admin.id!,
    actorRole: 'super_admin',
    action: 'SETTLEMENT_FORCE_PAY',
    targetType: 'Settlement',
    targetId: settlementId,
    payload: {
      before: { status: expectedStatus },
      after: { status: 'PAID', paidAmount, paidMemo, paymentProofUrl },
    },
  })

  // 알림
  try {
    const user = updated.user
    if (user) {
      const recipientName = user.brand?.brandName ?? user.creator?.displayName ?? user.creator?.username ?? user.name ?? '고객'
      const recipientEmail = isValidEmail(user.email) ? user.email! : undefined
      const recipientPhone = normalizePhone(user.phone)
      const tmpl = settlementPaidMessage({
        recipientName,
        amount: paidAmount,
        paidAt: now.toISOString().slice(0, 10),
        memo: paidMemo,
        recipientEmail,
      })
      sendNotification({
        userId: user.id,
        ...tmpl.inApp,
        phone: recipientPhone,
        email: recipientEmail,
        kakaoTemplate: recipientPhone ? tmpl.kakao : undefined,
        emailTemplate: recipientEmail ? tmpl.email : undefined,
      })
    }
  } catch { /* 알림 실패는 무시 */ }

  return updated
}

// ==================== Hold ====================

export async function holdSettlement(params: {
  settlementId: string
  reason: string
}) {
  const admin = await requireSuperAdmin()
  const { settlementId, reason } = params

  if (!reason || reason.length < 20) throw new Error('보류 사유는 최소 20자 이상 입력해주세요')

  const settlement = await prisma.settlement.findUnique({ where: { id: settlementId } })
  if (!settlement) throw new Error('정산을 찾을 수 없어요')
  if (settlement.status !== 'PENDING') throw new Error(`현재 상태가 ${settlement.status}이에요. PENDING 상태만 보류할 수 있어요.`)

  const now = new Date()
  const updated = await prisma.settlement.update({
    where: { id: settlementId },
    data: {
      status: 'HOLD',
      heldAt: now,
      heldBy: admin.id,
      heldReason: reason,
    },
    include: {
      user: {
        select: {
          id: true, name: true, email: true, phone: true,
          brand: { select: { brandName: true } },
          creator: { select: { displayName: true, username: true } },
        },
      },
    },
  })

  await logAuditAction({
    actorId: admin.id!,
    actorRole: 'super_admin',
    action: 'SETTLEMENT_HOLD',
    targetType: 'Settlement',
    targetId: settlementId,
    payload: {
      before: { status: 'PENDING' },
      after: { status: 'HOLD', reason },
    },
    reason,
  })

  try {
    const user = updated.user
    if (user) {
      const recipientName = user.brand?.brandName ?? user.creator?.displayName ?? user.creator?.username ?? user.name ?? '고객'
      const recipientEmail = isValidEmail(user.email) ? user.email! : undefined
      const recipientPhone = normalizePhone(user.phone)
      const tmpl = settlementHeldMessage({ recipientName, reason, recipientEmail })
      sendNotification({
        userId: user.id,
        ...tmpl.inApp,
        phone: recipientPhone,
        email: recipientEmail,
        kakaoTemplate: recipientPhone ? tmpl.kakao : undefined,
        emailTemplate: recipientEmail ? tmpl.email : undefined,
      })
    }
  } catch { /* 알림 실패는 무시 */ }

  return updated
}

// ==================== Release Hold ====================

export async function releaseSettlement(params: {
  settlementId: string
  memo?: string
}) {
  const admin = await requireSuperAdmin()
  const { settlementId, memo } = params

  const settlement = await prisma.settlement.findUnique({ where: { id: settlementId } })
  if (!settlement) throw new Error('정산을 찾을 수 없어요')
  if (settlement.status !== 'HOLD') throw new Error(`현재 상태가 ${settlement.status}이에요. HOLD 상태만 해제할 수 있어요.`)

  const updated = await prisma.settlement.update({
    where: { id: settlementId },
    data: {
      status: 'PENDING',
      heldAt: null,
      heldBy: null,
      heldReason: null,
    },
  })

  await logAuditAction({
    actorId: admin.id!,
    actorRole: 'super_admin',
    action: 'SETTLEMENT_RELEASE',
    targetType: 'Settlement',
    targetId: settlementId,
    payload: {
      before: { status: 'HOLD', reason: settlement.heldReason },
      after: { status: 'PENDING' },
    },
    reason: memo || undefined,
  })

  return updated
}

// ==================== Cancel ====================

export async function cancelSettlement(params: {
  settlementId: string
  reason: string
}) {
  const admin = await requireSuperAdmin()
  const { settlementId, reason } = params

  if (!reason || reason.length < 20) throw new Error('취소 사유는 최소 20자 이상 입력해주세요')

  const settlement = await prisma.settlement.findUnique({ where: { id: settlementId } })
  if (!settlement) throw new Error('정산을 찾을 수 없어요')
  if (settlement.status === 'CANCELLED') throw new Error('이미 취소된 정산이에요')

  const now = new Date()
  const updated = await prisma.settlement.update({
    where: { id: settlementId },
    data: {
      status: 'CANCELLED',
      cancelledAt: now,
      cancelledBy: admin.id,
      cancelledReason: reason,
    },
    include: {
      user: {
        select: {
          id: true, name: true, email: true, phone: true,
          brand: { select: { brandName: true } },
          creator: { select: { displayName: true, username: true } },
        },
      },
    },
  })

  await logAuditAction({
    actorId: admin.id!,
    actorRole: 'super_admin',
    action: 'SETTLEMENT_CANCEL',
    targetType: 'Settlement',
    targetId: settlementId,
    payload: {
      before: { status: settlement.status },
      after: { status: 'CANCELLED', reason },
    },
    reason,
  })

  try {
    const user = updated.user
    if (user) {
      const recipientName = user.brand?.brandName ?? user.creator?.displayName ?? user.creator?.username ?? user.name ?? '고객'
      const recipientEmail = isValidEmail(user.email) ? user.email! : undefined
      const recipientPhone = normalizePhone(user.phone)
      const tmpl = settlementCancelledMessage({ recipientName, reason, recipientEmail })
      sendNotification({
        userId: user.id,
        ...tmpl.inApp,
        phone: recipientPhone,
        email: recipientEmail,
        kakaoTemplate: recipientPhone ? tmpl.kakao : undefined,
        emailTemplate: recipientEmail ? tmpl.email : undefined,
      })
    }
  } catch { /* 알림 실패는 무시 */ }

  return updated
}

// ==================== Bulk Hold ====================

export async function bulkHoldSettlements(params: {
  settlementIds: string[]
  reason: string
}) {
  await requireSuperAdmin()
  const { settlementIds, reason } = params

  if (settlementIds.length === 0) throw new Error('선택된 정산이 없어요')
  if (settlementIds.length > 100) throw new Error('한 번에 최대 100건까지 보류할 수 있어요')

  const success: string[] = []
  const failed: { id: string; error: string }[] = []

  for (const id of settlementIds) {
    try {
      await holdSettlement({ settlementId: id, reason })
      success.push(id)
    } catch (err) {
      failed.push({ id, error: err instanceof Error ? err.message : '알 수 없는 오류' })
    }
  }

  return { success, failed }
}

// ==================== Update Memo ====================

export async function updateSettlementMemo(params: {
  settlementId: string
  memo: string
}) {
  const admin = await requireSuperAdmin()
  const { settlementId, memo } = params

  if (!memo || memo.length < 10) throw new Error('메모는 최소 10자 이상 입력해주세요')

  const settlement = await prisma.settlement.findUnique({ where: { id: settlementId } })
  if (!settlement) throw new Error('정산을 찾을 수 없어요')

  const updated = await prisma.settlement.update({
    where: { id: settlementId },
    data: { paidMemo: memo },
  })

  await logAuditAction({
    actorId: admin.id!,
    actorRole: 'super_admin',
    action: 'SETTLEMENT_MEMO_UPDATE',
    targetType: 'Settlement',
    targetId: settlementId,
    payload: {
      before: { paidMemo: settlement.paidMemo },
      after: { paidMemo: memo },
    },
  })

  return updated
}

// ==================== CSV Export Data ====================

export async function getAdminSettlementsForExport(params: SettlementListParams = {}) {
  await requireSuperAdmin()

  const { status = 'all', brandId, periodStart, periodEnd, q } = params

  const where: Record<string, unknown> = {}
  if (status !== 'all') where.status = status
  if (brandId) where.userId = brandId
  if (periodStart) where.periodStart = { gte: new Date(periodStart) }
  if (periodEnd) where.periodEnd = { lte: new Date(periodEnd) }
  if (q) {
    where.OR = [
      { id: { contains: q, mode: 'insensitive' } },
      { user: { name: { contains: q, mode: 'insensitive' } } },
    ]
  }

  const items = await prisma.settlement.findMany({
    where: where as never,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          name: true,
          brand: { select: { brandName: true } },
          creator: { select: { displayName: true } },
        },
      },
    },
  })

  return items.map(s => ({
    id: s.id,
    recipientName: s.user?.brand?.brandName ?? s.user?.creator?.displayName ?? s.user?.name ?? '-',
    periodStart: s.periodStart?.toISOString().slice(0, 10) ?? '-',
    periodEnd: s.periodEnd?.toISOString().slice(0, 10) ?? '-',
    totalSales: Number(s.totalSales),
    grossCommission: Number(s.grossCommission),
    netAmount: Number(s.netAmount),
    status: s.status,
    paidAt: s.paidAt?.toISOString().slice(0, 10) ?? '-',
    paidMemo: s.paidMemo ?? '-',
  }))
}

// ==================== Brand list for filter ====================

export async function getSettlementBrands() {
  await requireSuperAdmin()

  const brands = await prisma.brand.findMany({
    select: { userId: true, brandName: true },
    orderBy: { brandName: 'asc' },
  })

  return brands
}
