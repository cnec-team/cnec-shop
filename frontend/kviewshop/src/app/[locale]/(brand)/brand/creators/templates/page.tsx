'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Plus, MoreHorizontal, FileText } from 'lucide-react';
import { toast } from 'sonner';
import ProposalTemplateEditor from '@/components/brand/ProposalTemplateEditor';

interface TemplateData {
  id: string;
  name: string;
  type: string;
  subject: string | null;
  body: string;
  commissionRate: number | null;
  isDefault: boolean;
}

export default function ProposalTemplatesPage() {
  const [templates, setTemplates] = useState<TemplateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorTemplate, setEditorTemplate] = useState<TemplateData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TemplateData | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch('/api/brand/proposal-templates');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setTemplates(data.templates);
    } catch {
      toast.error('템플릿 목록을 불러오지 못했습니다');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const openCreate = () => {
    setEditorTemplate(null);
    setEditorOpen(true);
  };

  const openEdit = (t: TemplateData) => {
    setEditorTemplate(t);
    setEditorOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/brand/proposal-templates/${deleteTarget.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('템플릿이 삭제되었습니다');
      setDeleteTarget(null);
      fetchTemplates();
    } catch {
      toast.error('템플릿 삭제에 실패했습니다');
    }
  };

  if (loading) return null;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">제안서 템플릿</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> 새 템플릿
        </Button>
      </div>

      {templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((t) => (
            <Card key={t.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{t.name}</h3>
                    <Badge variant={t.type === 'GONGGU' ? 'default' : 'secondary'}>
                      {t.type === 'GONGGU' ? '공구' : '크리에이터픽'}
                    </Badge>
                    {t.isDefault && <Badge variant="outline">기본값</Badge>}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => openEdit(t)}>편집</DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeleteTarget(t)}
                        className="text-destructive"
                      >
                        삭제
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{t.body}</p>
                {t.commissionRate != null && (
                  <p className="text-xs text-muted-foreground mt-1">
                    기본 커미션: {Number(t.commissionRate)}%
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">아직 템플릿이 없습니다</p>
          <p className="text-sm text-muted-foreground mt-1">
            자주 쓰는 제안서를 템플릿으로 저장해보세요
          </p>
        </div>
      )}

      <ProposalTemplateEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        template={editorTemplate}
        onSuccess={fetchTemplates}
      />

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>템플릿을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>삭제된 템플릿은 복구할 수 없습니다.</AlertDialogDescription>
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
