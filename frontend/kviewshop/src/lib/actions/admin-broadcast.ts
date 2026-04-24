'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { logAuditAction } from '@/lib/audit'
import { sendNotification, normalizePhone, isValidEmail } from '@/lib/notifications'
import { broadcastPromotionalMessage, broadcastInformationalMessage } from '@/lib/notifications/templates'
import { resolveBroadcastTargets, isNightTimeKST } from '@/lib/broadcast/target-filter'
import { processBroadcastChunks } from '@/lib/broadcast/worker'

async function requireSuperAdmin() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'super_admin') {
    throw new Error('Forbidden')
  }
  return session.user
}

// ==================== Create ====================

export async function createBroadcast(data: {
  title: string
  content: string
  type: 'INFORMATIONAL' | 'PROMOTIONAL'
  channels: string[]
  targetType: string
  segmentRules?: Record<string, unknown> | null
  excludeSelf?: boolean
  kakaoTemplateCode?: string
}) {
  const admin = await requireSuperAdmin()

  if (!data.title || data.title.length < 5) throw new Error('제목은 최소 5자 이상 입력해주세요')
  if (!data.content || data.content.length < 10) throw new Error('본문은 최소 10자 이상 입력해주세요')
  if (!data.channels.includes('IN_APP')) throw new Error('인앱 알림은 필수입니다')

  const broadcast = await prisma.broadcast.create({
    data: {
      title: data.title,
      content: data.content,
      type: data.type,
      channels: data.channels,
      targetType: data.targetType,
      segmentRules: (data.segmentRules as object) ?? undefined,
      excludeSelf: data.excludeSelf ?? true,
      kakaoTemplateCode: data.kakaoTemplateCode,
      createdBy: admin.id!,
      status: 'DRAFT',
    },
  })

  await logAuditAction({
    actorId: admin.id!,
    actorRole: 'super_admin',
    action: 'BROADCAST_CREATE',
    targetType: 'Broadcast',
    targetId: broadcast.id,
    payload: { after: { title: data.title, type: data.type, targetType: data.targetType } },
  })

  return { broadcastId: broadcast.id }
}

// ==================== Update (DRAFT only) ====================

export async function updateBroadcast(id: string, data: {
  title?: string
  content?: string
  type?: 'INFORMATIONAL' | 'PROMOTIONAL'
  channels?: string[]
  targetType?: string
  segmentRules?: Record<string, unknown> | null
  excludeSelf?: boolean
  kakaoTemplateCode?: string
}) {
  const admin = await requireSuperAdmin()

  const broadcast = await prisma.broadcast.findUnique({ where: { id } })
  if (!broadcast) throw new Error('공지를 찾을 수 없어요')
  if (broadcast.status !== 'DRAFT') throw new Error('임시저장 상태에서만 수정할 수 있어요')

  const updateData: Record<string, unknown> = {}
  if (data.title !== undefined) updateData.title = data.title
  if (data.content !== undefined) updateData.content = data.content
  if (data.type !== undefined) updateData.type = data.type
  if (data.channels !== undefined) updateData.channels = data.channels
  if (data.targetType !== undefined) updateData.targetType = data.targetType
  if (data.segmentRules !== undefined) updateData.segmentRules = (data.segmentRules as object) ?? undefined
  if (data.excludeSelf !== undefined) updateData.excludeSelf = data.excludeSelf
  if (data.kakaoTemplateCode !== undefined) updateData.kakaoTemplateCode = data.kakaoTemplateCode

  return prisma.broadcast.update({
    where: { id },
    data: updateData as never,
  })
}

// ==================== Preview Targets ====================

export async function previewBroadcastTargets(params: {
  targetType: string
  segmentRules?: Record<string, unknown> | null
  type: string
  channels: string[]
  excludeSelf?: boolean
}) {
  const admin = await requireSuperAdmin()

  const targets = await resolveBroadcastTargets({
    targetType: params.targetType,
    segmentRules: params.segmentRules,
    type: params.type,
    channels: params.channels,
    excludeSelf: params.excludeSelf ?? true,
    excludeIds: params.excludeSelf ? [admin.id!] : [],
  })

  const breakdown = {
    brands: targets.filter(t => t.userType === 'BRAND').length,
    creators: targets.filter(t => t.userType === 'CREATOR').length,
    buyers: targets.filter(t => t.userType === 'BUYER').length,
  }

  return {
    totalCount: targets.length,
    breakdown,
    sample: targets.slice(0, 10).map(t => ({
      id: t.userId,
      name: t.name,
      userType: t.userType,
      channels: t.channels,
    })),
  }
}

