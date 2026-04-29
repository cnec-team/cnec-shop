import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function GET() {
  try {
    // 1. Auth check
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ step: 'auth', error: 'No session' })
    }

    // 2. Creator check
    const creator = await prisma.creator.findFirst({
      where: { userId: session.user.id },
    })
    if (!creator) {
      return NextResponse.json({
        step: 'creator',
        error: 'No creator for this user',
        userId: session.user.id,
        email: session.user.email,
        role: (session.user as any).role,
      })
    }

    // 3. Test getPickableProducts query
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

    const activeCampaignProductIds = new Set<string>()
    for (const cp of campaignProducts) {
      if (campaigns.some((c) => c.id === cp.campaignId)) {
        activeCampaignProductIds.add(cp.productId)
      }
    }

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

    // 4. Test getTrialableProducts query
    const trialProducts = await prisma.product.findMany({
      where: { allowTrial: true, isActive: true, status: 'ACTIVE' },
      select: {
        id: true, name: true,
        brand: { select: { id: true, companyName: true, logoUrl: true } },
        sampleRequests: {
          where: { creatorId: creator.id },
          select: { id: true, status: true },
          take: 1,
        },
      },
      take: 5,
    })

    return NextResponse.json({
      ok: true,
      userId: session.user.id,
      email: session.user.email,
      role: (session.user as any).role,
      creatorId: creator.id,
      brandsCount: brands.length,
      campaignsCount: campaigns.length,
      productsCount: products.length,
      trialProductsCount: trialProducts.length,
      sampleProductNames: products.slice(0, 3).map((p) => p.name),
    })
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 5),
    }, { status: 500 })
  }
}
