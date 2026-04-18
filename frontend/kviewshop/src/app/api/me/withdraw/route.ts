import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
    if (await rateLimit(`me-withdraw:${ip}`, 2, 60)) {
      return NextResponse.json({ error: 'too_many_requests', message: '잠시 후 다시 시도해주세요' }, { status: 429 });
    }

    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { reason, password } = await req.json();

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { buyer: true },
    });
    if (!user || !user.buyer) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // 비밀번호 검증 (소셜 아닌 경우)
    if (user.passwordHash && password) {
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) return NextResponse.json({ error: '비밀번호가 올바르지 않습니다' }, { status: 400 });
    }

    // 미배송 주문 체크
    const activeOrders = await prisma.order.count({
      where: {
        buyerId: user.buyer.id,
        status: { in: ['PENDING', 'PAID', 'PREPARING', 'SHIPPING'] },
      },
    });
    if (activeOrders > 0) {
      return NextResponse.json({ error: '미배송 주문이 있어 탈퇴할 수 없습니다' }, { status: 400 });
    }

    // 개인정보 익명화
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          email: `deleted_${user.id}@cnecshop.local`,
          name: '탈퇴회원',
          passwordHash: null,
          status: 'suspended',
        },
      }),
      prisma.buyer.update({
        where: { id: user.buyer.id },
        data: {
          nickname: '탈퇴회원',
          phone: null,
          pointsBalance: 0,
          defaultShippingAddress: undefined,
        },
      }),
      // 배송지 삭제
      prisma.address.deleteMany({ where: { buyerId: user.buyer.id } }),
      // 결제수단 삭제
      prisma.buyerPaymentMethod.deleteMany({ where: { buyerId: user.buyer.id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[api/me/withdraw] error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
