import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ hasActiveOrders: false });

    const buyer = await prisma.buyer.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!buyer) return NextResponse.json({ hasActiveOrders: false });

    const count = await prisma.order.count({
      where: {
        buyerId: buyer.id,
        status: { in: ['PENDING', 'PAID', 'PREPARING', 'SHIPPING'] },
      },
    });

    return NextResponse.json({ hasActiveOrders: count > 0 });
  } catch {
    return NextResponse.json({ hasActiveOrders: false });
  }
}
