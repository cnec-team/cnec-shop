import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';
import { incrementStock } from '@/lib/stock';

// Inline types
type OrderStatus = 'PENDING' | 'PAID' | 'PREPARING' | 'SHIPPING' | 'DELIVERED' | 'CONFIRMED' | 'CANCELLED' | 'REFUNDED';

interface CancelRequestBody {
  reason: string;
}

// Statuses that allow cancellation
const CANCELLABLE_STATUSES: OrderStatus[] = ['PENDING', 'PAID', 'PREPARING'];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const body: CancelRequestBody = await request.json();
    const { reason } = body;

    if (!reason || reason.trim() === '') {
      return NextResponse.json(
        { error: 'Cancellation reason is required' },
        { status: 400 }
      );
    }

    // Authenticate the requesting user
    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Fetch the order with ownership info
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, orderNumber: true, buyerId: true, creatorId: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify the user owns this order (buyerId or creatorId match)
    const userData = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { id: true, role: true },
    });

    let authorized = false;
    if (userData?.role === 'super_admin') {
      authorized = true;
    } else if (order.buyerId === authUser.id) {
      authorized = true;
    } else {
      // Check if user is the creator for this order
      const creatorData = await prisma.creator.findUnique({
        where: { userId: authUser.id },
        select: { id: true },
      });
      if (creatorData && order.creatorId === creatorData.id) {
        authorized = true;
      }
    }

    if (!authorized) {
      return NextResponse.json(
        { error: 'You are not authorized to cancel this order' },
        { status: 403 }
      );
    }

    // Check if the order can be cancelled
    if (!CANCELLABLE_STATUSES.includes(order.status as OrderStatus)) {
      return NextResponse.json(
        {
          error: `Order cannot be cancelled. Current status: ${order.status}. Cancellation is only allowed for orders in PENDING, PAID, or PREPARING status.`,
        },
        { status: 400 }
      );
    }

    const now = new Date();

    // Update order status to CANCELLED
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        cancelledAt: now,
        cancelReason: reason.trim(),
      },
    });

    // Update related conversion records to CANCELLED
    try {
      await prisma.conversion.updateMany({
        where: { orderId },
        data: { status: 'CANCELLED' },
      });
    } catch (conversionError) {
      console.error('Failed to cancel conversions:', conversionError);
      // Non-fatal: order is already cancelled
    }

    // Restore product stock by incrementing quantities
    try {
      const orderItems = await prisma.orderItem.findMany({
        where: { orderId },
        select: { id: true, productId: true, quantity: true },
      });

      for (const item of orderItems) {
        try {
          await incrementStock(item.productId, item.quantity);
        } catch (stockError) {
          console.error('Failed to restore stock for product:', item.productId, stockError);
        }
      }
    } catch (itemsError) {
      console.error('Failed to fetch order items for stock restore:', itemsError);
    }

    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
    });
  } catch (error: unknown) {
    console.error('Order cancel error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
