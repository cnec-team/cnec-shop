'use client'

import { Heart, Play, ThumbsUp, MessageCircle, RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/card'

function formatNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

export function ContentPerformance({ data }: { data: any }) {
  const items = [
    { icon: <Heart className="w-4 h-4 text-stone-500" />, label: '피드 좋아요', value: data.avgFeedLikes, valueColor: 'text-stone-900' },
    { icon: <Play className="w-4 h-4 text-stone-500" />, label: '릴스 조회수', value: data.avgReelsViews, valueColor: 'text-blue-500' },
    { icon: <ThumbsUp className="w-4 h-4 text-stone-500" />, label: '릴스 좋아요', value: data.avgReelsLikes, valueColor: 'text-stone-900' },
    { icon: <MessageCircle className="w-4 h-4 text-stone-500" />, label: '댓글 수', value: data.avgFeedComments ?? data.avgComments ?? 0, valueColor: 'text-stone-900' },
  ]

  const daysSince = data.lastSyncedAt
    ? Math.floor((Date.now() - new Date(data.lastSyncedAt).getTime()) / (1000 * 60 * 60 * 24))
    : null

  const syncDate = data.lastSyncedAt ? (() => {
    const d = new Date(data.lastSyncedAt)
    return `${String(d.getFullYear()).slice(2)}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
  })() : null

  return (
    <Card className="p-6 rounded-xl border-stone-200">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-semibold text-stone-900">콘텐츠 성과</h3>
          <p className="text-xs text-stone-500 mt-0.5">최근 30일 평균 게시물 기준</p>
        </div>
        <span className="text-xs text-stone-500">
          Last sync · {daysSince !== null ? `${daysSince}일 전` : '대기'}{syncDate ? ` (${syncDate})` : ''}
        </span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map(item => (
          <div key={item.label}>
            <div className="flex items-center gap-1.5 mb-1.5">
              {item.icon}
              <span className="text-xs text-stone-500">{item.label}</span>
            </div>
            <p className={`text-xl font-bold tabular-nums ${item.valueColor}`}>{formatNum(item.value)}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}
