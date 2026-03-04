import { NextRequest, NextResponse } from 'next/server';

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

    return NextResponse.json({
      success: true,
      payment: {
        paymentKey: result.paymentKey,
        orderId: result.orderId,
        orderName: result.orderName,
        totalAmount: result.totalAmount,
        method: result.method,
        status: result.status,
        approvedAt: result.approvedAt,
        receipt: result.receipt,
        card: result.card,
        easyPay: result.easyPay,
      },
    });
  } catch (error: any) {
    console.error('Payment confirmation error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
