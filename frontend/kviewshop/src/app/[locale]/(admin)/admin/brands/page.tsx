'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Search, Building2, Check } from 'lucide-react';
import { getAdminBrands, approveBrand } from '@/lib/actions/admin';
import { toast } from 'sonner';

interface Brand {
  id: string;
  companyName: string;
  businessNumber: string | null;
  approved: boolean;
  createdAt: Date;
}

export default function AdminBrandsPage() {
  const t = useTranslations('admin');
  const [search, setSearch] = useState('');
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBrands();
  }, []);

  async function fetchBrands() {
    try {
      const data = await getAdminBrands();
      setBrands(data as Brand[]);
    } catch (err) {
      console.error('Error:', err);
      setError('데이터를 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  }

  const handleApprove = async (id: string) => {
    await approveBrand(id);
    toast.success('브랜드가 승인되었습니다');
    fetchBrands();
  };

  const filteredBrands = brands.filter(b =>
    b.companyName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold">{t('brandManagement')}</h1>
        <p className="text-muted-foreground">{t('brandManagementDesc')}</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('allBrands')}</CardTitle>
              <CardDescription>{filteredBrands.length}개의 브랜드</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="브랜드 검색..."
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
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">{error}</p>
            </div>
          ) : filteredBrands.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">등록된 브랜드가 없습니다</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>회사명</TableHead>
                  <TableHead>사업자등록번호</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>등록일</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBrands.map((brand) => (
                  <TableRow key={brand.id}>
                    <TableCell className="font-medium">{brand.companyName}</TableCell>
                    <TableCell>{brand.businessNumber || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={brand.approved ? 'default' : 'secondary'}>
                        {brand.approved ? '승인됨' : '대기 중'}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(brand.createdAt).toLocaleDateString('ko-KR')}</TableCell>
                    <TableCell className="text-right">
                      {!brand.approved && (
                        <Button size="sm" onClick={() => handleApprove(brand.id)}>
                          <Check className="mr-2 h-4 w-4" />
                          승인
                        </Button>
                      )}
                    </TableCell>
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
