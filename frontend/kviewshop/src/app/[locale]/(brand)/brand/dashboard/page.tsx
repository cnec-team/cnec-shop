'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getBrandDashboardData, getBrandSession } from '@/lib/actions/brand';
import { CAMPAIGN_STATUS_LABELS } from '@/types/database';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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
  return `${formatNumber(num)}원`;
}

function StatsCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-20" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-28" />
      </CardContent>
    </Card>
  );
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
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
        if (!brandData) {
          setIsLoading(false);
          return;
        }
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
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">대시보드</h1>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">브랜드 정보를 불러올 수 없습니다.</p>
            <p className="mt-2 text-sm text-muted-foreground">로그인 상태를 확인해주세요.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">대시보드</h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <StatsCardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent>
              <TableSkeleton rows={5} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent>
              <TableSkeleton rows={5} />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const stats = data?.stats;
  const activeGonggu = data?.activeGonggu;
  const creatorRankings = data?.creatorRankings ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">대시보드</h1>
        <p className="text-sm text-muted-foreground">
          {brand?.brandName ?? '브랜드'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>방문수</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatNumber(stats?.totalVisits ?? 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>주문수</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatNumber(stats?.totalOrders ?? 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>전환율</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {stats?.conversionRate ?? 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>매출</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(stats?.totalRevenue ?? 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>수수료</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(stats?.totalCommission ?? 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>진행중 캠페인</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatNumber(stats?.activeCampaigns ?? 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>활동 크리에이터</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatNumber(stats?.activeCreators ?? 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>등록 상품</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatNumber(stats?.productCount ?? 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Real-time Gonggu Dashboard */}
        <Card>
          <CardHeader>
            <CardTitle>실시간 공구 현황</CardTitle>
            <CardDescription>
              현재 진행 중인 공구 캠페인의 실시간 상태
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeGonggu ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold">{activeGonggu.title}</p>
                    <Badge variant="secondary">
                      {CAMPAIGN_STATUS_LABELS[activeGonggu.status as keyof typeof CAMPAIGN_STATUS_LABELS]}
                    </Badge>
                  </div>
                  <Link href="campaigns/gonggu">
                    <Button variant="outline" size="sm">
                      상세보기
                    </Button>
                  </Link>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>판매 진행률</span>
                    <span>
                      {formatNumber(activeGonggu.soldCount)} /{' '}
                      {formatNumber(activeGonggu.totalStock ?? 0)}
                    </span>
                  </div>
                  <Progress
                    value={
                      activeGonggu.totalStock
                        ? (activeGonggu.soldCount / activeGonggu.totalStock) *
                          100
                        : 0
                    }
                  />
                </div>

                {activeGonggu.endAt && (
                  <div className="text-sm text-muted-foreground">
                    종료:{' '}
                    {new Date(activeGonggu.endAt).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                )}

                {activeGonggu.targetParticipants && (
                  <div className="text-sm text-muted-foreground">
                    목표 참여 크리에이터:{' '}
                    {formatNumber(activeGonggu.targetParticipants)}명
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-muted-foreground">
                  현재 진행 중인 공구 캠페인이 없습니다.
                </p>
                <Link href="campaigns/new" className="mt-4">
                  <Button variant="outline" size="sm">
                    새 캠페인 만들기
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Creator Sales Ranking */}
        <Card>
          <CardHeader>
            <CardTitle>크리에이터 매출 랭킹</CardTitle>
            <CardDescription>
              누적 매출 기준 상위 크리에이터
            </CardDescription>
          </CardHeader>
          <CardContent>
            {creatorRankings.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">순위</TableHead>
                    <TableHead>크리에이터</TableHead>
                    <TableHead className="text-right">주문수</TableHead>
                    <TableHead className="text-right">매출</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {creatorRankings.map((ranking, index) => (
                    <TableRow key={ranking.creator.id}>
                      <TableCell className="font-medium">
                        {index + 1}
                      </TableCell>
                      <TableCell>{ranking.creator.displayName}</TableCell>
                      <TableCell className="text-right">
                        {formatNumber(ranking.orderCount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(ranking.totalSales)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">
                  아직 매출 데이터가 없습니다.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
