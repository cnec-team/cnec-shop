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
  Search, Users, Instagram, Youtube, ExternalLink, ShieldAlert, ShieldCheck,
  TrendingUp, ShoppingBag, Eye, Package, Megaphone, UserCheck, UserX, UserPlus,
} from 'lucide-react';
import { getAdminCreators, getAdminCreatorDetail, updateCreatorStatus, updateCreatorGrade } from '@/lib/actions/admin';
import { toast } from 'sonner';

// TikTok icon (lucide doesn't have it)
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.73a8.19 8.19 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.16z"/>
    </svg>
  );
}

interface AdminCreator {
  id: string;
  userId: string;
  displayName: string | null;
  username: string | null;
  shopId: string | null;
  profileImage: string | null;
  profileImageUrl: string | null;
  bio: string | null;
  instagramHandle: string | null;
  youtubeHandle: string | null;
  tiktokHandle: string | null;
  skinType: string | null;
  personalColor: string | null;
  skinConcerns: string[] | null;
  ageRange: string | null;
  status: string;
  country: string | null;
  createdAt: Date;
  user: { email: string; phone: string | null } | null;
  grade: { grade: string; monthlySales: number; commissionBonusRate: number } | null;
  totalSales: number;
  orderCount: number;
  totalCommission: number;
  shopVisitCount: number;
  shopItemCount: number;
  campaignCount: number;
}

interface CreatorDetail extends AdminCreator {
  recentOrders: { id: string; orderNumber: string | null; totalAmount: number; status: string; createdAt: Date }[];
  participations: { id: string; status: string; appliedAt: Date; campaign: { id: string; title: string; status: string; type: string } }[];
  campaignCount: number;
}

const GRADE_COLORS: Record<string, string> = {
  ROOKIE: 'bg-gray-100 text-gray-700',
  SILVER: 'bg-slate-200 text-slate-800',
  GOLD: 'bg-amber-100 text-amber-700',
  PLATINUM: 'bg-purple-100 text-purple-700',
};

const GRADE_KO: Record<string, string> = {
  ROOKIE: '루키', SILVER: '실버', GOLD: '골드', PLATINUM: '플래티넘',
};

const SKIN_TYPE_KO: Record<string, string> = {
  dry: '건성', oily: '지성', combination: '복합성', normal: '보통', oily_sensitive: '지성민감성', sensitive: '민감성',
};

const PERSONAL_COLOR_KO: Record<string, string> = {
  spring_warm: '봄웜', summer_cool: '여름쿨', autumn_warm: '가을웜', winter_cool: '겨울쿨',
};

const STATUS_LABELS: Record<string, string> = {
  PAID: '결제완료', PREPARING: '준비중', SHIPPING: '배송중', DELIVERED: '배송완료',
  CONFIRMED: '확정', CANCELLED: '취소', REFUNDED: '환불',
};

function formatKRW(v: number) {
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(v);
}

