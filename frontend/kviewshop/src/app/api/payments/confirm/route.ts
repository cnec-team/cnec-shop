import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
    const { orderId, paymentKey, amount } = await request.json();

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
    const supabase = getSupabaseClient();

    const { data: existingOrder, error: fetchError } = await supabase
      .from('orders')
      .select('order_number, total_amount, status')
      .eq('order_number', orderId)
      .single();

    if (fetchError || !existingOrder) {
      console.error('Order not found for payment confirmation:', orderId);
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

    if (Number(result.totalAmount) !== Number(existingOrder.total_amount)) {
      console.error('Payment amount mismatch:', {
        paid: result.totalAmount,
        expected: existingOrder.total_amount,
      });
      return NextResponse.json(
        { success: false, message: 'Payment amount mismatch' },
        { status: 400 }
      );
    }

    // Payment confirmed by Toss — update order status server-side
    const now = new Date().toISOString();

    const { data: order, error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'PAID',
        payment_key: paymentKey,
        pg_transaction_id: paymentKey,
        pg_provider: 'toss',
        payment_method: result.method || 'CARD',
        paid_at: now,
      })
      .eq('order_number', orderId)
      .select('order_number')
      .single();

    if (updateError) {
      console.error('Failed to update order status after Toss confirmation:', updateError);
      return NextResponse.json(
        { success: false, message: 'Payment confirmed but order update failed. Contact support.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      orderNumber: order?.order_number || orderId,
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
