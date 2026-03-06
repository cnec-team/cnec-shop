'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/store/auth';
import { getClient } from '@/lib/supabase/client';
import { GUIDE_CATEGORY_LABELS } from '@/types/database';
import type { Guide, GuideCategory } from '@/types/database';

export default function AdminGuidesPage() {
  const { isLoading: authLoading } = useAuthStore();
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Guide | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<string>('CREATOR_BEGINNER');
  const [formTargetGrade, setFormTargetGrade] = useState('ALL');
  const [formOrder, setFormOrder] = useState(0);
  const [formPublished, setFormPublished] = useState(false);
  const [formContent, setFormContent] = useState('{"sections":[]}');

  const fetchGuides = useCallback(async () => {
    try {
      const supabase = getClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch('/api/admin/guides', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setGuides(data.guides);
      }
    } catch (error) {
      console.error('Failed to fetch guides:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) fetchGuides();
  }, [authLoading, fetchGuides]);

  const openCreate = () => {
    setEditing(null);
    setCreating(true);
    setFormTitle('');
    setFormCategory('CREATOR_BEGINNER');
    setFormTargetGrade('ALL');
    setFormOrder(0);
    setFormPublished(false);
    setFormContent('{"sections":[]}');
  };

  const openEdit = (guide: Guide) => {
    setCreating(false);
    setEditing(guide);
    setFormTitle(guide.title);
    setFormCategory(guide.category);
    setFormTargetGrade(guide.target_grade);
    setFormOrder(guide.display_order);
    setFormPublished(guide.is_published);
    setFormContent(JSON.stringify(guide.content, null, 2));
  };

  const handleSave = async () => {
    if (!formTitle.trim()) { toast.error('제목을 입력하세요'); return; }
    let parsedContent;
    try { parsedContent = JSON.parse(formContent); } catch {
      toast.error('content JSON이 올바르지 않습니다'); return;
    }

    setSaving(true);
    try {
      const supabase = getClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const body = {
        title: formTitle,
        category: formCategory,
        target_grade: formTargetGrade,
        display_order: formOrder,
        is_published: formPublished,
        content: parsedContent,
      };

      const url = editing ? `/api/admin/guides/${editing.id}` : '/api/admin/guides';
      const method = editing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(editing ? '가이드가 수정되었습니다' : '가이드가 생성되었습니다');
        setEditing(null);
        setCreating(false);
        fetchGuides();
      } else {
        const data = await res.json();
        toast.error(data.error || '저장에 실패했습니다');
      }
    } catch {
      toast.error('오류가 발생했습니다');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      const supabase = getClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`/api/admin/guides/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        toast.success('가이드가 삭제되었습니다');
        fetchGuides();
      }
    } catch {
      toast.error('삭제에 실패했습니다');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">가이드 관리</h1>
          <p className="text-sm text-muted-foreground">크리에이터/브랜드 가이드 콘텐츠를 관리합니다</p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          새 가이드
        </Button>
      </div>

      {/* Edit/Create Form */}
      {(editing || creating) && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-lg">{editing ? '가이드 수정' : '새 가이드'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">제목</label>
              <input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                placeholder="가이드 제목"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">카테고리</label>
                <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md text-sm">
                  {Object.entries(GUIDE_CATEGORY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">대상 등급</label>
                <select value={formTargetGrade} onChange={(e) => setFormTargetGrade(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-md text-sm">
                  <option value="ALL">전체</option>
                  <option value="SILVER">실버+</option>
                  <option value="GOLD">골드+</option>
                  <option value="PLATINUM">플래티넘+</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">정렬 순서</label>
                <input type="number" value={formOrder} onChange={(e) => setFormOrder(parseInt(e.target.value) || 0)} className="w-full mt-1 px-3 py-2 border rounded-md text-sm" />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={formPublished} onChange={(e) => setFormPublished(e.target.checked)} />
                  공개
                </label>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">콘텐츠 (JSON)</label>
              <textarea
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-md text-sm font-mono h-40"
                placeholder='{"sections":[{"type":"heading","text":"제목"}]}'
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving} size="sm">
                {saving ? '저장 중...' : '저장'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setEditing(null); setCreating(false); }}>취소</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Guide List */}
      <Card>
        <CardContent className="p-0">
          {guides.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">가이드가 없습니다</p>
          ) : (
            <div className="divide-y">
              {guides.map((guide) => (
                <div key={guide.id} className="flex items-center justify-between p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {guide.is_published ? (
                        <Eye className="h-4 w-4 text-green-500 shrink-0" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <p className="font-medium text-sm truncate">{guide.title}</p>
                    </div>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                        {GUIDE_CATEGORY_LABELS[guide.category as GuideCategory]}
                      </span>
                      {guide.target_grade !== 'ALL' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                          {guide.target_grade}+
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(guide)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(guide.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
