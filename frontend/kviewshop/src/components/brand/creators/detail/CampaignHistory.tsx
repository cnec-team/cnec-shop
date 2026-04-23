'use client'

import Link from 'next/link'
import { CalendarDays, ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function CampaignHistory({ history, creatorName, creatorId }: { history: any[]; creatorName: string; creatorId: string }) {
  return (
    <Card className="p-6 rounded-xl border-stone-200">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold text-stone-900">크넥 캠페인 이력</h3>
        {history.length > 0 && (
          <span className="text-sm text-stone-500 tabular-nums">총 {history.length}건</span>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-8">
          <CalendarDays className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <p className="text-sm text-stone-600 mb-1">{creatorName} 님과의 캠페인 이력이 없어요</p>
          <p className="text-xs text-stone-500 mb-5">첫 공동구매를 제안해 보세요. 평균 응답률은 68%로 높은 편이에요.</p>
          <div className="flex items-center justify-center gap-2">
            <Button asChild size="sm" className="rounded-lg gap-1.5">
              <Link href={`/brand/creators/${creatorId}?action=propose`}>
                공동구매 제안하기
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((h: any) => (
            <div key={h.id} className="flex items-center justify-between py-3 border-b border-stone-100 last:border-0">
              <div>
                <p className="text-sm font-medium text-stone-900">{h.title}</p>
                <p className="text-xs text-stone-500">{formatDate(h.startAt)} ~ {formatDate(h.endAt)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-stone-900 tabular-nums">
                  {h.totalSales > 0 ? `₩${h.totalSales.toLocaleString()}` : '—'}
                </p>
                <p className="text-xs text-stone-500 tabular-nums">{h.orders}건</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
