import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { confirmPayment, TossApiError } from '@/lib/toss/billing-client'
import { applyBillingPaymentSuccess } from '@/lib/billing/apply-payment'
import { sendNotification } from '@/lib/notifications'
import { billingPaymentSuccessMessage, billingPaymentFailedMessage } from '@/lib/notifications/templates'

export async function POST(req: NextRequest) {
  let orderId: string | undefined
  try {
    const body = await req.json()
    const { paymentKey, amount } = body
    orderId = body.orderId

    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json({ error: '필수 정보가 빠졌어요' }, { status: 400 })
    }

    const payment = await prisma.billingPayment.findUnique({
      where: { orderId },
      include: { brand: { include: { user: { select: { email: true } } } } },
    })

    if (!payment) {
      return NextResponse.json({ error: '주문을 찾을 수 없어요' }, { status: 404 })
    }

    if (Number(payment.amount) !== Number(amount)) {
      await prisma.billingPayment.update({
        where: { id: payment.id },
        data: { status: 'FAILED', rawResponse: { error: '금액 불일치' } as any },
      })
      return NextResponse.json({ error: '결제 금액이 일치하지 않아요' }, { status: 400 })
    }

    if (payment.status !== 'PENDING') {
      if (['CONFIRMED', 'WEBHOOK_CONFIRMED'].includes(payment.status)) {
        return NextResponse.json({
          success: true,
          paymentId: payment.id,
          alreadyConfirmed: true,
        })
      }
      return NextResponse.json(
        { error: '이 결제는 더 이상 처리할 수 없어요' },
        { status: 409 }
      )
    }

    const tossResult = await confirmPayment({ paymentKey, orderId, amount })

    const updated = await prisma.billingPayment.update({
      where: { id: payment.id },
      data: {
        status: 'CONFIRMED',
        paymentKey: tossResult.paymentKey,
        method: tossResult.method,
        approvedAt: new Date(tossResult.approvedAt),
        rawResponse: tossResult as any,
      },
    })

    await applyBillingPaymentSuccess(updated.id)

    // 결제 성공 알림
    try {
      const brandEmail = payment.brand?.user?.email ?? undefined
      const brandName = payment.brand?.brandName ?? payment.brand?.companyName ?? ''
      const tmpl = billingPaymentSuccessMessage({
        brandName,
        amount: Number(payment.amount),
        purpose: payment.purpose ?? '',
        billingCycle: payment.billingCycle ?? undefined,
        recipientEmail: brandEmail,
      })
      await sendNotification({
        userId: payment.brand.userId,
        ...tmpl.inApp,
        email: brandEmail,
        emailTemplate: brandEmail ? tmpl.email : undefined,
        kakaoTemplate: tmpl.kakao,
      })
    } catch {}

    return NextResponse.json({ success: true, paymentId: updated.id })
  } catch (error: unknown) {
    console.error('[billing/confirm]', error)

    if (orderId) {
      try {
        await prisma.billingPayment.updateMany({
          where: { orderId, status: 'PENDING' },
          data: {
            status: 'FAILED',
            rawResponse:
              error instanceof TossApiError
                ? (error.raw as any)
                : ({ error: error instanceof Error ? error.message : 'unknown' } as any),
          },
        })
      } catch {
        // ignore update error
      }

      // 결제 실패 알림
      try {
        const failedPayment = await prisma.billingPayment.findUnique({
          where: { orderId },
          include: { brand: { include: { user: { select: { email: true } } } } },
        })
        if (failedPayment) {
          const brandEmail = failedPayment.brand?.user?.email ?? undefined
          const brandName = failedPayment.brand?.brandName ?? failedPayment.brand?.companyName ?? ''
          const errorReason = error instanceof TossApiError ? error.message : '결제가 처리되지 않았어요'
          const failTmpl = billingPaymentFailedMessage({
            brandName,
            amount: Number(failedPayment.amount),
            purpose: failedPayment.purpose ?? '',
            errorReason,
            recipientEmail: brandEmail,
          })
          await sendNotification({
            userId: failedPayment.brand.userId,
            ...failTmpl.inApp,
            email: brandEmail,
            emailTemplate: brandEmail ? failTmpl.email : undefined,
            kakaoTemplate: failTmpl.kakao,
          })
        }
      } catch {}
    }

    const message =
      error instanceof TossApiError ? error.message : '결제 승인에 실패했어요'
    return NextResponse.json(
      {
        error: message,
        code: error instanceof TossApiError ? error.code : 'UNKNOWN',
      },
      { status: 400 }
    )
  }
}
