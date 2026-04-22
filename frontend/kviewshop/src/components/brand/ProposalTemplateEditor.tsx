'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface TemplateData {
  id: string;
  name: string;
  type: string;
  subject: string | null;
  body: string;
  commissionRate: number | null;
  isDefault: boolean;
}

interface ProposalTemplateEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: TemplateData | null;
  onSuccess: () => void;
}

const VARIABLES = [
  { label: '크리에이터명', var: '{{creatorName}}' },
  { label: '브랜드명', var: '{{brandName}}' },
  { label: '캠페인명', var: '{{campaignName}}' },
  { label: '커미션', var: '{{commissionRate}}' },
  { label: '기간', var: '{{campaignPeriod}}' },
];

function previewReplace(text: string, commissionRate: string): string {
  return text
    .replace(/\{\{creatorName\}\}/g, '김뷰티')
    .replace(/\{\{brandName\}\}/g, '브랜드명')
    .replace(/\{\{campaignName\}\}/g, '여름 공구')
    .replace(/\{\{commissionRate\}\}/g, `${commissionRate || '15'}%`)
    .replace(/\{\{campaignPeriod\}\}/g, '2026.05.01 ~ 2026.05.07');
}

export default function ProposalTemplateEditor({
  open,
  onOpenChange,
  template,
  onSuccess,
}: ProposalTemplateEditorProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState('GONGGU');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [commissionRate, setCommissionRate] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (template) {
      setName(template.name);
      setType(template.type);
      setSubject(template.subject || '');
      setBody(template.body);
      setCommissionRate(template.commissionRate != null ? String(template.commissionRate) : '');
      setIsDefault(template.isDefault);
    } else {
      setName('');
      setType('GONGGU');
      setSubject('');
      setBody('');
      setCommissionRate('');
      setIsDefault(false);
    }
  }, [template, open]);

  const insertVariable = (variable: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setBody((prev) => prev + variable);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newBody = body.slice(0, start) + variable + body.slice(end);
    setBody(newBody);
    requestAnimationFrame(() => {
      textarea.focus();
      const newPos = start + variable.length;
      textarea.setSelectionRange(newPos, newPos);
    });
  };

  const handleSave = async () => {
    if (!name.trim() || !body.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        type,
        subject: subject.trim() || null,
        body: body.trim(),
        commissionRate: commissionRate ? Number(commissionRate) : null,
        isDefault,
      };

      const url = template
        ? `/api/brand/proposal-templates/${template.id}`
        : '/api/brand/proposal-templates';
      const method = template ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || '저장 실패');
        return;
      }

      toast.success(template ? '템플릿이 수정되었습니다' : '템플릿이 생성되었습니다');
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error('템플릿 저장에 실패했습니다');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{template ? '템플릿 수정' : '새 템플릿'}</SheetTitle>
        </SheetHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* 좌측: 편집 */}
          <div className="space-y-4">
            <div>
              <Label>템플릿 이름 *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 여름 공구 초대"
              />
            </div>

            <div>
              <Label>제안 유형 *</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GONGGU">공구</SelectItem>
                  <SelectItem value="PRODUCT_PICK">상품 추천</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>제목</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="제안서 제목 (선택)"
              />
            </div>

            <div>
              <Label>본문 *</Label>
              <div className="flex flex-wrap gap-1 mb-2">
                {VARIABLES.map((v) => (
                  <Button
                    key={v.var}
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => insertVariable(v.var)}
                    type="button"
                  >
                    {v.label}
                  </Button>
                ))}
              </div>
              <Textarea
                ref={textareaRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={8}
                placeholder="안녕하세요 {{creatorName}}님..."
              />
            </div>

            <div>
              <Label>기본 커미션율 (%)</Label>
              <Input
                type="number"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                placeholder="15"
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={isDefault} onCheckedChange={setIsDefault} />
              <Label>기본 템플릿으로 설정</Label>
            </div>

            <Button
              onClick={handleSave}
              className="w-full"
              disabled={!name.trim() || !body.trim() || saving}
            >
              {template ? '수정' : '생성'}
            </Button>
          </div>

          {/* 우측: 미리보기 */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <h3 className="text-sm font-semibold mb-3">미리보기</h3>
            {subject && (
              <p className="font-medium mb-2">{previewReplace(subject, commissionRate)}</p>
            )}
            <div className="text-sm whitespace-pre-wrap">
              {previewReplace(body, commissionRate) || '본문을 입력하면 미리보기가 표시됩니다'}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
