'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import {
  Search, Megaphone, FileEdit, Users, CheckCircle, XCircle, Package,
  Percent, Calendar, Building2, Loader2, Image as ImageIcon, TrendingUp,
  ShoppingBag, Eye, RotateCcw, ArrowUpDown,
} from 'lucide-react';
import { getAdminCampaigns, getAdminCampaignStats, getAdminCampaignDetail, getAdminBrandList } from '@/lib/actions/admin';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ---------- Types ----------

interface CampaignProduct {
  id: string;
  campaignPrice: number;
  product: { id: string; name: string | null; thumbnailUrl: string | null; price: number | null; status?: string };
}

interface CampaignParticipation {
  id: string;
  creatorId: string;
  status: string;
}

interface Campaign {
  id: string;
  title: string;
  description: string | null;
  status: string;
  type: string;
  startAt: string | Date | null;
  endAt: string | Date | null;
  commissionRate: number;
  totalStock: number | null;
  soldCount: number;
  recruitmentType?: string;
  targetParticipants: number | null;
  createdAt: string | Date;
  brand: { id: string; companyName: string; logoUrl?: string | null };
  products: CampaignProduct[];
  participations: CampaignParticipation[];
}

interface DetailParticipation extends CampaignParticipation {
  creator: { id: string; displayName: string | null; shopId: string | null; profileImageUrl: string | null } | null;
  orderCount: number;
  totalSales: number;
  commission: number;
}

interface CampaignDetail extends Omit<Campaign, 'participations'> {
  brand: { id: string; companyName: string; brandName: string | null; logoUrl?: string | null };
  participations: DetailParticipation[];
  stats: {
    totalOrders: number;
    totalSales: number;
    totalCommission: number;
    avgOrderAmount: number;
    shopVisitCount: number;
    conversionRate: string | null;
  };
}

interface BrandOption {
  id: string;
  companyName: string | null;
  brandName: string | null;
  logoUrl: string | null;
}

// ---------- Helpers ----------

function getDDay(endAt: string | Date | null): string | null {
  if (!endAt) return null;
  const end = new Date(endAt);
  const now = new Date();
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return '종료';
  if (diff === 0) return 'D-Day';
  return `D-${diff}`;
}

function formatDate(d: string | Date | null): string {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function formatKRW(v: number) {
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(v);
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  DRAFT: { label: '작성중', color: 'bg-gray-100 text-gray-700' },
  RECRUITING: { label: '모집중', color: 'bg-blue-100 text-blue-700' },
  ACTIVE: { label: '진행중', color: 'bg-green-100 text-green-700' },
  ENDED: { label: '종료', color: 'bg-red-100 text-red-700' },
};

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  GONGGU: { label: '공구', color: 'bg-purple-100 text-purple-700' },
  ALWAYS: { label: '상시', color: 'bg-amber-100 text-amber-700' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: 'bg-gray-100 text-gray-700' };
  return <Badge className={`${cfg.color} border-0 font-medium`}>{cfg.label}</Badge>;
}

function TypeBadge({ type }: { type: string }) {
  const cfg = TYPE_CONFIG[type] || { label: type, color: 'bg-gray-100 text-gray-700' };
  return <Badge className={`${cfg.color} border-0 font-medium`}>{cfg.label}</Badge>;
}

type StatusFilter = 'active' | 'draft' | 'ended' | 'all';

const STATUS_TABS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'active', label: '진행 중' },
  { value: 'draft', label: '작성 중' },
  { value: 'ended', label: '종료' },
  { value: 'all', label: '전체보기' },
];

function statusFilterToApi(f: StatusFilter): string {
  if (f === 'active') return 'ACTIVE';
  if (f === 'draft') return 'DRAFT';
  if (f === 'ended') return 'ENDED';
  return 'all';
}

function statusMatchesFilter(status: string, filter: StatusFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'active') return status === 'ACTIVE' || status === 'RECRUITING';
  if (filter === 'draft') return status === 'DRAFT';
  if (filter === 'ended') return status === 'ENDED';
  return true;
}

type CampaignType = 'all' | 'GONGGU' | 'ALWAYS';

const TYPE_TABS: Array<{ value: CampaignType; label: string }> = [
  { value: 'all', label: '전체' },
  { value: 'GONGGU', label: '공구' },
  { value: 'ALWAYS', label: '상시' },
];

