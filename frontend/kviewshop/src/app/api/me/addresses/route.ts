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
    if (!buyer) return NextResponse.json([], { status: 200 });

    const addresses = await prisma.address.findMany({
      where: { buyerId: buyer.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json(addresses);
  } catch (error) {
    console.error('[api/me/addresses] error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const buyer = await prisma.buyer.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!buyer) return NextResponse.json({ error: 'Buyer not found' }, { status: 404 });

    const count = await prisma.address.count({ where: { buyerId: buyer.id } });
    if (count >= 20) return NextResponse.json({ error: '배송지는 최대 20개까지 등록할 수 있습니다' }, { status: 400 });

    const body = await req.json();

    const address = await prisma.$transaction(async (tx) => {
      if (body.isDefault) {
        await tx.address.updateMany({
          where: { buyerId: buyer.id, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.address.create({
        data: {
          buyerId: buyer.id,
          label: body.label || null,
          recipient: body.recipient,
          phone: body.phone,
          zipcode: body.zipcode || '',
          address: body.address,
          detail: body.detail,
          isDefault: body.isDefault || count === 0,
        },
      });
    });

    return NextResponse.json(address, { status: 201 });
  } catch (error) {
    console.error('[api/me/addresses] error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
