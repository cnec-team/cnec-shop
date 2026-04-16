'use client'

import { LayoutGrid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ViewToggleProps {
  value: 'card' | 'list'
  onChange: (v: 'card' | 'list') => void
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div className="flex border rounded-lg overflow-hidden">
      <Button
        variant="ghost"
        size="sm"
        className={cn('rounded-none px-3', value === 'card' && 'bg-muted')}
        onClick={() => onChange('card')}
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn('rounded-none px-3', value === 'list' && 'bg-muted')}
        onClick={() => onChange('list')}
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  )
}
