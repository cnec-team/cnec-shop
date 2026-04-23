'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
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
  Search, Check, X, Users, Clock, Instagram, Youtube,
  ExternalLink, ChevronLeft, ChevronRight, CheckCircle2,
  XCircle, AlertCircle, ShieldCheck,
} from 'lucide-react';
import {
  getAdminCreatorApprovals,
  getCreatorApprovalDetail,
  approveCreator,
  rejectCreator,
  bulkApproveCreators,
} from '@/lib/actions/admin';
import { toast } from 'sonner';

interface CreatorApproval {
  id: string;
  userId: string;
  displayName: string | null;
  shopId: string | null;
  profileImageUrl: string | null;
  instagramHandle: string | null;
  youtubeHandle: string | null;
  tiktokHandle: string | null;
  igFollowers: number | null;
  primaryCategory: string | null;
  categories: string[];
  bio: string | null;
  status: string;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  rejectionReason: string | null;
  createdAt: Date;
  user: { email: string; phone: string | null; name: string | null } | null;
}

interface CreatorDetail {
  id: string;
  userId: string;
  displayName: string | null;
  shopId: string | null;
  profileImage: string | null;
  profileImageUrl: string | null;
  instagramHandle: string | null;
  youtubeHandle: string | null;
  tiktokHandle: string | null;
  igFollowers: number | null;
  igEngagementRate: number | null;
  igCategory: string | null;
  igBio: string | null;
  igVerified: boolean;
  primaryCategory: string | null;
  categories: string[];
  bio: string | null;
  skinType: string | null;
  personalColor: string | null;
  skinConcerns: string[];
  ageRange: string | null;
  status: string;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  reviewedBy: string | null;
  rejectionReason: string | null;
  approvalNote: string | null;
  onboardingCompleted: boolean;
  createdAt: Date;
  user: { email: string; phone: string | null; name: string | null; createdAt: Date; ci: string | null; phoneReachable: boolean | null } | null;
}

const CATEGORIES = [
  '스킨케어', '메이크업', '헤어', '네일', '이너뷰티', '뷰티디바이스',
];

const REJECTION_TEMPLATES = [
  '팔로워 수 부족 (최소 1,000명)',
  '뷰티 카테고리 관련성 부족',
  '콘텐츠 품질 미달',
  'SNS 계정 비공개',
];

