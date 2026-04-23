import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createHmac, timingSafeEqual } from 'crypto';

type OrderStatus = 'PENDING' | 'PAID' | 'PREPARING' | 'SHIPPING' | 'DELIVERED' | 'CONFIRMED' | 'CANCELLED' | 'REFUNDED';

/**
 * 토스페이먼츠 웹훅
 *
 * 토스에서 결제 상태 변경, 취소 상태 변경, 가상계좌 입금 시 호출.
 * HMAC-SHA256 서명 검증 후 주문 상태 업데이트.
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('toss-signature');
    const webhookSecret = process.env.TOSS_PAYMENTS_WEBHOOK_SECRET;

    // 서명 검증 (webhookSecret이 있을 때만)
    if (webhookSecret && signature) {
      const expected = createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('base64');

      const sigBuf = Buffer.from(signature);
      const expBuf = Buffer.from(expected);

      if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
        console.error('[Webhook] 서명 검증 실패');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const body = JSON.parse(rawBody);
    const { eventType, data } = body;

    if (!data?.paymentKey) {
      return NextResponse.json({ received: true, processed: false, reason: 'No paymentKey' });
    }

    const paymentKey = data.paymentKey as string;

    // 주문 조회 (paymentKey로)
    const order = await prisma.order.findFirst({
      where: { OR: [{ paymentKey }, { pgTransactionId: paymentKey }] },
      select: { id: true, status: true, orderNumber: true, totalAmount: true },
    });

    if (!order) {
      // orderId로 재시도
      if (data.orderId) {
        const orderById = await prisma.order.findUnique({
          where: { id: data.orderId },
          select: { id: true, status: true, orderNumber: true, totalAmount: true },
        });
        if (!orderById) {
          console.error('[Webhook] 주문 없음:', paymentKey, data.orderId);
          return NextResponse.json({ received: true, processed: false, reason: 'Order not found' });
        }
        return processWebhookEvent(orderById, eventType, data);
      }
      console.error('[Webhook] 주문 없음:', paymentKey);
      return NextResponse.json({ received: true, processed: false, reason: 'Order not found' });
    }

    return processWebhookEvent(order, eventType, data);
  } catch (error: unknown) {
    console.error('[Webhook] 처리 에러:', error);
    return NextResponse.json({ received: true, processed: false, reason: 'Internal error' });
  }
}

async function processWebhookEvent(
  order: { id: string; status: string; orderNumber: string | null; totalAmount: unknown },
  eventType: string,
  data: Record<string, unknown>,
) {
  const now = new Date();

  if (eventType === 'PAYMENT_STATUS_CHANGED') {
    const status = data.status as string;

    if (status === 'DONE' && order.status === 'PENDING') {
      // 결제 완료 — /api/payments/complete에서 이미 처리하지만 웹훅 백업
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'PAID',
          paidAt: now,
          paymentKey: data.paymentKey as string,
          pgTransactionId: data.paymentKey as string,
          pgProvider: 'toss',
        },
      });
      return NextResponse.json({ received: true, processed: true, newStatus: 'PAID' });
    }

    if (status === 'CANCELED' || status === 'EXPIRED' || status === 'ABORTED') {
      if (order.status !== 'CANCELLED' && order.status !== 'REFUNDED') {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'CANCELLED',
            cancelledAt: now,
            cancelReason: `토스 웹훅: ${status}`,
          },
        });
        // 전환 기록 취소
        try {
          await prisma.conversion.updateMany({
            where: { orderId: order.id },
            data: { status: 'CANCELLED' },
          });
        } catch {}
      }
      return NextResponse.json({ received: true, processed: true, newStatus: 'CANCELLED' });
    }
  }

  if (eventType === 'CANCEL_STATUS_CHANGED') {
    if (order.status !== 'CANCELLED' && order.status !== 'REFUNDED') {
      const newStatus: OrderStatus = (data.cancelAmount && Number(data.cancelAmount) < Number(order.totalAmount))
        ? 'REFUNDED' // 부분 취소
        : 'CANCELLED';

      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: newStatus,
          cancelledAt: now,
          cancelReason: (data.cancelReason as string) || '토스 웹훅 취소',
        },
      });
      try {
        await prisma.conversion.updateMany({
          where: { orderId: order.id },
          data: { status: 'CANCELLED' },
        });
      } catch {}
      return NextResponse.json({ received: true, processed: true, newStatus });
    }
  }

  // DEPOSIT_CALLBACK: 가상계좌 입금 완료
  if (eventType === 'DEPOSIT_CALLBACK') {
    if (data.status === 'DONE' && order.status === 'PENDING') {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'PAID', paidAt: now, pgProvider: 'toss' },
      });
      return NextResponse.json({ received: true, processed: true, newStatus: 'PAID' });
    }
  }

  return NextResponse.json({ received: true, processed: false, reason: `Unhandled: ${eventType}` });
}