export default function AdminCreatorsPage() {
  const t = useTranslations('admin');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [creators, setCreators] = useState<AdminCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sheet
  const [selectedCreator, setSelectedCreator] = useState<CreatorDetail | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetLoading, setSheetLoading] = useState(false);

  // Grade change
  const [newGrade, setNewGrade] = useState('');
  const [gradeUpdating, setGradeUpdating] = useState(false);

  // Status change dialog
  const [suspendDialog, setSuspendDialog] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => { fetchCreators(); }, []);

  async function fetchCreators() {
    try {
      const data = await getAdminCreators();
      setCreators(data as AdminCreator[]);
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
      total: creators.length,
      active: creators.filter(c => c.status === 'ACTIVE').length,
      suspended: creators.filter(c => c.status === 'SUSPENDED').length,
      newThisMonth: creators.filter(c => new Date(c.createdAt) >= monthStart).length,
    };
  }, [creators]);

  const filtered = useMemo(() => {
    return creators.filter(c => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (gradeFilter !== 'all' && (c.grade?.grade || 'ROOKIE') !== gradeFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          c.displayName?.toLowerCase().includes(s) ||
          c.shopId?.toLowerCase().includes(s) ||
          c.user?.email?.toLowerCase().includes(s) ||
          c.instagramHandle?.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [creators, search, statusFilter, gradeFilter]);

  async function openDetail(creatorId: string) {
    setSheetOpen(true);
    setSheetLoading(true);
    try {
      const detail = await getAdminCreatorDetail(creatorId);
      setSelectedCreator(detail as CreatorDetail);
      setNewGrade(detail.grade?.grade || 'ROOKIE');
    } catch {
      toast.error('상세 정보를 불러올 수 없습니다');
      setSheetOpen(false);
    } finally {
      setSheetLoading(false);
    }
  }

  async function handleGradeChange() {
    if (!selectedCreator) return;
    setGradeUpdating(true);
    try {
      await updateCreatorGrade(selectedCreator.id, newGrade);
      toast.success(`등급이 ${GRADE_KO[newGrade] || newGrade}(으)로 변경되었습니다`);
      fetchCreators();
      const detail = await getAdminCreatorDetail(selectedCreator.id);
      setSelectedCreator(detail as CreatorDetail);
    } catch {
      toast.error('등급 변경에 실패했습니다');
    } finally {
      setGradeUpdating(false);
    }
  }

  async function handleStatusToggle() {
    if (!selectedCreator) return;
    setStatusUpdating(true);
    const newStatus = selectedCreator.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await updateCreatorStatus(selectedCreator.id, newStatus as 'ACTIVE' | 'SUSPENDED');
      toast.success(newStatus === 'SUSPENDED' ? '계정이 정지되었습니다' : '계정이 활성화되었습니다');
      setSuspendDialog(false);
      fetchCreators();
      const detail = await getAdminCreatorDetail(selectedCreator.id);
      setSelectedCreator(detail as CreatorDetail);
    } catch {
      toast.error('상태 변경에 실패했습니다');
    } finally {
      setStatusUpdating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold">{t('creatorManagement')}</h1>
        <p className="text-muted-foreground">{t('creatorManagementDesc')}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center"><Users className="h-5 w-5 text-blue-600" /></div><div><p className="text-sm text-muted-foreground">전체</p><p className="text-2xl font-bold">{stats.total}명</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center"><UserCheck className="h-5 w-5 text-green-600" /></div><div><p className="text-sm text-muted-foreground">활성</p><p className="text-2xl font-bold">{stats.active}명</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center"><UserX className="h-5 w-5 text-red-600" /></div><div><p className="text-sm text-muted-foreground">정지</p><p className="text-2xl font-bold">{stats.suspended}명</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center"><UserPlus className="h-5 w-5 text-purple-600" /></div><div><p className="text-sm text-muted-foreground">이번 달 신규</p><p className="text-2xl font-bold">{stats.newThisMonth}명</p></div></div></CardContent></Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>{t('allCreators')}</CardTitle>
              <CardDescription>{filtered.length}명의 크리에이터</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[120px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 상태</SelectItem>
                  <SelectItem value="ACTIVE">활성</SelectItem>
                  <SelectItem value="SUSPENDED">정지</SelectItem>
                </SelectContent>
              </Select>
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger className="w-full sm:w-[130px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 등급</SelectItem>
                  <SelectItem value="ROOKIE">루키</SelectItem>
                  <SelectItem value="SILVER">실버</SelectItem>
                  <SelectItem value="GOLD">골드</SelectItem>
                  <SelectItem value="PLATINUM">플래티넘</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="이름/shopId/이메일/인스타 검색..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
          ) : error ? (
            <div className="text-center py-12"><Users className="mx-auto h-12 w-12 text-muted-foreground/50" /><p className="mt-4 text-muted-foreground">{error}</p></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12"><Users className="mx-auto h-12 w-12 text-muted-foreground/50" /><p className="mt-4 text-muted-foreground">크리에이터가 없습니다</p></div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>프로필</TableHead>
                      <TableHead>SNS</TableHead>
                      <TableHead>이메일</TableHead>
                      <TableHead>피부/연령</TableHead>
                      <TableHead>등급</TableHead>
                      <TableHead className="text-right">총 매출</TableHead>
                      <TableHead className="text-right">커미션</TableHead>
                      <TableHead className="text-right">상품</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>가입일</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(c => {
                      const grade = c.grade?.grade || 'ROOKIE';
                      return (
                        <TableRow key={c.id} className={`cursor-pointer hover:bg-muted/50 ${c.totalSales > 0 ? 'bg-blue-50/50' : ''}`} onClick={() => openDetail(c.id)}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarImage src={c.profileImageUrl || c.profileImage || ''} />
                                <AvatarFallback>{(c.displayName || c.username || '?')[0]}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{c.displayName || c.username}</p>
                                <p className="text-xs text-muted-foreground">@{c.shopId || c.username}</p>
                                {c.bio && <p className="text-xs text-muted-foreground/70 truncate max-w-[160px]">{c.bio.slice(0, 20)}{c.bio.length > 20 ? '...' : ''}</p>}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                              {c.instagramHandle && <a href={`https://instagram.com/${c.instagramHandle}`} target="_blank" rel="noopener noreferrer"><Instagram className="h-4 w-4 text-pink-500 hover:text-pink-700" /></a>}
                              {c.youtubeHandle && <a href={`https://youtube.com/@${c.youtubeHandle}`} target="_blank" rel="noopener noreferrer"><Youtube className="h-4 w-4 text-red-500 hover:text-red-700" /></a>}
                              {c.tiktokHandle && <a href={`https://tiktok.com/@${c.tiktokHandle}`} target="_blank" rel="noopener noreferrer"><TikTokIcon className="h-4 w-4 hover:opacity-70" /></a>}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{c.user?.email || '-'}</TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              {c.skinType && <Badge variant="outline" className="text-xs">{SKIN_TYPE_KO[c.skinType] || c.skinType}</Badge>}
                              {c.ageRange && <Badge variant="outline" className="text-xs">{c.ageRange}</Badge>}
                            </div>
                          </TableCell>
                          <TableCell><Badge className={GRADE_COLORS[grade] || GRADE_COLORS.ROOKIE}>{GRADE_KO[grade] || grade}</Badge></TableCell>
                          <TableCell className="text-right text-sm font-medium">{formatKRW(c.totalSales)}</TableCell>
                          <TableCell className="text-right text-sm">{formatKRW(c.totalCommission)}</TableCell>
                          <TableCell className="text-right text-sm">{c.shopItemCount}</TableCell>
                          <TableCell>
                            <Badge variant={c.status === 'ACTIVE' ? 'default' : 'destructive'} className={c.status === 'ACTIVE' ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}>
                              {c.status === 'ACTIVE' ? '활성' : '정지'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{new Date(c.createdAt).toLocaleDateString('ko-KR')}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {filtered.map(c => {
                  const grade = c.grade?.grade || 'ROOKIE';
                  return (
                    <Card key={c.id} className={`cursor-pointer hover:bg-muted/50 ${c.totalSales > 0 ? 'bg-blue-50/50' : ''}`} onClick={() => openDetail(c.id)}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={c.profileImageUrl || c.profileImage || ''} />
                              <AvatarFallback>{(c.displayName || c.username || '?')[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{c.displayName || c.username}</p>
                              <p className="text-xs text-muted-foreground">@{c.shopId || c.username}</p>
                            </div>
                          </div>
                          <div className="flex gap-1 items-center">
                            <Badge className={GRADE_COLORS[grade]}>{GRADE_KO[grade] || grade}</Badge>
                            <Badge variant={c.status === 'ACTIVE' ? 'default' : 'destructive'} className={c.status === 'ACTIVE' ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}>
                              {c.status === 'ACTIVE' ? '활성' : '정지'}
                            </Badge>
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                          <div><p className="text-muted-foreground">매출</p><p className="font-medium">{formatKRW(c.totalSales)}</p></div>
                          <div><p className="text-muted-foreground">커미션</p><p className="font-medium">{formatKRW(c.totalCommission)}</p></div>
                          <div><p className="text-muted-foreground">상품</p><p className="font-medium">{c.shopItemCount}개</p></div>
                        </div>
                        <div className="mt-2 flex gap-1">
                          {c.instagramHandle && <Instagram className="h-3.5 w-3.5 text-pink-500" />}
                          {c.youtubeHandle && <Youtube className="h-3.5 w-3.5 text-red-500" />}
                          {c.tiktokHandle && <TikTokIcon className="h-3.5 w-3.5" />}
                        </div>
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
            <SheetTitle>크리에이터 상세</SheetTitle>
          </SheetHeader>
          {sheetLoading ? (
            <div className="py-12 text-center text-muted-foreground">로딩 중...</div>
          ) : selectedCreator && (
            <div className="space-y-6 mt-4">
              {/* Profile */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedCreator.profileImageUrl || selectedCreator.profileImage || ''} />
                  <AvatarFallback className="text-lg">{(selectedCreator.displayName || '?')[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-semibold">{selectedCreator.displayName || selectedCreator.username}</p>
                  <p className="text-sm text-muted-foreground">@{selectedCreator.shopId || selectedCreator.username}</p>
                  <Badge variant={selectedCreator.status === 'ACTIVE' ? 'default' : 'destructive'} className={selectedCreator.status === 'ACTIVE' ? 'bg-green-100 text-green-800 hover:bg-green-100 mt-1' : 'mt-1'}>
                    {selectedCreator.status === 'ACTIVE' ? '활성' : '정지'}
                  </Badge>
                </div>
              </div>

              {selectedCreator.bio && <p className="text-sm text-muted-foreground">{selectedCreator.bio}</p>}

              {/* SNS */}
              <div className="flex gap-3 flex-wrap">
                {selectedCreator.instagramHandle && (
                  <a href={`https://instagram.com/${selectedCreator.instagramHandle}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-pink-600 hover:underline">
                    <Instagram className="h-4 w-4" />@{selectedCreator.instagramHandle}
                  </a>
                )}
                {selectedCreator.youtubeHandle && (
                  <a href={`https://youtube.com/@${selectedCreator.youtubeHandle}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-red-600 hover:underline">
                    <Youtube className="h-4 w-4" />@{selectedCreator.youtubeHandle}
                  </a>
                )}
                {selectedCreator.tiktokHandle && (
                  <a href={`https://tiktok.com/@${selectedCreator.tiktokHandle}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm hover:underline">
                    <TikTokIcon className="h-4 w-4" />@{selectedCreator.tiktokHandle}
                  </a>
                )}
              </div>

              {/* Beauty Profile */}
              <div className="flex gap-2 flex-wrap">
                {selectedCreator.skinType && <Badge variant="outline">{SKIN_TYPE_KO[selectedCreator.skinType] || selectedCreator.skinType}</Badge>}
                {selectedCreator.personalColor && <Badge variant="outline">{PERSONAL_COLOR_KO[selectedCreator.personalColor] || selectedCreator.personalColor}</Badge>}
                {selectedCreator.skinConcerns && selectedCreator.skinConcerns.map((concern, i) => <Badge key={i} variant="outline">{concern}</Badge>)}
                {selectedCreator.ageRange && <Badge variant="outline">{selectedCreator.ageRange}</Badge>}
              </div>

              {/* Contact */}
              <div className="text-sm space-y-1">
                <p><span className="text-muted-foreground">이메일:</span> {selectedCreator.user?.email || '-'}</p>
                <p><span className="text-muted-foreground">전화번호:</span> {selectedCreator.user?.phone || '-'}</p>
              </div>

              <Separator />

              {/* Stats */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4" />성과</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-muted/50 rounded-lg"><p className="text-xs text-muted-foreground">총 매출</p><p className="font-semibold text-sm">{formatKRW(selectedCreator.totalSales)}</p></div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg"><p className="text-xs text-muted-foreground">커미션</p><p className="font-semibold text-sm">{formatKRW(selectedCreator.totalCommission)}</p></div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg"><p className="text-xs text-muted-foreground">판매 건수</p><p className="font-semibold text-sm">{selectedCreator.orderCount}건</p></div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg"><p className="text-xs text-muted-foreground">방문수</p><p className="font-semibold text-sm">{selectedCreator.shopVisitCount}</p></div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg"><p className="text-xs text-muted-foreground">상품 수</p><p className="font-semibold text-sm">{selectedCreator.shopItemCount}개</p></div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg"><p className="text-xs text-muted-foreground">캠페인</p><p className="font-semibold text-sm">{selectedCreator.campaignCount}개</p></div>
                </div>
              </div>

              <Separator />

              {/* Recent Orders */}
              {selectedCreator.recentOrders.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2"><ShoppingBag className="h-4 w-4" />최근 주문</h3>
                  <div className="space-y-2">
                    {selectedCreator.recentOrders.slice(0, 5).map(o => (
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
              <div className="space-y-4">
                <h3 className="font-semibold">관리</h3>

                {/* Grade */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">등급 변경</p>
                  <div className="flex gap-2">
                    <Select value={newGrade} onValueChange={setNewGrade}>
                      <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ROOKIE">루키</SelectItem>
                        <SelectItem value="SILVER">실버</SelectItem>
                        <SelectItem value="GOLD">골드</SelectItem>
                        <SelectItem value="PLATINUM">플래티넘</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={handleGradeChange} disabled={gradeUpdating || newGrade === (selectedCreator.grade?.grade || 'ROOKIE')}>
                      {gradeUpdating ? '변경 중...' : '변경'}
                    </Button>
                  </div>
                </div>

                {/* Status Toggle */}
                <div className="flex gap-2">
                  {selectedCreator.status === 'ACTIVE' ? (
                    <Button variant="destructive" size="sm" className="flex-1" onClick={() => setSuspendDialog(true)}>
                      <ShieldAlert className="h-4 w-4 mr-2" />정지
                    </Button>
                  ) : (
                    <Button variant="default" size="sm" className="flex-1" onClick={handleStatusToggle} disabled={statusUpdating}>
                      <ShieldCheck className="h-4 w-4 mr-2" />{statusUpdating ? '처리 중...' : '활성화'}
                    </Button>
                  )}
                  {selectedCreator.shopId && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/shop/${selectedCreator.shopId}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />샵 보기
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Suspend Dialog */}
      <Dialog open={suspendDialog} onOpenChange={setSuspendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>크리에이터 정지</DialogTitle>
            <DialogDescription>
              {selectedCreator?.displayName || selectedCreator?.username} 계정을 정지하시겠습니까? 정지된 계정은 서비스를 이용할 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendDialog(false)}>취소</Button>
            <Button variant="destructive" onClick={handleStatusToggle} disabled={statusUpdating}>
              {statusUpdating ? '처리 중...' : '정지'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
