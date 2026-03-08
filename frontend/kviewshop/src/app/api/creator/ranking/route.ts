import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'monthly';

    const now = new Date();
    let startDate: Date;

    if (period === 'weekly') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      startDate = weekAgo;
    } else {
      // monthly: start of current month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Get top 20 creators by CONFIRMED order total in the period
    const rankings = await prisma.order.findMany({
      where: {
        status: 'CONFIRMED',
        paidAt: { gte: startDate },
      },
      select: { creatorId: true, totalAmount: true },
    });

    // Aggregate by creator
    const salesMap = new Map<string, number>();
    for (const order of rankings) {
      if (!order.creatorId) continue;
      const current = salesMap.get(order.creatorId) ?? 0;
      salesMap.set(order.creatorId, current + Number(order.totalAmount));
    }

    // Sort and take top 20
    const sorted = Array.from(salesMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);

    if (sorted.length === 0) {
      return NextResponse.json({ period, rankings: [] });
    }

    // Fetch creator display info
    const creatorIds = sorted.map(([id]) => id);
    const creators = await prisma.creator.findMany({
      where: { id: { in: creatorIds } },
      select: { id: true, displayName: true, profileImageUrl: true },
    });

    const creatorMap = new Map(creators.map(c => [c.id, c]));

    const rankingList = sorted.map(([creatorId, totalSales], index) => {
      const c = creatorMap.get(creatorId);
      return {
        rank: index + 1,
        creatorId,
        displayName: c?.displayName ?? '크리에이터',
        profileImage: c?.profileImageUrl ?? null,
        totalSales,
      };
    });

    return NextResponse.json({ period, rankings: rankingList });
  } catch (error) {
    console.error('Ranking API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