// ==================== Test Send ====================

export async function testSendBroadcast(broadcastId: string) {
  const admin = await requireSuperAdmin()

  const broadcast = await prisma.broadcast.findUnique({ where: { id: broadcastId } })
  if (!broadcast) throw new Error('공지를 찾을 수 없어요')

  const user = await prisma.user.findUnique({
    where: { id: admin.id! },
    select: { id: true, name: true, email: true, phone: true },
  })
  if (!user) throw new Error('사용자 정보를 찾을 수 없어요')

  const tmplFn = broadcast.type === 'PROMOTIONAL'
    ? broadcastPromotionalMessage
    : broadcastInformationalMessage

  const tmpl = tmplFn({
    recipientName: user.name ?? '테스트',
    title: broadcast.title,
    content: broadcast.content,
    recipientEmail: isValidEmail(user.email) ? user.email! : undefined,
  })

  const phone = normalizePhone(user.phone)
  const email = isValidEmail(user.email) ? user.email! : undefined

  await sendNotification({
    userId: user.id,
    ...tmpl.inApp,
    phone: broadcast.channels.includes('KAKAO') ? phone : undefined,
    email: broadcast.channels.includes('EMAIL') ? email : undefined,
    kakaoTemplate: broadcast.channels.includes('KAKAO') && phone ? tmpl.kakao : undefined,
    emailTemplate: broadcast.channels.includes('EMAIL') && email ? tmpl.email : undefined,
  })

  await logAuditAction({
    actorId: admin.id!,
    actorRole: 'super_admin',
    action: 'BROADCAST_TEST_SEND',
    targetType: 'Broadcast',
    targetId: broadcastId,
  })

  return { success: true }
}

// ==================== Send ====================

export async function sendBroadcast(broadcastId: string, idempotencyKey: string) {
  const admin = await requireSuperAdmin()

  // Idempotency check
  const existing = await prisma.broadcast.findUnique({ where: { idempotencyKey } })
  if (existing && existing.id !== broadcastId) {
    throw new Error('동일 요청이 이미 처리되었어요')
  }

  const broadcast = await prisma.broadcast.findUnique({ where: { id: broadcastId } })
  if (!broadcast) throw new Error('공지를 찾을 수 없어요')
  if (broadcast.status !== 'DRAFT') throw new Error('임시저장 상태에서만 발송할 수 있어요')

  // Night time check for promotional kakao
  if (broadcast.type === 'PROMOTIONAL' && broadcast.channels.includes('KAKAO') && isNightTimeKST()) {
    throw new Error('야간(21:00~08:00)에는 광고성 알림톡을 발송할 수 없어요')
  }

  // Resolve targets
  const targets = await resolveBroadcastTargets({
    targetType: broadcast.targetType,
    segmentRules: broadcast.segmentRules as Record<string, unknown> | null,
    type: broadcast.type,
    channels: broadcast.channels,
    excludeSelf: broadcast.excludeSelf,
    excludeIds: broadcast.excludeSelf ? [admin.id!] : [],
  })

  if (targets.length === 0) throw new Error('발송 대상이 없어요')

  // Over 10k guard - only allow for informational + IN_APP only
  if (targets.length > 10000) {
    const isInAppOnly = broadcast.channels.length === 1 && broadcast.channels[0] === 'IN_APP'
    const isInformational = broadcast.type === 'INFORMATIONAL'
    if (!isInAppOnly || !isInformational) {
      throw new Error('1만명 초과는 예약 발송만 가능해요 (정보성 + 인앱만 예외)')
    }
  }

  // Duplicate content check (within 1 hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const duplicate = await prisma.broadcast.findFirst({
    where: {
      title: broadcast.title,
      content: broadcast.content,
      status: 'COMPLETED',
      completedAt: { gte: oneHourAgo },
      id: { not: broadcastId },
    },
  })
  if (duplicate) {
    throw new Error('1시간 이내 동일 내용의 공지가 이미 발송되었어요. 의도적이라면 내용을 약간 수정해주세요.')
  }

  // Create recipients
  await prisma.broadcastRecipient.createMany({
    data: targets.map(t => ({
      broadcastId,
      userId: t.userId,
      userType: t.userType,
      channels: t.channels,
      status: 'PENDING',
    })),
    skipDuplicates: true,
  })

  // Update broadcast status
  await prisma.broadcast.update({
    where: { id: broadcastId },
    data: {
      status: 'SENDING',
      totalCount: targets.length,
      startedAt: new Date(),
      idempotencyKey,
    },
  })

  await logAuditAction({
    actorId: admin.id!,
    actorRole: 'super_admin',
    action: 'BROADCAST_SEND',
    targetType: 'Broadcast',
    targetId: broadcastId,
    payload: { after: { totalCount: targets.length } },
  })

  // Start async processing (fire and forget)
  processBroadcastChunks(broadcastId).catch(err => {
    console.error('[Broadcast Worker] Error:', err)
    prisma.broadcast.update({
      where: { id: broadcastId },
      data: { status: 'FAILED', lastError: String(err), completedAt: new Date() },
    }).catch(() => {})
  })

  return { totalCount: targets.length }
}

