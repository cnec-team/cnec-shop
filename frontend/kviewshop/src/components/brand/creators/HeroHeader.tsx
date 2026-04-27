'use client'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  totalCreatorCount: number
  onRefresh: () => void
}

export function HeroHeader({ totalCreatorCount, onRefresh }: Props) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-[12px] font-bold text-blue-600">
          <Sparkles className="w-3.5 h-3.5" strokeWidth={2.5} />
          AI 크리에이터 매칭
        </div>
        <h1 className="text-[34px] leading-[42px] md:text-[40px] md:leading-[48px] font-extrabold tracking-tight text-stone-900">
          이번 캠페인에 딱 맞는 <br className="hidden md:block" />
          크리에이터를 찾아보세요
        </h1>
        <p className="text-[15px] md:text-[16px] text-stone-600 leading-relaxed">
          검증된 뷰티 크리에이터{' '}
          <span className="font-bold text-stone-900 tabular-nums">
            {totalCreatorCount.toLocaleString()}
          </span>
          명을 AI가 우리 브랜드에 맞는 순서로 정렬해 줬어요
        </p>
      </div>
      <Button
        onClick={onRefresh}
        className="gap-2 h-11 px-5 rounded-full bg-stone-900 text-white text-[14px] font-semibold hover:bg-stone-800 shadow-sm"
      >
        <Sparkles className="w-4 h-4" />
        AI 추천 다시 받기
      </Button>
    </div>
  )
}
