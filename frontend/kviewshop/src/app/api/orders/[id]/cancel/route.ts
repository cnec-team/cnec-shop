import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inline types
type OrderStatus = 'PENDING' | 'PAID' | 'PREPARING' | 'SHIPPING' | 'DELIVERED' | 'CONFIRMED' | 'CANCELLED' | 'REFUNDED';

interface CancelRequestBody {
  reason: string;
}

interface OrderItemRow {
  id: string;
  product_id: string;
  quantity: number;
}

// Statuses that allow cancellation
const CANCELLABLE_STATUSES: OrderStatus[] = ['PENDING', 'PAID', 'PREPARING'];

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

    const supabase = getSupabaseClient();

    // Fetch the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, status, order_number')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
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

    const now = new Date().toISOString();

    // Update order status to CANCELLED
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'CANCELLED' as OrderStatus,
        cancelled_at: now,
        cancel_reason: reason.trim(),
        updated_at: now,
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Failed to cancel order:', updateError);
      return NextResponse.json(
        { error: 'Failed to cancel order', detail: updateError.message },
        { status: 500 }
      );
    }

    // Update related conversion records to CANCELLED
    const { error: conversionError } = await supabase
      .from('conversions')
      .update({
        status: 'CANCELLED',
      })
      .eq('order_id', orderId);

    if (conversionError) {
      console.error('Failed to cancel conversions:', conversionError);
      // Non-fatal: order is already cancelled
    }

    // Restore product stock by incrementing quantities
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('id, product_id, quantity')
      .eq('order_id', orderId);

    if (itemsError) {
      console.error('Failed to fetch order items for stock restore:', itemsError);
    } else if (orderItems && orderItems.length > 0) {
      for (const item of orderItems as OrderItemRow[]) {
        const { error: stockError } = await supabase.rpc('increment_stock', {
          p_product_id: item.product_id,
          p_quantity: item.quantity,
        });

        if (stockError) {
          console.error('Failed to restore stock for product:', item.product_id, stockError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      orderNumber: order.order_number,
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
