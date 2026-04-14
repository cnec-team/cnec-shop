'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Search, Building2, Check, X, ShieldAlert, TrendingUp, Package, Megaphone,
  ShoppingBag, Mail, Phone, User, FileText, Truck, ExternalLink, Clock,
} from 'lucide-react';
import { getAdminBrands, getAdminBrandDetail, updateBrandStatus } from '@/lib/actions/admin';
import { toast } from 'sonner';

interface AdminBrand {
  id: string;
  userId: string;
  brandName: string | null;
  companyName: string;
  representativeName: string | null;
  businessNumber: string | null;
  businessRegistrationUrl: string | null;
  logoUrl: string | null;
  description: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  platformFeeRate: number;
  creatorCommissionRate: number | null;
  defaultShippingFee: number;
  freeShippingThreshold: number;
  defaultCourier: string | null;
  returnAddress: string | null;
  approved: boolean;
  approvedAt: Date | null;
  mocraStatus: string | null;
  createdAt: Date;
  user: { email: string; phone: string | null; name: string | null } | null;
  productCount: number;
  activeCampaignCount: number;
  orderCount: number;
  totalSales: number;
}

interface BrandDetail {
  id: string;
  userId: string;
  brandName: string | null;
  companyName: string;
  representativeName: string | null;
  businessNumber: string | null;
  businessRegistrationUrl: string | null;
  logoUrl: string | null;
  description: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  platformFeeRate: number;
  creatorCommissionRate: number | null;
  defaultShippingFee: number;
  freeShippingThreshold: number;
  defaultCourier: string | null;
  returnAddress: string | null;
  approved: boolean;
  approvedAt: Date | null;
  mocraStatus: string | null;
  createdAt: Date;
  user: { email: string; phone: string | null; name: string | null } | null;
  products: { id: string; name: string | null; price: number; status: string; thumbnailUrl: string | null }[];
  campaigns: { id: string; title: string; status: string; type: string; startAt: Date | null; endAt: Date | null }[];
  recentOrders: { id: string; orderNumber: string | null; totalAmount: number; status: string; createdAt: Date }[];
  totalSales: number;
  totalOrders: number;
  productCount?: number;
  activeCampaignCount?: number;
  orderCount?: number;
}

type BrandAction = 'approve' | 'suspend' | 'reject';

const STATUS_LABELS: Record<string, string> = {
  PAID: '결제완료', PREPARING: '준비중', SHIPPING: '배송중', DELIVERED: '배송완료',
  CONFIRMED: '확정', CANCELLED: '취소', REFUNDED: '환불',
};

const CAMPAIGN_STATUS: Record<string, string> = {
  DRAFT: '초안', RECRUITING: '모집중', ACTIVE: '진행중', ENDED: '종료',
};

function formatKRW(v: number) {
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(v);
}

function getBrandStatus(brand: { approved: boolean; approvedAt: Date | null }): 'approved' | 'pending' | 'suspended' {
  if (brand.approved) return 'approved';
  if (brand.approvedAt) return 'suspended'; // Was approved before, now suspended
  return 'pending';
}

