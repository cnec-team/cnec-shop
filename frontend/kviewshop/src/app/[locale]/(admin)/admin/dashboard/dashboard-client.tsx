'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  RefreshCw,
  UserCheck,
  Building2,
  Banknote,
  AlertTriangle,
  Clock,
  Package,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  Minus,
  ShoppingCart,
  Megaphone,
  User,
  Star,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import dynamic from 'next/dynamic'

const TrendChart = dynamic(() => import('./trend-chart'), { ssr: false })

// ==================== Types ====================

type KpiStats = {
  todayGmv: number
  todayGmvPrev: number
  todayOrders: number
  todayOrdersPrev: number
  monthGmv: number
  monthGmvPrev: number
  activeCampaigns: number
  activeCreators: number
  activeBrands: number
  newCreatorsThisMonth: number
  newBrandsThisMonth: number
}

type PendingQueue = {
  pendingCreatorApprovals: number
  pendingBrandApprovals: number
  pendingSettlements: number
  pendingSettlementTotal: number
  failedPayments: number
  lowStockProducts: number
  expiringCampaigns: number
}

type ActivityItem = {
  type: string
  title: string
  description: string
  link: string
  createdAt: string
  actorName: string
  iconType: string
}

type TopBrand = {
  id: string
  name: string
  logoUrl: string | null
  monthGmv: number
  orderCount: number
  activeCampaignCount: number
}

type TopCreator = {
  id: string
  name: string
  profileImageUrl: string | null
  monthRevenue: number
  salesCount: number
  cnecReliabilityScore: number | null
}

type TrendPoint = {
  date: string
  dateLabel: string
  gmv: number
  orders: number
}

type Props = {
  kpi: KpiStats
  queue: PendingQueue
  activity: ActivityItem[]
  topBrands: TopBrand[]
  topCreators: TopCreator[]
  weeklyTrend: TrendPoint[]
}

// ==================== Helpers ====================

function formatKrw(amount: number): string {
  if (amount >= 100_000_000) {
    return `${(amount / 100_000_000).toFixed(1)}억`
  }
  if (amount >= 10_000) {
    return `${Math.floor(amount / 10_000).toLocaleString()}만`
  }
  return amount.toLocaleString()
}

function formatKrwFull(amount: number): string {
  return amount.toLocaleString()
}

function getChangePercent(current: number, previous: number): { value: number; label: string } {
  if (previous === 0) {
    return current > 0 ? { value: 100, label: '+100%' } : { value: 0, label: '0%' }
  }
  const pct = ((current - previous) / previous) * 100
  const sign = pct >= 0 ? '+' : ''
  return { value: pct, label: `${sign}${pct.toFixed(1)}%` }
}

// ==================== CountUp ====================

function useCountUp(target: number, duration: number = 1200) {
  const [value, setValue] = useState(0)
  const ref = useRef<number>(0)

  useEffect(() => {
    const start = ref.current
    const diff = target - start
    if (diff === 0) return

    const startTime = performance.now()
    let animationId: number

    function tick(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      const current = start + diff * eased
      setValue(Math.round(current))
      ref.current = Math.round(current)

      if (progress < 1) {
        animationId = requestAnimationFrame(tick)
      }
    }

    animationId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animationId)
  }, [target, duration])

  return value
}

// ==================== Components ====================

function PendingQueueSection({ queue }: { queue: PendingQueue }) {
  const cards = [
    {
      label: '크리에이터 승인',
      count: queue.pendingCreatorApprovals,
      icon: UserCheck,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      link: '/admin/approvals/creators',
    },
    {
      label: '브랜드 승인',
      count: queue.pendingBrandApprovals,
      icon: Building2,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      link: '/admin/brands',
    },
    {
      label: '정산 대기',
      count: queue.pendingSettlements,
      icon: Banknote,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      link: '/admin/settlements',
    },
    {
      label: '결제 실패',
      count: queue.failedPayments,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      link: '/admin/orders',
    },
    {
      label: '마감 임박',
      count: queue.expiringCampaigns,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      link: '/admin/campaigns',
    },
    {
      label: '재고 부족',
      count: queue.lowStockProducts,
      icon: Package,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      link: '/admin/campaigns',
    },
  ]

  const totalPending = cards.reduce((sum, c) => sum + c.count, 0)

  if (totalPending === 0) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
        <p className="mt-3 text-base font-medium text-stone-700">
          오늘 처리할 일이 없어요
        </p>
        <p className="mt-1 text-sm text-stone-400">
          잘 운영되고 있어요
        </p>
      </div>
    )
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-1 md:grid md:grid-cols-3 md:overflow-x-visible lg:grid-cols-6">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Link
            key={card.label}
            href={card.link}
            className="group min-w-[140px] flex-shrink-0 snap-start rounded-2xl border border-stone-200 bg-white p-5 transition-shadow hover:shadow-md md:min-w-0"
          >
            <div className={`inline-flex rounded-lg p-1.5 ${card.bgColor}`}>
              <Icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <div className="mt-3">
              <span
                className={`text-2xl font-bold tabular-nums ${
                  card.count > 0 ? card.color : 'text-stone-300'
                }`}
              >
                {card.count}
              </span>
            </div>
            <p className="mt-1 text-xs text-stone-500">{card.label}</p>
          </Link>
        )
      })}
    </div>
  )
}

