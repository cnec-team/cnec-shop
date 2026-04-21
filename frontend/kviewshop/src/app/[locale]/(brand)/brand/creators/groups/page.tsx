'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Users, MoreHorizontal, FolderHeart } from 'lucide-react';
import { toast } from 'sonner';

interface CreatorGroup {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { members: number };
}

export default function CreatorGroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<CreatorGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CreatorGroup | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CreatorGroup | null>(null);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch('/api/brand/creator-groups');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setGroups(data.groups);
    } catch {
      toast.error('그룹 목록을 불러오지 못했습니다');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const res = await fetch('/api/brand/creator-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() || null }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || '생성 실패');
        return;
      }
      toast.success('그룹이 생성되었습니다');
      setCreateOpen(false);
      setNewName('');
      setNewDesc('');
      fetchGroups();
    } catch {
      toast.error('그룹 생성에 실패했습니다');
    }
  };

  const handleEdit = (group: CreatorGroup) => {
    setEditTarget(group);
    setNewName(group.name);
    setNewDesc(group.description || '');
  };

  const handleEditSave = async () => {
    if (!editTarget || !newName.trim()) return;
    try {
      const res = await fetch(`/api/brand/creator-groups/${editTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() || null }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || '수정 실패');
        return;
      }
      toast.success('그룹이 수정되었습니다');
      setEditTarget(null);
      setNewName('');
      setNewDesc('');
      fetchGroups();
    } catch {
      toast.error('그룹 수정에 실패했습니다');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/brand/creator-groups/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      toast.success('그룹이 삭제되었습니다');
      setDeleteTarget(null);
      fetchGroups();
    } catch {
      toast.error('그룹 삭제에 실패했습니다');
    }
  };

  if (loading) return null;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">그룹 관리</h1>
          <Badge variant="secondary">{groups.length}/20 그룹</Badge>
        </div>
        <Button onClick={() => setCreateOpen(true)} disabled={groups.length >= 20}>
          <Plus className="h-4 w-4 mr-1" /> 새 그룹 만들기
        </Button>
      </div>

      {groups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((g) => (
            <Card
              key={g.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(`creators/groups/${g.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{g.name}</h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger onClick={(e) => e.stopPropagation()}>
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`creators/groups/${g.id}`);
                        }}
                      >
                        보기
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(g);
                        }}
                      >
                        수정
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(g);
                        }}
                        className="text-destructive"
                      >
                        삭제
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {g.description && (
                  <p className="text-sm text-muted-foreground mt-1">{g.description}</p>
                )}
                <div className="flex items-center gap-1 mt-3 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{g._count.members}/500</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <FolderHeart className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">아직 그룹이 없습니다</p>
          <p className="text-sm text-muted-foreground mt-1">
            크리에이터를 그룹으로 관리해보세요
          </p>
        </div>
      )}

      {/* 생성 Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 그룹 생성</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>그룹명 *</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                maxLength={50}
                placeholder="예: 뷰티 마이크로"
              />
            </div>
            <div>
              <Label>설명</Label>
              <Textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="그룹 설명 (선택)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreate} disabled={!newName.trim()}>
              생성
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 수정 Dialog */}
      <Dialog open={editTarget !== null} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>그룹 수정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>그룹명 *</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                maxLength={50}
              />
            </div>
            <div>
              <Label>설명</Label>
              <Textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleEditSave} disabled={!newName.trim()}>
              수정
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 Dialog */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>그룹을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>삭제된 그룹은 복구할 수 없습니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
