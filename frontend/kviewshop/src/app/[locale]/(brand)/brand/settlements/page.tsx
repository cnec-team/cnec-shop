'use client';

import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { getBrandSettlements, getBrandSession } from '@/lib/actions/brand';
import { PLATFORM_FEE_RATE } from '@/types/database';
import { Button } from '@/components/ui/button';
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
import { DollarSign, Clock, CheckCircle, Receipt, Download } from 'lucide-react';

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
        if (!brandData) {
          setIsLoading(false);
          return;
        }
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold">정산 관리</h1>
          <p className="text-muted-foreground">수익 및 지급 내역을 확인합니다</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadExcel}
          disabled={settlements.length === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          엑셀 다운로드
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">정산 대기</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {formatKRW(totalPending)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">총 매출</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatKRW(totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">지급 완료</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {formatKRW(totalPaid)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>크리에이터별 정산 내역</CardTitle>
          <CardDescription>월별 정산 기록</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : settlements.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">정산 내역이 없습니다</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>크리에이터명</TableHead>
                  <TableHead className="text-right">판매건수</TableHead>
                  <TableHead className="text-right">총매출</TableHead>
                  <TableHead className="text-right">수수료</TableHead>
                  <TableHead className="text-right">플랫폼수수료</TableHead>
                  <TableHead className="text-right">정산금액</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settlements.map((s, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{s.creatorName}</TableCell>
                    <TableCell className="text-right">{s.orderCount}건</TableCell>
                    <TableCell className="text-right">{formatKRW(s.totalSales)}</TableCell>
                    <TableCell className="text-right">{formatKRW(s.commissionAmount)}</TableCell>
                    <TableCell className="text-right">{formatKRW(s.platformFee)}</TableCell>
                    <TableCell className="text-right font-medium">{formatKRW(s.netAmount)}</TableCell>
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
