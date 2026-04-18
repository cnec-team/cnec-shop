import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { createInquiry } from '@/lib/actions/inquiry';

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

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
    if (await rateLimit(`me-inquiries-create:${ip}`, 5, 60)) {
      return NextResponse.json({ error: 'too_many_requests', message: '잠시 후 다시 시도해주세요' }, { status: 429 });
    }

    const body = await req.json();
    const result = await createInquiry(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('[api/me/inquiries POST] error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 400 });
  }
}
