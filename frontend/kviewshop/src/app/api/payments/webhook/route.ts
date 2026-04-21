import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Inline types
type OrderStatus = 'PENDING' | 'PAID' | 'PREPARING' | 'SHIPPING' | 'DELIVERED' | 'CONFIRMED' | 'CANCELLED' | 'REFUNDED';

/**
 * PortOne V2 결제 웹훅.
 *
 * 기존: HMAC-SHA256 서명 검증 → 본문 파싱 → 상태 매핑
 * 변경: 서명 검증 제거, paymentId만 꺼낸 뒤 PortOne API를 직접 재조회하여
 *       실제 결제 상태·금액을 단일 진실 공급원(SSOT)으로 사용.
 *
 * 왜 변경했는가:
 *  - PortOne V2 웹훅 서명 스펙이 SDK 버전마다 달라 운영 중 서명 불일치 발생 가능
 *  - 재조회 방식은 서명 키 관리 부담이 없고, 금액·상태 검증이 한 곳에서 완결됨
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 웹훅 본문에서 paymentId만 추출 (나머지는 PortOne API 응답을 신뢰)
    const paymentId: string | undefined =
      body?.data?.paymentId ?? body?.paymentId;

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Missing paymentId in webhook data' },
        { status: 400 },
      );
    }

    // ── PortOne API로 결제 상태 재조회 ──
    const portoneApiSecret = process.env.PORTONE_API_SECRET;
    if (!portoneApiSecret) {
      console.error('[Webhook] PORTONE_API_SECRET 미설정');
      return NextResponse.json(
        { error: 'Payment verification not configured' },
        { status: 500 },
      );
    }

    const verifyRes = await fetch(
      `https://api.portone.io/payments/${encodeURIComponent(paymentId)}`,
      { headers: { Authorization: `PortOne ${portoneApiSecret}` } },
    );

    if (!verifyRes.ok) {
      console.error('[Webhook] PortOne 결제 조회 실패:', verifyRes.status);
      // 200 반환해서 PortOne 재시도 방지
      return NextResponse.json({
        received: true,
        processed: false,
        reason: 'PortOne API lookup failed',
      });
    }

    const payment = await verifyRes.json();

    // ── PortOne 상태 → 주문 상태 매핑 ──
    const newStatus = mapPortOneStatus(payment.status);
    if (!newStatus) {
      return NextResponse.json({
        received: true,
        processed: false,
        reason: `Unhandled PortOne status: ${payment.status}`,
      });
    }

    // ── 주문 조회 ──
    const webhookOrderId: string | undefined = body?.data?.orderId;
    let order;
    if (webhookOrderId) {
      order = await prisma.order.findUnique({
        where: { id: webhookOrderId },
        select: { id: true, status: true, orderNumber: true, totalAmount: true },
      });
    }
    if (!order) {
      order = await prisma.order.findFirst({
        where: { pgTransactionId: paymentId },
        select: { id: true, status: true, orderNumber: true, totalAmount: true },
      });
    }

    if (!order) {
      console.error('[Webhook] 주문 없음, paymentId:', paymentId);
      return NextResponse.json({
        received: true,
        processed: false,
        reason: 'Order not found',
      });
    }

    // 멱등성: 이미 같은 상태면 스킵
    if (order.status === newStatus) {
      return NextResponse.json({
        received: true,
        processed: true,
        reason: 'Already processed',
      });
    }

    // ── PAID: 금액 검증 ──
    if (newStatus === 'PAID') {
      const paidAmount = payment.amount?.total;
      const orderAmount = Number(order.totalAmount);

      if (paidAmount !== orderAmount) {
        console.error('[Webhook] 금액 불일치', {
          paymentId,
          orderNumber: order.orderNumber,
          paidAmount,
          orderAmount,
        });

        // 자동 취소
        try {
          await fetch(
            `https://api.portone.io/payments/${encodeURIComponent(paymentId)}/cancel`,
            {
              method: 'POST',
              headers: {
                Authorization: `PortOne ${portoneApiSecret}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                reason: '금액 불일치: 웹훅 검증 자동 취소',
              }),
            },
          );
        } catch (cancelErr) {
          console.error('[Webhook] 자동 취소 실패:', cancelErr);
        }

        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'CANCELLED',
            cancelReason: '금액 불일치: 웹훅 검증 자동 취소',
          },
        });

        return NextResponse.json({
          received: true,
          processed: true,
          reason: 'Amount mismatch - payment cancelled',
        });
      }
    }

    // ── 주문 상태 업데이트 ──
    const now = new Date();
    const updateData: Record<string, unknown> = { status: newStatus };

    switch (newStatus) {
      case 'PAID':
        updateData.paidAt = now;
        updateData.pgTransactionId = paymentId;
        break;
      case 'CANCELLED':
        updateData.cancelledAt = payment.cancelledAt ? new Date(payment.cancelledAt) : now;
        updateData.cancelReason = payment.cancellation?.reason ?? 'PG사 취소';
        break;
      case 'REFUNDED':
        updateData.cancelledAt = now;
        updateData.cancelReason = payment.cancellation?.reason ?? 'PG사 환불';
        break;
    }

    try {
      await prisma.order.update({
        where: { id: order.id },
        data: updateData,
      });
    } catch (updateErr) {
      console.error('[Webhook] 주문 업데이트 실패:', updateErr);
      return NextResponse.json({
        received: true,
        processed: false,
        reason: 'Failed to update order',
      });
    }

    // 취소/환불 시 전환 기록도 취소
    if (newStatus === 'CANCELLED' || newStatus === 'REFUNDED') {
      try {
        await prisma.conversion.updateMany({
          where: { orderId: order.id },
          data: { status: 'CANCELLED' },
        });
      } catch (convErr) {
        console.error('[Webhook] 전환 기록 취소 실패:', convErr);
      }
    }

    console.log(
      `[Webhook] 처리 완료: order=${order.orderNumber}, portoneStatus=${payment.status}, newStatus=${newStatus}`,
    );

    return NextResponse.json({
      received: true,
      processed: true,
      orderNumber: order.orderNumber,
      newStatus,
    });
  } catch (error: unknown) {
    console.error('[Webhook] 처리 에러:', error);
    return NextResponse.json({
      received: true,
      processed: false,
      reason: 'Internal processing error',
    });
  }
}

/** PortOne V2 결제 상태 → 주문 상태 매핑 */
function mapPortOneStatus(portoneStatus: string): OrderStatus | null {
  switch (portoneStatus) {
    case 'PAID':
      return 'PAID';
    case 'CANCELLED':
    case 'FAILED':
      return 'CANCELLED';
    case 'PARTIAL_CANCELLED':
      return 'REFUNDED';
    default:
      return null;
  }
}
