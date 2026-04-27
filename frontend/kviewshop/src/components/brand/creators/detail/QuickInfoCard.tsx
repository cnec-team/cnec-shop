'use client'

import { Card } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { HelpCircle } from 'lucide-react'

export function QuickInfoCard({ creator }: { creator: any }) {
  const rows = [
    {
      label: '선호 카테고리',
      value: creator.igCategory ?? '—',
      tooltip: '인스타그램 비즈니스 계정에 등록된 카테고리. 뷰티·패션·라이프스타일 등.',
    },
    {
      label: '언어',
      value: creator.igPrimaryLanguage || creator.igLanguage || '한국어',
      tooltip: '크리에이터의 주 콘텐츠 언어. 타겟 시장에 맞는 크리에이터 선택에 참고하세요.',
    },
    {
      label: '데이터 기준일',
      value: creator.igDataImportedAt
        ? `${Math.floor((Date.now() - new Date(creator.igDataImportedAt).getTime()) / (1000 * 60 * 60 * 24))}일 전`
        : '—',
      tooltip: '인스타그램 데이터를 마지막으로 수집한 날짜. 오래될수록 현재 수치와 차이가 있을 수 있어요.',
    },
    {
      label: '주 시청자',
      value: creator.igAudienceGender && creator.igAudienceAge
        ? `${creator.igAudienceGender} · ${creator.igAudienceAge}`
        : '데이터 없음',
      tooltip: '이 크리에이터의 팔로워 중 가장 높은 비율을 차지하는 성별·연령대.',
    },
    {
      label: '팔로잉',
      value: creator.igFollowing?.toLocaleString() ?? '—',
      tooltip: '크리에이터가 팔로우하는 계정 수. 팔로워 대비 팔로잉이 낮으면 영향력이 높은 편이에요.',
    },
    {
      label: '게시물',
      value: creator.igPostsCount?.toLocaleString() ?? '—',
      tooltip: '인스타그램에 게시한 총 피드·릴스 수.',
    },
    {
      label: '크넥 협업',
      value: creator.cnecCompletedPayments > 0 ? `${creator.cnecCompletedPayments}회 완료` : '신규',
      tooltip: '크넥 플랫폼을 통해 브랜드와 협업을 완료한 횟수. 많을수록 경험이 풍부한 크리에이터예요.',
    },
  ]

  return (
    <TooltipProvider delayDuration={200}>
      <Card className="p-5 rounded-xl border-stone-200">
        <h3 className="text-lg font-semibold text-stone-900 mb-4">빠른 정보</h3>
        <dl className="space-y-3">
          {rows.map(row => (
            <div key={row.label} className="flex items-center justify-between text-sm">
              <dt className="flex items-center gap-1 text-stone-500">
                {row.label}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-3 h-3 text-stone-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-[240px] text-xs">
                    {row.tooltip}
                  </TooltipContent>
                </Tooltip>
              </dt>
              <dd className="font-semibold text-stone-900 tabular-nums">{row.value}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </TooltipProvider>
  )
}
