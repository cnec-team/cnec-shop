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
    { icon: <Heart className="w-4 h-4 text-rose-500" />, label: '피드 좋아요', value: data.avgFeedLikes },
    { icon: <Play className="w-4 h-4 text-blue-500" />, label: '릴스 조회수', value: data.avgReelsViews },
    { icon: <ThumbsUp className="w-4 h-4 text-green-500" />, label: '릴스 좋아요', value: data.avgReelsLikes },
    { icon: <MessageCircle className="w-4 h-4 text-amber-500" />, label: '댓글 수', value: data.avgFeedComments ?? data.avgComments ?? 0 },
  ]

  const daysSince = data.lastSyncedAt
    ? Math.floor((Date.now() - new Date(data.lastSyncedAt).getTime()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <Card className="p-6 rounded-xl border-stone-200">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold text-stone-900">콘텐츠 성과</h3>
        <div className="flex items-center gap-1.5 text-xs text-stone-500">
          <RefreshCw className="w-3 h-3" />
          {daysSince !== null ? `${daysSince}일 전 동기화` : '동기화 대기'}
          {data.dataSource !== 'Phase 1 추정' && (
            <span className="ml-1 text-green-600 font-medium">실제 데이터</span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map(item => (
          <div key={item.label} className="text-center">
            <div className="flex items-center justify-center mb-2">{item.icon}</div>
            <p className="text-xl font-bold text-stone-900 tabular-nums">{formatNum(item.value)}</p>
            <p className="text-xs text-stone-500 mt-1">{item.label}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}
