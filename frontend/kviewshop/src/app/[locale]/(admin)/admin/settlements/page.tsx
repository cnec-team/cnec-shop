'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DollarSign, Clock, Receipt, Download, FileSpreadsheet, FileText, MoreHorizontal } from 'lucide-react';
import { formatCurrency } from '@/lib/i18n/config';
import { getAdminSettlements } from '@/lib/actions/admin';
import { exportToExcel, exportToPDF } from '@/lib/export/settlements';
import { toast } from 'sonner';

interface Settlement {
  id: string;
  userId: string | null;
  userRole: string | null;
  totalSales: number;
  grossCommission: number;
  netAmount: number;
  status: string;
  periodStart: Date;
  periodEnd: Date;
  createdAt: Date;
  paidAt: Date | null;
  user?: {
    name: string | null;
    role: string | null;
  } | null;
}

export default function AdminSettlementsPage() {
  const t = useTranslations('admin');
  const [loading, setLoading] = useState(true);
  const [settlements, setSettlements] = useState<Settlement[]>([]);

  useEffect(() => {
    fetchSettlements();
  }, []);

  async function fetchSettlements() {
    try {
      const data = await getAdminSettlements();
      setSettlements(data as unknown as Settlement[]);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }

  const pendingSettlements = settlements.filter((s) => s.status === 'PENDING' || s.status === 'processing');
  const completedSettlements = settlements.filter((s) => s.status === 'COMPLETED' || s.status === 'completed');

  const totalPending = pendingSettlements.reduce((sum, s) => sum + Number(s.netAmount), 0);
  const totalCompleted = completedSettlements.reduce((sum, s) => sum + Number(s.netAmount), 0);
  const totalAll = settlements.reduce((sum, s) => sum + Number(s.netAmount), 0);

  const handleExportExcel = (data: Settlement[]) => {
    if (data.length === 0) {
      toast.error('내보낼 데이터가 없습니다');
      return;
    }
    // Map to the format expected by the export util
    const exportData = data.map(s => ({
      id: s.id,
      recipient_name: s.user?.name || '-',
      recipient_type: s.userRole === 'creator' ? 'creator' as const : 'brand' as const,
      amount: Number(s.netAmount),
      currency: 'USD',
      status: s.status.toLowerCase() as 'pending' | 'processing' | 'completed' | 'failed',
      period_start: new Date(s.periodStart).toISOString(),
      period_end: new Date(s.periodEnd).toISOString(),
      created_at: new Date(s.createdAt).toISOString(),
      paid_at: s.paidAt ? new Date(s.paidAt).toISOString() : undefined,
    }));
    exportToExcel(exportData, 'settlements');
    toast.success('Excel 파일이 다운로드되었습니다');
  };

  const handleExportPDF = (settlement: Settlement) => {
    const exportData = {
      id: settlement.id,
      recipient_name: settlement.user?.name || '-',
      recipient_type: settlement.userRole === 'creator' ? 'creator' as const : 'brand' as const,
      amount: Number(settlement.netAmount),
      currency: 'USD',
      status: settlement.status.toLowerCase() as 'pending' | 'processing' | 'completed' | 'failed',
      period_start: new Date(settlement.periodStart).toISOString(),
      period_end: new Date(settlement.periodEnd).toISOString(),
      created_at: new Date(settlement.createdAt).toISOString(),
      paid_at: settlement.paidAt ? new Date(settlement.paidAt).toISOString() : undefined,
    };
    exportToPDF(exportData);
  };

  const getStatusBadge = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    const styles: Record<string, string> = {
      pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
      processing: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
      completed: 'bg-green-500/10 text-green-500 border-green-500/30',
      failed: 'bg-red-500/10 text-red-500 border-red-500/30',
    };
    const labels: Record<string, string> = {
      pending: '대기중',
      processing: '처리중',
      completed: '완료',
      failed: '실패',
    };
    return (
      <Badge variant="outline" className={styles[normalizedStatus] || ''}>
        {labels[normalizedStatus] || status}
      </Badge>
    );
  };

  const renderSettlementTable = (data: Settlement[]) => {
    if (data.length === 0) {
      return (
        <div className="text-center py-12">
          <Receipt className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">정산 내역이 없습니다</p>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>수령인</TableHead>
            <TableHead>유형</TableHead>
            <TableHead>금액</TableHead>
            <TableHead>정산 기간</TableHead>
            <TableHead>상태</TableHead>
            <TableHead className="text-right">관리</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((settlement) => (
            <TableRow key={settlement.id}>
              <TableCell className="font-medium">{settlement.user?.name || '-'}</TableCell>
              <TableCell>
                <Badge variant="outline">
                  {settlement.userRole === 'creator' ? '크리에이터' : '브랜드'}
                </Badge>
              </TableCell>
              <TableCell className="font-bold">
                {formatCurrency(Number(settlement.netAmount), 'USD')}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(settlement.periodStart).toLocaleDateString('ko-KR')} ~{' '}
                {new Date(settlement.periodEnd).toLocaleDateString('ko-KR')}
              </TableCell>
              <TableCell>{getStatusBadge(settlement.status)}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleExportPDF(settlement)}>
                      <FileText className="mr-2 h-4 w-4" />
                      PDF 인보이스
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold">{t('settlementManagement')}</h1>
          <p className="text-muted-foreground">{t('settlementManagementDesc')}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              내보내기
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleExportExcel(settlements)}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              전체 Excel 다운로드
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExportExcel(pendingSettlements)}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              대기중만 Excel 다운로드
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExportExcel(completedSettlements)}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              완료만 Excel 다운로드
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">정산 대기 금액</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{formatCurrency(totalPending, 'USD')}</div>
            <p className="text-xs text-muted-foreground">{pendingSettlements.length}건 대기중</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">이번 달 지급액</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(totalCompleted, 'USD')}</div>
            <p className="text-xs text-muted-foreground">{completedSettlements.length}건 완료</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">전체 지급액</CardTitle>
            <Receipt className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalAll, 'USD')}</div>
            <p className="text-xs text-muted-foreground">누적 금액</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>정산 내역</CardTitle>
          <CardDescription>크리에이터 및 브랜드 정산을 관리합니다</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending">
            <TabsList>
              <TabsTrigger value="pending">대기중 ({pendingSettlements.length})</TabsTrigger>
              <TabsTrigger value="completed">완료 ({completedSettlements.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
              ) : (
                renderSettlementTable(pendingSettlements)
              )}
            </TabsContent>

            <TabsContent value="completed" className="mt-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
              ) : (
                renderSettlementTable(completedSettlements)
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
