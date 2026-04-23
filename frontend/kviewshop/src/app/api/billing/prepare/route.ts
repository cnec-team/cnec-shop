import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { generateOrderId } from '@/lib/toss/order-id'
import { resolveCustomerName } from '@/lib/toss/customer'
import { PRICING_V3 } from '@/lib/pricing/v3/constants'
import { subMinutes } from 'date-fns'

const VALID_CHARGE_AMOUNTS = [50_000, 100_000, 300_000, 500_000]

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: '로그인이 필요해요' }, { status: 401 })

    const brand = await prisma.brand.findUnique({ where: { userId: user.id } })
    if (!brand) return NextResponse.json({ error: '브랜드를 찾을 수 없어요' }, { status: 404 })

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { name: true, email: true },
    })
    if (!fullUser) return NextResponse.json({ error: '사용자 정보가 없어요' }, { status: 404 })

    const body = await req.json()
    const { purpose, billingCycle, chargeAmount } = body

    let amount: number
    let orderName: string
    let orderIdPrefix: 'PRO_SUB' | 'STD_SUB' | 'STD_CHG'

    if (purpose === 'PRO_SUBSCRIPTION') {
      if (billingCycle === 'MONTHLY') {
        amount = PRICING_V3.PRO.MONTHLY_FEE
        orderName = '크넥샵 프로 월간 구독'
      } else if (billingCycle === 'ANNUAL') {
        amount = PRICING_V3.PRO.ANNUAL_FEE
        orderName = '크넥샵 프로 연간 구독'
      } else {
        return NextResponse.json({ error: '결제 주기를 선택해주세요' }, { status: 400 })
      }
      orderIdPrefix = 'PRO_SUB'
    } else if (purpose === 'STANDARD_SUBSCRIPTION') {
      amount = PRICING_V3.STANDARD.MONTHLY_FEE
      orderName = '크넥샵 스탠다드 월간 구독'
      orderIdPrefix = 'STD_SUB'
    } else if (purpose === 'STANDARD_CHARGE') {
      if (!VALID_CHARGE_AMOUNTS.includes(Number(chargeAmount))) {
        return NextResponse.json({ error: '충전 금액이 올바르지 않아요' }, { status: 400 })
      }
      amount = Number(chargeAmount)
      orderName = `크넥샵 스탠다드 충전 ₩${amount.toLocaleString()}`
      orderIdPrefix = 'STD_CHG'
    } else {
      return NextResponse.json({ error: '잘못된 결제 요청이에요' }, { status: 400 })
    }

    // 중복 결제 방지: 최근 10분 PENDING 재사용
    const recentPending = await prisma.billingPayment.findFirst({
      where: {
        brandId: brand.id,
        purpose,
        status: 'PENDING',
        amount,
        ...(purpose === 'PRO_SUBSCRIPTION' && billingCycle ? { billingCycle } : {}),
        requestedAt: { gte: subMinutes(new Date(), 10) },
      },
      orderBy: { requestedAt: 'desc' },
    })

    let payment = recentPending

    if (!payment) {
      const subscription = await prisma.brandSubscription.findUnique({
        where: { brandId: brand.id },
      })

      const orderId = generateOrderId({ purpose: orderIdPrefix, brandId: brand.id })

      payment = await prisma.billingPayment.create({
        data: {
          brandId: brand.id,
          subscriptionId: subscription?.id ?? null,
          purpose,
          targetPlan: purpose === 'PRO_SUBSCRIPTION' ? 'PRO' : null,
          billingCycle: billingCycle ?? null,
          amount,
          orderId,
          orderName,
          status: 'PENDING',
        },
      })
    }

    const customerName = resolveCustomerName(brand, fullUser)

    return NextResponse.json({
      orderId: payment.orderId,
      orderName: payment.orderName,
      amount: Number(payment.amount),
      customerName,
      customerEmail: fullUser.email,
      brandId: brand.id,
    })
  } catch (error: unknown) {
    console.error('[billing/prepare]', error)
    return NextResponse.json({ error: '결제 준비 중 오류가 발생했어요' }, { status: 500 })
  }
}
