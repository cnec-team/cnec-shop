'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import type { BillingCycle } from './types'

interface PlanCalculatorProps {
  billingCycle: BillingCycle
}

function calculateCosts(gongguCount: number, messageCount: number, billingCycle: BillingCycle) {
  const standardGongguOverage = Math.max(0, gongguCount - 3) * 30000
  const standardMessageOverage = Math.max(0, messageCount - 100) * 700
  const standardTotal = 99000 + standardGongguOverage + standardMessageOverage

  const proMonthlyPrice = billingCycle === 'annual' ? 264000 : 330000
  const proMessageOverage = Math.max(0, messageCount - 500) * 700
  const proTotal = proMonthlyPrice + proMessageOverage

  const recommended: 'standard' | 'pro' =
    proTotal <= standardTotal || gongguCount > 3 ? 'pro' : 'standard'

  return { standardTotal, proTotal, recommended }
}

function formatPrice(n: number) {
  return `₩${n.toLocaleString('ko-KR')}`
}

export function PlanCalculator({ billingCycle }: PlanCalculatorProps) {
  const [gongguCount, setGongguCount] = useState(3)
  const [messageCount, setMessageCount] = useState(100)

  const costs = useMemo(
    () => calculateCosts(gongguCount, messageCount, billingCycle),
    [gongguCount, messageCount, billingCycle]
  )

  const handleGongguChange = useCallback((values: number[]) => {
    setGongguCount(values[0])
  }, [])

  const handleMessageChange = useCallback((values: number[]) => {
    setMessageCount(values[0])
  }, [])

  const router = useRouter()

  function handleCTA() {
    if (costs.recommended === 'pro') {
      const cycle = billingCycle === 'annual' ? 'ANNUAL' : 'MONTHLY'
      router.push(`/brand/billing/checkout?purpose=PRO_SUBSCRIPTION&cycle=${cycle}`)
    } else {
      router.push('/brand/billing/checkout?purpose=STANDARD_SUBSCRIPTION')
    }
  }

  const recommendedName = costs.recommended === 'pro' ? '프로' : '스탠다드'
  const gongguExceeded = gongguCount > 3
  const proBase = billingCycle === 'annual' ? 264000 : 330000

  return (
    <div>
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-[32px] font-bold tracking-[-0.02em]">
          내게 맞는 플랜 찾기
        </h2>
        <p className="mt-3 text-muted-foreground">
          월 사용량을 조절하면 실제 비용을 계산해드려요
        </p>
      </div>

      <div className="space-y-8 mb-12 max-w-md mx-auto">
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm font-medium">월 공구 캠페인</label>
            <span className="text-sm font-semibold tabular-nums">{gongguCount}개</span>
          </div>
          <Slider value={[gongguCount]} onValueChange={handleGongguChange} min={0} max={20} step={1} />
          <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
            <span>0개</span>
            <span>20개</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm font-medium">월 메시지 발송</label>
            <span className="text-sm font-semibold tabular-nums">
              {messageCount.toLocaleString('ko-KR')}건
            </span>
          </div>
          <Slider value={[messageCount]} onValueChange={handleMessageChange} min={0} max={2000} step={10} />
          <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
            <span>0건</span>
            <span>2,000건</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border bg-card p-6 text-center opacity-60">
          <p className="text-sm font-medium text-muted-foreground mb-2">체험</p>
          <p className="text-lg font-semibold text-muted-foreground">3일 한정</p>
        </div>

        <div
          className={cn(
            'rounded-2xl border bg-card p-6 text-center transition-all duration-200',
            costs.recommended === 'standard' && 'ring-2 ring-primary',
            gongguExceeded && 'opacity-60'
          )}
        >
          <p className="text-sm font-medium text-muted-foreground mb-2">스탠다드</p>
          {gongguExceeded ? (
            <p className="text-sm text-muted-foreground">공구 3개/월 초과 시 개설 불가</p>
          ) : (
            <AnimatePresence mode="wait">
              <motion.p
                key={costs.standardTotal}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className="text-2xl font-bold tabular-nums"
              >
                {formatPrice(costs.standardTotal)}
              </motion.p>
            </AnimatePresence>
          )}
          {!gongguExceeded && costs.standardTotal > 99000 && (
            <p className="mt-1 text-xs text-muted-foreground">
              기본 ₩99,000 + 초과 {formatPrice(costs.standardTotal - 99000)}
            </p>
          )}
        </div>

        <div
          className={cn(
            'rounded-2xl border bg-card p-6 text-center transition-all duration-200',
            costs.recommended === 'pro' && 'ring-2 ring-primary'
          )}
        >
          <p className="text-sm font-medium text-muted-foreground mb-2">프로</p>
          <AnimatePresence mode="wait">
            <motion.p
              key={costs.proTotal}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="text-2xl font-bold tabular-nums"
            >
              {formatPrice(costs.proTotal)}
            </motion.p>
          </AnimatePresence>
          {costs.proTotal > proBase && (
            <p className="mt-1 text-xs text-muted-foreground">
              기본 {formatPrice(proBase)} + 초과 {formatPrice(costs.proTotal - proBase)}
            </p>
          )}
        </div>
      </div>

      <div className="mt-8 text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-4 py-2 text-sm font-medium">
          <Check className="h-4 w-4" />
          {recommendedName}가 가장 유리해요
        </div>
        <div>
          <Button
            onClick={handleCTA}
            className="h-12 px-8 rounded-xl text-base font-semibold focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {recommendedName}로 시작하기
          </Button>
        </div>
      </div>
    </div>
  )
}
