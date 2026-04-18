import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const buyer = await prisma.buyer.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!buyer) return NextResponse.json({ error: 'Buyer not found' }, { status: 404 });

    const settings = await prisma.buyerNotificationSetting.findUnique({
      where: { buyerId: buyer.id },
    });

    return NextResponse.json(settings || {
      kakaoOrder: true, kakaoShipping: true, kakaoDeliver: true, kakaoGonggu: true,
      emailOrder: true, emailShipping: true, emailDeliver: true, emailGonggu: true,
    });
  } catch (error) {
    console.error('[api/me/notification-settings] error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
    if (await rateLimit(`me-notifications:${ip}`, 30, 60)) {
      return NextResponse.json({ error: 'too_many_requests', message: '잠시 후 다시 시도해주세요' }, { status: 429 });
    }

    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const buyer = await prisma.buyer.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!buyer) return NextResponse.json({ error: 'Buyer not found' }, { status: 404 });

    const body = await req.json();
    const data: Record<string, boolean> = {};
    const keys = ['kakaoOrder', 'kakaoShipping', 'kakaoDeliver', 'kakaoGonggu',
                  'emailOrder', 'emailShipping', 'emailDeliver', 'emailGonggu'];
    for (const key of keys) {
      if (typeof body[key] === 'boolean') data[key] = body[key];
    }

    await prisma.buyerNotificationSetting.upsert({
      where: { buyerId: buyer.id },
      create: { buyerId: buyer.id, ...data },
      update: data,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[api/me/notification-settings] error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
