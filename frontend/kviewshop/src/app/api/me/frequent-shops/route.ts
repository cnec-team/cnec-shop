import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ shops: [] });

    const buyer = await prisma.buyer.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!buyer) return NextResponse.json({ shops: [] });

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const shopCounts = await prisma.order.groupBy({
      by: ['creatorId'],
      where: {
        buyerId: buyer.id,
        creatorId: { not: null },
        createdAt: { gte: sixMonthsAgo },
        status: { in: ['PAID', 'PREPARING', 'SHIPPING', 'DELIVERED', 'CONFIRMED'] },
      },
      _count: { creatorId: true },
      orderBy: { _count: { creatorId: 'desc' } },
      take: 5,
    });

    if (shopCounts.length === 0) return NextResponse.json({ shops: [] });

    const creatorIds = shopCounts
      .map(s => s.creatorId)
      .filter((id): id is string => id !== null);

    const creators = await prisma.creator.findMany({
      where: {
        id: { in: creatorIds },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        profileImage: true,
      },
    });

    const creatorMap = new Map(creators.map(c => [c.id, c]));
    const shops = shopCounts
      .map(sc => {
        const creator = creatorMap.get(sc.creatorId!);
        if (!creator) return null;
        return {
          id: creator.id,
          username: creator.username,
          displayName: creator.displayName,
          profileImage: creator.profileImage,
          purchaseCount: sc._count.creatorId,
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);

    return NextResponse.json({ shops });
  } catch (error) {
    console.error('Failed to fetch frequent shops:', error);
    return NextResponse.json({ shops: [] });
  }
}
