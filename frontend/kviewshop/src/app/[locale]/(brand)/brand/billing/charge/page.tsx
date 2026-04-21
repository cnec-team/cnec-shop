'use client'

import { useRouter, useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const AMOUNTS = [50_000, 100_000, 300_000, 500_000]

export default function ChargePage() {
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Link
        href={`/${locale}/brand/pricing`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        가격 페이지로
      </Link>

      <h1 className="text-2xl font-bold mb-2">잔액 충전</h1>
      <p className="text-muted-foreground mb-8">
        충전한 잔액은 공동구매 / 메시지 / 상세정보 사용 시 차감돼요.
      </p>

      <div className="grid grid-cols-2 gap-4">
        {AMOUNTS.map((amount) => (
          <Card
            key={amount}
            className="p-6 cursor-pointer hover:border-primary transition"
            onClick={() =>
              router.push(
                `/${locale}/brand/billing/checkout?purpose=STANDARD_CHARGE&amount=${amount}`
              )
            }
          >
            <div className="text-2xl font-bold">
              ₩{amount.toLocaleString()}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
