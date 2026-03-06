import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
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

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
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

    const supabase = getSupabaseClient();

    // Find the order by pg_transaction_id (paymentId) or by orderId from webhook
    let orderQuery = supabase
      .from('orders')
      .select('id, status, order_number, total_amount');

    if (webhookOrderId) {
      orderQuery = orderQuery.eq('id', webhookOrderId);
    } else {
      orderQuery = orderQuery.eq('pg_transaction_id', paymentId);
    }

    const { data: order, error: orderError } = await orderQuery.single();

    if (orderError || !order) {
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
      const orderAmount = Number(order.total_amount);

      if (paidAmount !== orderAmount) {
        console.error('Webhook: Amount mismatch detected', {
          paymentId,
          orderNumber: order.order_number,
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
        await supabase
          .from('orders')
          .update({
            status: 'CANCELLED',
            cancel_reason: 'Amount mismatch: auto-cancelled by webhook verification',
            updated_at: new Date().toISOString(),
          })
          .eq('id', order.id);

        return NextResponse.json({
          received: true,
          processed: true,
          reason: 'Amount mismatch - payment cancelled',
        });
      }
    }

    // Build update payload based on event type
    const now = new Date().toISOString();
    const updateData: Record<string, unknown> = {
      status: newStatus,
      updated_at: now,
    };

    switch (newStatus) {
      case 'PAID':
        updateData.paid_at = now;
        updateData.pg_transaction_id = paymentId;
        break;
      case 'CANCELLED':
        updateData.cancelled_at = data.cancelledAt || now;
        updateData.cancel_reason = data.cancelReason || 'Cancelled via payment gateway';
        break;
      case 'REFUNDED':
        updateData.cancelled_at = now;
        updateData.cancel_reason = data.cancelReason || 'Refunded via payment gateway';
        break;
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', order.id);

    if (updateError) {
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
      const { error: conversionError } = await supabase
        .from('conversions')
        .update({ status: 'CANCELLED' })
        .eq('order_id', order.id);

      if (conversionError) {
        console.error('Webhook: Failed to cancel conversions:', conversionError);
      }
    }

    console.log(
      `Webhook processed: order=${order.order_number}, event=${eventType}, newStatus=${newStatus}`
    );

    return NextResponse.json({
      received: true,
      processed: true,
      orderNumber: order.order_number,
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
