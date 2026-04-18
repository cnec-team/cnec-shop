import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const buyer = await prisma.buyer.findFirst({
      where: { userId: session.user.id },
      select: { id: true, pointsBalance: true },
    });
    if (!buyer) return NextResponse.json({ error: 'Buyer not found' }, { status: 404 });

    const history = await prisma.pointsHistory.findMany({
      where: { buyerId: buyer.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      balance: buyer.pointsBalance,
      history: history.map(h => ({
        id: h.id,
        amount: h.amount,
        type: h.type,
        description: h.description,
        createdAt: h.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('[api/me/points] error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
