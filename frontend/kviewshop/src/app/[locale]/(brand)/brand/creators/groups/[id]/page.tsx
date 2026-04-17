'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ChevronLeft,
  ChevronRight,
  UserPlus,
  MoreHorizontal,
  X,
  User,
  BadgeCheck,
  Users,
  FileSpreadsheet,
  Send,
  ShoppingBag,
  Pencil,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatFollowerCount } from '@/lib/utils/format';
import { getCreatorProfileImage } from '@/lib/utils/image';
import AddMembersDialog from '@/components/brand/AddMembersDialog';
import { InviteModal } from '@/components/brand/InviteModal';

interface GroupMember {
  id: string;
  memo: string | null;
  creator: {
    id: string;
    instagramHandle: string | null;
    displayName: string | null;
    igFollowers: number | null;
    igEngagementRate: number | null;
    igCategory: string | null;
    igVerified: boolean | null;
    igProfileImageR2Url: string | null;
    igProfilePicUrl: string | null;
  };
}

interface GroupDetail {
  id: string;
  name: string;
  description: string | null;
  members: GroupMember[];
  _count: { members: number };
  pagination?: { page: number; limit: number; total: number };
}

function InlineMemoEdit({
  value,
  onSave,
}: {
  value: string;
  onSave: (memo: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value);

  useEffect(() => {
    setText(value);
  }, [value]);

  const save = () => {
    setEditing(false);
    if (text !== value) onSave(text);
  };

  if (!editing) {
    return (
      <span
        className="text-sm text-muted-foreground cursor-pointer hover:text-foreground min-w-[60px] inline-block"
        onClick={() => setEditing(true)}
      >
        {value || '메모 추가'}
      </span>
    );
  }

  return (
    <Input
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => e.key === 'Enter' && save()}
      className="h-7 text-sm w-32"
      autoFocus
    />
  );
}

