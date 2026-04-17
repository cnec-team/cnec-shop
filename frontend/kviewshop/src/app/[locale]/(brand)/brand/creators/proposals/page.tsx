'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Send,
  CreditCard,
  TrendingUp,
  Package,
  ChevronLeft,
  ChevronRight,
  Loader2,
  User,
} from 'lucide-react';
import { toast } from 'sonner';

interface ChannelStatus {
  inApp: string;
  email: string;
  kakao: string;
  dm: string;
}

interface Proposal {
  id: string;
  creator: {
    id: string;
    displayName: string | null;
    profileImageUrl: string | null;
  };
  type: string;
  campaignTitle: string | null;
  productName: string | null;
  createdAt: string;
  status: string;
  channels: ChannelStatus;
}

interface ProposalSummary {
  totalSent: number;
  paidCount: number;
  paidAmount: number;
  acceptRate: number;
  remainingQuota: number;
}

interface ProposalsData {
  proposals: Proposal[];
  summary: ProposalSummary;
  total: number;
  page: number;
  totalPages: number;
}

const STATUS_OPTIONS = [
  { value: 'ALL', label: '전체' },
  { value: 'PENDING', label: '대기' },
  { value: 'ACCEPTED', label: '수락' },
  { value: 'REJECTED', label: '거절' },
  { value: 'EXPIRED', label: '만료' },
];

const TYPE_OPTIONS = [
  { value: 'ALL', label: '전체' },
  { value: 'GONGGU', label: '공구 초대' },
  { value: 'PRODUCT_PICK', label: '상품 추천' },
];

const PERIOD_OPTIONS = [
  { value: '7', label: '7일' },
  { value: '30', label: '30일' },
  { value: 'ALL', label: '전체' },
];

function statusBadge(status: string) {
  switch (status) {
    case 'PENDING':
      return <Badge variant="secondary">대기</Badge>;
    case 'ACCEPTED':
      return <Badge variant="default">수락</Badge>;
    case 'REJECTED':
      return <Badge variant="destructive">거절</Badge>;
    case 'EXPIRED':
      return <Badge variant="outline">만료</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function typeBadge(type: string) {
  switch (type) {
    case 'GONGGU':
      return (
        <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100">
          공구 초대
        </Badge>
      );
    case 'PRODUCT_PICK':
      return (
        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
          상품 추천
        </Badge>
      );
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
}

function channelBadgeClass(status: string): string {
  switch (status) {
    case 'SENT':
      return 'bg-green-100 text-green-700';
    case 'FAILED':
      return 'bg-red-100 text-red-700';
    case 'SKIPPED':
      return 'bg-gray-100 text-gray-500';
    case 'PENDING':
      return 'bg-blue-100 text-blue-700';
    default:
      return 'bg-gray-100 text-gray-500';
  }
}

function channelStatusLabel(status: string): string {
  switch (status) {
    case 'SENT':
      return '발송';
    case 'FAILED':
      return '실패';
    case 'SKIPPED':
      return '미발송';
    case 'PENDING':
      return '대기';
    default:
      return status;
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatAmount(num: number): string {
  return num.toLocaleString('ko-KR') + '원';
}

export default function BrandProposalsPage() {
  const [data, setData] = useState<ProposalsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [periodFilter, setPeriodFilter] = useState('30');
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (typeFilter !== 'ALL') params.set('type', typeFilter);
      if (periodFilter !== 'ALL') params.set('days', periodFilter);
      params.set('page', String(page));

      const res = await fetch(`/api/brand/proposals?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setData(json);
    } catch {
      toast.error('초대 목록을 불러오지 못했습니다');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, periodFilter, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleFilterChange(
    setter: (val: string) => void,
    value: string
  ) {
    setter(value);
    setPage(1);
  }

  const summary = data?.summary;

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">보낸 초대</h1>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Send className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium text-muted-foreground">
              이번달 발송
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary ? (
              <p className="text-2xl font-bold">
                {summary.totalSent.toLocaleString('ko-KR')}건
              </p>
            ) : (
              <Skeleton className="h-8 w-20" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium text-muted-foreground">
              이번달 유료
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary ? (
              <p className="text-2xl font-bold">
                {summary.paidCount.toLocaleString('ko-KR')}건 ={' '}
                <span className="text-lg">
                  {formatAmount(summary.paidAmount)}
                </span>
              </p>
            ) : (
              <Skeleton className="h-8 w-32" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium text-muted-foreground">
              수락률
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary ? (
              <p className="text-2xl font-bold">{summary.acceptRate}%</p>
            ) : (
              <Skeleton className="h-8 w-16" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium text-muted-foreground">
              남은 쿼터
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary ? (
              <p className="text-2xl font-bold">
                {summary.remainingQuota.toLocaleString('ko-KR')}건
              </p>
            ) : (
              <Skeleton className="h-8 w-16" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select
          value={statusFilter}
          onValueChange={(v) => handleFilterChange(setStatusFilter, v)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="상태" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={typeFilter}
          onValueChange={(v) => handleFilterChange(setTypeFilter, v)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="타입" />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={periodFilter}
          onValueChange={(v) => handleFilterChange(setPeriodFilter, v)}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="기간" />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Proposals Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !data || data.proposals.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              발송된 초대가 없습니다
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>크리에이터</TableHead>
                    <TableHead>타입</TableHead>
                    <TableHead>캠페인/상품</TableHead>
                    <TableHead>발송일시</TableHead>
                    <TableHead>채널 상태</TableHead>
                    <TableHead className="text-center">상태</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.proposals.map((proposal) => (
                    <TableRow key={proposal.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {proposal.creator.profileImageUrl ? (
                            <img
                              src={proposal.creator.profileImageUrl}
                              alt=""
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                              <User className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <span className="font-medium">
                            {proposal.creator.displayName || '이름 없음'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{typeBadge(proposal.type)}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {proposal.campaignTitle ||
                          proposal.productName ||
                          '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(proposal.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(
                            [
                              ['inApp', '앱'],
                              ['email', '이메일'],
                              ['kakao', '카카오'],
                              ['dm', 'DM'],
                            ] as const
                          ).map(([key, label]) => (
                            <span
                              key={key}
                              className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${channelBadgeClass(proposal.channels[key])}`}
                            >
                              {label}: {channelStatusLabel(proposal.channels[key])}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {statusBadge(proposal.status)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {data.page} / {data.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= data.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
