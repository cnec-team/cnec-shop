import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { cancelPayment, TossApiError } from '@/lib/toss/billing-client'
import { rollbackPlanAfterRefund } from '@/lib/billing/rollback-after-refund'
import { sendNotification } from '@/lib/notifications'

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: '로그인이 필요해요' }, { status: 401 })
    if (user.role !== 'super_admin')
      return NextResponse.json({ error: '권한이 없어요' }, { status: 403 })

    const { paymentId, cancelAmount, reason, approve } = await req.json()

    const payment = await prisma.billingPayment.findUnique({
      where: { id: paymentId },
      include: { brand: { include: { user: true } } },
    })
    if (!payment)
      return NextResponse.json({ error: '결제를 찾을 수 없어요' }, { status: 404 })
    if (!payment.paymentKey)
      return NextResponse.json({ error: 'paymentKey가 없어요' }, { status: 400 })

    if (!approve) {
      await prisma.billingPayment.update({
        where: { id: paymentId },
        data: {
          status: 'REFUND_REJECTED',
          refundReason: `[거절] ${reason}`,
          refundApprovedBy: user.id,
        },
      })

      try {
        await sendNotification({
          userId: payment.brand.userId,
          type: 'SYSTEM',
          title: '환불 요청이 거절됐어요',
          message: `환불이 어려운 사유가 있어요. 사유: ${reason}`,
        })
      } catch {
        // 알림 실패는 주요 로직에 영향 주지 않음
      }

      return NextResponse.json({ ok: true, approved: false })
    }

    await cancelPayment({
      paymentKey: payment.paymentKey,
      cancelReason: reason,
      cancelAmount: cancelAmount ?? undefined,
    })

    const isPartial = cancelAmount && cancelAmount < Number(payment.amount)
    const refundAmount = cancelAmount ?? payment.amount

    await prisma.billingPayment.update({
      where: { id: paymentId },
      data: {
        status: isPartial ? 'PARTIALLY_REFUNDED' : 'REFUNDED',
        refundedAt: new Date(),
        refundedAmount: refundAmount,
        refundApprovedBy: user.id,
      },
    })

    if (!isPartial) {
      await rollbackPlanAfterRefund(paymentId)
    }

    try {
      await sendNotification({
        userId: payment.brand.userId,
        type: 'SYSTEM',
        title: '환불이 완료됐어요',
        message: `₩${Number(refundAmount).toLocaleString()} 환불이 완료됐어요. 카드사 정책에 따라 3~5영업일 걸릴 수 있어요.`,
      })
    } catch {
      // 알림 실패는 주요 로직에 영향 주지 않음
    }

    return NextResponse.json({ ok: true, approved: true })
  } catch (error: unknown) {
    console.error('[admin/billing/refund-approve]', error)
    const message =
      error instanceof TossApiError ? error.message : '환불 처리 중 오류가 발생했어요'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
