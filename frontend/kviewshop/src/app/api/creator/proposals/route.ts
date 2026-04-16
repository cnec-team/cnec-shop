import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  const authUser = await getAuthUser()
  if (!authUser || authUser.role !== 'creator') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const creator = await prisma.creator.findFirst({
    where: { userId: authUser.id },
    select: { id: true },
  })
  if (!creator) {
    return NextResponse.json({ error: 'Creator not found' }, { status: 404 })
  }

  const sp = request.nextUrl.searchParams
  const status = sp.get('status') || undefined

  const where = {
    creatorId: creator.id,
    ...(status ? { status: status as 'PENDING' | 'ACCEPTED' | 'REJECTED' } : {}),
  }

  const [proposals, pendingCount] = await Promise.all([
    prisma.creatorProposal.findMany({
      where,
      include: {
        brand: {
          select: { id: true, brandName: true, logoUrl: true },
        },
        campaign: {
          include: {
            products: {
              include: {
                product: {
                  select: {
                    name: true,
                    nameKo: true,
                    salePrice: true,
                    originalPrice: true,
                  },
                },
              },
            },
          },
        },
        template: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.creatorProposal.count({
      where: { creatorId: creator.id, status: 'PENDING' },
    }),
  ])

  const serialized = proposals.map(p => ({
    ...p,
    commissionRate: p.commissionRate ? Number(p.commissionRate) : null,
    campaign: p.campaign
      ? {
          ...p.campaign,
          commissionRate: Number(p.campaign.commissionRate),
          products: p.campaign.products.map(cp => ({
            ...cp,
            campaignPrice: Number(cp.campaignPrice),
            product: {
              ...cp.product,
              salePrice: cp.product.salePrice ? Number(cp.product.salePrice) : null,
              originalPrice: cp.product.originalPrice ? Number(cp.product.originalPrice) : null,
            },
          })),
        }
      : null,
  }))

  return NextResponse.json({ proposals: serialized, pendingCount })
}