function statusBadge(status: string) {
  switch (status) {
    case 'approved': return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">승인</Badge>;
    case 'pending': return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">대기</Badge>;
    case 'suspended': return <Badge variant="destructive">정지</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
}

export default function AdminBrandsPage() {
  const t = useTranslations('admin');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [brands, setBrands] = useState<AdminBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sheet
  const [selectedBrand, setSelectedBrand] = useState<BrandDetail | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetLoading, setSheetLoading] = useState(false);

  // Action dialog
  const [actionDialog, setActionDialog] = useState<{ open: boolean; action: BrandAction; brandId: string; brandName: string }>({ open: false, action: 'approve', brandId: '', brandName: '' });
  const [actionUpdating, setActionUpdating] = useState(false);

  useEffect(() => { fetchBrands(); }, []);

  async function fetchBrands() {
    try {
      const data = await getAdminBrands();
      setBrands(data as AdminBrand[]);
    } catch {
      setError('데이터를 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      total: brands.length,
      approved: brands.filter(b => b.approved).length,
      pending: brands.filter(b => !b.approved && !b.approvedAt).length,
      newThisMonth: brands.filter(b => new Date(b.createdAt) >= monthStart).length,
    };
  }, [brands]);

  const filtered = useMemo(() => {
    return brands.filter(b => {
      const status = getBrandStatus(b);
      if (statusFilter !== 'all' && status !== statusFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          b.brandName?.toLowerCase().includes(s) ||
          b.companyName?.toLowerCase().includes(s) ||
          b.businessNumber?.includes(s) ||
          b.contactEmail?.toLowerCase().includes(s) ||
          b.user?.email?.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [brands, search, statusFilter]);

  async function openDetail(brandId: string) {
    setSheetOpen(true);
    setSheetLoading(true);
    try {
      const detail = await getAdminBrandDetail(brandId);
      setSelectedBrand(detail as BrandDetail);
    } catch {
      toast.error('상세 정보를 불러올 수 없습니다');
      setSheetOpen(false);
    } finally {
      setSheetLoading(false);
    }
  }

  function openActionDialog(action: BrandAction, brandId: string, brandName: string) {
    setActionDialog({ open: true, action, brandId, brandName });
  }

  async function handleAction() {
    setActionUpdating(true);
    try {
      await updateBrandStatus(actionDialog.brandId, actionDialog.action);
      const labels = { approve: '승인', suspend: '정지', reject: '거절' };
      toast.success(`브랜드가 ${labels[actionDialog.action]}되었습니다`);
      setActionDialog(prev => ({ ...prev, open: false }));
      fetchBrands();
      if (sheetOpen && selectedBrand?.id === actionDialog.brandId) {
        const detail = await getAdminBrandDetail(actionDialog.brandId);
        setSelectedBrand(detail as BrandDetail);
      }
    } catch {
      toast.error('처리에 실패했습니다');
    } finally {
      setActionUpdating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold">{t('brandManagement')}</h1>
        <p className="text-muted-foreground">{t('brandManagementDesc')}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center"><Building2 className="h-5 w-5 text-blue-600" /></div><div><p className="text-sm text-muted-foreground">전체</p><p className="text-2xl font-bold">{stats.total}개</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center"><Check className="h-5 w-5 text-green-600" /></div><div><p className="text-sm text-muted-foreground">승인됨</p><p className="text-2xl font-bold">{stats.approved}개</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-yellow-50 flex items-center justify-center"><Clock className="h-5 w-5 text-yellow-600" /></div><div><p className="text-sm text-muted-foreground">대기중</p><p className="text-2xl font-bold">{stats.pending}개</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center"><Building2 className="h-5 w-5 text-purple-600" /></div><div><p className="text-sm text-muted-foreground">이번 달 신규</p><p className="text-2xl font-bold">{stats.newThisMonth}개</p></div></div></CardContent></Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>{t('allBrands')}</CardTitle>
              <CardDescription>{filtered.length}개의 브랜드</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[120px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 상태</SelectItem>
                  <SelectItem value="approved">승인</SelectItem>
                  <SelectItem value="pending">대기</SelectItem>
                  <SelectItem value="suspended">정지</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="브랜드명/회사명/사업자번호/이메일 검색..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
          ) : error ? (
            <div className="text-center py-12"><Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" /><p className="mt-4 text-muted-foreground">{error}</p></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12"><Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" /><p className="mt-4 text-muted-foreground">브랜드가 없습니다</p></div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>브랜드</TableHead>
                      <TableHead>사업자번호</TableHead>
                      <TableHead>연락처</TableHead>
                      <TableHead className="text-right">상품</TableHead>
                      <TableHead className="text-right">총 매출</TableHead>
                      <TableHead className="text-right">수수료율</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>등록일</TableHead>
                      <TableHead className="text-right">액션</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(b => {
                      const status = getBrandStatus(b);
                      return (
                        <TableRow key={b.id} className={`cursor-pointer hover:bg-muted/50 ${status === 'pending' ? 'bg-yellow-50/60' : ''}`} onClick={() => openDetail(b.id)}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarImage src={b.logoUrl || ''} />
                                <AvatarFallback>{(b.brandName || b.companyName || '?')[0]}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{b.brandName || b.companyName}</p>
                                {b.brandName && b.companyName !== b.brandName && (
                                  <p className="text-xs text-muted-foreground">{b.companyName}</p>
                                )}
                                {b.representativeName && <p className="text-xs text-muted-foreground">{b.representativeName} 대표</p>}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-mono">{b.businessNumber || '-'}</span>
                              {b.businessRegistrationUrl && (
                                <a href={b.businessRegistrationUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                                  <FileText className="h-3.5 w-3.5 text-blue-500 hover:text-blue-700" />
                                </a>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs space-y-0.5">
                              {(b.contactEmail || b.user?.email) && <p className="flex items-center gap-1 text-muted-foreground"><Mail className="h-3 w-3" />{b.contactEmail || b.user?.email}</p>}
                              {(b.contactPhone || b.user?.phone) && <p className="flex items-center gap-1"><Phone className="h-3 w-3" />{b.contactPhone || b.user?.phone}</p>}
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-sm">{b.productCount}</TableCell>
                          <TableCell className="text-right text-sm font-medium">{formatKRW(b.totalSales)}</TableCell>
                          <TableCell className="text-right text-xs">
                            <span className="text-sm">10%</span>
                            <p className="text-muted-foreground">(결제 수수료 포함)</p>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 flex-wrap">
                              {statusBadge(status)}
                              {b.mocraStatus && (
                                <Badge variant="outline" className={`text-[10px] px-1 py-0 ${b.mocraStatus === 'green' ? 'border-green-400 text-green-700' : b.mocraStatus === 'yellow' ? 'border-yellow-400 text-yellow-700' : 'border-red-400 text-red-700'}`}>
                                  MoCRA
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{new Date(b.createdAt).toLocaleDateString('ko-KR')}</TableCell>
                          <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                            {status === 'pending' && (
                              <div className="flex gap-1 justify-end">
                                <Button size="sm" variant="default" onClick={() => openActionDialog('approve', b.id, b.companyName)}>
                                  <Check className="h-3.5 w-3.5 mr-1" />승인
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => openActionDialog('reject', b.id, b.companyName)}>
                                  <X className="h-3.5 w-3.5 mr-1" />거절
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {filtered.map(b => {
                  const status = getBrandStatus(b);
                  return (
                    <Card key={b.id} className={`cursor-pointer hover:bg-muted/50 ${status === 'pending' ? 'bg-yellow-50/60' : ''}`} onClick={() => openDetail(b.id)}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={b.logoUrl || ''} />
                              <AvatarFallback>{(b.brandName || b.companyName || '?')[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{b.brandName || b.companyName}</p>
                              <p className="text-xs text-muted-foreground">{b.representativeName || '-'} | {b.businessNumber || '-'}</p>
                            </div>
                          </div>
                          <div className="flex gap-1 items-center">
                            {statusBadge(status)}
                            {b.mocraStatus && (
                              <Badge variant="outline" className={`text-[10px] px-1 py-0 ${b.mocraStatus === 'green' ? 'border-green-400 text-green-700' : b.mocraStatus === 'yellow' ? 'border-yellow-400 text-yellow-700' : 'border-red-400 text-red-700'}`}>MoCRA</Badge>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                          <div><p className="text-muted-foreground">상품</p><p className="font-medium">{b.productCount}개</p></div>
                          <div><p className="text-muted-foreground">매출</p><p className="font-medium">{formatKRW(b.totalSales)}</p></div>
                          <div><p className="text-muted-foreground">수수료</p><p className="font-medium">10%</p></div>
                        </div>
                        {status === 'pending' && (
                          <div className="mt-3 flex gap-2" onClick={e => e.stopPropagation()}>
                            <Button size="sm" className="flex-1" onClick={() => openActionDialog('approve', b.id, b.companyName)}>
                              <Check className="h-3.5 w-3.5 mr-1" />승인
                            </Button>
                            <Button size="sm" variant="destructive" className="flex-1" onClick={() => openActionDialog('reject', b.id, b.companyName)}>
                              <X className="h-3.5 w-3.5 mr-1" />거절
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>브랜드 상세</SheetTitle>
          </SheetHeader>
          {sheetLoading ? (
            <div className="py-12 text-center text-muted-foreground">로딩 중...</div>
          ) : selectedBrand && (
            <div className="space-y-6 mt-4">
              {/* Brand Info */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedBrand.logoUrl || ''} />
                  <AvatarFallback className="text-lg">{(selectedBrand.brandName || selectedBrand.companyName || '?')[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-semibold">{selectedBrand.brandName || selectedBrand.companyName}</p>
                  {selectedBrand.brandName && selectedBrand.companyName !== selectedBrand.brandName && (
                    <p className="text-sm text-muted-foreground">{selectedBrand.companyName}</p>
                  )}
                  {statusBadge(getBrandStatus(selectedBrand))}
                </div>
              </div>

              {selectedBrand.description && <p className="text-sm text-muted-foreground">{selectedBrand.description}</p>}

              {/* Business Info */}
              <div className="text-sm space-y-1.5">
                <p className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /><span className="text-muted-foreground">대표자:</span> {selectedBrand.representativeName || '-'}</p>
                <p className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" /><span className="text-muted-foreground">사업자번호:</span> <span className="font-mono">{selectedBrand.businessNumber || '-'}</span></p>
                {selectedBrand.businessRegistrationUrl && (
                  <a href={selectedBrand.businessRegistrationUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline">
                    <ExternalLink className="h-4 w-4" />사업자등록증 보기
                  </a>
                )}
              </div>

              <Separator />

              {/* Contact */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2"><Mail className="h-4 w-4" />연락처</h3>
                <div className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">이메일:</span> {selectedBrand.contactEmail || selectedBrand.user?.email || '-'}</p>
                  <p><span className="text-muted-foreground">전화:</span> {selectedBrand.contactPhone || selectedBrand.user?.phone || '-'}</p>
                  <p><span className="text-muted-foreground">담당자:</span> {selectedBrand.user?.name || '-'}</p>
                </div>
              </div>

              <Separator />

              {/* Operation Info */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2"><Truck className="h-4 w-4" />운영 정보</h3>
                <div className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">플랫폼 수수료:</span> 10% (결제 수수료 포함)</p>
                  <p className="text-xs text-muted-foreground pl-4">공동구매 진행 시 브랜드에 청구되는 수수료입니다. 크리에이터 커미션은 별도입니다.</p>
                  <p><span className="text-muted-foreground">커미션율:</span> {selectedBrand.creatorCommissionRate ?? '-'}%</p>
                  <p><span className="text-muted-foreground">기본 배송비:</span> {formatKRW(selectedBrand.defaultShippingFee)}</p>
                  <p><span className="text-muted-foreground">무료배송 기준:</span> {selectedBrand.freeShippingThreshold > 0 ? formatKRW(selectedBrand.freeShippingThreshold) : '-'}</p>
                  <p><span className="text-muted-foreground">택배사:</span> {selectedBrand.defaultCourier || '-'}</p>
                  <p><span className="text-muted-foreground">반품주소:</span> {selectedBrand.returnAddress || '-'}</p>
                  {selectedBrand.mocraStatus && <p><span className="text-muted-foreground">MoCRA:</span> <Badge variant="outline" className={selectedBrand.mocraStatus === 'green' ? 'border-green-500 text-green-700' : selectedBrand.mocraStatus === 'yellow' ? 'border-yellow-500 text-yellow-700' : 'border-red-500 text-red-700'}>{selectedBrand.mocraStatus}</Badge></p>}
                </div>
              </div>

              <Separator />

              {/* Stats */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4" />성과</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-muted/50 rounded-lg"><p className="text-xs text-muted-foreground">등록 상품</p><p className="font-semibold">{selectedBrand.productCount ?? selectedBrand.products.length}개</p></div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg"><p className="text-xs text-muted-foreground">진행 캠페인</p><p className="font-semibold">{selectedBrand.activeCampaignCount ?? selectedBrand.campaigns.length}개</p></div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg"><p className="text-xs text-muted-foreground">총 주문</p><p className="font-semibold">{selectedBrand.totalOrders}건</p></div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg"><p className="text-xs text-muted-foreground">총 매출</p><p className="font-semibold">{formatKRW(selectedBrand.totalSales)}</p></div>
                </div>
              </div>

              <Separator />

              {/* Products */}
              {selectedBrand.products.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2"><Package className="h-4 w-4" />최근 상품</h3>
                  <div className="space-y-2">
                    {selectedBrand.products.map(p => (
                      <div key={p.id} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                        <div className="flex items-center gap-2">
                          {p.thumbnailUrl && <Avatar className="h-8 w-8 rounded"><AvatarImage src={p.thumbnailUrl} /><AvatarFallback>P</AvatarFallback></Avatar>}
                          <span className="font-medium">{p.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{p.status}</Badge>
                          <span>{formatKRW(p.price)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Orders */}
              {selectedBrand.recentOrders.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2"><ShoppingBag className="h-4 w-4" />최근 주문</h3>
                  <div className="space-y-2">
                    {selectedBrand.recentOrders.slice(0, 5).map(o => (
                      <div key={o.id} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                        <div>
                          <span className="font-medium">{o.orderNumber || o.id.slice(0, 8)}</span>
                          <span className="text-muted-foreground ml-2">{new Date(o.createdAt).toLocaleDateString('ko-KR')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{STATUS_LABELS[o.status] || o.status}</Badge>
                          <span className="font-medium">{formatKRW(o.totalAmount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Actions */}
              <div className="space-y-3">
                <h3 className="font-semibold">관리</h3>
                {(() => {
                  const status = getBrandStatus(selectedBrand);
                  return (
                    <div className="flex gap-2 flex-wrap">
                      {status === 'pending' && (
                        <>
                          <Button size="sm" className="flex-1" onClick={() => openActionDialog('approve', selectedBrand.id, selectedBrand.companyName)}>
                            <Check className="h-4 w-4 mr-2" />승인
                          </Button>
                          <Button size="sm" variant="destructive" className="flex-1" onClick={() => openActionDialog('reject', selectedBrand.id, selectedBrand.companyName)}>
                            <X className="h-4 w-4 mr-2" />거절
                          </Button>
                        </>
                      )}
                      {status === 'approved' && (
                        <Button size="sm" variant="destructive" className="flex-1" onClick={() => openActionDialog('suspend', selectedBrand.id, selectedBrand.companyName)}>
                          <ShieldAlert className="h-4 w-4 mr-2" />정지
                        </Button>
                      )}
                      {status === 'suspended' && (
                        <Button size="sm" className="flex-1" onClick={() => openActionDialog('approve', selectedBrand.id, selectedBrand.companyName)}>
                          <Check className="h-4 w-4 mr-2" />재승인
                        </Button>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={open => setActionDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.action === 'approve' ? '브랜드 승인' : actionDialog.action === 'suspend' ? '브랜드 정지' : '브랜드 거절'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.brandName}을(를) {actionDialog.action === 'approve' ? '승인' : actionDialog.action === 'suspend' ? '정지' : '거절'}하시겠습니까?
              {actionDialog.action !== 'approve' && ' 이 작업은 해당 브랜드의 서비스 이용에 영향을 줍니다.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(prev => ({ ...prev, open: false }))}>취소</Button>
            <Button
              variant={actionDialog.action === 'approve' ? 'default' : 'destructive'}
              onClick={handleAction}
              disabled={actionUpdating}
            >
              {actionUpdating ? '처리 중...' : actionDialog.action === 'approve' ? '승인' : actionDialog.action === 'suspend' ? '정지' : '거절'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
