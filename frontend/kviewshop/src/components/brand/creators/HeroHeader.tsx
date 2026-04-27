'use client'

import { useState } from 'react'
import { Sparkles, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface Props {
  totalCreatorCount: number
  onRefresh: () => void
}

export function HeroHeader({ totalCreatorCount, onRefresh }: Props) {
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      onRefresh()
      toast.success('AI 추천을 새로고침했어요')
    } finally {
      setTimeout(() => setRefreshing(false), 1500)
    }
  }

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-blue-500">
          <Sparkles className="w-3.5 h-3.5" strokeWidth={2.5} />
          AI 크리에이터 매칭
        </div>
        <h1 className="text-[28px] leading-[36px] font-bold text-stone-900">
          이번 캠페인에 딱 맞는<br />
          크리에이터를 찾아보세요
        </h1>
        <p className="text-sm text-stone-600">
          검증된 뷰티 크리에이터{' '}
          <span className="font-semibold text-stone-900 tabular-nums">
            {totalCreatorCount.toLocaleString()}
          </span>
          명을 AI가 우리 브랜드에 맞는 순서로 정렬해 찾았어요
        </p>
      </div>
      <Button
        onClick={handleRefresh}
        disabled={refreshing}
        className="gap-2 rounded-full bg-stone-900 text-white hover:bg-stone-800"
      >
        {refreshing ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
        {refreshing ? '새로고침 중...' : 'AI 추천 다시 받기'}
      </Button>
    </div>
  )
}
