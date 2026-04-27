'use client'

import { Sparkles, Clock, TrendingUp } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface Props {
  avgMatchScore: number
  recentUpdatedCount: number
  avgEr: number
}

export function KpiCards({ avgMatchScore, recentUpdatedCount, avgEr }: Props) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="p-5 rounded-xl border-stone-200 cursor-help">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-stone-500 mb-2">평균 AI 적합도</p>
                  <p className="text-[32px] leading-none font-bold text-stone-900 tabular-nums">
                    {avgMatchScore}<span className="text-lg font-bold ml-0.5">점</span>
                  </p>
                  <p className="text-xs text-stone-500 mt-2">현재 페이지 추천군 기준</p>
                </div>
                <div className="rounded-full bg-blue-50 p-2.5">
                  <Sparkles className="w-5 h-5 text-blue-500" strokeWidth={2} />
                </div>
              </div>
            </Card>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[260px] text-xs">
            현재 페이지에 표시된 크리에이터들의 AI 매칭 점수 평균. 시청자 정합·콘텐츠 품질·브랜드 톤·가성비를 종합한 점수예요.
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="p-5 rounded-xl border-stone-200 cursor-help">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-stone-500 mb-2">최근 7일 업로드</p>
                  <p className="text-[32px] leading-none font-bold text-stone-900 tabular-nums">
                    {recentUpdatedCount.toLocaleString()}<span className="text-lg font-bold ml-0.5">명</span>
                  </p>
                  <p className="text-xs text-stone-500 mt-2">지금 가장 활발한 그룹</p>
                </div>
                <div className="rounded-full bg-amber-50 p-2.5">
                  <Clock className="w-5 h-5 text-amber-500" strokeWidth={2} />
                </div>
              </div>
            </Card>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[260px] text-xs">
            최근 7일 내 인스타 데이터가 업데이트된 크리에이터 수. 이 그룹은 현재 활발히 활동 중이에요.
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="p-5 rounded-xl border-stone-200 cursor-help">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-stone-500 mb-2">평균 참여율 (ER)</p>
                  <p className="text-[32px] leading-none font-bold text-stone-900 tabular-nums">
                    {avgEr.toFixed(2)}<span className="text-lg font-bold ml-0.5">%</span>
                  </p>
                  <p className="text-xs text-stone-500 mt-2">K-뷰��� 평균 2.4% 대비</p>
                </div>
                <div className="rounded-full bg-green-50 p-2.5">
                  <TrendingUp className="w-5 h-5 text-green-500" strokeWidth={2} />
                </div>
              </div>
            </Card>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[260px] text-xs">
            현재 페이지 크리에이터들의 평균 참여율(ER). 좋아요+댓글÷팔로워 비율이며, K-뷰티 크리에이터 평균은 2.4%예요.
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