const SORT_OPTIONS = [
  { value: 'recent', label: '최신순' },
  { value: 'deadline', label: '마감 임박순' },
  { value: 'name', label: '브랜드명 가나다순' },
];

function toTypeParam(v: CampaignType): string | null {
  if (v === 'GONGGU') return 'groupbuy';
  if (v === 'ALWAYS') return 'always';
  return null;
}

function fromTypeParam(v: string | null): CampaignType {
  if (v === 'groupbuy') return 'GONGGU';
  if (v === 'always') return 'ALWAYS';
  return 'all';
}

function fromStatusParam(v: string | null): StatusFilter {
  if (v === 'active' || v === 'draft' || v === 'ended' || v === 'all') return v;
  return 'active';
}

// ---------- Empty state ----------

function getEmptyState(
  totalCount: number,
  statusFilter: StatusFilter,
  typeFilter: CampaignType,
  brandFilter: string,
  brandName: string | null,
  hasSearch: boolean,
) {
  // No campaigns in entire system
  if (totalCount === 0 && brandFilter === 'all' && typeFilter === 'all' && !hasSearch) {
    return {
      title: '아직 등록된 캠페인이 없어요',
      description: '브랜드가 캠페인을 만들면 여기에 표시돼요',
      cta: null,
    };
  }

  // Search result empty
  if (hasSearch) {
    return {
      title: '검색 결과가 없어요',
      description: '다른 조건으로 검색해보세요',
      cta: 'reset' as const,
    };
  }

  // Brand filter active
  if (brandFilter !== 'all' && brandName) {
    return {
      title: `${brandName}의 캠페인이 없어요`,
      description: '다른 브랜드를 선택해보세요',
      cta: 'reset' as const,
    };
  }

  // Type filter active
  if (typeFilter !== 'all') {
    const label = typeFilter === 'GONGGU' ? '공구' : '상시';
    return {
      title: `${label} 캠페인이 없어요`,
      description: '다른 유형을 선택해보세요',
      cta: 'reset' as const,
    };
  }

  // Status tab active
  if (statusFilter !== 'all') {
    const statusLabels: Record<string, string> = {
      active: '진행 중인',
      draft: '작성 중인',
      ended: '종료된',
    };
    return {
      title: `${statusLabels[statusFilter] ?? ''} 캠페인이 없어요`,
      description: '다른 조건으로 검색해보세요',
      cta: 'reset' as const,
    };
  }

  return {
    title: '캠페인이 없어요',
    description: '다른 조건으로 검색해보세요',
    cta: 'reset' as const,
  };
}

// ---------- Main Component ----------

