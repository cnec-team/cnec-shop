'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  ShoppingBag, Eye,
} from 'lucide-react';
import { getAdminCampaigns, getAdminCampaignStats, getAdminCampaignDetail } from '@/lib/actions/admin';
import { toast } from 'sonner';

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
  brand: { id: string; companyName: string };
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
  brand: { id: string; companyName: string; brandName: string | null };
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

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({ DRAFT: 0, RECRUITING: 0, ACTIVE: 0, ENDED: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<CampaignDetail | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetLoading, setSheetLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [campaignData, statsData] = await Promise.all([
        getAdminCampaigns({ status: statusFilter, type: typeFilter, search }),
        getAdminCampaignStats(),
      ]);
      setCampaigns(campaignData as Campaign[]);
      setStats(statsData);
    } catch {
      toast.error('데이터를 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

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

  const approvedCount = (c: Campaign) => c.participations.filter(p => p.status === 'APPROVED').length;

  const statCards = [
    { key: 'DRAFT', label: '작성중', icon: FileEdit, color: 'text-gray-500' },
    { key: 'RECRUITING', label: '모집중', icon: Users, color: 'text-blue-500' },
    { key: 'ACTIVE', label: '진행중', icon: CheckCircle, color: 'text-green-500' },
    { key: 'ENDED', label: '종료', icon: XCircle, color: 'text-red-500' },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Megaphone className="h-6 w-6" />캠페인 관리</h1>
        <p className="text-sm text-gray-500 mt-1">전체 캠페인 현황을 확인하고 관리합니다</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(sc => {
          const Icon = sc.icon;
          const active = statusFilter === sc.key;
          return (
            <Card key={sc.key} className={`cursor-pointer transition-all hover:shadow-md ${active ? 'ring-2 ring-blue-500 bg-blue-50/50' : ''}`} onClick={() => setStatusFilter(statusFilter === sc.key ? 'all' : sc.key)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div><p className="text-xs text-gray-500">{sc.label}</p><p className="text-2xl font-bold mt-1">{stats[sc.key] ?? 0}</p></div>
                  <Icon className={`h-8 w-8 ${sc.color} opacity-60`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="캠페인명 / 브랜드명 검색" value={searchInput} onChange={e => setSearchInput(e.target.value)} className="pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="타입" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 타입</SelectItem>
            <SelectItem value="GONGGU">공구</SelectItem>
            <SelectItem value="ALWAYS">상시</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
      ) : campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400"><Megaphone className="h-12 w-12 mb-3 opacity-40" /><p className="text-sm">캠페인이 없습니다</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map(c => {
            const dday = getDDay(c.endAt);
            const approved = approvedCount(c);
            return (
              <Card key={c.id} className="cursor-pointer hover:shadow-md transition-all" onClick={() => openDetail(c.id)}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base font-semibold line-clamp-2">{c.title}</CardTitle>
                    <StatusBadge status={c.status} />
                  </div>
                  <div className="flex items-center gap-2 mt-1"><Building2 className="h-3.5 w-3.5 text-gray-400" /><span className="text-xs text-gray-500">{c.brand.companyName}</span></div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatDate(c.startAt)} ~ {formatDate(c.endAt)}</span>
                    {dday && (c.status === 'ACTIVE' || c.status === 'RECRUITING') && (
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${dday === '종료' ? 'text-red-500 border-red-200' : 'text-blue-500 border-blue-200'}`}>{dday}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <div className="flex items-center gap-1"><Percent className="h-3.5 w-3.5 text-gray-400" /><span>{(c.commissionRate * 100).toFixed(0)}%</span></div>
                    <div className="flex items-center gap-1"><Users className="h-3.5 w-3.5 text-gray-400" /><span>{approved}명</span></div>
                    <div className="flex items-center gap-1"><Package className="h-3.5 w-3.5 text-gray-400" /><span>{c.products.length}개</span></div>
                  </div>
                  {c.totalStock !== null && (
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>판매 {c.soldCount}/{c.totalStock}</span>
                        <span>{c.totalStock > 0 ? Math.round((c.soldCount / c.totalStock) * 100) : 0}%</span>
                      </div>
                      <Progress value={c.totalStock > 0 ? (c.soldCount / c.totalStock) * 100 : 0} className="h-1.5" />
                    </div>
                  )}
                  <div><TypeBadge type={c.type} /></div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

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
