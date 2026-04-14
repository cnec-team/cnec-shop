'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Search, Package, Clock, CheckCircle, Truck, PackageCheck, ThumbsUp,
  Instagram, Youtube, Save, Loader2, XCircle,
} from 'lucide-react';
import {
  getAdminSampleRequests, getAdminSampleStats, getAdminSampleDetail,
  updateAdminSampleNote, getAdminBrandList,
} from '@/lib/actions/admin';
import { toast } from 'sonner';

interface SampleRequest {
  id: string;
  status: string;
  decision: string | null;
  message: string | null;
  adminNote: string | null;
  trackingNumber: string | null;
  feedback: string | null;
  passReason: string | null;
  shippingAddress: unknown;
  createdAt: Date;
  respondedAt: Date | null;
  shippedAt: Date | null;
  receivedAt: Date | null;
  decidedAt: Date | null;
  creator: {
    id: string;
    displayName: string | null;
    shopId: string | null;
    profileImageUrl: string | null;
    instagramHandle?: string | null;
    youtubeHandle?: string | null;
    tiktokHandle?: string | null;
  };
  brand: { id: string; brandName: string | null; companyName: string };
  product: { id: string; name: string | null; thumbnailUrl: string | null; price?: number | null } | null;
}

interface SampleStats {
  pending: number;
  approved: number;
  shipped: number;
  received: number;
  decided: number;
  rejected: number;
  cancelled: number;
  decidedProceed: number;
  conversionRate: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: '대기중', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  approved: { label: '승인', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  shipped: { label: '발송완료', color: 'bg-orange-100 text-orange-700', icon: Truck },
  received: { label: '수령완료', color: 'bg-emerald-100 text-emerald-700', icon: PackageCheck },
  decided: { label: '결정완료', color: 'bg-green-100 text-green-800', icon: ThumbsUp },
  rejected: { label: '거절', color: 'bg-red-100 text-red-700', icon: XCircle },
  cancelled: { label: '취소', color: 'bg-gray-100 text-gray-600', icon: XCircle },
};

const DECISION_CONFIG: Record<string, { label: string; color: string }> = {
  PROCEED: { label: '공구진행', color: 'bg-green-100 text-green-800' },
  PASS: { label: '패스', color: 'bg-gray-100 text-gray-600' },
};

function SampleStatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: 'bg-gray-100 text-gray-600' };
  return <Badge className={`${cfg.color} border-0`}>{cfg.label}</Badge>;
}

