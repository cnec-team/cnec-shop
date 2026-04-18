import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const buyer = await prisma.buyer.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!buyer) return NextResponse.json({ error: 'Buyer not found' }, { status: 404 });

    const inquiries = await prisma.orderInquiry.findMany({
      where: { buyerId: buyer.id },
      orderBy: { createdAt: 'desc' },
      include: {
        order: { select: { orderNumber: true } },
        answers: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    return NextResponse.json(inquiries);
  } catch (error) {
    console.error('[api/me/inquiries] error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
