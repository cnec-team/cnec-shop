'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  TrendingUp,
  DollarSign,
  Users,
  Megaphone,
  BarChart3,
  ArrowUpRight,
  Loader2,
  Target,
  ChevronRight,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { SafeImage } from '@/components/common/SafeImage'
import {
  getBrandROIDashboard,
  type BrandROIDashboardData,
  type CampaignROI,
  type CreatorPerformance,
} from '@/lib/actions/brand-analytics'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

function formatWon(amount: number): string {
  if (amount >= 100000000) return `${(amount / 100000000).toFixed(1)}억`
  if (amount >= 10000) return `${Math.floor(amount / 10000).toLocaleString()}만`
  return `${amount.toLocaleString()}원`
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ACTIVE: 'bg-emerald-50 text-emerald-700',
    RECRUITING: 'bg-blue-50 text-blue-700',
    ENDED: 'bg-gray-100 text-gray-500',
    DRAFT: 'bg-yellow-50 text-yellow-700',
    PAUSED: 'bg-orange-50 text-orange-700',
  }
  const labels: Record<string, string> = {
    ACTIVE: '진행중',
    RECRUITING: '모집중',
    ENDED: '종료',
    DRAFT: '준비중',
    PAUSED: '일시중지',
  }
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${styles[status] || 'bg-gray-100 text-gray-500'}`}>
      {labels[status] || status}
    </span>
  )
}

export default function BrandROIDashboardPage() {
  const params = useParams()
  const locale = params.locale as string

  const [data, setData] = useState<BrandROIDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'campaigns' | 'creators' | 'seeding'>('campaigns')

  useEffect(() => {
    getBrandROIDashboard()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (!data) {
    return <p className="text-center text-gray-400 py-20">데이터를 불러오지 못했어요</p>
  }

  const { summary, campaigns, topCreators, seedingFunnel, monthlyTrend } = data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold">ROI 분석</h1>
        <p className="text-sm text-muted-foreground mt-1">이번 달 캠페인 투자 대비 성과</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-emerald-50 rounded-lg p-1.5">
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </div>
            <span className="text-xs text-muted-foreground">이번 달 매출</span>
          </div>
          <p className="text-xl font-bold">{formatWon(summary.totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-blue-50 rounded-lg p-1.5">
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
            <span className="text-xs text-muted-foreground">ROAS</span>
          </div>
          <p className="text-xl font-bold">{summary.roas.toFixed(1)}x</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-violet-50 rounded-lg p-1.5">
              <Megaphone className="h-4 w-4 text-violet-600" />
            </div>
            <span className="text-xs text-muted-foreground">활성 캠페인</span>
          </div>
          <p className="text-xl font-bold">{summary.activeCampaigns}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-orange-50 rounded-lg p-1.5">
              <Users className="h-4 w-4 text-orange-600" />
            </div>
            <span className="text-xs text-muted-foreground">참여 크리에이터</span>
          </div>
          <p className="text-xl font-bold">{summary.activeCreators}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Campaign Revenue Bar Chart */}
        <div className="bg-white rounded-xl border p-4">
          <h3 className="text-sm font-semibold mb-4">캠페인별 매출</h3>
          {campaigns.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={campaigns.filter((c) => c.revenue > 0).slice(0, 6)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => formatWon(v)} fontSize={11} />
                <YAxis
                  type="category"
                  dataKey="title"
                  width={120}
                  fontSize={11}
                  tickFormatter={(v: string) => v.length > 12 ? v.slice(0, 12) + '...' : v}
                />
                <Tooltip formatter={(v) => [formatWon(Number(v)), '매출']} />
                <Bar dataKey="revenue" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-sm text-gray-400">
              매출 데이터가 없어요
            </div>
          )}
        </div>

        {/* Monthly Trend Line Chart */}
        <div className="bg-white rounded-xl border p-4">
          <h3 className="text-sm font-semibold mb-4">월별 매출 추이</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" fontSize={11} />
              <YAxis tickFormatter={(v) => formatWon(v)} fontSize={11} />
              <Tooltip formatter={(v) => [formatWon(Number(v)), '매출']} />
              <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="flex border-b">
          {[
            { key: 'campaigns' as const, label: '캠페인 성과' },
            { key: 'creators' as const, label: '크리에이터 성과' },
            { key: 'seeding' as const, label: '시딩 전환' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'text-gray-900 border-b-2 border-gray-900'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4">
          {/* Campaign Tab */}
          {activeTab === 'campaigns' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-400">
                    <th className="pb-3 font-medium">캠페인</th>
                    <th className="pb-3 font-medium text-right">매출</th>
                    <th className="pb-3 font-medium text-right">주문</th>
                    <th className="pb-3 font-medium text-right">객단가</th>
                    <th className="pb-3 font-medium text-right">크리에이터</th>
                    <th className="pb-3 font-medium">상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {campaigns.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="py-3">
                        <p className="font-medium text-gray-900 truncate max-w-[200px]">{c.title}</p>
                        <p className="text-xs text-gray-400">{c.type === 'GONGGU' ? '공구' : '상시'}</p>
                      </td>
                      <td className="py-3 text-right font-medium">{formatWon(c.revenue)}</td>
                      <td className="py-3 text-right">{c.orderCount}건</td>
                      <td className="py-3 text-right">{formatWon(c.avgOrderValue)}</td>
                      <td className="py-3 text-right">{c.creatorCount}명</td>
                      <td className="py-3"><StatusBadge status={c.status} /></td>
                    </tr>
                  ))}
                  {campaigns.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-400">
                        캠페인이 없어요
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Creator Tab */}
          {activeTab === 'creators' && (
            <div className="space-y-3">
              {topCreators.map((c, idx) => (
                <div key={c.creatorId} className="flex items-center gap-3 py-2">
                  <span className="text-sm font-bold text-gray-300 w-6 text-center">{idx + 1}</span>
                  <div className="w-9 h-9 rounded-full bg-gray-100 overflow-hidden shrink-0">
                    {c.profileImageUrl ? (
                      <SafeImage src={c.profileImageUrl} alt="" width={36} height={36} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{c.displayName}</p>
                    <p className="text-xs text-gray-400">
                      팔로워 {c.followerCount.toLocaleString()}명 · {c.orderCount}건
                    </p>
                  </div>
                  <p className="text-sm font-bold text-gray-900">{formatWon(c.revenue)}</p>
                </div>
              ))}
              {topCreators.length === 0 && (
                <p className="py-8 text-center text-gray-400 text-sm">아직 매출 데이터가 없어요</p>
              )}
            </div>
          )}

          {/* Seeding Tab */}
          {activeTab === 'seeding' && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3 text-center">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{seedingFunnel.totalSent}</p>
                  <p className="text-xs text-gray-400 mt-1">체험 발송</p>
                </div>
                <div className="flex items-center justify-center">
                  <ChevronRight className="h-5 w-5 text-gray-300" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{seedingFunnel.received}</p>
                  <p className="text-xs text-gray-400 mt-1">수령 완료</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-600">{seedingFunnel.proceeded}</p>
                  <p className="text-xs text-gray-400 mt-1">공구 전환</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600">
                  체험 → 공구 전환율: <span className="font-bold text-gray-900">{seedingFunnel.conversionRate}%</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
