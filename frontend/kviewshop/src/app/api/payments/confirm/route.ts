import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY;
    if (!TOSS_SECRET_KEY) {
      console.error('TOSS_SECRET_KEY environment variable is not set');
      return NextResponse.json(
        { success: false, message: 'Payment service configuration error' },
        { status: 500 }
      );
    }
    const { orderId, paymentKey, amount, guestEmail, guestPhone } = await request.json();

    if (!orderId || !paymentKey || !amount) {
      return NextResponse.json(
        { success: false, message: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Confirm payment with Toss Payments API
    const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(TOSS_SECRET_KEY + ':').toString('base64'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId,
        paymentKey,
        amount,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Toss payment confirmation failed:', result);
      return NextResponse.json(
        {
          success: false,
          message: result.message || 'Payment confirmation failed',
          code: result.code,
        },
        { status: response.status }
      );
    }

    // Verify payment amount matches order total
    const existingOrder = await prisma.order.findFirst({
      where: { orderNumber: orderId },
      select: { orderNumber: true, totalAmount: true, status: true, buyerId: true, buyerEmail: true, buyerPhone: true },
    });

    if (!existingOrder) {
      console.error('Order not found for payment confirmation:', orderId);
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify order ownership
    const session = await auth();
    if (session?.user) {
      if (existingOrder.buyerId && existingOrder.buyerId !== session.user.id) {
        return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
      }
    } else {
      if (!guestEmail || !guestPhone) {
        return NextResponse.json({ success: false, message: 'Guest verification required' }, { status: 401 });
      }
      if (existingOrder.buyerEmail !== guestEmail || existingOrder.buyerPhone !== guestPhone) {
        return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
      }
    }

    if (Number(result.totalAmount) !== Number(existingOrder.totalAmount)) {
      console.error('Payment amount mismatch:', {
        paid: result.totalAmount,
        expected: existingOrder.totalAmount,
      });
      return NextResponse.json(
        { success: false, message: 'Payment amount mismatch' },
        { status: 400 }
      );
    }

    // Payment confirmed by Toss — update order status server-side
    const now = new Date();

    const order = await prisma.order.update({
      where: { orderNumber: orderId },
      data: {
        status: 'PAID',
        paymentKey,
        pgTransactionId: paymentKey,
        pgProvider: 'toss',
        paymentMethod: result.method || 'CARD',
        paidAt: now,
      },
      select: { orderNumber: true },
    });

    return NextResponse.json({
      success: true,
      orderNumber: order?.orderNumber || orderId,
      payment: {
        paymentKey: result.paymentKey,
        orderId: result.orderId,
        orderName: result.orderName,
        totalAmount: result.totalAmount,
        method: result.method,
        status: result.status,
        approvedAt: result.approvedAt,
      },
    });
  } catch (error: unknown) {
    console.error('Payment confirmation error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