export default function GroupDetailPage() {
  const router = useRouter();
  const routeParams = useParams();
  const groupId = routeParams.id as string;

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('recent');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [addMembersOpen, setAddMembersOpen] = useState(false);
  const [inviteModal, setInviteModal] = useState<{
    open: boolean;
    type: 'GONGGU' | 'PRODUCT_PICK';
    creatorIds: string[];
  }>({ open: false, type: 'GONGGU', creatorIds: [] });
  const [editNameOpen, setEditNameOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [inlineEditingName, setInlineEditingName] = useState(false);
  const [inlineEditingDesc, setInlineEditingDesc] = useState(false);
  const [inlineName, setInlineName] = useState('');
  const [inlineDesc, setInlineDesc] = useState('');

  const fetchGroup = useCallback(async () => {
    try {
      const searchParams = new URLSearchParams();
      if (search) searchParams.set('search', search);
      if (sort) searchParams.set('sort', sort);
      searchParams.set('page', String(page));
      searchParams.set('limit', '50');
      const res = await fetch(`/api/brand/creator-groups/${groupId}?${searchParams}`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setGroup(data);
    } catch {
      toast.error('그룹 정보를 불러오지 못했습니다');
    } finally {
      setLoading(false);
    }
  }, [groupId, search, sort, page]);

  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  const removeMember = async (memberId: string) => {
    try {
      const res = await fetch(`/api/brand/creator-groups/${groupId}/members/${memberId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('멤버가 제거되었습니다');
      fetchGroup();
    } catch {
      toast.error('멤버 제거에 실패했습니다');
    }
  };

  const updateMemo = async (memberId: string, memo: string) => {
    try {
      await fetch(`/api/brand/creator-groups/${groupId}/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memo }),
      });
    } catch {
      toast.error('메모 저장에 실패했습니다');
    }
  };

  const startInlineEditName = () => {
    if (!group) return;
    setInlineName(group.name);
    setInlineEditingName(true);
  };

  const saveInlineName = async () => {
    if (!inlineName.trim() || !group) return;
    try {
      const res = await fetch(`/api/brand/creator-groups/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: inlineName.trim() }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('그룹명이 수정되었습니다');
      setInlineEditingName(false);
      fetchGroup();
    } catch {
      toast.error('그룹명 수정에 실패했습니다');
    }
  };

  const startInlineEditDesc = () => {
    if (!group) return;
    setInlineDesc(group.description || '');
    setInlineEditingDesc(true);
  };

  const saveInlineDesc = async () => {
    if (!group) return;
    try {
      const res = await fetch(`/api/brand/creator-groups/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: inlineDesc.trim() || null }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('설명이 수정되었습니다');
      setInlineEditingDesc(false);
      fetchGroup();
    } catch {
      toast.error('설명 수정에 실패했습니다');
    }
  };

  const handleEditName = () => {
    if (!group) return;
    setEditName(group.name);
    setEditDesc(group.description || '');
    setEditNameOpen(true);
  };

  const saveEditName = async () => {
    try {
      const res = await fetch(`/api/brand/creator-groups/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), description: editDesc.trim() || null }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('그룹이 수정되었습니다');
      setEditNameOpen(false);
      fetchGroup();
    } catch {
      toast.error('그룹 수정에 실패했습니다');
    }
  };

  const handleDeleteGroup = async () => {
    try {
      const res = await fetch(`/api/brand/creator-groups/${groupId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      toast.success('그룹이 삭제되었습니다');
      router.push('../groups');
    } catch {
      toast.error('그룹 삭제에 실패했습니다');
    }
  };

  const handleExport = () => {
    window.open(`/api/brand/creator-groups/${groupId}/export`, '_blank');
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allSelected =
    group !== null && group.members.length > 0 && selectedIds.size === group.members.length;

  const toggleAll = () => {
    if (!group) return;
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(group.members.map((m) => m.id)));
    }
  };

  const handleBulkRemove = async () => {
    const ids = Array.from(selectedIds);
    try {
      await Promise.all(
        ids.map((memberId) =>
          fetch(`/api/brand/creator-groups/${groupId}/members/${memberId}`, { method: 'DELETE' })
        )
      );
      toast.success(`${ids.length}명이 그룹에서 제거되었습니다`);
      setSelectedIds(new Set());
      fetchGroup();
    } catch {
      toast.error('일괄 제거에 실패했습니다');
    }
  };

  const handleBulkPropose = () => {
    const ids = group?.members
      .filter((m) => selectedIds.has(m.id))
      .map((m) => m.creator.id) ?? [];
    setInviteModal({ open: true, type: 'GONGGU', creatorIds: ids });
  };

  const handleBulkExport = () => {
    handleExport();
  };

  const totalPages = group?.pagination ? Math.ceil(group.pagination.total / 50) : 1;

  if (loading) return null;
  if (!group) return <div className="p-6 text-center">그룹을 찾을 수 없습니다</div>;

  return (
    <div className="p-6">
      {/* 상단 */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push('../groups')} className="mb-2">
          <ChevronLeft className="h-4 w-4 mr-1" /> 그룹 목록
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              {inlineEditingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={inlineName}
                    onChange={(e) => setInlineName(e.target.value)}
                    maxLength={50}
                    className="text-2xl font-bold h-10 w-64"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && saveInlineName()}
                  />
                  <Button size="icon" variant="ghost" onClick={saveInlineName}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setInlineEditingName(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <h1
                  className="text-2xl font-bold cursor-pointer hover:text-muted-foreground group flex items-center gap-2"
                  onClick={startInlineEditName}
                >
                  {group.name}
                  <Pencil className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h1>
              )}
              <Badge variant="secondary">{group._count.members}/500</Badge>
            </div>
            {inlineEditingDesc ? (
              <div className="flex items-start gap-2 mt-1">
                <Textarea
                  value={inlineDesc}
                  onChange={(e) => setInlineDesc(e.target.value)}
                  className="text-sm w-80 min-h-[60px]"
                  autoFocus
                  placeholder="그룹 설명 (선택)"
                />
                <Button size="icon" variant="ghost" onClick={saveInlineDesc}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setInlineEditingDesc(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <p
                className="text-muted-foreground mt-1 cursor-pointer hover:text-foreground group flex items-center gap-1"
                onClick={startInlineEditDesc}
              >
                {group.description || '설명 추가'}
                <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </p>
            )}
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            <Button variant="outline" onClick={() => {
              const ids = group.members.map((m) => m.creator.id);
              setInviteModal({ open: true, type: 'GONGGU', creatorIds: ids });
            }}>
              <Send className="h-4 w-4 mr-1" /> 전체에게 공구 초대
            </Button>
            <Button variant="outline" onClick={() => {
              const ids = group.members.map((m) => m.creator.id);
              setInviteModal({ open: true, type: 'PRODUCT_PICK', creatorIds: ids });
            }}>
              <ShoppingBag className="h-4 w-4 mr-1" /> 전체에게 상품 추천
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <FileSpreadsheet className="h-4 w-4 mr-1" /> 엑셀 다운로드
            </Button>
            <Button variant="outline" onClick={() => setAddMembersOpen(true)}>
              <UserPlus className="h-4 w-4 mr-1" /> 멤버 추가
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleEditName}>그룹명 수정</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-destructive">
                  그룹 삭제
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* 검색 + 정렬 */}
      <div className="flex gap-3 mb-4">
        <Input
          placeholder="크리에이터 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">최근 추가순</SelectItem>
            <SelectItem value="followers">팔로워순</SelectItem>
            <SelectItem value="engagement">참여율순</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 다중 선택 액션바 */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-muted rounded-lg">
          <span className="text-sm">{selectedIds.size}명 선택</span>
          <Button size="sm" onClick={handleBulkPropose}>
            일괄 초대 보내기
          </Button>
          <Button size="sm" variant="outline" onClick={handleBulkExport}>
            엑셀 다운로드
          </Button>
          <Button size="sm" variant="destructive" onClick={handleBulkRemove}>
            그룹에서 삭제
          </Button>
        </div>
      )}

      {/* 멤버 테이블 */}
      {group.members.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox checked={allSelected || false} onCheckedChange={toggleAll} />
              </TableHead>
              <TableHead>크리에이터</TableHead>
              <TableHead className="text-right">팔로워</TableHead>
              <TableHead className="text-right">참여율</TableHead>
              <TableHead>메모</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {group.members.map((m) => (
              <TableRow key={m.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.has(m.id)}
                    onCheckedChange={() => toggleSelect(m.id)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={getCreatorProfileImage(m.creator)} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="text-sm font-medium">
                        @{m.creator.instagramHandle || 'unknown'}
                      </span>
                      {m.creator.igVerified && (
                        <BadgeCheck className="h-3.5 w-3.5 text-blue-500 inline ml-1" />
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {formatFollowerCount(m.creator.igFollowers || 0)}
                </TableCell>
                <TableCell className="text-right">
                  {Number(m.creator.igEngagementRate || 0).toFixed(1)}%
                </TableCell>
                <TableCell>
                  <InlineMemoEdit
                    value={m.memo || ''}
                    onSave={(memo) => updateMemo(m.id, memo)}
                  />
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => removeMember(m.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-16">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">아직 멤버가 없습니다</p>
          <p className="text-sm text-muted-foreground mt-1">크리에이터를 추가해보세요</p>
        </div>
      )}

      {/* 페이지네이션 */}
      {group.pagination && group.pagination.total > 50 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            전체 {group.pagination.total}명 중 {(page - 1) * 50 + 1}-{Math.min(page * 50, group.pagination.total)}명
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" /> 이전
            </Button>
            <span className="text-sm">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages}
            >
              다음 <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* 크리에이터 추가 Dialog */}
      <AddMembersDialog
        open={addMembersOpen}
        onOpenChange={setAddMembersOpen}
        groupId={group.id}
        onSuccess={fetchGroup}
      />

      {/* 그룹명 수정 Dialog */}
      <Dialog open={editNameOpen} onOpenChange={setEditNameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>그룹 수정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>그룹명 *</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={50}
              />
            </div>
            <div>
              <Label>설명</Label>
              <Input
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveEditName} disabled={!editName.trim()}>
              수정
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>그룹을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>삭제된 그룹은 복구할 수 없습니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGroup} className="bg-destructive">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* InviteModal */}
      <InviteModal
        open={inviteModal.open}
        onOpenChange={(open) => setInviteModal((prev) => ({ ...prev, open }))}
        mode={inviteModal.creatorIds.length === 1 ? 'single' : 'bulk'}
        creatorIds={inviteModal.creatorIds}
        defaultType={inviteModal.type}
        onSuccess={fetchGroup}
      />
    </div>
  );
}
