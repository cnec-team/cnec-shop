import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

// Inline types
type OrderStatus = 'PENDING' | 'PAID' | 'PREPARING' | 'SHIPPING' | 'DELIVERED' | 'CONFIRMED' | 'CANCELLED' | 'REFUNDED';

interface WebhookPayload {
  type: string;
  timestamp: string;
  data: {
    paymentId: string;
    transactionId?: string;
    orderNumber?: string;
    orderId?: string;
    status?: string;
    amount?: number;
    cancelledAt?: string;
    cancelReason?: string;
  };
}

// Map PortOne webhook event types to our order statuses
function mapWebhookEventToStatus(eventType: string): OrderStatus | null {
  switch (eventType) {
    case 'payment.paid':
    case 'payment.confirmed':
      return 'PAID';
    case 'payment.cancelled':
    case 'payment.failed':
      return 'CANCELLED';
    case 'payment.refunded':
      return 'REFUNDED';
    default:
      return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Read raw body for signature verification
    const rawBody = await request.text();

    // Verify webhook signature using HMAC-SHA256
    const webhookSecret = process.env.PORTONE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('PORTONE_WEBHOOK_SECRET is not configured');
      return NextResponse.json({ error: 'Webhook configuration error' }, { status: 500 });
    }

    const signature = request.headers.get('x-portone-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Missing webhook signature' }, { status: 401 });
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const signatureBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
      console.error('Webhook signature verification failed');
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    const payload: WebhookPayload = JSON.parse(rawBody);

    if (!payload.type || !payload.data) {
      return NextResponse.json(
        { error: 'Invalid webhook payload' },
        { status: 400 }
      );
    }

    const { type: eventType, data } = payload;
    const { paymentId, orderId: webhookOrderId } = data;

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Missing paymentId in webhook data' },
        { status: 400 }
      );
    }

    // Map event type to order status
    const newStatus = mapWebhookEventToStatus(eventType);

    if (!newStatus) {
      // Unrecognized event type - acknowledge but don't process
      console.log(`Unrecognized webhook event type: ${eventType}`);
      return NextResponse.json({ received: true, processed: false });
    }

    // Find the order by id or pgTransactionId (paymentId)
    let order;
    if (webhookOrderId) {
      order = await prisma.order.findUnique({
        where: { id: webhookOrderId },
        select: { id: true, status: true, orderNumber: true, totalAmount: true },
      });
    } else {
      order = await prisma.order.findFirst({
        where: { pgTransactionId: paymentId },
        select: { id: true, status: true, orderNumber: true, totalAmount: true },
      });
    }

    if (!order) {
      console.error('Webhook: Order not found for paymentId:', paymentId);
      // Return 200 to prevent PortOne from retrying
      return NextResponse.json({ received: true, processed: false, reason: 'Order not found' });
    }

    // Idempotency: Skip if already processed
    if (order.status === newStatus) {
      return NextResponse.json({ received: true, processed: true, reason: 'Already processed' });
    }

    // Double verification: For payment events, verify with PortOne API directly
    if (newStatus === 'PAID') {
      const portoneApiSecret = process.env.PORTONE_API_SECRET;
      if (!portoneApiSecret) {
        console.error('Webhook: PORTONE_API_SECRET is not configured for double verification');
        return NextResponse.json({ error: 'Payment verification not configured' }, { status: 500 });
      }

      const verifyResponse = await fetch(
        `https://api.portone.io/payments/${encodeURIComponent(paymentId)}`,
        { headers: { 'Authorization': `PortOne ${portoneApiSecret}` } }
      );

      if (!verifyResponse.ok) {
        console.error('Webhook: PortOne payment verification failed:', verifyResponse.status);
        return NextResponse.json({ received: true, processed: false, reason: 'Payment verification failed' });
      }

      const paymentData = await verifyResponse.json();

      // Verify payment status is actually PAID
      if (paymentData.status !== 'PAID') {
        console.error('Webhook: PortOne reports payment not PAID:', paymentData.status);
        return NextResponse.json({ received: true, processed: false, reason: 'Payment not confirmed by PortOne' });
      }

      // Verify amount matches order total
      const paidAmount = paymentData.amount?.total;
      const orderAmount = Number(order.totalAmount);

      if (paidAmount !== orderAmount) {
        console.error('Webhook: Amount mismatch detected', {
          paymentId,
          orderNumber: order.orderNumber,
          paidAmount,
          orderAmount,
        });

        // Auto-cancel the payment due to amount mismatch
        try {
          const cancelResponse = await fetch(
            `https://api.portone.io/payments/${encodeURIComponent(paymentId)}/cancel`,
            {
              method: 'POST',
              headers: {
                'Authorization': `PortOne ${portoneApiSecret}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ reason: 'Amount mismatch detected during webhook verification' }),
            }
          );
          if (!cancelResponse.ok) {
            console.error('Webhook: Auto-cancel API call failed:', cancelResponse.status);
          }
        } catch (cancelError) {
          console.error('Webhook: Auto-cancel request error:', cancelError);
        }

        // Update order to CANCELLED
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'CANCELLED',
            cancelReason: 'Amount mismatch: auto-cancelled by webhook verification',
          },
        });

        return NextResponse.json({
          received: true,
          processed: true,
          reason: 'Amount mismatch - payment cancelled',
        });
      }
    }

    // Build update payload based on event type
    const now = new Date();
    const updateData: Record<string, unknown> = {
      status: newStatus,
    };

    switch (newStatus) {
      case 'PAID':
        updateData.paidAt = now;
        updateData.pgTransactionId = paymentId;
        break;
      case 'CANCELLED':
        updateData.cancelledAt = data.cancelledAt ? new Date(data.cancelledAt) : now;
        updateData.cancelReason = data.cancelReason || 'Cancelled via payment gateway';
        break;
      case 'REFUNDED':
        updateData.cancelledAt = now;
        updateData.cancelReason = data.cancelReason || 'Refunded via payment gateway';
        break;
    }

    try {
      await prisma.order.update({
        where: { id: order.id },
        data: updateData,
      });
    } catch (updateError) {
      console.error('Webhook: Failed to update order:', updateError);
      // Still return 200 so PortOne doesn't retry indefinitely
      return NextResponse.json({
        received: true,
        processed: false,
        reason: 'Failed to update order',
      });
    }

    // If cancelled or refunded, also update conversion records
    if (newStatus === 'CANCELLED' || newStatus === 'REFUNDED') {
      try {
        await prisma.conversion.updateMany({
          where: { orderId: order.id },
          data: { status: 'CANCELLED' },
        });
      } catch (conversionError) {
        console.error('Webhook: Failed to cancel conversions:', conversionError);
      }
    }

    console.log(
      `Webhook processed: order=${order.orderNumber}, event=${eventType}, newStatus=${newStatus}`
    );

    return NextResponse.json({
      received: true,
      processed: true,
      orderNumber: order.orderNumber,
      newStatus,
    });
  } catch (error: unknown) {
    console.error('Webhook processing error:', error);
    // Always return 200 for webhooks to prevent unnecessary retries
    return NextResponse.json({
      received: true,
      processed: false,
      reason: 'Internal processing error',
    });
  }
}
