'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Users } from 'lucide-react';

export default function CreatorExplorePage() {
  const [search, setSearch] = useState('');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">크리에이터 탐색</h1>
        <p className="text-xs text-muted-foreground mt-0.5">크리에이터를 검색하고 탐색합니다</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>크리에이터 검색</CardTitle>
              <CardDescription>카테고리, 팔로워 수, 활동 지역으로 필터링</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="크리에이터 검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">크리에이터 탐색 기능이 준비 중입니다</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
