'use server'

import { prisma } from '@/lib/db'

interface LogAuditActionParams {
  actorId: string
  actorRole: string
  action: string
  targetType: string
  targetId: string
  payload?: { before?: unknown; after?: unknown; options?: unknown }
  reason?: string
  ipAddress?: string
  userAgent?: string
}

export async function logAuditAction(params: LogAuditActionParams) {
  try {
    return await prisma.auditLog.create({
      data: {
        actorId: params.actorId,
        actorRole: params.actorRole,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        payload: params.payload as object ?? undefined,
        reason: params.reason,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    })
  } catch (error) {
    console.error('[AuditLog] Failed to log action:', error)
    return null
  }
}
