'use client'

import { Sparkles, FileText, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

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

  // 공정가 밴드 계산
  const avgCost = tier === 'MEGA' ? 350000 : tier === 'MACRO' ? 250000 : 150000
  const costRatio = avgCost > 0 ? Math.round(((adCost - avgCost) / avgCost) * 100) : 0
  const bandMin = Math.round(avgCost * 0.8)
  const bandMax = Math.round(avgCost * 1.2)
  const bandPosition = Math.min(90, Math.max(10, matchScore.costEfficiency))

  const metrics = [
    { icon: <Sparkles className="w-4 h-4 text-stone-500" />, label: '예상 CPC', value: formatKrw(cpc), sub: '클릭당 비용' },
    { icon: <FileText className="w-4 h-4 text-stone-500" />, label: '예상 광고비', value: formatKrw(adCost), sub: '단일 캠페인 기준' },
    { icon: <TrendingUp className="w-4 h-4 text-stone-500" />, label: '예상 CPM', value: `${cpm.toLocaleString()}원`, sub: '1,000회 노출당' },
  ]

  return (
    <Card className="p-6 rounded-xl border-stone-200">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-lg font-semibold text-stone-900">예상 비용 · 성과</h3>
        <Button variant="ghost" size="sm" className="text-xs text-stone-500">
          정밀 분석
        </Button>
      </div>
      <p className="text-xs text-stone-500 mb-5">과거 협업 데이터 기반 시뮬레이션</p>

      <div className="grid grid-cols-3 gap-4 mb-5">
        {metrics.map(m => (
          <div key={m.label}>
            <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-stone-100 mb-2">
              {m.icon}
            </div>
            <p className="text-xs text-stone-500 mb-0.5">{m.label}</p>
            <p className="text-xl font-bold text-stone-900 tabular-nums">{m.value}</p>
            <p className="text-[10px] text-stone-400 mt-0.5">{m.sub}</p>
          </div>
        ))}
      </div>

      <div className="border-t border-stone-100 pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-stone-700">공정가 밴드</span>
            {costRatio > 0 && (
              <span className="text-[10px] font-medium text-green-700 bg-green-50 rounded-full px-2 py-0.5">
                평균 이상 +{costRatio}%
              </span>
            )}
          </div>
          <span className="text-xs text-stone-500">동급 평균 추정 {formatKrw(avgCost)}</span>
        </div>
        <div className="relative h-3 rounded-full bg-stone-100 overflow-hidden">
          <div className="absolute left-[20%] right-[20%] h-full bg-blue-100 rounded-full" />
          <div className="absolute h-full w-1 bg-blue-500 rounded-full" style={{ left: `${bandPosition}%` }} />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-stone-500 tabular-nums">
          <span>{formatKrw(bandMin)}</span>
          <span>{formatKrw(bandMax)}</span>
        </div>
      </div>
    </Card>
  )
}
