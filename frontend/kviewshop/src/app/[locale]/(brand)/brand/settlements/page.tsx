'use client';

import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { getBrandSettlements, getBrandSession } from '@/lib/actions/brand';
import { PLATFORM_FEE_RATE } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DollarSign,
  Clock,
  CheckCircle,
  Receipt,
  Download,
  TrendingUp,
  Wallet,
} from 'lucide-react';

interface SettlementRow {
  creatorName: string;
  orderCount: number;
  totalSales: number;
  commissionAmount: number;
  platformFee: number;
  netAmount: number;
}

function formatKRW(num: number): string {
  return `${num.toLocaleString('ko-KR')}원`;
}

function formatCompact(num: number): string {
  if (num >= 10000) return `${(num / 10000).toFixed(1)}만원`;
  return formatKRW(num);
}

export default function BrandSettlementsPage() {
  const [brand, setBrand] = useState<{ id: string } | null>(null);
  const [settlements, setSettlements] = useState<SettlementRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPending, setTotalPending] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const brandData = await getBrandSession();
        if (!brandData) { setIsLoading(false); return; }
        setBrand(brandData);
        const data = await getBrandSettlements(brandData.id);
        setSettlements(data.settlements);
        setTotalRevenue(data.totalRevenue);
        setTotalPending(data.totalPending);
        setTotalPaid(data.totalPaid);
      } catch (error) {
        console.error('Failed to fetch settlements:', error);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  function handleDownloadExcel() {
    if (settlements.length === 0) return;
    const rows = settlements.map((s) => ({
      '정산기간': `${new Date().getFullYear()}년 ${new Date().getMonth() + 1}월`,
      '크리에이터명': s.creatorName,
      '판매건수': s.orderCount,
      '총매출': s.totalSales,
      '수수료금액': s.commissionAmount,
      '플랫폼수수료': s.platformFee,
      '정산금액': s.netAmount,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '정산내역');
    XLSX.writeFile(wb, `cnec_settlements_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  const netRevenue = totalRevenue - totalPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">정산 관리</h1>
          <p className="text-sm text-muted-foreground mt-1">수익 및 지급 내역을 확인합니다</p>
        </div>
        <Button variant="outline" size="sm" className="h-9" onClick={handleDownloadExcel} disabled={settlements.length === 0}>
          <Download className="h-4 w-4 mr-1.5" />
          엑셀 다운로드
        </Button>
      </div>

      {/* Summary card */}
      <Card className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
            <div className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">총 매출</p>
              </div>
              <p className="text-2xl font-bold">{formatCompact(totalRevenue)}</p>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10">
                  <Clock className="h-4 w-4 text-orange-500" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">정산 대기</p>
              </div>
              <p className="text-2xl font-bold text-orange-500">{formatCompact(totalPending)}</p>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">지급 완료</p>
              </div>
              <p className="text-2xl font-bold text-green-500">{formatCompact(totalPaid)}</p>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10">
                  <Wallet className="h-4 w-4 text-purple-500" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">순수익</p>
              </div>
              <p className="text-2xl font-bold">{formatCompact(netRevenue)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Creator settlement table */}
      <Card className="bg-white rounded-xl border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">크리에이터별 정산 내역</CardTitle>
          <CardDescription className="text-xs">이번 달 정산 기록</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : settlements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Receipt className="h-16 w-16 text-muted-foreground/20 mb-4" />
              <p className="text-lg font-medium mb-1">정산 내역이 없습니다</p>
              <p className="text-sm text-muted-foreground">
                주문이 발생하면 자동으로 정산 내역이 생성됩니다
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                      <TableHead className="font-medium text-sm text-gray-500">크리에이터명</TableHead>
                      <TableHead className="font-medium text-sm text-gray-500 text-right">판매건수</TableHead>
                      <TableHead className="font-medium text-sm text-gray-500 text-right">총매출</TableHead>
                      <TableHead className="font-medium text-sm text-gray-500 text-right">수수료</TableHead>
                      <TableHead className="font-medium text-sm text-gray-500 text-right">플랫폼수수료</TableHead>
                      <TableHead className="font-medium text-sm text-gray-500 text-right">정산금액</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {settlements.map((s, i) => (
                      <TableRow key={i} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="font-medium">{s.creatorName}</TableCell>
                        <TableCell className="text-right">{s.orderCount}건</TableCell>
                        <TableCell className="text-right">{formatKRW(s.totalSales)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{formatKRW(s.commissionAmount)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{formatKRW(s.platformFee)}</TableCell>
                        <TableCell className="text-right font-bold">{formatKRW(s.netAmount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-3 p-4">
                {settlements.map((s, i) => (
                  <div key={i} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{s.creatorName}</p>
                      <Badge variant="outline" className="text-[10px]">{s.orderCount}건</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">총매출</p>
                        <p className="font-medium">{formatKRW(s.totalSales)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">정산금액</p>
                        <p className="font-bold">{formatKRW(s.netAmount)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
