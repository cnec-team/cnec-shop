'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getBrandProducts, getBrandSession } from '@/lib/actions/brand';
import { PRODUCT_CATEGORY_LABELS } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  LayoutGrid,
  List,
  Search,
  Package,
  Plus,
  Upload,
  AlertTriangle,
} from 'lucide-react';

interface ProductData {
  id: string;
  name: string | null;
  category: string | null;
  originalPrice: number | string | null;
  salePrice: number | string | null;
  stock: number;
  status: string;
  allowCreatorPick: boolean;
  defaultCommissionRate: number | string;
  thumbnailUrl?: string | null;
  images?: string[];
}

function formatCurrency(num: number): string {
  return `${num.toLocaleString('ko-KR')}원`;
}

function getStockBadge(stock: number) {
  if (stock === 0) return <Badge variant="destructive" className="text-[10px]">품절</Badge>;
  if (stock <= 10) return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-200 text-[10px]">재고 부족</Badge>;
  return null;
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
  const [brand, setBrand] = useState<{ id: string } | null>(null);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      try {
        const brandData = await getBrandSession();
        if (!brandData) {
          setIsLoading(false);
          return;
        }
        setBrand(brandData);

        const data = await getBrandProducts(brandData.id, statusFilter, categoryFilter);
        setProducts(data as any);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setIsLoading(false);
      }
    }

    setIsLoading(true);
    load();
  }, [statusFilter, categoryFilter]);

  const filteredProducts = products.filter((p) =>
    !searchQuery || (p.name ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map((p) => p.id)));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">상품 관리</h1>
          <p className="text-sm text-muted-foreground mt-1">
            등록된 상품 {products.length}개
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="products/bulk">
            <Button variant="outline" size="sm" className="h-9">
              <Upload className="h-4 w-4 mr-1.5" />
              일괄 등록
            </Button>
          </Link>
          <Link href="products/new">
            <Button size="sm" className="h-9">
              <Plus className="h-4 w-4 mr-1.5" />
              상품 등록
            </Button>
          </Link>
        </div>
      </div>

      {/* Search & Filters */}
      <Card className="bg-white rounded-xl border shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="상품명으로 검색"
                className="pl-9 h-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[110px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">전체 상태</SelectItem>
                  <SelectItem value="ACTIVE">판매중</SelectItem>
                  <SelectItem value="INACTIVE">판매중지</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[110px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">전체 카테고리</SelectItem>
                  {Object.entries(PRODUCT_CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="hidden sm:flex items-center border rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent'}`}
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent'}`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg bg-primary/5 border border-primary/10 px-4 py-3">
          <span className="text-sm font-medium">{selectedIds.size}개 선택됨</span>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setSelectedIds(new Set())}>
            선택 해제
          </Button>
        </div>
      )}

      {/* Products */}
      {isLoading ? (
        <Card className="bg-white rounded-xl border shadow-sm">
          <CardContent className="p-6">
            <TableSkeleton />
          </CardContent>
        </Card>
      ) : filteredProducts.length === 0 ? (
        <Card className="bg-white rounded-xl border shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="h-16 w-16 text-muted-foreground/20 mb-4" />
            <p className="text-lg font-medium mb-1">첫 상품을 등록해보세요</p>
            <p className="text-sm text-muted-foreground mb-6">
              상품을 등록하면 캠페인을 통해 크리에이터와 함께 판매할 수 있어요
            </p>
            <Link href="products/new">
              <Button>
                <Plus className="h-4 w-4 mr-1.5" />
                상품 등록
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : viewMode === 'list' ? (
        /* List view */
        <Card className="bg-white rounded-xl border shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                  <TableHead className="w-10 pl-4">
                    <Checkbox
                      checked={selectedIds.size === filteredProducts.length && filteredProducts.length > 0}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead className="font-medium text-sm text-gray-500">상품명</TableHead>
                  <TableHead className="font-medium text-sm text-gray-500">카테고리</TableHead>
                  <TableHead className="font-medium text-sm text-gray-500 text-right">판매가</TableHead>
                  <TableHead className="font-medium text-sm text-gray-500 text-right">재고</TableHead>
                  <TableHead className="font-medium text-sm text-gray-500">상태</TableHead>
                  <TableHead className="font-medium text-sm text-gray-500 text-right">수수료</TableHead>
                  <TableHead className="font-medium text-sm text-gray-500 text-right pr-4">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id} className="hover:bg-gray-50 transition-colors">
                    <TableCell className="pl-4">
                      <Checkbox
                        checked={selectedIds.has(product.id)}
                        onCheckedChange={() => toggleSelect(product.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gray-100 shrink-0 overflow-hidden">
                          {(product.thumbnailUrl || (product.images && product.images[0])) ? (
                            <img
                              src={product.thumbnailUrl || product.images![0]}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Package className="h-4 w-4 text-muted-foreground/40" />
                            </div>
                          )}
                        </div>
                        <span className="font-medium text-sm truncate max-w-[200px]">{product.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {PRODUCT_CATEGORY_LABELS[(product.category ?? '') as keyof typeof PRODUCT_CATEGORY_LABELS]}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {formatCurrency(Number(product.salePrice ?? 0))}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className={`text-sm ${product.stock <= 10 ? 'font-medium text-destructive' : ''}`}>
                          {product.stock.toLocaleString('ko-KR')}
                        </span>
                        {getStockBadge(product.stock)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={product.status === 'ACTIVE' ? 'default' : 'secondary'}
                        className={product.status === 'ACTIVE' ? 'bg-green-500/10 text-green-600 border-green-200' : ''}
                      >
                        {product.status === 'ACTIVE' ? '판매중' : '판매중지'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {Number(product.defaultCommissionRate) * 100}%
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <Link href={`products/${product.id}`}>
                        <Button variant="ghost" size="sm" className="h-7 text-xs">
                          수정
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        /* Grid view */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <Link key={product.id} href={`products/${product.id}`}>
              <Card className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                <div className="aspect-square bg-gray-100 rounded-t-xl overflow-hidden relative">
                  {(product.thumbnailUrl || (product.images && product.images[0])) ? (
                    <img
                      src={product.thumbnailUrl || product.images![0]}
                      alt={product.name ?? ''}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Package className="h-12 w-12 text-muted-foreground/20" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2 flex gap-1">
                    <Badge
                      variant={product.status === 'ACTIVE' ? 'default' : 'secondary'}
                      className={product.status === 'ACTIVE' ? 'bg-green-500/90 text-white' : ''}
                    >
                      {product.status === 'ACTIVE' ? '판매중' : '판매중지'}
                    </Badge>
                    {getStockBadge(product.stock)}
                  </div>
                </div>
                <CardContent className="p-4">
                  <p className="font-medium text-sm truncate mb-1">{product.name}</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    {PRODUCT_CATEGORY_LABELS[(product.category ?? '') as keyof typeof PRODUCT_CATEGORY_LABELS]}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-sm">{formatCurrency(Number(product.salePrice ?? 0))}</p>
                    <p className="text-xs text-muted-foreground">재고 {product.stock}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
