'use client'

import { cn } from '@/lib/utils'

interface Props {
  value: 'QUARTERLY' | 'ANNUAL'
  onChange: (v: 'QUARTERLY' | 'ANNUAL') => void
}

export function BillingCycleToggle({ value, onChange }: Props) {
  return (
    <div className="flex bg-muted rounded-lg p-1 text-sm">
      <button
        onClick={() => onChange('QUARTERLY')}
        className={cn(
          'flex-1 py-2 px-3 rounded-md transition',
          value === 'QUARTERLY' ? 'bg-white shadow-sm font-medium' : 'text-muted-foreground'
        )}
      >
        3개월
      </button>
      <button
        onClick={() => onChange('ANNUAL')}
        className={cn(
          'flex-1 py-2 px-3 rounded-md transition',
          value === 'ANNUAL' ? 'bg-white shadow-sm font-medium' : 'text-muted-foreground'
        )}
      >
        1년 <span className="text-xs text-primary">-20%</span>
      </button>
    </div>
  )
}