// ==================== Schedule ====================

export async function scheduleBroadcast(broadcastId: string, scheduledAt: string) {
  const admin = await requireSuperAdmin()

  const broadcast = await prisma.broadcast.findUnique({ where: { id: broadcastId } })
  if (!broadcast) throw new Error('공지를 찾을 수 없어요')
  if (broadcast.status !== 'DRAFT') throw new Error('임시저장 상태에서만 예약할 수 있어요')

  const scheduleDate = new Date(scheduledAt)
  if (scheduleDate <= new Date()) throw new Error('예약 시각은 현재보다 미래여야 해요')

  // Night time check for promotional kakao
  if (broadcast.type === 'PROMOTIONAL' && broadcast.channels.includes('KAKAO') && isNightTimeKST(scheduleDate)) {
    throw new Error('야간(21:00~08:00)에는 광고성 알림톡을 예약할 수 없어요')
  }

  await prisma.broadcast.update({
    where: { id: broadcastId },
    data: { status: 'SCHEDULED', scheduledAt: scheduleDate },
  })

  return { scheduledAt: scheduleDate }
}

// ==================== Cancel ====================

export async function cancelBroadcast(broadcastId: string, reason: string) {
  const admin = await requireSuperAdmin()

  const broadcast = await prisma.broadcast.findUnique({ where: { id: broadcastId } })
  if (!broadcast) throw new Error('공지를 찾을 수 없어요')
  if (!['SCHEDULED', 'SENDING', 'DRAFT'].includes(broadcast.status)) {
    throw new Error(`현재 상태(${broadcast.status})에서는 취소할 수 없어요`)
  }

  await prisma.broadcast.update({
    where: { id: broadcastId },
    data: { status: 'CANCELLED', lastError: reason, completedAt: new Date() },
  })

  await logAuditAction({
    actorId: admin.id!,
    actorRole: 'super_admin',
    action: 'BROADCAST_CANCEL',
    targetType: 'Broadcast',
    targetId: broadcastId,
    reason,
  })

  return { success: true }
}

// ==================== List ====================

export async function getBroadcastList(params: {
  status?: string
  type?: string
  q?: string
  page?: number
  pageSize?: number
} = {}) {
  await requireSuperAdmin()

  const { status, type, q, page = 1, pageSize = 20 } = params
  const where: Record<string, unknown> = {}

  if (status && status !== 'all') where.status = status
  if (type && type !== 'all') where.type = type
  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
    ]
  }

  const [items, total] = await Promise.all([
    prisma.broadcast.findMany({
      where: where as never,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.broadcast.count({ where: where as never }),
  ])

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

// ==================== Detail ====================

export async function getBroadcastDetail(id: string) {
  await requireSuperAdmin()

  const broadcast = await prisma.broadcast.findUnique({ where: { id } })
  if (!broadcast) throw new Error('공지를 찾을 수 없어요')

  // Channel stats
  const stats = await prisma.broadcastRecipient.groupBy({
    by: ['status'],
    where: { broadcastId: id },
    _count: true,
  })

  // Recent failures
  const recentFailures = await prisma.broadcastRecipient.findMany({
    where: { broadcastId: id, status: 'FAILED' },
    orderBy: { failedAt: 'desc' },
    take: 10,
  })

  // Audit logs
  const auditLogs = await prisma.auditLog.findMany({
    where: { targetType: 'Broadcast', targetId: id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  return {
    broadcast,
    stats: stats.reduce((acc, s) => ({ ...acc, [s.status]: s._count }), {} as Record<string, number>),
    recentFailures,
    auditLogs,
  }
}

// ==================== Delete (DRAFT only) ====================

export async function deleteBroadcast(id: string) {
  const admin = await requireSuperAdmin()

  const broadcast = await prisma.broadcast.findUnique({ where: { id } })
  if (!broadcast) throw new Error('공지를 찾을 수 없어요')
  if (broadcast.status !== 'DRAFT') throw new Error('임시저장 상태에서만 삭제할 수 있어요')

  await prisma.broadcast.delete({ where: { id } })
  return { success: true }
}
