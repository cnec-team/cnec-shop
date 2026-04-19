import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { sendNotification, orderCompleteMessage, newOrderBrandMessage, saleOccurredMessage, normalizePhone, isValidEmail } from '@/lib/notifications';
import { logger } from '@/lib/notifications/logger';

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
      logger.error('PORTONE_API_SECRET is not configured');
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
      logger.error('PortOne 결제 검증 실패', undefined, { status: verifyResponse.status });
      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 400 }
      );
    }

    const paymentData = await verifyResponse.json();

    // Verify the payment amount matches the order
    if (paymentData.amount?.total !== Number(order.totalAmount)) {
      logger.error('결제 금액 불일치', undefined, {
        portone: paymentData.amount?.total,
        order: Number(order.totalAmount),
      });
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
      logger.error('주문 아이템 조회 실패', itemsError);
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
          logger.error('전환 기록 생성 실패', conversionError);
          // Non-fatal: order is already paid
        }
      }
    }

    // ── 결제 완료 3채널 알림 ──
    try {
      const orderWithDetails = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: { include: { product: { include: { brand: { include: { user: true } } } } } },
          buyer: { include: { user: true } },
          creator: { include: { user: true } },
        },
      })

      if (orderWithDetails) {
        const firstProduct = orderWithDetails.items[0]
        const productName = firstProduct?.productName ?? firstProduct?.product.name ?? '상품'
        const totalAmount = Number(orderWithDetails.totalAmount)
        const totalQuantity = orderWithDetails.items.reduce((sum, i) => sum + i.quantity, 0)

        // 1. 구매자 알림 (회원 + 비회원 모두 지원)
        const buyerUserId = orderWithDetails.buyer?.userId
        const rawBuyerEmail = orderWithDetails.buyerEmail ?? orderWithDetails.buyer?.user.email
        const rawBuyerPhone = orderWithDetails.buyerPhone ?? orderWithDetails.buyer?.user.phone
        const buyerName = orderWithDetails.buyerName ?? orderWithDetails.buyer?.user.name ?? '고객'
        const buyerEmail = isValidEmail(rawBuyerEmail) ? rawBuyerEmail! : undefined
        const buyerPhone = normalizePhone(rawBuyerPhone)
        const guestOrderLink = buyerUserId
          ? '/buyer/orders'
          : `/order-lookup?orderNumber=${orderWithDetails.orderNumber ?? ''}`

        {
          const tmpl = orderCompleteMessage({
            buyerName,
            orderNumber: orderWithDetails.orderNumber ?? '',
            productName,
            totalAmount,
            recipientEmail: buyerEmail,
            orderLinkUrl: guestOrderLink,
          })
          try {
            await sendNotification({
              userId: buyerUserId ?? undefined,
              ...tmpl.inApp,
              phone: buyerPhone,
              kakaoTemplate: buyerPhone ? tmpl.kakao : undefined,
              email: buyerEmail,
              emailTemplate: buyerEmail ? tmpl.email : undefined,
            })
          } catch (e) { logger.error('구매자 알림 발송 실패', e) }
        }

        // 2. 브랜드 알림 (주문에 포함된 브랜드별)
        const brandMap = new Map<string, typeof firstProduct.product.brand>()
        for (const item of orderWithDetails.items) {
          if (item.product.brand && !brandMap.has(item.product.brandId)) {
            brandMap.set(item.product.brandId, item.product.brand)
          }
        }
        for (const [, brand] of brandMap) {
          if (!brand) continue
          const brandEmail = isValidEmail(brand.user.email) ? brand.user.email! : undefined
          const brandPhone = normalizePhone(brand.user.phone)
          const tmpl = newOrderBrandMessage({
            brandName: brand.brandName ?? '',
            orderNumber: orderWithDetails.orderNumber ?? '',
            productName,
            quantity: totalQuantity,
            totalAmount,
            buyerName,
            recipientEmail: brandEmail,
          })
          try {
            await sendNotification({
              userId: brand.userId,
              ...tmpl.inApp,
              phone: brandPhone,
              kakaoTemplate: brandPhone ? tmpl.kakao : undefined,
              email: brandEmail,
              emailTemplate: brandEmail ? tmpl.email : undefined,
            })
          } catch (e) { logger.error('브랜드 알림 발송 실패', e) }
        }

        // 3. 크리에이터 알림 (판매 발생)
        if (orderWithDetails.creator) {
          const creator = orderWithDetails.creator
          const commissionRate = 0.10
          const commissionAmount = Math.round(totalAmount * commissionRate)
          const creatorEmail = isValidEmail(creator.user.email) ? creator.user.email! : undefined
          const creatorPhone = normalizePhone(creator.user.phone)
          const tmpl = saleOccurredMessage({
            creatorName: creator.user.name ?? '',
            productName,
            orderAmount: totalAmount,
            commissionAmount,
            recipientEmail: creatorEmail,
          })
          try {
            await sendNotification({
              userId: creator.userId,
              ...tmpl.inApp,
              phone: creatorPhone,
              kakaoTemplate: creatorPhone ? tmpl.kakao : undefined,
              email: creatorEmail,
              emailTemplate: creatorEmail ? tmpl.email : undefined,
            })
          } catch (e) { logger.error('크리에이터 알림 발송 실패', e) }
        }
      }
    } catch (notifErr) {
      logger.error('결제 알림 발송 에러 (non-fatal)', notifErr)
    }

    return NextResponse.json({
      success: true,
      orderNumber: order.orderNumber,
    });
  } catch (error: unknown) {
    logger.error('결제 완료 처리 에러', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
