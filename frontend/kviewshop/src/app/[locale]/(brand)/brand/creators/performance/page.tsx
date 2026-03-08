'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getBrandSession, getCreatorPerformance } from '@/lib/actions/brand';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, TrendingUp, Users, Megaphone } from 'lucide-react';

interface CreatorPerformanceData {
  creator: {
    id: string;
    shopId: string | null;
    displayName: string | null;
    profileImageUrl: string | null;
    skinType: string | null;
  };
  orderCount: number;
  totalSales: number;
  visitCount: number;
  conversionRate: number;
}

type SortField = 'totalSales' | 'orderCount' | 'conversionRate';
type PeriodFilter = 'this_month' | 'last_month' | 'all';

function formatCurrency(num: number): string {
  return `${num.toLocaleString('ko-KR')}원`;
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}

export default function CreatorPerformancePage() {
  const [brand, setBrand] = useState<{ id: string } | null>(null);
  const [performances, setPerformances] = useState<CreatorPerformanceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('totalSales');
  const [period, setPeriod] = useState<PeriodFilter>('this_month');

  useEffect(() => {
    async function init() {
      const brandData = await getBrandSession();
      if (brandData) setBrand(brandData);
      else setIsLoading(false);
    }
    init();
  }, []);

  useEffect(() => {
    if (!brand?.id) return;

    async function fetchPerformance() {
      try {
        const result = await getCreatorPerformance(brand!.id, period);
        setPerformances(result as CreatorPerformanceData[]);
      } catch (error) {
        console.error('Failed to fetch creator performance:', error);
      } finally {
        setIsLoading(false);
      }
    }

    setIsLoading(true);
    fetchPerformance();
  }, [brand?.id, period]);

  const sortedPerformances = [...performances].sort((a, b) => {
    return b[sortField] - a[sortField];
  });

  const totalCreators = performances.length;
  const totalSales = performances.reduce((sum, p) => sum + p.totalSales, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="../creators">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            돌아가기
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">크리에이터 성과</h1>
          <p className="text-sm text-muted-foreground">
            내 상품을 판매한 크리에이터별 성과를 확인합니다.
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">판매 크리에이터</p>
              <p className="text-2xl font-bold">{totalCreators}명</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">크리에이터 경유 매출</p>
              <p className="text-2xl font-bold">{formatCurrency(totalSales)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">기간</span>
              <Select value={period} onValueChange={(v) => setPeriod(v as PeriodFilter)}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this_month">이번 달</SelectItem>
                  <SelectItem value="last_month">지난 달</SelectItem>
                  <SelectItem value="all">전체</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">정렬</span>
              <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="totalSales">매출순</SelectItem>
                  <SelectItem value="orderCount">판매량순</SelectItem>
                  <SelectItem value="conversionRate">전환율순</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>크리에이터 성과 테이블</CardTitle>
          <CardDescription>
            {period === 'this_month' ? '이번 달' : period === 'last_month' ? '지난 달' : '전체'} 기준
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton />
          ) : sortedPerformances.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">
                해당 기간에 판매 크리에이터가 없습니다.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>크리에이터</TableHead>
                  <TableHead>피부타입</TableHead>
                  <TableHead className="text-right">판매량</TableHead>
                  <TableHead className="text-right">매출</TableHead>
                  <TableHead className="text-right">전환율</TableHead>
                  <TableHead>액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPerformances.map((perf) => (
                  <TableRow key={perf.creator.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          {perf.creator.profileImageUrl && (
                            <AvatarImage src={perf.creator.profileImageUrl} />
                          )}
                          <AvatarFallback className="text-xs">
                            {(perf.creator.displayName ?? '').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{perf.creator.displayName}</p>
                          <p className="text-xs text-muted-foreground">
                            @{perf.creator.shopId}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {perf.creator.skinType ? (
                        <Badge variant="outline">
                          {perf.creator.skinType}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {perf.orderCount.toLocaleString('ko-KR')}건
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(perf.totalSales)}
                    </TableCell>
                    <TableCell className="text-right">
                      {perf.conversionRate > 0 ? `${perf.conversionRate}%` : '-'}
                    </TableCell>
                    <TableCell>
                      <Link href={`../campaigns/new?creator_id=${perf.creator.id}`}>
                        <Button variant="outline" size="sm">
                          <Megaphone className="h-3 w-3 mr-1" />
                          공구 제안
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