function statusBadge(status: string) {
  switch (status) {
    case 'PENDING': return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">심사 대기</Badge>;
    case 'APPROVED': return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">승인</Badge>;
    case 'REJECTED': return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">거절</Badge>;
    case 'SUSPENDED': return <Badge variant="destructive">정지</Badge>;
    case 'ACTIVE': return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">활성</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
}

function formatFollowers(n: number | null): string {
  if (n === null || n === undefined) return '-';
  if (n >= 10000) return (n / 10000).toFixed(1) + '만';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

function timeAgo(date: Date | string | null): string {
  if (!date) return '-';
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return '방금 전';
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return d.toLocaleDateString('ko-KR');
}

export default function AdminCreatorApprovalsPage() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') || 'PENDING';

  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [followerFilter, setFollowerFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [creators, setCreators] = useState<CreatorApproval[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(true);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Detail sheet
  const [detail, setDetail] = useState<CreatorDetail | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetLoading, setSheetLoading] = useState(false);

  // Approve dialog
  const [approveDialog, setApproveDialog] = useState<{ open: boolean; creatorId: string; name: string }>({ open: false, creatorId: '', name: '' });
  const [approveNote, setApproveNote] = useState('');
  const [approving, setApproving] = useState(false);

  // Reject dialog
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; creatorId: string; name: string }>({ open: false, creatorId: '', name: '' });
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  // Bulk approve dialog
  const [bulkDialog, setBulkDialog] = useState(false);
  const [bulkApproving, setBulkApproving] = useState(false);

  const fetchCreators = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAdminCreatorApprovals({
        status: statusFilter === 'all' ? undefined : statusFilter,
        category: categoryFilter === 'all' ? undefined : categoryFilter,
        followerRange: followerFilter === 'all' ? undefined : followerFilter,
        search: search || undefined,
        page,
      });
      setCreators(result.creators as CreatorApproval[]);
      setTotal(result.total);
      setPageSize(result.pageSize);
    } catch {
      toast.error('데이터를 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, followerFilter, search, page]);

  useEffect(() => { fetchCreators(); }, [fetchCreators]);

  const totalPages = Math.ceil(total / pageSize);

  const pendingCreators = useMemo(() => creators.filter(c => c.status === 'PENDING'), [creators]);
  const allPendingSelected = pendingCreators.length > 0 && pendingCreators.every(c => selectedIds.has(c.id));

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allPendingSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingCreators.map(c => c.id)));
    }
  }

  async function openDetail(creatorId: string) {
    setSheetOpen(true);
    setSheetLoading(true);
    try {
      const d = await getCreatorApprovalDetail(creatorId);
      setDetail(d as CreatorDetail);
    } catch {
      toast.error('상세 정보를 불러올 수 없습니다');
      setSheetOpen(false);
    } finally {
      setSheetLoading(false);
    }
  }

  async function handleApprove() {
    setApproving(true);
    try {
      await approveCreator(approveDialog.creatorId, approveNote || undefined);
      toast.success(`${approveDialog.name}님이 승인되었습니다`);
      setApproveDialog({ open: false, creatorId: '', name: '' });
      setApproveNote('');
      fetchCreators();
      if (sheetOpen && detail?.id === approveDialog.creatorId) {
        const d = await getCreatorApprovalDetail(approveDialog.creatorId);
        setDetail(d as CreatorDetail);
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '처리에 실패했습니다');
    } finally {
      setApproving(false);
    }
  }

  async function handleReject() {
    if (!rejectReason.trim()) {
      toast.error('거절 사유를 입력해주세요');
      return;
    }
    setRejecting(true);
    try {
      await rejectCreator(rejectDialog.creatorId, rejectReason);
      toast.success(`${rejectDialog.name}님이 거절되었습니다`);
      setRejectDialog({ open: false, creatorId: '', name: '' });
      setRejectReason('');
      fetchCreators();
      if (sheetOpen && detail?.id === rejectDialog.creatorId) {
        const d = await getCreatorApprovalDetail(rejectDialog.creatorId);
        setDetail(d as CreatorDetail);
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '처리에 실패했습니다');
    } finally {
      setRejecting(false);
    }
  }

  async function handleBulkApprove() {
    setBulkApproving(true);
    try {
      const ids = Array.from(selectedIds);
      const result = await bulkApproveCreators(ids);
      toast.success(`${result.count}명의 크리에이터가 승인되었습니다`);
      setBulkDialog(false);
      setSelectedIds(new Set());
      fetchCreators();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : '처리에 실패했습니다');
    } finally {
      setBulkApproving(false);
    }
  }

  // Checklist for detail review
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    sns: false, followers: false, content: false, beauty: false,
  });

  function toggleChecklist(key: string) {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold">크리에이터 승인</h1>
          <p className="text-muted-foreground">크리에이터 가입 신청을 심사합니다.</p>
        </div>
        {selectedIds.size > 0 && (
          <Button onClick={() => setBulkDialog(true)}>
            <Check className="h-4 w-4 mr-2" />
            {selectedIds.size}명 일괄 승인
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>크리에이터 목록</CardTitle>
              <CardDescription>{total}명</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 상태</SelectItem>
                  <SelectItem value="PENDING">심사 대기</SelectItem>
                  <SelectItem value="APPROVED">승인</SelectItem>
                  <SelectItem value="REJECTED">거절</SelectItem>
                  <SelectItem value="SUSPENDED">정지</SelectItem>
                  <SelectItem value="ACTIVE">활성</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={v => { setCategoryFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 카테고리</SelectItem>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={followerFilter} onValueChange={v => { setFollowerFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">팔로워 전체</SelectItem>
                  <SelectItem value="0-1000">1K 미만</SelectItem>
                  <SelectItem value="1000-10000">1K ~ 10K</SelectItem>
                  <SelectItem value="10000-100000">10K ~ 100K</SelectItem>
                  <SelectItem value="100000+">100K+</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="이름/인스타/이메일 검색" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pl-10" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : creators.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">해당하는 크리에이터가 없습니다</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {statusFilter === 'PENDING' && (
                        <TableHead className="w-10">
                          <Checkbox checked={allPendingSelected} onCheckedChange={toggleSelectAll} />
                        </TableHead>
                      )}
                      <TableHead>크리에이터</TableHead>
                      <TableHead>SNS</TableHead>
                      <TableHead className="text-right">팔로워</TableHead>
                      <TableHead>카테고리</TableHead>
                      <TableHead>신청일</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead className="text-right">액션</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {creators.map(c => (
                      <TableRow
                        key={c.id}
                        className={`cursor-pointer hover:bg-muted/50 ${c.status === 'PENDING' ? 'bg-amber-50/50' : ''}`}
                        onClick={() => openDetail(c.id)}
                      >
                        {statusFilter === 'PENDING' && (
                          <TableCell onClick={e => e.stopPropagation()}>
                            <Checkbox checked={selectedIds.has(c.id)} onCheckedChange={() => toggleSelect(c.id)} />
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={c.profileImageUrl || ''} />
                              <AvatarFallback>{(c.displayName || c.user?.name || '?')[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{c.displayName || c.user?.name || '-'}</p>
                              <p className="text-xs text-muted-foreground">{c.user?.email || '-'}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {c.instagramHandle && (
                              <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                                <Instagram className="h-3 w-3" />@{c.instagramHandle}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium">{formatFollowers(c.igFollowers)}</TableCell>
                        <TableCell>
                          {c.primaryCategory ? (
                            <Badge variant="outline" className="text-xs">{c.primaryCategory}</Badge>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {timeAgo(c.submittedAt || c.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell>{statusBadge(c.status)}</TableCell>
                        <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                          {c.status === 'PENDING' && (
                            <div className="flex gap-1 justify-end">
                              <Button size="sm" variant="default" onClick={() => setApproveDialog({ open: true, creatorId: c.id, name: c.displayName || c.user?.name || '-' })}>
                                <Check className="h-3.5 w-3.5 mr-1" />승인
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => setRejectDialog({ open: true, creatorId: c.id, name: c.displayName || c.user?.name || '-' })}>
                                <X className="h-3.5 w-3.5 mr-1" />거절
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {creators.map(c => (
                  <Card key={c.id} className={`cursor-pointer hover:bg-muted/50 ${c.status === 'PENDING' ? 'bg-amber-50/50' : ''}`} onClick={() => openDetail(c.id)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {c.status === 'PENDING' && (
                            <div onClick={e => e.stopPropagation()}>
                              <Checkbox checked={selectedIds.has(c.id)} onCheckedChange={() => toggleSelect(c.id)} />
                            </div>
                          )}
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={c.profileImageUrl || ''} />
                            <AvatarFallback>{(c.displayName || '?')[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{c.displayName || c.user?.name || '-'}</p>
                            {c.instagramHandle && (
                              <p className="text-xs text-muted-foreground flex items-center gap-0.5">
                                <Instagram className="h-3 w-3" />@{c.instagramHandle}
                              </p>
                            )}
                          </div>
                        </div>
                        {statusBadge(c.status)}
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                        <div><p className="text-muted-foreground">팔로워</p><p className="font-medium">{formatFollowers(c.igFollowers)}</p></div>
                        <div><p className="text-muted-foreground">카테고리</p><p className="font-medium">{c.primaryCategory || '-'}</p></div>
                        <div><p className="text-muted-foreground">신청일</p><p className="font-medium">{timeAgo(c.submittedAt || c.createdAt)}</p></div>
                      </div>
                      {c.status === 'PENDING' && (
                        <div className="mt-3 flex gap-2" onClick={e => e.stopPropagation()}>
                          <Button size="sm" className="flex-1" onClick={() => setApproveDialog({ open: true, creatorId: c.id, name: c.displayName || '-' })}>
                            <Check className="h-3.5 w-3.5 mr-1" />승인
                          </Button>
                          <Button size="sm" variant="destructive" className="flex-1" onClick={() => setRejectDialog({ open: true, creatorId: c.id, name: c.displayName || '-' })}>
                            <X className="h-3.5 w-3.5 mr-1" />거절
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    {(page - 1) * pageSize + 1}~{Math.min(page * pageSize, total)} / {total}명
                  </p>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={o => { setSheetOpen(o); if (!o) setChecklist({ sns: false, followers: false, content: false, beauty: false }); }}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>크리에이터 심사</SheetTitle>
          </SheetHeader>
          {sheetLoading ? (
            <div className="py-12 text-center text-muted-foreground">로딩 중...</div>
          ) : detail && (
            <div className="space-y-6 mt-4">
              {/* Profile header */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={detail.profileImageUrl || detail.profileImage || ''} />
                  <AvatarFallback className="text-lg">{(detail.displayName || '?')[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-semibold">{detail.displayName || detail.user?.name || '-'}</p>
                  {detail.shopId && <p className="text-sm text-muted-foreground">cnecshop.com/{detail.shopId}</p>}
                  <div className="mt-1">{statusBadge(detail.status)}</div>
                </div>
              </div>

              {detail.bio && <p className="text-sm text-muted-foreground">{detail.bio}</p>}

              {/* Info */}
              <div className="text-sm space-y-1.5">
                <p className="flex items-center gap-2"><span className="text-muted-foreground">이름:</span> {detail.user?.name || '-'}</p>
                <p className="flex items-center gap-2"><span className="text-muted-foreground">이메일:</span> {detail.user?.email || '-'}</p>
                <p className="flex items-center gap-2"><span className="text-muted-foreground">전화:</span> {detail.user?.phone || '-'}</p>
                <p className="flex items-center gap-2">
                  <span className="text-muted-foreground">인증:</span>
                  {detail.user?.ci ? (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">본인인증 완료</Badge>
                  ) : detail.user?.phoneReachable ? (
                    <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100">번호 확인</Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </p>
                <p className="flex items-center gap-2"><span className="text-muted-foreground">가입일:</span> {detail.user?.createdAt ? new Date(detail.user.createdAt).toLocaleDateString('ko-KR') : '-'}</p>
              </div>

              <Separator />

              {/* SNS */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Instagram className="h-4 w-4" /> SNS</h3>
                <div className="text-sm space-y-2">
                  {detail.instagramHandle && (
                    <a href={`https://instagram.com/${detail.instagramHandle}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline">
                      <Instagram className="h-4 w-4" /> @{detail.instagramHandle}
                      {detail.igVerified && <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {detail.youtubeHandle && (
                    <a href={`https://youtube.com/@${detail.youtubeHandle}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-red-600 hover:underline">
                      <Youtube className="h-4 w-4" /> {detail.youtubeHandle}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {detail.tiktokHandle && (
                    <p className="text-muted-foreground">TikTok: @{detail.tiktokHandle}</p>
                  )}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">팔로워</p>
                    <p className="font-semibold">{formatFollowers(detail.igFollowers)}</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">참여율</p>
                    <p className="font-semibold">{detail.igEngagementRate ? `${detail.igEngagementRate}%` : '-'}</p>
                  </div>
                </div>
                {detail.igBio && (
                  <p className="mt-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded">{detail.igBio}</p>
                )}
              </div>

              <Separator />

              {/* Category / Beauty info */}
              <div>
                <h3 className="font-semibold mb-2">카테고리 / 뷰티 정보</h3>
                <div className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">메인 카테고리:</span> {detail.primaryCategory || detail.igCategory || '-'}</p>
                  {detail.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {detail.categories.map(c => <Badge key={c} variant="outline" className="text-xs">{c}</Badge>)}
                    </div>
                  )}
                  {detail.skinType && <p><span className="text-muted-foreground">피부 타입:</span> {detail.skinType}</p>}
                  {detail.personalColor && <p><span className="text-muted-foreground">퍼스널 컬러:</span> {detail.personalColor}</p>}
                </div>
              </div>

              <Separator />

              {/* Review checklist */}
              {detail.status === 'PENDING' && (
                <>
                  <div>
                    <h3 className="font-semibold mb-3">심사 체크리스트</h3>
                    <div className="space-y-2">
                      {[
                        { key: 'sns', label: 'SNS 프로필 확인' },
                        { key: 'followers', label: '팔로워 진성 확인' },
                        { key: 'content', label: '콘텐츠 품질 확인' },
                        { key: 'beauty', label: '뷰티 관련성 확인' },
                      ].map(item => (
                        <label key={item.key} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-muted/50 rounded-lg">
                          <Checkbox checked={checklist[item.key]} onCheckedChange={() => toggleChecklist(item.key)} />
                          <span className="text-sm">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h3 className="font-semibold">심사 결정</h3>
                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        onClick={() => {
                          setApproveDialog({ open: true, creatorId: detail.id, name: detail.displayName || '-' });
                        }}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />승인하기
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => {
                          setRejectDialog({ open: true, creatorId: detail.id, name: detail.displayName || '-' });
                        }}
                      >
                        <XCircle className="h-4 w-4 mr-2" />거절하기
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {/* Show rejection reason if rejected */}
              {detail.status === 'REJECTED' && detail.rejectionReason && (
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="font-semibold text-red-800">거절 사유</span>
                  </div>
                  <p className="text-sm text-red-700">{detail.rejectionReason}</p>
                  {detail.reviewedAt && (
                    <p className="text-xs text-red-500 mt-2">
                      {new Date(detail.reviewedAt).toLocaleDateString('ko-KR')} 심사 완료
                    </p>
                  )}
                </div>
              )}

              {detail.status === 'APPROVED' && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="font-semibold text-green-800">승인됨</span>
                  </div>
                  {detail.approvalNote && <p className="text-sm text-green-700">{detail.approvalNote}</p>}
                  {detail.reviewedAt && (
                    <p className="text-xs text-green-500 mt-2">
                      {new Date(detail.reviewedAt).toLocaleDateString('ko-KR')} 승인
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Approve Dialog */}
      <Dialog open={approveDialog.open} onOpenChange={open => setApproveDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>크리에이터 승인</DialogTitle>
            <DialogDescription>
              {approveDialog.name}님을 승인하시겠습니까? 승인 시 알림이 발송되고 가입 축하 3,000원이 지급됩니다.
            </DialogDescription>
          </DialogHeader>
          <div>
            <label className="text-sm font-medium">승인 메모 (선택)</label>
            <Textarea
              value={approveNote}
              onChange={e => setApproveNote(e.target.value)}
              placeholder="관리자용 메모 (크리에이터에게 미공개)"
              className="mt-1"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialog(prev => ({ ...prev, open: false }))}>취소</Button>
            <Button onClick={handleApprove} disabled={approving}>
              {approving ? '처리 중...' : '승인'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={open => setRejectDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>크리에이터 거절</DialogTitle>
            <DialogDescription>
              {rejectDialog.name}님의 가입을 거절합니다. 거절 사유는 크리에이터에게 전달됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">거절 사유 템플릿</label>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {REJECTION_TEMPLATES.map(t => (
                  <Button
                    key={t}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setRejectReason(t)}
                  >
                    {t}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">거절 사유 (필수)</label>
              <Textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="거절 사유를 입력해주세요"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(prev => ({ ...prev, open: false }))}>취소</Button>
            <Button variant="destructive" onClick={handleReject} disabled={rejecting || !rejectReason.trim()}>
              {rejecting ? '처리 중...' : '거절'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Approve Dialog */}
      <Dialog open={bulkDialog} onOpenChange={setBulkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>일괄 승인</DialogTitle>
            <DialogDescription>
              선택한 {selectedIds.size}명의 크리에이터를 일괄 승인하시겠습니까? 각 크리에이터에게 알림이 발송되고 가입 축하 3,000원이 지급됩니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDialog(false)}>취소</Button>
            <Button onClick={handleBulkApprove} disabled={bulkApproving}>
              {bulkApproving ? '처리 중...' : `${selectedIds.size}명 승인`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