export default function AdminCampaignsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL-driven state
  const typeFilter = fromTypeParam(searchParams.get('type'));
  const statusFilter = fromStatusParam(searchParams.get('status'));
  const brandFilter = searchParams.get('brand') || 'all';
  const sortValue = searchParams.get('sort') || 'recent';
  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const [searchInput, setSearchInput] = useState(searchParams.get('q') ?? '');

  // Data state
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Detail sheet
  const [detail, setDetail] = useState<CampaignDetail | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetLoading, setSheetLoading] = useState(false);

  // URL update helper
  const updateUrl = useCallback((params: {
    type?: CampaignType;
    status?: StatusFilter;
    brand?: string;
    sort?: string;
    q?: string;
  }) => {
    const p = new URLSearchParams();
    const t = params.type ?? typeFilter;
    const s = params.status ?? statusFilter;
    const b = params.brand ?? brandFilter;
    const so = params.sort ?? sortValue;
    const q = params.q ?? search;

    const tp = toTypeParam(t);
    if (tp) p.set('type', tp);
    if (s !== 'active') p.set('status', s);
    if (b !== 'all') p.set('brand', b);
    if (so !== 'recent') p.set('sort', so);
    if (q.trim()) p.set('q', q.trim());

    const qs = p.toString();
    router.replace(`?${qs}`, { scroll: false });
  }, [typeFilter, statusFilter, brandFilter, sortValue, search, router]);

  // Load brands once
  useEffect(() => {
    getAdminBrandList().then(setBrands).catch(() => {});
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      if (searchInput !== search) {
        updateUrl({ q: searchInput });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch campaigns
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAdminCampaigns({
        type: typeFilter === 'all' ? undefined : typeFilter,
        brandId: brandFilter === 'all' ? undefined : brandFilter,
        search: search || undefined,
        sort: sortValue,
      });
      setCampaigns(data as Campaign[]);
      setTotalCount(prev => {
        // Only update total when no filters applied
        if (typeFilter === 'all' && brandFilter === 'all' && !search) {
          return data.length;
        }
        return prev;
      });
    } catch {
      toast.error('데이터를 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, brandFilter, search, sortValue]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Initialize total count
  useEffect(() => {
    if (typeFilter === 'all' && brandFilter === 'all' && !search) return;
    getAdminCampaigns({}).then((data) => {
      setTotalCount(data.length);
    }).catch(() => {});
  }, []);

  // Status-based filtering (client-side since we fetch all statuses)
  const filtered = useMemo(() => {
    return campaigns.filter(c => statusMatchesFilter(c.status, statusFilter));
  }, [campaigns, statusFilter]);

  // Status counts for tabs
  const statusCounts = useMemo(() => {
    const acc: Record<StatusFilter, number> = { active: 0, draft: 0, ended: 0, all: campaigns.length };
    campaigns.forEach(c => {
      if (c.status === 'ACTIVE' || c.status === 'RECRUITING') acc.active += 1;
      else if (c.status === 'DRAFT') acc.draft += 1;
      else if (c.status === 'ENDED') acc.ended += 1;
    });
    return acc;
  }, [campaigns]);

  // Brand name for empty state
  const selectedBrandName = useMemo(() => {
    if (brandFilter === 'all') return null;
    const b = brands.find(br => br.id === brandFilter);
    return b?.companyName ?? null;
  }, [brandFilter, brands]);

  async function openDetail(campaignId: string) {
    setSheetOpen(true);
    setSheetLoading(true);
    try {
      const data = await getAdminCampaignDetail(campaignId);
      setDetail(data as CampaignDetail);
    } catch {
      toast.error('상세 정보를 불러올 수 없습니다');
      setSheetOpen(false);
    } finally {
      setSheetLoading(false);
    }
  }

  function resetFilters() {
    setSearch('');
    setSearchInput('');
    router.replace('?', { scroll: false });
  }

  const approvedCount = (c: Campaign) => c.participations.filter(p => p.status === 'APPROVED').length;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Megaphone className="h-6 w-6" />
          캠페인 관리
        </h1>
        <p className="text-sm text-gray-500 mt-1">전체 캠페인 현황을 확인하고 관리합니다</p>
      </div>

      {/* Type segment control */}
      <div className="flex items-center gap-1 rounded-full bg-gray-100 p-1 w-fit">
        {TYPE_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => updateUrl({ type: tab.value })}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-medium transition-colors',
              typeFilter === tab.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters row: Brand + Status tabs + Search + Sort */}
      <div className="space-y-3">
        {/* Brand filter + Sort */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Select value={brandFilter} onValueChange={(v) => updateUrl({ brand: v })}>
              <SelectTrigger className="w-full sm:w-52">
                <Building2 className="h-4 w-4 text-gray-400 mr-1.5" />
                <SelectValue placeholder="브랜드 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 브랜드</SelectItem>
                {brands.map(b => (
                  <SelectItem key={b.id} value={b.id}>{b.companyName || b.brandName || b.id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="search"
                placeholder="캠페인명 또는 브랜드명으로 검색"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="h-10 w-full rounded-full border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-100"
              />
            </div>
            <Select value={sortValue} onValueChange={(v) => updateUrl({ sort: v })}>
              <SelectTrigger className="w-36 sm:w-40">
                <ArrowUpDown className="h-3.5 w-3.5 text-gray-400 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Status tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_TABS.map((tab) => {
            const active = statusFilter === tab.value;
            const count = statusCounts[tab.value];
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => updateUrl({ status: tab.value })}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100',
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'rounded-full px-1.5 text-xs tabular-nums',
                    active ? 'bg-white/15 text-white' : 'text-gray-400',
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : filtered.length === 0 ? (
        (() => {
          const empty = getEmptyState(totalCount, statusFilter, typeFilter, brandFilter, selectedBrandName, search.trim().length > 0);
          return (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-gray-100 bg-white py-20 text-center shadow-sm">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50">
                <Package className="h-7 w-7 text-gray-300" />
              </div>
              <p className="text-xl font-bold text-gray-900">{empty.title}</p>
              <p className="mt-2 max-w-md text-sm text-gray-500">{empty.description}</p>
              {empty.cta === 'reset' && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  필터 초기화
                </button>
              )}
            </div>
          );
        })()
      ) : (
        <div className="space-y-4">
          {filtered.map(c => {
            const dday = getDDay(c.endAt);
            const approved = approvedCount(c);
            return (
              <div
                key={c.id}
                className="cursor-pointer rounded-3xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md"
                onClick={() => openDetail(c.id)}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  {/* Brand badge + Campaign info */}
                  <div className="flex-1 min-w-0 space-y-3">
                    {/* Brand row */}
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={c.brand.logoUrl || ''} />
                        <AvatarFallback className="text-[10px] bg-gray-100">{c.brand.companyName[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium text-gray-500">{c.brand.companyName}</span>
                    </div>

                    {/* Title + badges */}
                    <div className="flex items-start gap-2">
                      <h3 className="text-base font-semibold text-gray-900 line-clamp-2">{c.title}</h3>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={c.status} />
                      <TypeBadge type={c.type} />
                      {dday && (c.status === 'ACTIVE' || c.status === 'RECRUITING') && (
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${dday === '종료' ? 'text-red-500 border-red-200' : 'text-blue-500 border-blue-200'}`}>
                          {dday}
                        </Badge>
                      )}
                    </div>

                    {/* Meta row */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{formatDate(c.startAt)} ~ {formatDate(c.endAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Percent className="h-3.5 w-3.5" />
                        <span>{(c.commissionRate * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        <span>{approved}명</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Package className="h-3.5 w-3.5" />
                        <span>{c.products.length}개</span>
                      </div>
                    </div>
                  </div>

                  {/* Sales progress (right side on desktop, bottom on mobile) */}
                  {c.totalStock !== null && (
                    <div className="w-full sm:w-56 shrink-0 rounded-2xl bg-gray-50 p-4">
                      <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                        <span>판매 {c.soldCount}/{c.totalStock}</span>
                        <span className="font-medium text-gray-700">{c.totalStock > 0 ? Math.round((c.soldCount / c.totalStock) * 100) : 0}%</span>
                      </div>
                      <Progress value={c.totalStock > 0 ? (c.soldCount / c.totalStock) * 100 : 0} className="h-1.5" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{detail?.title || '캠페인 상세'}</SheetTitle>
            <SheetDescription className="sr-only">캠페인 상세 정보</SheetDescription>
          </SheetHeader>
          {sheetLoading ? (
            <div className="py-12 text-center"><Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto" /></div>
          ) : detail && (
            <Tabs defaultValue="overview" className="mt-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">개요</TabsTrigger>
                <TabsTrigger value="products">상품</TabsTrigger>
                <TabsTrigger value="creators">성과</TabsTrigger>
                <TabsTrigger value="summary">매출</TabsTrigger>
              </TabsList>

              {/* Tab 1: Overview */}
              <TabsContent value="overview" className="space-y-4 mt-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={detail.status} />
                  <TypeBadge type={detail.type} />
                  {getDDay(detail.endAt) && (detail.status === 'ACTIVE' || detail.status === 'RECRUITING') && (
                    <Badge variant="outline" className="text-blue-500 border-blue-200">{getDDay(detail.endAt)}</Badge>
                  )}
                </div>

                {detail.description && <p className="text-sm text-muted-foreground">{detail.description}</p>}

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">브랜드</p><p className="text-sm font-medium">{detail.brand.brandName || detail.brand.companyName}</p></div>
                  <div className="p-3 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">기간</p><p className="text-sm font-medium">{formatDate(detail.startAt)} ~ {formatDate(detail.endAt)}</p></div>
                  <div className="p-3 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">커미션율</p><p className="text-sm font-medium">{(detail.commissionRate * 100).toFixed(0)}%</p></div>
                  <div className="p-3 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">모집 방식</p><p className="text-sm font-medium">{detail.recruitmentType === 'APPROVAL' ? '승인제' : '자유참여'}</p></div>
                </div>

                {detail.totalStock !== null && (
                  <div>
                    <p className="text-sm font-medium mb-2">한정수량</p>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">판매 {detail.soldCount.toLocaleString()}개 / 총 {detail.totalStock.toLocaleString()}개</span>
                      <span className="font-medium">{detail.totalStock > 0 ? Math.round((detail.soldCount / detail.totalStock) * 100) : 0}%</span>
                    </div>
                    <Progress value={detail.totalStock > 0 ? (detail.soldCount / detail.totalStock) * 100 : 0} className="h-2" />
                  </div>
                )}

                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">참여 크리에이터</p>
                  <p className="text-sm font-medium">
                    승인 {detail.participations.filter(p => p.status === 'APPROVED').length}명 / 대기 {detail.participations.filter(p => p.status === 'PENDING').length}명
                  </p>
                </div>
              </TabsContent>

              {/* Tab 2: Products */}
              <TabsContent value="products" className="space-y-3 mt-4">
                <p className="text-sm font-medium">상품 목록 ({detail.products.length}개)</p>
                {detail.products.map(cp => {
                  const discount = cp.product.price && cp.product.price > 0 ? Math.round((1 - cp.campaignPrice / cp.product.price) * 100) : 0;
                  return (
                    <div key={cp.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      {cp.product.thumbnailUrl ? (
                        <img src={cp.product.thumbnailUrl} alt={cp.product.name || ''} className="h-14 w-14 rounded-lg object-cover" />
                      ) : (
                        <div className="h-14 w-14 rounded-lg bg-gray-200 flex items-center justify-center"><ImageIcon className="h-5 w-5 text-gray-400" /></div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{cp.product.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-sm font-semibold text-blue-600">{cp.campaignPrice.toLocaleString()}원</span>
                          {cp.product.price && <span className="text-xs text-muted-foreground line-through">{cp.product.price.toLocaleString()}원</span>}
                          {discount > 0 && <Badge variant="outline" className="text-[10px] text-red-500 border-red-200">{discount}% OFF</Badge>}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {detail.products.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">등록된 상품이 없습니다</p>}
              </TabsContent>

              {/* Tab 3: Creator Performance */}
              <TabsContent value="creators" className="mt-4">
                <p className="text-sm font-medium mb-3">크리에이터 성과 ({detail.participations.length}명)</p>
                {detail.participations.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">참여 크리에이터가 없습니다</p>
                ) : (
                  <div className="space-y-2">
                    {detail.participations.map(p => (
                      <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={p.creator?.profileImageUrl || ''} />
                          <AvatarFallback>{(p.creator?.displayName || '?')[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{p.creator?.displayName || '알 수 없음'}</p>
                            <Badge variant="outline" className={`text-[10px] ${p.status === 'APPROVED' ? 'text-green-600 border-green-200' : 'text-yellow-600 border-yellow-200'}`}>
                              {p.status === 'APPROVED' ? '승인' : '대기'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">@{p.creator?.shopId || '-'}</p>
                        </div>
                        <div className="text-right text-xs">
                          {p.orderCount > 0 ? (
                            <>
                              <p className="font-medium">{formatKRW(p.totalSales)}</p>
                              <p className="text-muted-foreground">{p.orderCount}건 | 커미션 {formatKRW(p.commission)}</p>
                            </>
                          ) : (
                            <p className="text-muted-foreground">아직 판매 없음</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Tab 4: Sales Summary */}
              <TabsContent value="summary" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <ShoppingBag className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                    <p className="text-xs text-muted-foreground">총 주문</p>
                    <p className="text-xl font-bold">{detail.stats.totalOrders}건</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <TrendingUp className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                    <p className="text-xs text-muted-foreground">총 매출</p>
                    <p className="text-xl font-bold">{formatKRW(detail.stats.totalSales)}</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <Percent className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                    <p className="text-xs text-muted-foreground">총 커미션</p>
                    <p className="text-xl font-bold">{formatKRW(detail.stats.totalCommission)}</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <Package className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                    <p className="text-xs text-muted-foreground">평균 주문 금액</p>
                    <p className="text-xl font-bold">{formatKRW(detail.stats.avgOrderAmount)}</p>
                  </div>
                </div>
                {detail.stats.conversionRate && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm"><span className="text-muted-foreground">전환율:</span> <span className="font-semibold">{detail.stats.conversionRate}%</span> <span className="text-xs text-muted-foreground">({detail.stats.totalOrders}건 / {detail.stats.shopVisitCount}방문)</span></p>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
