'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Users } from 'lucide-react';
import { getAdminCreators } from '@/lib/actions/admin';

interface Creator {
  id: string;
  username: string | null;
  displayName: string | null;
  country: string | null;
  createdAt: Date;
}

export default function AdminCreatorsPage() {
  const t = useTranslations('admin');
  const [search, setSearch] = useState('');
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCreators();
  }, []);

  async function fetchCreators() {
    try {
      const data = await getAdminCreators();
      setCreators(data as Creator[]);
    } catch (err) {
      console.error('Error:', err);
      setError('데이터를 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  }

  const filteredCreators = creators.filter(c =>
    c.username?.toLowerCase().includes(search.toLowerCase()) ||
    c.displayName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold">{t('creatorManagement')}</h1>
        <p className="text-muted-foreground">{t('creatorManagementDesc')}</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('allCreators')}</CardTitle>
              <CardDescription>{filteredCreators.length}명의 크리에이터</CardDescription>
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
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
          ) : error ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">{error}</p>
            </div>
          ) : filteredCreators.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">등록된 크리에이터가 없습니다</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>크리에이터</TableHead>
                  <TableHead>국가</TableHead>
                  <TableHead>가입일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCreators.map((creator) => (
                  <TableRow key={creator.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{creator.displayName || creator.username}</p>
                        <p className="text-sm text-muted-foreground">@{creator.username}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{creator.country}</Badge>
                    </TableCell>
                    <TableCell>{new Date(creator.createdAt).toLocaleDateString('ko-KR')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
