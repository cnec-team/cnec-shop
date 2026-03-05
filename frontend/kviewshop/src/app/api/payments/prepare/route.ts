import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inline types to avoid dependency on database.ts
type OrderStatus = 'PENDING' | 'PAID' | 'PREPARING' | 'SHIPPING' | 'DELIVERED' | 'CONFIRMED' | 'CANCELLED' | 'REFUNDED';

interface PrepareRequestItem {
  productId: string;
  campaignId?: string;
  quantity: number;
  unitPrice: number;
}

interface PrepareRequestBuyer {
  name: string;
  phone: string;
  email: string;
}

interface PrepareRequestShipping {
  address: string;
  zipcode: string;
  detail?: string;
  memo?: string;
}

interface PrepareRequestBody {
  items: PrepareRequestItem[];
  creatorId: string;
  buyer: PrepareRequestBuyer;
  shipping: PrepareRequestShipping;
}

function generateOrderNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
  return `CNEC-${year}${month}${day}-${random}`;
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
    const body: PrepareRequestBody = await request.json();
    const { items, creatorId, buyer, shipping } = body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'items is required and must be a non-empty array' },
        { status: 400 }
      );
    }

    if (!creatorId) {
      return NextResponse.json(
        { error: 'creatorId is required' },
        { status: 400 }
      );
    }

    if (!buyer?.name || !buyer?.phone || !buyer?.email) {
      return NextResponse.json(
        { error: 'buyer name, phone, and email are required' },
        { status: 400 }
      );
    }

    if (!shipping?.address || !shipping?.zipcode) {
      return NextResponse.json(
        { error: 'shipping address and zipcode are required' },
        { status: 400 }
      );
    }

    // Validate each item
    for (const item of items) {
      if (!item.productId || !item.quantity || !item.unitPrice) {
        return NextResponse.json(
          { error: 'Each item must have productId, quantity, and unitPrice' },
          { status: 400 }
        );
      }
      if (item.quantity <= 0 || item.unitPrice < 0) {
        return NextResponse.json(
          { error: 'quantity must be > 0 and unitPrice must be >= 0' },
          { status: 400 }
        );
      }
    }

    const supabase = getSupabaseClient();

    // Calculate total amount
    const productAmount = items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );

    // Calculate shipping fee based on product shipping_fee_type
    const productIds = items.map((item) => item.productId);
    const { data: productShippingData } = await supabase
      .from('products')
      .select('id, shipping_fee_type, shipping_fee, free_shipping_threshold')
      .in('id', productIds);

    let shippingFee = 0;
    if (productShippingData) {
      // Use the highest shipping fee among all products (single shipment assumption)
      for (const product of productShippingData) {
        const feeType = product.shipping_fee_type || 'FREE';
        if (feeType === 'PAID') {
          shippingFee = Math.max(shippingFee, product.shipping_fee || 0);
        } else if (feeType === 'CONDITIONAL_FREE') {
          const threshold = product.free_shipping_threshold || 0;
          if (productAmount < threshold) {
            shippingFee = Math.max(shippingFee, product.shipping_fee || 0);
          }
        }
        // FREE: no fee
      }
    }

    const totalAmount = productAmount + shippingFee;

    // Look up the brand_id from the first product
    const { data: firstProduct, error: productError } = await supabase
      .from('products')
      .select('brand_id')
      .eq('id', items[0].productId)
      .single();

    if (productError || !firstProduct) {
      return NextResponse.json(
        { error: 'Invalid product: could not determine brand' },
        { status: 400 }
      );
    }

    const brandId: string = firstProduct.brand_id;

    // Generate order number
    const orderNumber = generateOrderNumber();
    const status: OrderStatus = 'PENDING';

    // Create order record
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        creator_id: creatorId,
        brand_id: brandId,
        buyer_name: buyer.name,
        buyer_phone: buyer.phone,
        buyer_email: buyer.email,
        shipping_address: shipping.address,
        shipping_zipcode: shipping.zipcode,
        shipping_detail: shipping.detail || null,
        shipping_memo: shipping.memo || null,
        total_amount: totalAmount,
        product_amount: productAmount,
        shipping_fee: shippingFee,
        status,
      })
      .select('id, order_number, total_amount')
      .single();

    if (orderError || !order) {
      console.error('Failed to create order:', orderError);
      return NextResponse.json(
        { error: 'Failed to create order', detail: orderError?.message },
        { status: 500 }
      );
    }

    // Fetch product info for denormalization
    const { data: productInfos } = await supabase
      .from('products')
      .select('id, name, name_ko, image_url, images')
      .in('id', productIds);
    const productMap = new Map((productInfos || []).map((p: any) => [p.id, p]));

    // Create order items with denormalized product info
    const orderItems = items.map((item) => {
      const prod = productMap.get(item.productId) as any;
      return {
        order_id: order.id,
        product_id: item.productId,
        campaign_id: item.campaignId || null,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.unitPrice * item.quantity,
        product_name: prod?.name || prod?.name_ko || null,
        product_image: prod?.image_url || (prod?.images && prod.images[0]) || null,
      };
    });

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Failed to create order items:', itemsError);
      // Attempt to clean up the order
      await supabase.from('orders').delete().eq('id', order.id);
      return NextResponse.json(
        { error: 'Failed to create order items', detail: itemsError.message },
        { status: 500 }
      );
    }

    // Decrement product stock for each item using atomic RPC
    for (const item of items) {
      const { data: stockResult, error: stockError } = await supabase.rpc('decrement_stock', {
        p_product_id: item.productId,
        p_quantity: item.quantity,
      });

      if (stockError) {
        console.error('Stock decrement failed:', stockError);
        // Clean up: delete order items and order
        await supabase.from('order_items').delete().eq('order_id', order.id);
        await supabase.from('orders').delete().eq('id', order.id);
        return NextResponse.json(
          { error: 'Failed to update stock', detail: stockError.message },
          { status: 500 }
        );
      }

      if (stockResult && !stockResult.success) {
        // Insufficient stock - clean up and return error
        await supabase.from('order_items').delete().eq('order_id', order.id);
        await supabase.from('orders').delete().eq('id', order.id);
        return NextResponse.json(
          { error: 'Insufficient stock', productId: item.productId, available: stockResult.available },
          { status: 409 }
        );
      }
    }

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.order_number,
      totalAmount: order.total_amount,
    });
  } catch (error: unknown) {
    console.error('Payment prepare error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
