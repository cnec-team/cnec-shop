import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendNotification, normalizePhone, isValidEmail } from '@/lib/notifications'
import { invoiceReminderMessage } from '@/lib/notifications/templates'

/**
 * 송장 미입력 리마인더 (CNECSHOP_005)
 * 결제 완료(PAID) 후 24시간 경과, 아직 SHIPPING으로 전환되지 않은 주문에 대해
 * 브랜드에게 송장 입력 리마인더를 보냅니다.
 *
 * Vercel Cron 또는 외부 스케줄러에서 호출:
 *   GET /api/cron/shipping-reminder?secret=CRON_SECRET
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const secret = searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const orders = await prisma.order.findMany({
    where: {
      status: 'PAID',
      paidAt: { lte: cutoff },
    },
    include: {
      items: {
        take: 1,
        select: {
          productName: true,
          product: {
            select: {
              brand: {
                select: {
                  userId: true,
                  brandName: true,
                  user: { select: { email: true, phone: true } },
                },
              },
            },
          },
        },
      },
    },
    take: 200,
  })

  let sent = 0
  for (const order of orders) {
    const brand = order.items[0]?.product?.brand
    if (!brand) continue

    const brandEmail = isValidEmail(brand.user.email) ? brand.user.email! : undefined
    const brandPhone = normalizePhone(brand.user.phone)

    const tmpl = invoiceReminderMessage({
      brandName: brand.brandName ?? '',
      orderNumber: order.orderNumber ?? '',
      productName: order.items[0]?.productName ?? '상품',
      orderDate: order.createdAt.toISOString().slice(0, 10),
      recipientEmail: brandEmail,
    })

    try {
      await sendNotification({
        userId: brand.userId,
        ...tmpl.inApp,
        phone: brandPhone,
        email: brandEmail,
        kakaoTemplate: brandPhone ? tmpl.kakao : undefined,
        emailTemplate: brandEmail ? tmpl.email : undefined,
      })
      sent++
    } catch {
      // 개별 실패 무시
    }
  }

  return NextResponse.json({ ok: true, checked: orders.length, sent })
}
