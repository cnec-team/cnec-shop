'use client'

import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  totalCreatorCount: number
  onRefresh: () => void
}

export function HeroHeader({ totalCreatorCount, onRefresh }: Props) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-blue-500">
          <Sparkles className="w-3.5 h-3.5" strokeWidth={2.5} />
          Beauty Creator Network
        </div>
        <h1 className="text-[28px] leading-[36px] font-bold text-stone-900">
          우리 브랜드의 다음 캠페인을 만들 사람
        </h1>
        <p className="text-sm text-stone-600">
          검증된 뷰티 크리에이터{' '}
          <span className="font-semibold text-stone-900 tabular-nums">
            {totalCreatorCount.toLocaleString()}
          </span>
          명을 AI가 적합도 순으로 정렬했어요
        </p>
      </div>
      <Button variant="outline" onClick={onRefresh} className="gap-2 rounded-full">
        <Sparkles className="w-4 h-4" />
        AI 추천 다시 받기
      </Button>
    </div>
  )
}
