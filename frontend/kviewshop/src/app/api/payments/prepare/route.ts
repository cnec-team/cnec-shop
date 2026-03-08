import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { decrementStock } from '@/lib/stock';

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

    // Calculate total amount
    const productAmount = items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );

    // Calculate shipping fee based on product shipping_fee_type
    const productIds = items.map((item) => item.productId);
    const productShippingData = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, shippingFeeType: true, shippingFee: true, freeShippingThreshold: true },
    });

    let shippingFee = 0;
    for (const product of productShippingData) {
      const feeType = product.shippingFeeType || 'FREE';
      if (feeType === 'PAID') {
        shippingFee = Math.max(shippingFee, Number(product.shippingFee) || 0);
      } else if (feeType === 'CONDITIONAL_FREE') {
        const threshold = Number(product.freeShippingThreshold) || 0;
        if (productAmount < threshold) {
          shippingFee = Math.max(shippingFee, Number(product.shippingFee) || 0);
        }
      }
      // FREE: no fee
    }

    const totalAmount = productAmount + shippingFee;

    // Look up the brandId from the first product
    const firstProduct = await prisma.product.findUnique({
      where: { id: items[0].productId },
      select: { brandId: true },
    });

    if (!firstProduct) {
      return NextResponse.json(
        { error: 'Invalid product: could not determine brand' },
        { status: 400 }
      );
    }

    const brandId: string = firstProduct.brandId;

    // Generate order number
    const orderNumber = generateOrderNumber();
    const status: OrderStatus = 'PENDING';

    // Create order record
    const order = await prisma.order.create({
      data: {
        orderNumber,
        creatorId,
        brandId,
        buyerName: buyer.name,
        buyerPhone: buyer.phone,
        buyerEmail: buyer.email,
        shippingAddress: shipping.address,
        shippingZipcode: shipping.zipcode,
        shippingDetail: shipping.detail || null,
        shippingMemo: shipping.memo || null,
        totalAmount,
        productAmount,
        shippingFee,
        status,
      },
      select: { id: true, orderNumber: true, totalAmount: true },
    });

    // Fetch product info for denormalization
    const productInfos = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, nameKo: true, imageUrl: true, images: true },
    });
    const productMap = new Map(productInfos.map((p) => [p.id, p]));

    // Create order items with denormalized product info
    const orderItemsData = items.map((item) => {
      const prod = productMap.get(item.productId);
      return {
        orderId: order.id,
        productId: item.productId,
        campaignId: item.campaignId || null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.unitPrice * item.quantity,
        productName: prod?.name || prod?.nameKo || null,
        productImage: prod?.imageUrl || (prod?.images && (prod.images as string[])[0]) || null,
      };
    });

    try {
      await prisma.orderItem.createMany({
        data: orderItemsData,
      });
    } catch (itemsError) {
      console.error('Failed to create order items:', itemsError);
      // Attempt to clean up the order
      await prisma.order.delete({ where: { id: order.id } });
      return NextResponse.json(
        { error: 'Failed to create order items', detail: itemsError instanceof Error ? itemsError.message : 'Unknown error' },
        { status: 500 }
      );
    }

    // Decrement product stock for each item using atomic helper
    for (const item of items) {
      const stockResult = await decrementStock(item.productId, item.quantity);

      if (!stockResult.success) {
        // Insufficient stock - clean up and return error
        await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
        await prisma.order.delete({ where: { id: order.id } });
        return NextResponse.json(
          { error: 'Insufficient stock', productId: item.productId, available: stockResult.available },
          { status: 409 }
        );
      }
    }

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
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
