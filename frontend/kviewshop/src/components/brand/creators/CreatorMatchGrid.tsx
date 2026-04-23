'use client'

import { Search, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CreatorMatchCard } from './CreatorMatchCard'

interface Props {
  creators: any[]
  totalAllCount: number
  totalFilteredCount: number
  selectedIds: string[]
  onToggleSelect: (id: string) => void
  onResetFilters: () => void
}

export function CreatorMatchGrid({
  creators,
  totalAllCount,
  totalFilteredCount,
  selectedIds,
  onToggleSelect,
  onResetFilters,
}: Props) {
  if (totalAllCount === 0) {
    return (
      <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-12 text-center">
        <p className="text-lg font-semibold text-stone-900 mb-2">아직 등록된 크리에이터가 없어요</p>
        <p className="text-sm text-stone-600">크리에이터 데이터가 곧 연동될 예정이에요</p>
      </div>
    )
  }

  if (totalFilteredCount === 0) {
    return (
      <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-12 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white border border-stone-200 mb-4">
          <Search className="w-5 h-5 text-stone-500" />
        </div>
        <p className="text-lg font-semibold text-stone-900 mb-2">조건에 맞는 크리에이터가 없어요</p>
        <p className="text-sm text-stone-600 mb-5">다른 필터를 시도해보세요</p>
        <Button onClick={onResetFilters} variant="outline" className="gap-2">
          <RotateCcw className="w-4 h-4" />
          필터 초기화
        </Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {creators.map((c: any) => (
        <CreatorMatchCard
          key={c.id}
          creator={c}
          selected={selectedIds.includes(c.id)}
          onToggleSelect={() => onToggleSelect(c.id)}
        />
      ))}
    </div>
  )
}
