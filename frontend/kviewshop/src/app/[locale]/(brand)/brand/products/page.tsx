'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/auth';
import type { Product } from '@/types/database';
import { PRODUCT_CATEGORY_LABELS } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

function formatCurrency(num: number): string {
  return `${num.toLocaleString('ko-KR')}원`;
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

export default function BrandProductsPage() {
  const { brand, isLoading: authLoading } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  useEffect(() => {
    if (!brand?.id) {
      if (!authLoading) setIsLoading(false);
      return;
    }

    async function fetchProducts() {
      const supabase = getClient();
      let query = supabase
        .from('products')
        .select('*')
        .eq('brand_id', brand!.id)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'ALL') {
        query = query.eq('status', statusFilter);
      }
      if (categoryFilter !== 'ALL') {
        query = query.eq('category', categoryFilter);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Failed to fetch products:', error);
      } else {
        setProducts((data ?? []) as Product[]);
      }
      setIsLoading(false);
    }

    setIsLoading(true);
    fetchProducts();
  }, [brand?.id, statusFilter, categoryFilter, authLoading]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">상품 관리</h1>
        <Link href="products/new">
          <Button>새 상품 등록</Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">상태</span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">전체</SelectItem>
                  <SelectItem value="ACTIVE">판매중</SelectItem>
                  <SelectItem value="INACTIVE">판매중지</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">카테고리</span>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">전체</SelectItem>
                  {Object.entries(PRODUCT_CATEGORY_LABELS).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            상품 목록{' '}
            <span className="text-sm font-normal text-muted-foreground">
              ({products.length}개)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton />
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">등록된 상품이 없습니다.</p>
              <Link href="products/new" className="mt-4">
                <Button variant="outline">첫 상품 등록하기</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>상품명</TableHead>
                  <TableHead>카테고리</TableHead>
                  <TableHead className="text-right">정가</TableHead>
                  <TableHead className="text-right">판매가</TableHead>
                  <TableHead className="text-right">재고</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>크리에이터픽</TableHead>
                  <TableHead className="text-right">기본 커미션율</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="max-w-[200px] truncate font-medium">
                      {product.name}
                    </TableCell>
                    <TableCell>
                      {PRODUCT_CATEGORY_LABELS[product.category]}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(product.original_price)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(product.sale_price)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          product.stock <= 10
                            ? 'font-medium text-destructive'
                            : ''
                        }
                      >
                        {product.stock.toLocaleString('ko-KR')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          product.status === 'ACTIVE' ? 'default' : 'secondary'
                        }
                      >
                        {product.status === 'ACTIVE' ? '판매중' : '판매중지'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          product.allow_creator_pick ? 'default' : 'outline'
                        }
                      >
                        {product.allow_creator_pick ? '허용' : '미허용'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {product.default_commission_rate}%
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`products/${product.id}`}>
                        <Button variant="ghost" size="sm">
                          수정
                        </Button>
                      </Link>
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
