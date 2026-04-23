'use client'

import { Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface Props {
  matchScore: {
    audienceFit: number
    contentQuality: number
    brandTone: number
    costEfficiency: number
    totalScore: number
  }
}

function barColor(score: number) {
  if (score >= 75) return 'bg-green-500'
  if (score >= 60) return 'bg-blue-500'
  if (score >= 40) return 'bg-amber-500'
  return 'bg-stone-400'
}

export function AiMatchReport({ matchScore }: Props) {
  const items = [
    { label: '시청자 정합', value: matchScore.audienceFit },
    { label: '콘텐츠 품질', value: matchScore.contentQuality },
    { label: '브랜드 톤', value: matchScore.brandTone },
    { label: '가성비', value: matchScore.costEfficiency },
  ]
  const sorted = [...items].sort((a, b) => b.value - a.value)

  return (
    <Card className="p-6 rounded-xl border-stone-200">
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-blue-50 p-2.5">
            <Sparkles className="w-5 h-5 text-blue-500" strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-stone-900">AI 적합도 리포트</h3>
            <p className="text-sm text-stone-500 mt-0.5">우리 브랜드 프로필과 매칭해본 결과예요</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-stone-500">종합</span>
          <div className="flex items-center justify-center w-11 h-11 rounded-full border-2 border-green-500 text-green-600 font-bold text-sm tabular-nums">
            {matchScore.totalScore}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
        {items.map(item => (
          <div key={item.label} className="flex items-center gap-3">
            <span className="text-sm text-stone-600 w-20 shrink-0">{item.label}</span>
            <div className="flex-1 h-2 rounded-full bg-stone-100 overflow-hidden">
              <div className={`h-full ${barColor(item.value)} transition-all duration-700`} style={{ width: `${item.value}%` }} />
            </div>
            <span className="text-sm font-semibold text-stone-900 tabular-nums w-8 text-right">{item.value}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-stone-100">
        {sorted.slice(0, 3).map(item => (
          <span key={item.label} className="inline-flex items-center gap-1 rounded-full bg-stone-50 px-2.5 py-1 text-xs text-stone-700 font-medium">
            <Sparkles className="w-3 h-3 text-blue-500" />
            {item.label} {item.value}점
          </span>
        ))}
      </div>
    </Card>
  )
}