function KpiCard({
  label,
  value,
  displayValue,
  prevValue,
  subText,
  prefix,
}: {
  label: string
  value: number
  displayValue?: string
  prevValue?: number
  subText?: string
  prefix?: string
}) {
  const animatedValue = useCountUp(value)
  const change = prevValue !== undefined ? getChangePercent(value, prevValue) : null

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6">
      <p className="text-xs font-medium text-stone-500">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-bold tabular-nums text-stone-900">
          {prefix && <span className="text-xl">{prefix}</span>}
          {displayValue
            ? displayValue.replace(/[\d,]+/, formatKrwFull(animatedValue))
            : animatedValue.toLocaleString()}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        {change && (
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-medium ${
              change.value > 0
                ? 'text-emerald-600'
                : change.value < 0
                  ? 'text-red-500'
                  : 'text-stone-400'
            }`}
          >
            {change.value > 0 ? (
              <ArrowUp className="h-3 w-3" />
            ) : change.value < 0 ? (
              <ArrowDown className="h-3 w-3" />
            ) : (
              <Minus className="h-3 w-3" />
            )}
            {change.label}
          </span>
        )}
        {subText && <span className="text-xs text-stone-400">{subText}</span>}
      </div>
    </div>
  )
}

function KpiSection({ kpi }: { kpi: KpiStats }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        label="오늘 GMV"
        value={kpi.todayGmv}
        prevValue={kpi.todayGmvPrev}
        prefix="₩"
        subText={`어제 ₩${formatKrw(kpi.todayGmvPrev)}`}
      />
      <KpiCard
        label="오늘 주문"
        value={kpi.todayOrders}
        prevValue={kpi.todayOrdersPrev}
        subText={`어제 ${kpi.todayOrdersPrev}건`}
      />
      <KpiCard
        label="이번 달 GMV"
        value={kpi.monthGmv}
        prevValue={kpi.monthGmvPrev}
        prefix="₩"
        subText={`지난 달 동일 시점 ₩${formatKrw(kpi.monthGmvPrev)}`}
      />
      <KpiCard
        label="활성 사용자"
        value={kpi.activeBrands + kpi.activeCreators}
        subText={`브랜드 ${kpi.activeBrands} · 크리에이터 ${kpi.activeCreators} · 이번 달 +${kpi.newBrandsThisMonth + kpi.newCreatorsThisMonth}`}
      />
    </div>
  )
}

function TopBrandsSection({ brands }: { brands: TopBrand[] }) {
  if (brands.length === 0) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-stone-900">이번 달 매출 TOP 5 브랜드</h3>
        <p className="mt-8 text-center text-sm text-stone-400">아직 데이터가 없어요</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6">
      <h3 className="text-sm font-semibold text-stone-900">이번 달 매출 TOP 5 브랜드</h3>
      <div className="mt-4 space-y-3">
        {brands.map((brand, i) => (
          <Link
            key={brand.id}
            href={`/admin/brands`}
            className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-stone-50"
          >
            <span className="w-5 text-center text-sm font-semibold text-stone-400">
              {i + 1}
            </span>
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-stone-100">
              {brand.logoUrl ? (
                <Image
                  src={brand.logoUrl}
                  alt={brand.name}
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <Building2 className="h-4 w-4 text-stone-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-stone-900">{brand.name}</p>
              <p className="text-xs text-stone-400">
                캠페인 {brand.activeCampaignCount}개 · 주문 {brand.orderCount}건
              </p>
            </div>
            <span className="text-sm font-semibold tabular-nums text-stone-900">
              ₩{formatKrw(brand.monthGmv)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

function TopCreatorsSection({ creators }: { creators: TopCreator[] }) {
  if (creators.length === 0) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-stone-900">이번 달 매출 기여 TOP 5 크리에이터</h3>
        <p className="mt-8 text-center text-sm text-stone-400">아직 데이터가 없어요</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6">
      <h3 className="text-sm font-semibold text-stone-900">이번 달 매출 기여 TOP 5 크리에이터</h3>
      <div className="mt-4 space-y-3">
        {creators.map((creator, i) => (
          <Link
            key={creator.id}
            href={`/admin/creators`}
            className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-stone-50"
          >
            <span className="w-5 text-center text-sm font-semibold text-stone-400">
              {i + 1}
            </span>
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-stone-100">
              {creator.profileImageUrl ? (
                <Image
                  src={creator.profileImageUrl}
                  alt={creator.name}
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <User className="h-4 w-4 text-stone-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-stone-900">{creator.name}</p>
              <p className="text-xs text-stone-400">
                {creator.cnecReliabilityScore !== null && (
                  <span className="inline-flex items-center gap-0.5">
                    <Star className="h-3 w-3 text-amber-400" />
                    {(creator.cnecReliabilityScore * 100).toFixed(0)}점
                    <span className="mx-1">·</span>
                  </span>
                )}
                판매 {creator.salesCount}건
              </p>
            </div>
            <span className="text-sm font-semibold tabular-nums text-stone-900">
              ₩{formatKrw(creator.monthRevenue)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

const activityIcons: Record<string, { icon: typeof ShoppingCart; color: string; bg: string }> = {
  newOrder: { icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-50' },
  newCampaign: { icon: Megaphone, color: 'text-blue-600', bg: 'bg-blue-50' },
  newBrand: { icon: Building2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  newCreator: { icon: User, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  settlementComplete: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  paymentFailed: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
}

function ActivitySection({ activity }: { activity: ActivityItem[] }) {
  if (activity.length === 0) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-stone-900">최근 활동</h3>
        <p className="mt-8 text-center text-sm text-stone-400">아직 활동이 없어요</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6">
      <h3 className="text-sm font-semibold text-stone-900">최근 활동</h3>
      <div className="mt-4 space-y-1">
        {activity.map((item, i) => {
          const config = activityIcons[item.iconType] || activityIcons.newOrder
          const Icon = config.icon
          return (
            <Link
              key={`${item.type}-${item.createdAt}-${i}`}
              href={item.link}
              className="flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-stone-50"
            >
              <div className={`mt-0.5 rounded-full p-1.5 ${config.bg}`}>
                <Icon className={`h-4 w-4 ${config.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-stone-900">
                  <span className="font-medium">{item.title}</span>
                  <span className="mx-1 text-stone-300">·</span>
                  <span className="text-stone-500">{item.actorName}</span>
                </p>
                <p className="truncate text-xs text-stone-400">{item.description}</p>
              </div>
              <span className="mt-0.5 shrink-0 text-xs text-stone-400">
                {formatDistanceToNow(new Date(item.createdAt), {
                  addSuffix: true,
                  locale: ko,
                })}
              </span>
            </Link>
          )
        })}
      </div>
      <div className="mt-4 border-t border-stone-100 pt-4">
        <Link
          href="/admin/activity"
          className="inline-flex items-center gap-1 text-sm font-medium text-stone-500 transition-colors hover:text-stone-900"
        >
          더 보기
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}

// ==================== Main ====================

export function DashboardClient({
  kpi,
  queue,
  activity,
  topBrands,
  topCreators,
  weeklyTrend,
}: Props) {
  const router = useRouter()
  const [lastUpdated] = useState(new Date())

  return (
    <div className="space-y-6">
      {/* 섹션 1: 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">대시보드</h1>
          <p className="mt-0.5 text-xs text-stone-400">
            마지막 업데이트{' '}
            {formatDistanceToNow(lastUpdated, { addSuffix: true, locale: ko })}
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.refresh()}
          className="h-9 w-9 rounded-lg"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* 섹션 2: 처리 대기 큐 */}
      <PendingQueueSection queue={queue} />

      {/* 섹션 3: 핵심 KPI */}
      <KpiSection kpi={kpi} />

      {/* 섹션 4: 매출 추이 차트 */}
      <TrendChart initialData={weeklyTrend} />

      {/* 섹션 5: TOP 5 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TopBrandsSection brands={topBrands} />
        <TopCreatorsSection creators={topCreators} />
      </div>

      {/* 섹션 6: 최근 활동 피드 */}
      <ActivitySection activity={activity} />
    </div>
  )
}
