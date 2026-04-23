'use client'

import { Card } from '@/components/ui/card'

function formatKrw(n: number) {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억원`
  if (n >= 10_000) return `${Math.round(n / 10_000)}만원`
  return `${n.toLocaleString()}원`
}

export function EstimatedCostCard({ matchScore, tier }: { matchScore: any; tier: string | null }) {
  const adCost = Number(matchScore.estimatedAdCost)
  const cpm = matchScore.estimatedCpm
  const reach = matchScore.expectedReach
  const cpc = reach > 0 ? Math.round(adCost / Math.max(1, reach * 0.03)) : 0

  return (
    <Card className="p-6 rounded-xl border-stone-200">
      <h3 className="text-lg font-semibold text-stone-900 mb-5">예상 비용 · 성과</h3>
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="text-center">
          <p className="text-xs text-stone-500 mb-1">예상 CPC</p>
          <p className="text-xl font-bold text-stone-900 tabular-nums">{formatKrw(cpc)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-stone-500 mb-1">예상 광고비</p>
          <p className="text-xl font-bold text-stone-900 tabular-nums">{formatKrw(adCost)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-stone-500 mb-1">예상 CPM</p>
          <p className="text-xl font-bold text-stone-900 tabular-nums">{cpm.toLocaleString()}원</p>
        </div>
      </div>
      <div className="border-t border-stone-100 pt-4">
        <p className="text-sm text-stone-600 mb-2">공정가 밴드</p>
        <div className="relative h-3 rounded-full bg-stone-100 overflow-hidden">
          <div className="absolute left-[20%] right-[20%] h-full bg-green-100 rounded-full" />
          <div className="absolute h-full w-1 bg-green-500 rounded-full" style={{ left: `${Math.min(90, Math.max(10, matchScore.costEfficiency))}%` }} />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-stone-500">
          <span>저가</span>
          <span className="font-medium text-stone-700">동급 {tier ?? 'MICRO'} 평균 추정</span>
          <span>고가</span>
        </div>
      </div>
    </Card>
  )
}
