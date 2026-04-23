'use client'

import { Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { PLAN_CONFIGS, type BillingCycle, type PlanTier } from './types'

interface PricingCardsProps {
  billingCycle: BillingCycle
  currentTier?: PlanTier
}

function formatPrice(n: number) {
  return `₩${n.toLocaleString('ko-KR')}`
}

const priceMotion = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.2 },
}

function PriceDisplay({ tier, billingCycle }: { tier: PlanTier; billingCycle: BillingCycle }) {
  const config = PLAN_CONFIGS[tier]
  const isDark = tier === 'pro'
  const mutedClass = isDark ? 'text-slate-400' : 'text-muted-foreground'

  if (tier === 'trial') {
    return (
      <div>
        <span className="text-[48px] font-bold tabular-nums leading-none" aria-label="무료">
          {formatPrice(0)}
        </span>
        <span className={cn('ml-2 text-base', mutedClass)}>/3일</span>
      </div>
    )
  }

  if (tier === 'standard') {
    return (
      <div>
        <span className="text-[48px] font-bold tabular-nums leading-none" aria-label="월 99,000원">
          {formatPrice(99000)}
        </span>
        <span className={cn('ml-2 text-base', mutedClass)}>/월</span>
      </div>
    )
  }

  const isAnnual = billingCycle === 'annual'
  const monthlyPrice = isAnnual ? config.priceAnnualMonthly! : config.priceMonthly

  return (
    <AnimatePresence mode="wait">
      <motion.div key={billingCycle} {...priceMotion}>
        <div>
          <span
            className="text-[48px] font-bold tabular-nums leading-none"
            aria-label={`월 ${monthlyPrice.toLocaleString('ko-KR')}원`}
          >
            {formatPrice(monthlyPrice)}
          </span>
          <span className={cn('ml-2 text-base', mutedClass)}>/월</span>
        </div>
        {isAnnual && (
          <div className={cn('mt-2 text-sm', mutedClass)}>
            <span className="line-through mr-2">{formatPrice(config.priceAnnualOriginal!)}</span>
            연 {formatPrice(config.priceAnnualTotal!)} · 2개월 무료
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

function PricingCard({
  tier,
  billingCycle,
  highlighted,
  isCurrentTier,
}: {
  tier: PlanTier
  billingCycle: BillingCycle
  highlighted?: boolean
  isCurrentTier?: boolean
}) {
  const router = useRouter()
  const config = PLAN_CONFIGS[tier]
  const isDark = tier === 'pro'
  const isAnnual = billingCycle === 'annual'

  function handleClick() {
    if (tier === 'trial') {
      toast.info('체험은 브랜드 승인 시 자동으로 시작돼요')
      return
    }
    if (tier === 'standard') {
      router.push('/brand/billing/checkout?purpose=STANDARD_SUBSCRIPTION')
    } else if (tier === 'pro') {
      const cycle = isAnnual ? 'ANNUAL' : 'MONTHLY'
      router.push(`/brand/billing/checkout?purpose=PRO_SUBSCRIPTION&cycle=${cycle}`)
    }
  }

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-2xl p-8 transition-all duration-200',
        isDark
          ? 'bg-slate-900 text-white border border-slate-800'
          : 'bg-card border shadow-sm',
        highlighted && !isDark && 'border-2 border-primary',
        !highlighted && !isDark && 'border-border',
        !isCurrentTier && 'hover:shadow-md'
      )}
    >
      {highlighted && !isDark && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground rounded-full px-4 py-1 text-xs font-medium">
          가장 인기
        </Badge>
      )}

      {isDark && isAnnual && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-900 rounded-full px-4 py-1 text-xs font-medium">
          20% 할인 중
        </Badge>
      )}

      <h3 className={cn('text-xl font-semibold', isDark && 'text-white')}>
        {config.name}
      </h3>
      <p className={cn('mt-1 text-sm', isDark ? 'text-slate-400' : 'text-muted-foreground')}>
        {config.description}
      </p>

      <div className="mt-6 mb-6">
        <PriceDisplay tier={tier} billingCycle={billingCycle} />
      </div>

      <div className={cn('border-t mb-6', isDark ? 'border-slate-800' : 'border-border')} />

      <ul className="space-y-3 flex-1 mb-8">
        {config.features.map((feature) => (
          <li key={feature.label} className="flex items-start gap-2.5 text-sm">
            <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" aria-label="포함" />
            <span
              className={cn(
                feature.emphasis && 'font-semibold',
                isDark ? 'text-slate-200' : 'text-foreground'
              )}
            >
              {feature.label}
            </span>
          </li>
        ))}
      </ul>

      {isCurrentTier ? (
        <Button
          disabled
          className="w-full h-12 rounded-xl text-base font-semibold bg-muted text-muted-foreground"
        >
          현재 이용 중
        </Button>
      ) : isDark ? (
        <Button
          onClick={handleClick}
          className="w-full h-12 rounded-xl text-base font-semibold bg-white text-slate-900 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
        >
          {config.ctaLabel}
        </Button>
      ) : (
        <Button
          variant={highlighted ? 'default' : 'outline'}
          onClick={handleClick}
          className="w-full h-12 rounded-xl text-base font-semibold focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {config.ctaLabel}
        </Button>
      )}
    </div>
  )
}

export function PricingCards({ billingCycle, currentTier }: PricingCardsProps) {
  return (
    <section className="pb-16 md:pb-24">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-stretch">
        <PricingCard tier="trial" billingCycle={billingCycle} isCurrentTier={currentTier === 'trial'} />
        <PricingCard
          tier="standard"
          billingCycle={billingCycle}
          highlighted
          isCurrentTier={currentTier === 'standard'}
        />
        <PricingCard tier="pro" billingCycle={billingCycle} isCurrentTier={currentTier === 'pro'} />
      </div>
    </section>
  )
}