function formatDate(d: Date | string | null): string {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function formatDateTime(d: Date | string | null): string {
  if (!d) return '-';
  return new Date(d).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function AdminSamplesPage() {
  const [samples, setSamples] = useState<SampleRequest[]>([]);
  const [stats, setStats] = useState<SampleStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [brands, setBrands] = useState<{ id: string; brandName: string | null; companyName: string | null }[]>([]);

  // Detail sheet
  const [detail, setDetail] = useState<SampleRequest | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [adminNote, setAdminNote] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [sampleData, statsData] = await Promise.all([
        getAdminSampleRequests({ status: statusFilter, brandId: brandFilter, search }),
        getAdminSampleStats(),
      ]);
      setSamples(sampleData as SampleRequest[]);
      setStats(statsData as SampleStats);
    } catch {
      toast.error('데이터를 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, brandFilter, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    getAdminBrandList().then(data => setBrands(data)).catch(() => {});
  }, []);

  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  async function openDetail(sampleId: string) {
    setSheetOpen(true);
    setSheetLoading(true);
    try {
      const data = await getAdminSampleDetail(sampleId);
      setDetail(data as SampleRequest);
      setAdminNote(data.adminNote || '');
    } catch {
      toast.error('상세 정보를 불러올 수 없습니다');
      setSheetOpen(false);
    } finally {
      setSheetLoading(false);
    }
  }

  async function handleSaveNote() {
    if (!detail) return;
    setSaving(true);
    try {
      await updateAdminSampleNote(detail.id, adminNote);
      toast.success('메모가 저장되었습니다');
    } catch {
      toast.error('저장에 실패했습니다');
    } finally {
      setSaving(false);
    }
  }

  const statCards = [
    { key: 'pending', label: '대기', icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-50' },
    { key: 'approved', label: '승인', icon: CheckCircle, color: 'text-blue-500', bg: 'bg-blue-50' },
    { key: 'shipped', label: '발송', icon: Truck, color: 'text-orange-500', bg: 'bg-orange-50' },
    { key: 'received', label: '수령', icon: PackageCheck, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { key: 'decided', label: '결정', icon: ThumbsUp, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Package className="h-6 w-6" />샘플 관리</h1>
        <p className="text-sm text-muted-foreground mt-1">제품 체험 신청 현황을 모니터링합니다</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {statCards.map(sc => {
          const Icon = sc.icon;
          const count = stats ? stats[sc.key as keyof SampleStats] as number : 0;
          const active = statusFilter === sc.key;
          return (
            <Card key={sc.key} className={`cursor-pointer transition-all hover:shadow-md ${active ? 'ring-2 ring-blue-500' : ''}`} onClick={() => setStatusFilter(statusFilter === sc.key ? 'all' : sc.key)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div><p className="text-xs text-muted-foreground">{sc.label}</p><p className="text-2xl font-bold mt-1">{count}</p></div>
                  <div className={`h-10 w-10 rounded-xl ${sc.bg} flex items-center justify-center`}><Icon className={`h-5 w-5 ${sc.color}`} /></div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>샘플 신청 목록</CardTitle>
              <CardDescription>{samples.length}건</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[120px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 상태</SelectItem>
                  <SelectItem value="pending">대기중</SelectItem>
                  <SelectItem value="approved">승인</SelectItem>
                  <SelectItem value="shipped">발송완료</SelectItem>
                  <SelectItem value="received">수령완료</SelectItem>
                  <SelectItem value="decided">결정완료</SelectItem>
                  <SelectItem value="rejected">거절</SelectItem>
                </SelectContent>
              </Select>
              <Select value={brandFilter} onValueChange={setBrandFilter}>
                <SelectTrigger className="w-full sm:w-[150px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 브랜드</SelectItem>
                  {brands.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.brandName || b.companyName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="크리에이터/브랜드 검색..." value={searchInput} onChange={e => setSearchInput(e.target.value)} className="pl-10" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : samples.length === 0 ? (
            <div className="text-center py-12"><Package className="mx-auto h-12 w-12 text-muted-foreground/50" /><p className="mt-4 text-muted-foreground">샘플 신청이 없습니다</p></div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>크리에이터</TableHead>
                      <TableHead>브랜드</TableHead>
                      <TableHead>상품</TableHead>
                      <TableHead>신청일</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>결정</TableHead>
                      <TableHead>메모</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {samples.map(s => (
                      <TableRow key={s.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetail(s.id)}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={s.creator.profileImageUrl || ''} />
                              <AvatarFallback>{(s.creator.displayName || '?')[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{s.creator.displayName || '-'}</p>
                              <p className="text-xs text-muted-foreground">@{s.creator.shopId || '-'}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{s.brand.brandName || s.brand.companyName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {s.product?.thumbnailUrl && <img src={s.product.thumbnailUrl} alt="" className="h-8 w-8 rounded object-cover" />}
                            <span className="text-sm truncate max-w-[120px]">{s.product?.name || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(s.createdAt)}</TableCell>
                        <TableCell><SampleStatusBadge status={s.status} /></TableCell>
                        <TableCell>
                          {s.decision ? (
                            <Badge className={`${DECISION_CONFIG[s.decision]?.color || 'bg-gray-100 text-gray-600'} border-0`}>
                              {DECISION_CONFIG[s.decision]?.label || s.decision}
                            </Badge>
                          ) : <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">{s.message?.slice(0, 20) || '-'}{s.message && s.message.length > 20 ? '...' : ''}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {samples.map(s => (
                  <Card key={s.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetail(s.id)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={s.creator.profileImageUrl || ''} />
                            <AvatarFallback>{(s.creator.displayName || '?')[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{s.creator.displayName || '-'}</p>
                            <p className="text-xs text-muted-foreground">{s.brand.brandName || s.brand.companyName}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <SampleStatusBadge status={s.status} />
                          {s.decision && <Badge className={`${DECISION_CONFIG[s.decision]?.color || ''} border-0 text-xs`}>{DECISION_CONFIG[s.decision]?.label}</Badge>}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        {s.product?.thumbnailUrl && <img src={s.product.thumbnailUrl} alt="" className="h-6 w-6 rounded object-cover" />}
                        <span>{s.product?.name || '-'}</span>
                        <span className="ml-auto">{formatDate(s.createdAt)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>샘플 신청 상세</SheetTitle>
          </SheetHeader>
          {sheetLoading ? (
            <div className="py-12 text-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" /></div>
          ) : detail && (
            <div className="space-y-5 mt-4">
              {/* Creator */}
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={detail.creator.profileImageUrl || ''} />
                  <AvatarFallback>{(detail.creator.displayName || '?')[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{detail.creator.displayName || '-'}</p>
                  <p className="text-sm text-muted-foreground">@{detail.creator.shopId || '-'}</p>
                  <div className="flex gap-2 mt-1">
                    {detail.creator.instagramHandle && (
                      <a href={`https://instagram.com/${detail.creator.instagramHandle}`} target="_blank" rel="noopener noreferrer">
                        <Instagram className="h-4 w-4 text-pink-500" />
                      </a>
                    )}
                    {detail.creator.youtubeHandle && (
                      <a href={`https://youtube.com/@${detail.creator.youtubeHandle}`} target="_blank" rel="noopener noreferrer">
                        <Youtube className="h-4 w-4 text-red-500" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Brand + Product */}
              <div>
                <p className="text-sm font-medium mb-2">브랜드 / 상품</p>
                <p className="text-sm text-muted-foreground">{detail.brand.brandName || detail.brand.companyName}</p>
                {detail.product && (
                  <div className="flex items-center gap-3 mt-2 p-3 rounded-lg bg-muted/30">
                    {detail.product.thumbnailUrl && <img src={detail.product.thumbnailUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />}
                    <div>
                      <p className="text-sm font-medium">{detail.product.name}</p>
                      {detail.product.price && <p className="text-xs text-muted-foreground">{detail.product.price.toLocaleString()}원</p>}
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Message */}
              {detail.message && (
                <div>
                  <p className="text-sm font-medium mb-1">신청 메시지</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{detail.message}</p>
                </div>
              )}

              {/* Shipping Info */}
              {(detail.trackingNumber || !!detail.shippingAddress) && (
                <div>
                  <p className="text-sm font-medium mb-1">배송 정보</p>
                  {!!detail.shippingAddress && <p className="text-sm text-muted-foreground">{typeof detail.shippingAddress === 'string' ? detail.shippingAddress : JSON.stringify(detail.shippingAddress as Record<string, unknown>)}</p>}
                  {detail.trackingNumber && <p className="text-sm mt-1"><span className="text-muted-foreground">운송장:</span> <span className="font-mono">{detail.trackingNumber}</span></p>}
                </div>
              )}

              <Separator />

              {/* Timeline */}
              <div>
                <p className="text-sm font-medium mb-3">상태 타임라인</p>
                <div className="space-y-3 relative">
                  <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-muted" />
                  {[
                    { label: '신청', date: detail.createdAt, done: true },
                    { label: '승인', date: detail.respondedAt, done: !!detail.respondedAt },
                    { label: '발송', date: detail.shippedAt, done: !!detail.shippedAt },
                    { label: '수령', date: detail.receivedAt, done: !!detail.receivedAt },
                    { label: '결정', date: detail.decidedAt, done: !!detail.decidedAt },
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-3 relative">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center z-10 ${step.done ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                        <CheckCircle className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm ${step.done ? 'font-medium' : 'text-muted-foreground'}`}>{step.label}</p>
                        {step.date && <p className="text-xs text-muted-foreground">{formatDateTime(step.date)}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Decision */}
              {detail.decision && (
                <div>
                  <p className="text-sm font-medium mb-1">결정 결과</p>
                  <Badge className={`${DECISION_CONFIG[detail.decision]?.color || ''} border-0`}>
                    {detail.decision === 'PROCEED' ? '공구 진행 결정' : '패스'}
                  </Badge>
                  {detail.decision === 'PASS' && detail.passReason && (
                    <p className="text-sm text-muted-foreground mt-1">사유: {detail.passReason}</p>
                  )}
                </div>
              )}

              {/* Feedback */}
              {detail.feedback && (
                <div>
                  <p className="text-sm font-medium mb-1">피드백</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{detail.feedback}</p>
                </div>
              )}

              <Separator />

              {/* Admin Note */}
              <div>
                <p className="text-sm font-medium mb-2">어드민 메모</p>
                <Textarea
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                  placeholder="메모를 입력하세요..."
                  rows={3}
                />
                <Button size="sm" className="mt-2" onClick={handleSaveNote} disabled={saving}>
                  <Save className="h-4 w-4 mr-1" />{saving ? '저장 중...' : '저장'}
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
