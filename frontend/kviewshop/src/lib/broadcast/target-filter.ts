import { prisma } from '@/lib/db'

export interface BroadcastTarget {
  userId: string
  userType: 'BRAND' | 'CREATOR' | 'BUYER'
  name: string
  email: string | null
  phone: string | null
  channels: string[]
}

interface TargetFilterParams {
  targetType: string
  segmentRules?: Record<string, unknown> | null
  type: string
  channels: string[]
  excludeSelf: boolean
  excludeIds?: string[]
}

export async function resolveBroadcastTargets(params: TargetFilterParams): Promise<BroadcastTarget[]> {
  const { targetType, segmentRules, type, channels, excludeIds = [] } = params
  const results: BroadcastTarget[] = []
  const isPromotional = type === 'PROMOTIONAL'

  // Brand targets
  const includeBrands = targetType === 'ALL_USERS' || targetType === 'BRANDS'
    || (targetType === 'SEGMENT' && (segmentRules as Record<string, unknown> | null)?.targetGroup === 'BRANDS')

  if (includeBrands) {
    const where: Record<string, unknown> = {}
    if (isPromotional) where.user = { marketingAgreedAt: { not: null } }
    if (targetType === 'SEGMENT' && segmentRules) {
      const r = segmentRules as Record<string, unknown>
      if (r.createdAtFrom) where.createdAt = { ...(where.createdAt as object || {}), gte: new Date(r.createdAtFrom as string) }
      if (r.createdAtTo) where.createdAt = { ...(where.createdAt as object || {}), lte: new Date(r.createdAtTo as string) }
    }

    const brands = await (prisma.brand as unknown as { findMany: (args: unknown) => Promise<{ userId: string; brandName: string | null; user: { email: string | null; phone: string | null } }[]> }).findMany({
      where,
      select: {
        userId: true,
        brandName: true,
        user: { select: { email: true, phone: true } },
      },
    })

    for (const b of brands) {
      if (excludeIds.includes(b.userId)) continue
      results.push({
        userId: b.userId, userType: 'BRAND',
        name: b.brandName ?? '브랜드',
        email: b.user.email, phone: b.user.phone,
        channels: resolveChannels(channels, b.user.email, b.user.phone),
      })
    }
  }

  // Creator targets
  const includeCreators = targetType === 'ALL_USERS' || targetType === 'CREATORS'
    || (targetType === 'SEGMENT' && (segmentRules as Record<string, unknown> | null)?.targetGroup === 'CREATORS')

  if (includeCreators) {
    const where: Record<string, unknown> = {}
    if (isPromotional) where.user = { marketingAgreedAt: { not: null } }
    if (targetType === 'SEGMENT' && segmentRules) {
      const r = segmentRules as Record<string, unknown>
      if (r.createdAtFrom) where.createdAt = { ...(where.createdAt as object || {}), gte: new Date(r.createdAtFrom as string) }
      if (r.createdAtTo) where.createdAt = { ...(where.createdAt as object || {}), lte: new Date(r.createdAtTo as string) }
    }

    const creators = await (prisma.creator as unknown as { findMany: (args: unknown) => Promise<{ userId: string; displayName: string | null; username: string | null; user: { email: string | null; phone: string | null } }[]> }).findMany({
      where,
      select: {
        userId: true, displayName: true, username: true,
        user: { select: { email: true, phone: true } },
      },
    })

    for (const c of creators) {
      if (excludeIds.includes(c.userId)) continue
      results.push({
        userId: c.userId, userType: 'CREATOR',
        name: c.displayName ?? c.username ?? '크리에이터',
        email: c.user.email, phone: c.user.phone,
        channels: resolveChannels(channels, c.user.email, c.user.phone),
      })
    }
  }

  // Buyer targets
  const includeBuyers = targetType === 'ALL_USERS' || targetType === 'BUYERS'
    || (targetType === 'SEGMENT' && (segmentRules as Record<string, unknown> | null)?.targetGroup === 'BUYERS')

  if (includeBuyers) {
    const where: Record<string, unknown> = {}
    if (isPromotional) {
      where.marketingConsent = true
      where.user = { marketingAgreedAt: { not: null } }
    }
    if (targetType === 'SEGMENT' && segmentRules) {
      const r = segmentRules as Record<string, unknown>
      if (r.createdAtFrom) where.createdAt = { ...(where.createdAt as object || {}), gte: new Date(r.createdAtFrom as string) }
      if (r.createdAtTo) where.createdAt = { ...(where.createdAt as object || {}), lte: new Date(r.createdAtTo as string) }
      if (r.purchaseCountMin !== undefined) where.totalOrders = { ...(where.totalOrders as object || {}), gte: Number(r.purchaseCountMin) }
      if (r.purchaseCountMax !== undefined) where.totalOrders = { ...(where.totalOrders as object || {}), lte: Number(r.purchaseCountMax) }
    }

    const buyers = await (prisma.buyer as unknown as { findMany: (args: unknown) => Promise<{ userId: string; nickname: string | null; phone: string | null; user: { email: string | null; phone: string | null } }[]> }).findMany({
      where,
      select: {
        userId: true, nickname: true, phone: true,
        user: { select: { email: true, phone: true } },
      },
    })

    for (const b of buyers) {
      if (excludeIds.includes(b.userId)) continue
      const phone = b.phone ?? b.user.phone
      results.push({
        userId: b.userId, userType: 'BUYER',
        name: b.nickname ?? '구매자',
        email: b.user.email, phone,
        channels: resolveChannels(channels, b.user.email, phone),
      })
    }
  }

  return results
}

function resolveChannels(requested: string[], email: string | null, phone: string | null): string[] {
  const r: string[] = []
  if (requested.includes('IN_APP')) r.push('IN_APP')
  if (requested.includes('EMAIL') && email) r.push('EMAIL')
  if (requested.includes('KAKAO') && phone) r.push('KAKAO')
  return r
}

export function isNightTimeKST(date?: Date): boolean {
  const d = date ?? new Date()
  const kstHour = new Date(d.getTime() + 9 * 60 * 60 * 1000).getUTCHours()
  return kstHour >= 21 || kstHour < 8
}
