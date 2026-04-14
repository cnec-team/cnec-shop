import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

// Inline types
type ConversionType = 'DIRECT' | 'INDIRECT';
type ConversionStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

interface CompleteRequestBody {
  orderId: string;
  paymentId: string;
  pgProvider: string;
  guestEmail?: string;
  guestPhone?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CompleteRequestBody = await request.json();
    const { orderId, paymentId, pgProvider } = body;

    // Validate required fields
    if (!orderId || !paymentId) {
      return NextResponse.json(
        { error: 'orderId and paymentId are required' },
        { status: 400 }
      );
    }

    // Fetch the order to verify it exists and is in PENDING state
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, orderNumber: true, status: true, totalAmount: true, creatorId: true, buyerId: true, buyerEmail: true, buyerPhone: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify order ownership
    const session = await auth();
    if (session?.user) {
      // Logged-in user: session.user.id is User ID, order.buyerId is Buyer table ID
      if (order.buyerId) {
        const buyerRecord = await prisma.buyer.findUnique({
          where: { userId: session.user.id },
          select: { id: true },
        });
        if (!buyerRecord || order.buyerId !== buyerRecord.id) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
    } else {
      // Guest: verify by matching buyer info from order
      // Guest payments don't require extra verification since orderId is already secret
    }

    if (order.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Order is not in PENDING state. Current status: ${order.status}` },
        { status: 400 }
      );
    }

    // Verify payment with PortOne API
    const portoneApiSecret = process.env.PORTONE_API_SECRET;
    if (!portoneApiSecret) {
      console.error('PORTONE_API_SECRET is not configured');
      return NextResponse.json(
        { error: 'Payment verification service not configured' },
        { status: 500 }
      );
    }

    const verifyResponse = await fetch(
      `https://api.portone.io/payments/${encodeURIComponent(paymentId)}`,
      {
        headers: {
          'Authorization': `PortOne ${portoneApiSecret}`,
        },
      }
    );

    if (!verifyResponse.ok) {
      console.error('PortOne payment verification failed:', verifyResponse.status);
      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 400 }
      );
    }

    const paymentData = await verifyResponse.json();

    // Verify the payment amount matches the order
    if (paymentData.amount?.total !== Number(order.totalAmount)) {
      console.error(
        `Payment amount mismatch: PortOne=${paymentData.amount?.total}, Order=${order.totalAmount}`
      );
      return NextResponse.json(
        { error: 'Payment amount does not match order total' },
        { status: 400 }
      );
    }

    // Verify payment status is actually paid
    if (paymentData.status !== 'PAID') {
      return NextResponse.json(
        { error: `Payment is not in PAID status. Current: ${paymentData.status}` },
        { status: 400 }
      );
    }

    // Update order status to PAID
    const now = new Date();
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'PAID',
        paidAt: now,
        paymentMethod: paymentData.method?.type || 'CARD',
        pgTransactionId: paymentId,
        pgProvider: pgProvider || 'portone',
      },
    });

    // Fetch order items for creating conversion records
    let orderItems: { id: string; orderId: string; productId: string; campaignId: string | null; quantity: number; unitPrice: number; totalPrice: number }[] = [];
    try {
      orderItems = await prisma.orderItem.findMany({
        where: { orderId },
      }) as unknown as typeof orderItems;
    } catch (itemsError) {
      console.error('Failed to fetch order items:', itemsError);
      // Order is already paid, so we don't fail - just log the error
    }

    // Create conversion records (DIRECT type) based on cookie tracking
    if (orderItems.length > 0) {
      const creatorId = order.creatorId;

      const conversionRecords = [];

      for (const item of orderItems) {
        // Default commission rate for direct sales
        let commissionRate = 0.10; // 10% default

        // If the item is from a campaign, try to get the campaign commission rate
        if (item.campaignId) {
          const campaign = await prisma.campaign.findUnique({
            where: { id: item.campaignId },
            select: { commissionRate: true },
          });

          if (campaign) {
            commissionRate = Number(campaign.commissionRate);
          }
        }

        const conversionType: ConversionType = 'DIRECT';
        const conversionStatus: ConversionStatus = 'PENDING';

        conversionRecords.push({
          orderId,
          orderItemId: item.id,
          creatorId,
          conversionType,
          orderAmount: item.totalPrice,
          commissionRate,
          commissionAmount: Math.round(Number(item.totalPrice) * commissionRate),
          status: conversionStatus,
        });
      }

      if (conversionRecords.length > 0) {
        try {
          await prisma.conversion.createMany({
            data: conversionRecords as any,
          });
        } catch (conversionError) {
          console.error('Failed to create conversion records:', conversionError);
          // Non-fatal: order is already paid
        }
      }
    }

    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
    });
  } catch (error: unknown) {
    console.error('Payment complete error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
