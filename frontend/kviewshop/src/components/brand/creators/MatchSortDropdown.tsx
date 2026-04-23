'use client'

import { ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const SORT_OPTIONS = [
  { value: 'matchScore', label: 'AI 적합도순' },
  { value: 'followers', label: '팔로워순' },
  { value: 'engagement', label: '참여율순' },
  { value: 'recent', label: '최근 업로드순' },
]

interface Props {
  value: string
  onChange: (v: string) => void
}

export function MatchSortDropdown({ value, onChange }: Props) {
  const current = SORT_OPTIONS.find(o => o.value === value)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 rounded-lg text-sm">
          <ArrowUpDown className="w-3.5 h-3.5" />
          {current?.label ?? '정렬'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {SORT_OPTIONS.map(opt => (
          <DropdownMenuItem key={opt.value} onClick={() => onChange(opt.value)}>
            {opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
