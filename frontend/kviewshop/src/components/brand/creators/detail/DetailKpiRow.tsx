'use client'

import { Users, ShieldCheck, TrendingUp, Activity } from 'lucide-react'
import { Card } from '@/components/ui/card'

function formatFollowers(n: number | null) {
  if (!n) return '0'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

export function DetailKpiRow({ creator, expectedReach }: { creator: any; expectedReach: number }) {
  const effectiveFollowers = creator.igValidFollowers ?? (creator.igFollowers ? Math.round(creator.igFollowers * 0.587) : null)
  const er = creator.igEngagementRate ? (creator.igEngagementRate * 100) : null

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiTile icon={<Users className="w-4 h-4" />} label="팔로워" value={formatFollowers(creator.igFollowers)} iconBg="bg-stone-100" iconColor="text-stone-600" />
      <KpiTile icon={<ShieldCheck className="w-4 h-4" />} label="유효 팔로워" value={effectiveFollowers ? formatFollowers(effectiveFollowers) : '—'} sub={effectiveFollowers && creator.igFollowers ? `${((effectiveFollowers / creator.igFollowers) * 100).toFixed(1)}% 진성` : ''} iconBg="bg-blue-50" iconColor="text-blue-500" />
      <KpiTile icon={<TrendingUp className="w-4 h-4" />} label="ER · 참여율" value={er !== null ? `${er.toFixed(2)}%` : '—'} iconBg="bg-green-50" iconColor="text-green-500" />
      <KpiTile icon={<Activity className="w-4 h-4" />} label="평균 도달" value={formatFollowers(expectedReach)} sub={creator.igFollowers ? `팔로워 대비 ${((expectedReach / creator.igFollowers) * 100).toFixed(0)}%` : ''} iconBg="bg-amber-50" iconColor="text-amber-500" />
    </div>
  )
}

function KpiTile({ icon, label, value, sub, iconBg, iconColor }: { icon: React.ReactNode; label: string; value: string; sub?: string; iconBg: string; iconColor: string }) {
  return (
    <Card className="p-5 rounded-xl border-stone-200">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-stone-500">{label}</p>
        <div className={`rounded-full ${iconBg} p-2`}>
          <div className={iconColor}>{icon}</div>
        </div>
      </div>
      <p className="text-2xl font-bold text-stone-900 tabular-nums">{value}</p>
      {sub && <p className="text-xs text-stone-500 mt-1">{sub}</p>}
    </Card>
  )
}
