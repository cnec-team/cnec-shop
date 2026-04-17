'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User, Search } from 'lucide-react';
import { toast } from 'sonner';
import { formatFollowerCount } from '@/lib/utils/format';
import { getCreatorProfileImage } from '@/lib/utils/image';

interface Creator {
  id: string;
  instagramHandle: string | null;
  displayName: string | null;
  igFollowers: number | null;
  igProfileImageR2Url: string | null;
  igProfilePicUrl: string | null;
}

interface AddMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  onSuccess: () => void;
}

export default function AddMembersDialog({
  open,
  onOpenChange,
  groupId,
  onSuccess,
}: AddMembersDialogProps) {
  const [search, setSearch] = useState('');
  const [creators, setCreators] = useState<Creator[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const searchCreators = useCallback(async (query: string) => {
    if (!query.trim()) {
      setCreators([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/brand/creators?search=${encodeURIComponent(query)}&limit=20`);
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setCreators(data.creators || []);
    } catch {
      setCreators([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchCreators(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, searchCreators]);

  useEffect(() => {
    if (!open) {
      setSearch('');
      setCreators([]);
      setSelectedIds(new Set());
    }
  }, [open]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAdd = async () => {
    if (selectedIds.size === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/brand/creator-groups/${groupId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorIds: Array.from(selectedIds) }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || '추가 실패');
        return;
      }
      const data = await res.json();
      toast.success(`${data.added}명 추가됨${data.skipped > 0 ? ` (${data.skipped}명 중복)` : ''}`);
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error('크리에이터 추가에 실패했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>크리에이터 추가</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="인스타그램 핸들 또는 이름 검색..."
            className="pl-9"
          />
        </div>

        <div className="flex-1 overflow-y-auto min-h-[200px] max-h-[400px] space-y-1">
          {loading && <p className="text-sm text-muted-foreground text-center py-4">검색 중...</p>}
          {!loading && search && creators.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">검색 결과가 없습니다</p>
          )}
          {creators.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer"
              onClick={() => toggleSelect(c.id)}
            >
              <Checkbox checked={selectedIds.has(c.id)} />
              <Avatar className="h-8 w-8">
                <AvatarImage src={getCreatorProfileImage(c)} />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  @{c.instagramHandle || 'unknown'}
                </p>
                {c.displayName && (
                  <p className="text-xs text-muted-foreground truncate">{c.displayName}</p>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {formatFollowerCount(c.igFollowers || 0)}
              </span>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button onClick={handleAdd} disabled={selectedIds.size === 0 || submitting}>
            {selectedIds.size > 0 ? `${selectedIds.size}명 추가하기` : '추가하기'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
