'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { loadTossPayments } from '@tosspayments/tosspayments-sdk'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface OrderData {
  orderId: string
  orderName: string
  amount: number
  customerName: string
  customerEmail: string
  brandId: string
}

export function CheckoutClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const purpose = searchParams.get('purpose')
  const billingCycle = searchParams.get('cycle')
  const chargeAmount = searchParams.get('amount')

  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    async function setup() {
      try {
        const res = await fetch('/api/billing/prepare', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            purpose,
            billingCycle: billingCycle || undefined,
            chargeAmount: chargeAmount ? Number(chargeAmount) : undefined,
          }),
        })
        const order = await res.json()
        if (!res.ok) throw new Error(order.error)
        setOrderData(order)
      } catch (error: unknown) {
        toast.error(
          error instanceof Error ? error.message : '결제 준비에 실패했어요'
        )
        router.push('/ko/brand/pricing')
      } finally {
        setLoading(false)
      }
    }
    setup()
  }, [purpose, billingCycle, chargeAmount, router])

  const handlePayment = async () => {
    if (!orderData) return

    const clientKey = process.env.NEXT_PUBLIC_TOSS_PAYMENTS_BILLING_CLIENT_KEY
    if (!clientKey) {
      toast.error('결제 설정이 완료되지 않았어요')
      return
    }

    setProcessing(true)
    try {
      const tossPayments = await loadTossPayments(clientKey)
      const payment = tossPayments.payment({
        customerKey: `brand_${orderData.brandId}`,
      })

      await payment.requestPayment({
        method: 'CARD',
        amount: { currency: 'KRW', value: orderData.amount },
        orderId: orderData.orderId,
        orderName: orderData.orderName,
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail,
        successUrl: `${window.location.origin}/ko/brand/billing/success`,
        failUrl: `${window.location.origin}/ko/brand/billing/fail`,
        card: {
          useEscrow: false,
          flowMode: 'DEFAULT',
          useCardPoint: false,
          useAppCardOnly: false,
        },
      })
    } catch (error: unknown) {
      console.error(error)
      toast.error(
        error instanceof Error ? error.message : '결제를 시작할 수 없어요'
      )
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }
  if (!orderData) return null

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold mb-2">{orderData.orderName}</h1>
      <p className="text-muted-foreground mb-8">
        결제 금액을 확인하고 결제를 진행해주세요.
      </p>

      <div className="border rounded-lg p-6 mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-muted-foreground">상품</span>
          <span>{orderData.orderName}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-muted-foreground">결제 수단</span>
          <span>신용/체크카드</span>
        </div>
        <div className="border-t mt-4 pt-4 flex justify-between items-center">
          <span className="font-medium">총 결제 금액</span>
          <span className="text-2xl font-bold">
            ₩{orderData.amount.toLocaleString()}
          </span>
        </div>
      </div>

      <Button
        onClick={handlePayment}
        className="w-full"
        size="lg"
        disabled={processing}
      >
        {processing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            결제창을 여는 중...
          </>
        ) : (
          '결제하기'
        )}
      </Button>

      <p className="text-xs text-muted-foreground mt-4 text-center">
        결제 후 7일 이내 사용 기록이 없다면 전액 환불해드려요.
      </p>
    </div>
  )
}
