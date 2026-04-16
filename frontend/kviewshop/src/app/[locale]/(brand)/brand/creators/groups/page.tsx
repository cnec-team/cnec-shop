'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FolderOpen, Plus } from 'lucide-react';

export default function CreatorGroupsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">그룹 관리</h1>
          <p className="text-xs text-muted-foreground mt-0.5">크리에이터 그룹을 관리합니다</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          그룹 생성
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>크리에이터 그룹</CardTitle>
          <CardDescription>그룹별로 크리에이터를 분류하여 관리하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">생성된 그룹이 없습니다</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
