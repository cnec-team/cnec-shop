'use client'

import { Users, ShieldCheck, TrendingUp, Activity } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

function formatFollowers(n: number | null) {
  if (!n) return '0'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

export function DetailKpiRow({ creator, expectedReach }: { creator: any; expectedReach: number }) {
  const effectiveFollowers = creator.igValidFollowers ?? (creator.igFollowers ? Math.round(creator.igFollowers * 0.587) : null)
  const er = creator.igEngagementRate ? Number(creator.igEngagementRate) : null

  return (
    <TooltipProvider delayDuration={200}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile
          icon={<Users className="w-4 h-4" />}
          label="팔로워"
          value={formatFollowers(creator.igFollowers)}
          tooltip="인스타그램 총 팔로워 수. 봇·휴면 계정이 포함될 수 있어요."
          iconBg="bg-stone-100"
          iconColor="text-stone-600"
        />
        <KpiTile
          icon={<ShieldCheck className="w-4 h-4" />}
          label="유효 팔로워"
          value={effectiveFollowers ? formatFollowers(effectiveFollowers) : '—'}
          sub={effectiveFollowers && creator.igFollowers ? `${((effectiveFollowers / creator.igFollowers) * 100).toFixed(1)}% 진성` : ''}
          tooltip="봇·휴면 계정을 제외한 실제 활동하는 팔로워 수. '진성' 비율이 높을수록 광고 효과가 좋아요."
          iconBg="bg-blue-50"
          iconColor="text-blue-500"
        />
        <KpiTile
          icon={<TrendingUp className="w-4 h-4" />}
          label="참여율 (ER)"
          value={er !== null ? `${er.toFixed(2)}%` : '—'}
          tooltip="팔로워 대비 좋아요+댓글 비율. K-뷰티 크리에이터 평균은 2.4%이며, 높을수록 팬 충성도가 높아요."
          iconBg="bg-green-50"
          iconColor="text-green-500"
        />
        <KpiTile
          icon={<Activity className="w-4 h-4" />}
          label="평균 도달"
          value={formatFollowers(expectedReach)}
          sub={creator.igFollowers ? `팔로워 대비 ${((expectedReach / creator.igFollowers) * 100).toFixed(0)}%` : ''}
          tooltip="게시물 1개당 평균적으로 도달하는 사용자 수. 광고 캠페인 효과 예측에 사용돼요."
          iconBg="bg-amber-50"
          iconColor="text-amber-500"
        />
      </div>
    </TooltipProvider>
  )
}

function KpiTile({ icon, label, value, sub, tooltip, iconBg, iconColor }: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  tooltip: string
  iconBg: string
  iconColor: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Card className="p-5 rounded-xl border-stone-200 cursor-help">
          <div className="flex items-start justify-between mb-3">
            <p className="text-sm text-stone-500">{label}</p>
            <div className={`rounded-full ${iconBg} p-2`}>
              <div className={iconColor}>{icon}</div>
            </div>
          </div>
          <p className="text-2xl font-bold text-stone-900 tabular-nums">{value}</p>
          {sub && <p className="text-xs text-stone-500 mt-1">{sub}</p>}
        </Card>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[260px] text-xs">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  )
}
