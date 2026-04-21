import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { sendNotification } from '@/lib/notifications'

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: '로그인이 필요해요' }, { status: 401 })

    const brand = await prisma.brand.findUnique({ where: { userId: user.id } })
    if (!brand) return NextResponse.json({ error: '브랜드를 찾을 수 없어요' }, { status: 404 })

    const { paymentId, reason } = await req.json()
    if (!reason || reason.length < 10) {
      return NextResponse.json(
        { error: '환불 사유를 10자 이상 입력해주세요' },
        { status: 400 }
      )
    }

    const payment = await prisma.billingPayment.findFirst({
      where: { id: paymentId, brandId: brand.id },
    })
    if (!payment)
      return NextResponse.json({ error: '결제 내역을 찾을 수 없어요' }, { status: 404 })

    if (!['CONFIRMED', 'WEBHOOK_CONFIRMED'].includes(payment.status)) {
      return NextResponse.json(
        { error: '이 결제는 환불을 요청할 수 없어요' },
        { status: 400 }
      )
    }

    await prisma.billingPayment.update({
      where: { id: paymentId },
      data: {
        status: 'REFUND_REQUESTED',
        refundReason: reason,
        refundRequestedAt: new Date(),
      },
    })

    const admins = await prisma.user.findMany({ where: { role: 'super_admin' } })
    for (const admin of admins) {
      try {
        await sendNotification({
          userId: admin.id,
          type: 'SYSTEM',
          title: '환불 요청이 접수됐어요',
          message: `${brand.brandName ?? brand.companyName}에서 ₩${Number(payment.amount).toLocaleString()} 환불을 요청했어요.`,
        })
      } catch {
        // 알림 실패는 주요 로직에 영향 주지 않음
      }
    }

    return NextResponse.json({
      ok: true,
      message: '환불 요청이 접수됐어요. 영업일 기준 2일 이내 검토 후 연락드려요.',
    })
  } catch (error: unknown) {
    console.error('[billing/refund-request]', error)
    return NextResponse.json({ error: '환불 요청 중 오류가 발생했어요' }, { status: 500 })
  }
}
