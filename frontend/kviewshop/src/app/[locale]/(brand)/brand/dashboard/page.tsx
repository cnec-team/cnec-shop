'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getBrandDashboardData, getBrandSession } from '@/lib/actions/brand';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ShoppingCart,
  TrendingUp,
  Megaphone,
  Users,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';

interface DashboardData {
  stats: {
    totalVisits: number;
    totalOrders: number;
    totalRevenue: number;
    totalCommission: number;
    conversionRate: number;
    activeCampaigns: number;
    activeCreators: number;
    productCount: number;
  };
  activeGonggu: {
    title: string;
    status: string;
    soldCount: number;
    totalStock: number | null;
    endAt: string | null;
    targetParticipants: number | null;
  } | null;
  creatorRankings: Array<{
    creator: { id: string; displayName: string | null };
    totalSales: number;
    orderCount: number;
  }>;
}

function formatNumber(num: number): string {
  return num.toLocaleString('ko-KR');
}

function formatCurrency(num: number): string {
  if (num >= 10000) return `${(num / 10000).toFixed(1)}만원`;
  return `${formatNumber(num)}원`;
}

function OnboardingChecklist({ stats }: { stats: DashboardData['stats'] }) {
  const steps = [
    { label: '계정 생성', done: true, href: '#' },
    { label: '상품 등록', done: stats.productCount > 0, href: '../brand/products/new', cta: '상품 등록' },
    { label: '캠페인 생성', done: stats.activeCampaigns > 0, href: '../brand/campaigns/new', cta: '캠페인 만들기' },
    { label: '크리에이터 승인', done: stats.activeCreators > 0, href: '../brand/creators/pending', cta: '확인하기' },
  ];
  const completed = steps.filter((s) => s.done).length;
  const progressPercent = (completed / steps.length) * 100;

  if (completed >= steps.length) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-bold text-gray-900">시작 가이드</h2>
        <span className="text-xs text-gray-400">{completed}/{steps.length}</span>
      </div>
      <Progress value={progressPercent} className="h-1.5 mb-4" />
      <p className="text-xs text-emerald-600 font-semibold mb-4">30일간 수수료 0%로 시작하세요</p>
      <div className="space-y-2">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              {step.done ? (
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              ) : (
                <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-gray-200 text-[10px] text-gray-400">
                  {i + 1}
                </div>
              )}
              <span className={step.done ? 'text-sm text-gray-400 line-through' : 'text-sm font-medium text-gray-900'}>
                {step.label}
              </span>
            </div>
            {!step.done && step.cta && (
              <Link href={step.href}>
                <Button size="sm" variant="outline" className="h-7 text-xs rounded-lg">
                  {step.cta} <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BrandDashboardPage() {
  const [brand, setBrand] = useState<{ id: string; brandName?: string | null } | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const brandData = await getBrandSession();
        if (!brandData) { setIsLoading(false); return; }
        setBrand(brandData as any);
        const dashboardData = await getBrandDashboardData(brandData.id);
        setData(dashboardData as any);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  if (!isLoading && !brand?.id) {
    return (
      <div className="max-w-3xl space-y-6">
        <h1 className="text-xl font-bold text-gray-900">대시보드</h1>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <p className="text-gray-400">브랜드 정보를 불러올 수 없습니다.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  const stats = data?.stats;
  const activeGonggu = data?.activeGonggu;
  const creatorRankings = data?.creatorRankings ?? [];

  const today = new Date();
  const dateStr = `${today.getMonth() + 1}월 ${today.getDate()}일`;

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm text-gray-400">{dateStr}</p>
        <h1 className="text-xl font-bold text-gray-900 mt-0.5">
          {brand?.brandName ?? '브랜드'} 대시보드
        </h1>
      </div>

      {/* Onboarding */}
      {stats && stats.productCount === 0 && <OnboardingChecklist stats={stats} />}

      {/* 4 Key Metrics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400">오늘 주문</p>
            <ShoppingCart className="h-4 w-4 text-gray-300" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatNumber(stats?.totalOrders ?? 0)}
            <span className="text-sm font-normal text-gray-400 ml-0.5">건</span>
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400">이번 달 매출</p>
            <TrendingUp className="h-4 w-4 text-gray-300" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.totalRevenue ?? 0)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400">진행중 캠페인</p>
            <Megaphone className="h-4 w-4 text-gray-300" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatNumber(stats?.activeCampaigns ?? 0)}
            <span className="text-sm font-normal text-gray-400 ml-0.5">개</span>
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400">활성 크리에이터</p>
            <Users className="h-4 w-4 text-gray-300" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatNumber(stats?.activeCreators ?? 0)}
            <span className="text-sm font-normal text-gray-400 ml-0.5">명</span>
          </p>
        </div>
      </div>

      {/* Active Gonggu */}
      {activeGonggu && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-900">실시간 공구</h2>
            <Link href="campaigns/gonggu">
              <span className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-0.5">
                전체 보기 <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          </div>
          <p className="text-sm font-semibold text-gray-900">{activeGonggu.title}</p>
          <div className="mt-3 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">판매 진행률</span>
              <span className="font-medium text-gray-900">
                {formatNumber(activeGonggu.soldCount)} / {formatNumber(activeGonggu.totalStock ?? 0)}
              </span>
            </div>
            <Progress
              value={activeGonggu.totalStock ? (activeGonggu.soldCount / activeGonggu.totalStock) * 100 : 0}
              className="h-1.5"
            />
          </div>
        </div>
      )}

      {/* Creator Rankings */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-900">크리에이터 TOP 5</h2>
          <Link href="creators">
            <span className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-0.5">
              전체 보기 <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        </div>
        {creatorRankings.length > 0 ? (
          <div className="space-y-3">
            {creatorRankings.slice(0, 5).map((ranking, index) => (
              <div key={ranking.creator.id} className="flex items-center gap-3">
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  index === 0 ? 'bg-amber-50 text-amber-700' :
                  index === 1 ? 'bg-gray-100 text-gray-600' :
                  index === 2 ? 'bg-orange-50 text-orange-600' :
                  'bg-gray-50 text-gray-400'
                }`}>{index + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{ranking.creator.displayName}</p>
                  <p className="text-[10px] text-gray-400">{formatNumber(ranking.orderCount)}건</p>
                </div>
                <p className="text-sm font-semibold text-gray-900">{formatNumber(ranking.totalSales)}원</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <Users className="h-10 w-10 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">아직 매출 데이터가 없습니다</p>
          </div>
        )}
      </div>

      {/* ROI Comparison — conditional on 10+ orders */}
      {(stats?.totalOrders ?? 0) >= 10 && (stats?.activeCreators ?? 0) > 0 && (
        <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-5">
          <p className="text-sm font-semibold text-emerald-800">
            크넥 크리에이터 {stats?.activeCreators}명이 이번 달 ₩{formatNumber(stats?.totalRevenue ?? 0)} 매출
          </p>
          <p className="text-xs text-emerald-600 mt-1">
            메가 인플루언서 1회(₩3,000만~) 대비 ROI {Math.max(1, Math.round((stats?.totalRevenue ?? 0) / 30000000 * (stats?.activeCreators ?? 1))).toFixed(0)}배
          </p>
        </div>
      )}

      {/* Bottom stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-[10px] text-gray-400 mb-0.5">방문수</p>
          <p className="text-base font-bold text-gray-900">{formatNumber(stats?.totalVisits ?? 0)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-[10px] text-gray-400 mb-0.5">전환율</p>
          <p className="text-base font-bold text-gray-900">{(stats?.conversionRate ?? 0).toFixed(1)}%</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-[10px] text-gray-400 mb-0.5">수수료</p>
          <p className="text-base font-bold text-gray-900">{formatCurrency(stats?.totalCommission ?? 0)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-[10px] text-gray-400 mb-0.5">등록 상품</p>
          <p className="text-base font-bold text-gray-900">{formatNumber(stats?.productCount ?? 0)}</p>
        </div>
      </div>
    </div>
  );
}
