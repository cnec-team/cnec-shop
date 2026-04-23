'use client'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import type { BillingCycle } from './types'

interface BillingToggleProps {
  value: BillingCycle
  onChange: (value: BillingCycle) => void
}

export function BillingCycleToggle({ value, onChange }: BillingToggleProps) {
  return (
    <div className="flex items-center justify-center gap-3">
      <div role="tablist" className="inline-flex rounded-xl bg-muted p-1">
        <button
          role="tab"
          aria-selected={value === 'monthly'}
          onClick={() => onChange('monthly')}
          className={cn(
            'rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
            value === 'monthly'
              ? 'bg-white text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          월간
        </button>
        <button
          role="tab"
          aria-selected={value === 'annual'}
          onClick={() => onChange('annual')}
          className={cn(
            'rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
            value === 'annual'
              ? 'bg-white text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          연간
        </button>
      </div>
      {value === 'annual' && (
        <Badge className="bg-primary text-primary-foreground rounded-full px-3 py-1 text-xs font-medium">
          2개월 무료
        </Badge>
      )}
    </div>
  )
}
