import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inline types
type ConversionType = 'DIRECT' | 'INDIRECT';
type ConversionStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

interface CompleteRequestBody {
  orderId: string;
  paymentId: string;
  pgProvider: string;
}

interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: string;
  campaign_id: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
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

    const supabase = getSupabaseClient();

    // Fetch the order to verify it exists and is in PENDING state
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, order_number, status, total_amount, creator_id')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    if (order.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Order is not in PENDING state. Current status: ${order.status}` },
        { status: 400 }
      );
    }

    // Verify payment with PortOne API (mock for now - just validate paymentId exists)
    // In production, this would call PortOne's payment verification API:
    //   GET https://api.portone.io/payments/{paymentId}
    // For now, we simply check that a paymentId was provided
    if (!paymentId || paymentId.trim() === '') {
      return NextResponse.json(
        { error: 'Invalid paymentId' },
        { status: 400 }
      );
    }

    // Update order status to PAID
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'PAID',
        paid_at: now,
        payment_method: 'CARD', // Default; can be derived from PortOne response
        pg_transaction_id: paymentId,
        pg_provider: pgProvider || 'portone',
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Failed to update order status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update order status', detail: updateError.message },
        { status: 500 }
      );
    }

    // Fetch order items for creating conversion records
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    if (itemsError) {
      console.error('Failed to fetch order items:', itemsError);
      // Order is already paid, so we don't fail - just log the error
    }

    // Create conversion records (DIRECT type) based on cookie tracking
    // In a real implementation, we'd read visitor/creator cookies to determine
    // direct vs indirect conversion. For now, we create DIRECT conversions.
    if (orderItems && orderItems.length > 0) {
      const creatorId = order.creator_id;

      // Determine commission rate - check if there's a campaign-based rate
      const conversionRecords = [];

      for (const item of orderItems as OrderItemRow[]) {
        // Default commission rate for direct sales
        let commissionRate = 0.10; // 10% default

        // If the item is from a campaign, try to get the campaign commission rate
        if (item.campaign_id) {
          const { data: campaign } = await supabase
            .from('campaigns')
            .select('commission_rate')
            .eq('id', item.campaign_id)
            .single();

          if (campaign) {
            commissionRate = campaign.commission_rate;
          }
        }

        const conversionType: ConversionType = 'DIRECT';
        const conversionStatus: ConversionStatus = 'PENDING';

        conversionRecords.push({
          order_id: orderId,
          order_item_id: item.id,
          creator_id: creatorId,
          conversion_type: conversionType,
          order_amount: item.total_price,
          commission_rate: commissionRate,
          commission_amount: Math.round(item.total_price * commissionRate),
          status: conversionStatus,
        });
      }

      if (conversionRecords.length > 0) {
        const { error: conversionError } = await supabase
          .from('conversions')
          .insert(conversionRecords);

        if (conversionError) {
          console.error('Failed to create conversion records:', conversionError);
          // Non-fatal: order is already paid
        }
      }
    }

    return NextResponse.json({
      success: true,
      orderNumber: order.order_number,
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
