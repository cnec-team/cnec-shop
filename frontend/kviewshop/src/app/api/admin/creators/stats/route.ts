import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'

export async function GET() {
  const authUser = await getAuthUser()
  if (!authUser || authUser.role !== 'super_admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tiers = ['UNDER_1K', 'NANO', 'MICRO', 'MACRO', 'MEGA'] as const

  const [
    total,
    withIg,
    withEmail,
    withProfilePic,
    lastImport,
    ...tierCounts
  ] = await Promise.all([
    prisma.creator.count(),
    prisma.creator.count({ where: { igUsername: { not: null } } }),
    prisma.creator.count({ where: { igEmail: { not: null } } }),
    prisma.creator.count({ where: { igProfilePicUrl: { not: null } } }),
    prisma.creator.findFirst({
      where: { igDataImportedAt: { not: null } },
      orderBy: { igDataImportedAt: 'desc' },
      select: { igDataImportedAt: true },
    }),
    ...tiers.map(t => prisma.creator.count({ where: { igTier: t } })),
  ])

  const tierDistribution = tiers.reduce<Record<string, number>>((acc, t, i) => {
    acc[t] = tierCounts[i] ?? 0
    return acc
  }, {})

  return NextResponse.json({
    total,
    withIgData: withIg,
    withoutIgData: total - withIg,
    withEmail,
    withProfilePic,
    tierDistribution,
    lastImportAt: lastImport?.igDataImportedAt ?? null,
  })
}
