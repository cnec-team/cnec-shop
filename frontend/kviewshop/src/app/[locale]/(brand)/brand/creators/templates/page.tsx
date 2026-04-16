'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus } from 'lucide-react';

export default function CreatorTemplatesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">메시지 템플릿</h1>
          <p className="text-xs text-muted-foreground mt-0.5">크리에이터에게 보내는 메시지 템플릿을 관리합니다</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          템플릿 생성
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>메시지 템플릿</CardTitle>
          <CardDescription>자주 사용하는 메시지를 템플릿으로 저장하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">생성된 템플릿이 없습니다</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
