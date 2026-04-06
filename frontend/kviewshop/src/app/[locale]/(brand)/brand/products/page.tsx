'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getBrandProducts, getBrandSession, deleteProducts, bulkUpdateProducts } from '@/lib/actions/brand';
import { PRODUCT_CATEGORY_LABELS } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  LayoutGrid,
  List,
  Search,
  Package,
  Plus,
  Upload,
  Info,
  Loader2,
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
  createdAt?: string | null;
}

type SortMode = 'latest' | 'commission_high' | 'price_high';

function formatCurrency(num: number): string {
  return `${num.toLocaleString('ko-KR')}원`;
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
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
  const [searchType, setSearchType] = useState<string>('name');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortMode, setSortMode] = useState<SortMode>('latest');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkAllowCreatorPick, setBulkAllowCreatorPick] = useState('');
  const [bulkCommissionRate, setBulkCommissionRate] = useState('');

  const loadProducts = async (brandId?: string) => {
    const id = brandId || brand?.id;
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await getBrandProducts(id, statusFilter, categoryFilter);
      setProducts(data as any);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    async function load() {
      try {
        const brandData = await getBrandSession();
        if (!brandData) {
          setIsLoading(false);
          return;
        }
        setBrand(brandData);
        await loadProducts(brandData.id);
      } catch (error) {
        console.error('Failed to fetch products:', error);
        setIsLoading(false);
      }
    }

    setIsLoading(true);
    load();
  }, [statusFilter, categoryFilter]);

  const filteredProducts = products.filter((p) =>
    !searchQuery || (p.name ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortMode) {
      case 'commission_high':
        return Number(b.defaultCommissionRate) - Number(a.defaultCommissionRate);
      case 'price_high':
        return Number(b.salePrice ?? 0) - Number(a.salePrice ?? 0);
      case 'latest':
      default:
        return 0;
    }
  });

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === sortedProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedProducts.map((p) => p.id)));
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      const count = await deleteProducts(Array.from(selectedIds));
      toast.success(`${count}개 상품이 삭제되었습니다.`);
      setSelectedIds(new Set());
      setShowDeleteConfirm(false);
      await loadProducts();
    } catch (error) {
      toast.error('삭제에 실패했습니다.');
      console.error('Failed to delete products:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkUpdate = async () => {
    const data: { status?: string; allowCreatorPick?: boolean; defaultCommissionRate?: number } = {};
    if (bulkStatus) data.status = bulkStatus;
    if (bulkAllowCreatorPick) data.allowCreatorPick = bulkAllowCreatorPick === 'true';
    if (bulkCommissionRate) data.defaultCommissionRate = Number(bulkCommissionRate);

    if (Object.keys(data).length === 0) {
      toast.error('변경할 항목을 선택해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const count = await bulkUpdateProducts(Array.from(selectedIds), data);
      toast.success(`${count}개 상품이 업데이트되었습니다.`);
      setSelectedIds(new Set());
      setShowSettingsModal(false);
      setBulkStatus('');
      setBulkAllowCreatorPick('');
      setBulkCommissionRate('');
      await loadProducts();
    } catch (error) {
      toast.error('설정 변경에 실패했습니다.');
      console.error('Failed to update products:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDiscountPercent = (original: number, sale: number) => {
    if (!original || original <= sale) return 0;
    return Math.round(((original - sale) / original) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">상품 관리</h1>
          <div className="h-1 w-12 bg-gray-900 mt-2 rounded-full" />
        </div>
      </div>

      {/* Notice Banner */}
      <div className="flex items-center gap-4 rounded-xl bg-primary/5 border border-primary/15 px-6 py-4">
        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 shrink-0">
          <span className="text-2xl font-bold text-primary">%</span>
        </div>
        <p className="text-sm text-gray-700">
          <span className="font-semibold text-primary">크리에이터 수익 할인</span> 진행 중입니다. 설정한 수익률에서 프로모션 할인이 적용됩니다.
        </p>
      </div>

      {/* Search Section */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-3">상품 조회</h2>
        <Card className="bg-white rounded-xl border shadow-sm">
          <CardContent className="p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Select value={searchType} onValueChange={setSearchType}>
                <SelectTrigger className="w-full sm:w-[140px] h-11 bg-gray-50 border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">상품명</SelectItem>
                  <SelectItem value="category">카테고리</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="상품명을 입력해 주세요. (복수 검색 시 ,(콤마)로 구분)"
                  className="pl-9 h-11"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg">
            총 <span className="font-bold text-primary">{sortedProducts.length}개</span>
          </span>
          <div className="h-4 w-px bg-gray-200" />
          <button
            onClick={toggleAll}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <div className={`flex items-center justify-center h-5 w-5 rounded-full border-2 transition-colors ${
              selectedIds.size === sortedProducts.length && sortedProducts.length > 0
                ? 'bg-primary border-primary'
                : 'border-gray-300'
            }`}>
              {selectedIds.size === sortedProducts.length && sortedProducts.length > 0 && (
                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            전체 선택
          </button>
        </div>
        <div className="flex items-center gap-1">
          {(['latest', 'commission_high', 'price_high'] as SortMode[]).map((mode, idx) => (
            <button
              key={mode}
              onClick={() => setSortMode(mode)}
              className={`flex items-center gap-1 text-sm px-2 py-1 rounded transition-colors ${
                sortMode === mode
                  ? 'text-gray-900 font-medium'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${
                sortMode === mode ? 'bg-gray-900' : 'bg-gray-300'
              }`} />
              {mode === 'latest' ? '최신 등록순' : mode === 'commission_high' ? '수익률 높은 순' : '판매가 높은 순'}
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-10 px-6 rounded-lg border-gray-300 text-gray-700"
            disabled={selectedIds.size === 0}
            onClick={() => setShowSettingsModal(true)}
          >
            설정 변경
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-10 px-6 rounded-lg border-gray-300 text-gray-700"
            disabled={selectedIds.size === 0}
            onClick={() => setShowDeleteConfirm(true)}
          >
            삭제
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Link href="products/bulk">
            <Button variant="outline" size="sm" className="h-10 px-5 rounded-lg">
              <Upload className="h-4 w-4 mr-1.5" />
              일괄 등록
            </Button>
          </Link>
          <Link href="products/new">
            <Button size="sm" className="h-10 px-5 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium">
              <Plus className="h-4 w-4 mr-1.5" />
              상품 등록하기
            </Button>
          </Link>
        </div>
      </div>

      {/* Products */}
      {isLoading ? (
        <Card className="bg-white rounded-xl border shadow-sm">
          <CardContent className="p-6">
            <TableSkeleton />
          </CardContent>
        </Card>
      ) : sortedProducts.length === 0 ? (
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
        <Card className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50 border-b border-gray-200">
                  <TableHead className="w-16 text-center font-semibold text-xs text-gray-500 uppercase tracking-wider py-4">
                    선택
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-gray-500 uppercase tracking-wider py-4">
                    <div className="flex flex-col">
                      <span>상품명</span>
                      <span className="text-[10px] text-gray-400 font-normal normal-case tracking-normal">상품 번호</span>
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-gray-500 uppercase tracking-wider py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span>할인가</span>
                      <span className="text-[10px] text-gray-400 font-normal normal-case tracking-normal">판매가</span>
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-gray-500 uppercase tracking-wider py-4 text-center">대분류</TableHead>
                  <TableHead className="font-semibold text-xs text-gray-500 uppercase tracking-wider py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      판매 상태
                      <Info className="h-3 w-3 text-gray-400" />
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-gray-500 uppercase tracking-wider py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      등록일
                      <Info className="h-3 w-3 text-gray-400" />
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-gray-500 uppercase tracking-wider py-4 text-center">설정 상태</TableHead>
                  <TableHead className="font-semibold text-xs text-gray-500 uppercase tracking-wider py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      수익률
                      <Info className="h-3 w-3 text-gray-400" />
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-gray-500 uppercase tracking-wider py-4 text-center">설정</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedProducts.map((product) => {
                  const originalPrice = Number(product.originalPrice ?? 0);
                  const salePrice = Number(product.salePrice ?? 0);
                  const discount = getDiscountPercent(originalPrice, salePrice);
                  const commissionRate = Number(product.defaultCommissionRate) * 100;

                  return (
                    <TableRow key={product.id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-100">
                      <TableCell className="text-center py-5">
                        <div className="flex justify-center">
                          <button
                            onClick={() => toggleSelect(product.id)}
                            className={`flex items-center justify-center h-7 w-7 rounded-full border-2 transition-all ${
                              selectedIds.has(product.id)
                                ? 'bg-primary border-primary shadow-sm'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            {selectedIds.has(product.id) && (
                              <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="py-5">
                        <div className="flex items-center gap-3">
                          <div className="h-14 w-14 rounded-lg bg-gray-100 shrink-0 overflow-hidden border border-gray-200">
                            {(product.thumbnailUrl || (product.images && product.images[0])) ? (
                              <img
                                src={product.thumbnailUrl || product.images![0]}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <Package className="h-5 w-5 text-muted-foreground/40" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-gray-900 truncate max-w-[260px]">
                              {product.name}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              상품 번호 : #{product.id.slice(0, 10)}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-5">
                        <div className="flex flex-col items-center">
                          <span className="font-semibold text-sm text-gray-900">
                            {formatCurrency(salePrice)}
                          </span>
                          {discount > 0 && (
                            <span className="text-xs text-gray-400 line-through mt-0.5">
                              {formatCurrency(originalPrice)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-sm text-gray-600 py-5">
                        {PRODUCT_CATEGORY_LABELS[(product.category ?? '') as keyof typeof PRODUCT_CATEGORY_LABELS]}
                      </TableCell>
                      <TableCell className="text-center py-5">
                        <div className="flex justify-center">
                          <Badge
                            variant={product.status === 'ACTIVE' ? 'default' : 'secondary'}
                            className={
                              product.status === 'ACTIVE'
                                ? 'bg-green-50 text-green-700 border-green-200 font-medium'
                                : 'bg-gray-50 text-gray-500 border-gray-200 font-medium'
                            }
                          >
                            {product.status === 'ACTIVE' ? '판매중' : '판매중지'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-sm text-gray-600 py-5">
                        {product.createdAt
                          ? new Date(product.createdAt).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                            })
                          : '-'}
                      </TableCell>
                      <TableCell className="text-center py-5">
                        <Badge
                          variant="outline"
                          className={
                            product.allowCreatorPick
                              ? 'bg-blue-50 text-blue-700 border-blue-200 font-medium'
                              : 'bg-gray-50 text-gray-400 border-gray-200 font-medium'
                          }
                        >
                          {product.allowCreatorPick ? 'ON' : 'OFF'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center py-5">
                        <div className="flex flex-col items-center">
                          {discount > 0 ? (
                            <>
                              <span className="text-xs text-gray-400 line-through">{commissionRate}%</span>
                              <span className="font-semibold text-sm text-primary">
                                {commissionRate}%
                              </span>
                            </>
                          ) : (
                            <span className="font-medium text-sm text-gray-700">{commissionRate}%</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-5">
                        <Link href={`products/${product.id}`}>
                          <Button variant="outline" size="sm" className="h-8 px-4 rounded-lg text-xs border-gray-300 hover:bg-gray-50">
                            변경
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        /* Grid view */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sortedProducts.map((product) => {
            const originalPrice = Number(product.originalPrice ?? 0);
            const salePrice = Number(product.salePrice ?? 0);
            const discount = getDiscountPercent(originalPrice, salePrice);

            return (
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
                    </div>
                    {discount > 0 && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-red-500 text-white border-0">
                          {discount}%
                        </Badge>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <p className="font-medium text-sm truncate mb-0.5">{product.name}</p>
                    <p className="text-xs text-gray-400 mb-2">
                      {PRODUCT_CATEGORY_LABELS[(product.category ?? '') as keyof typeof PRODUCT_CATEGORY_LABELS]}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <p className="font-bold text-sm">{formatCurrency(salePrice)}</p>
                      {discount > 0 && (
                        <p className="text-xs text-gray-400 line-through">{formatCurrency(originalPrice)}</p>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-400">수익률 {Number(product.defaultCommissionRate) * 100}%</p>
                      <p className="text-xs text-gray-400">재고 {product.stock}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>상품 삭제</DialogTitle>
            <DialogDescription>
              선택한 {selectedIds.size}개 상품을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={isSubmitting}>
              취소
            </Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />삭제 중...</> : '삭제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Change Dialog */}
      <Dialog open={showSettingsModal} onOpenChange={(open) => {
        setShowSettingsModal(open);
        if (!open) { setBulkStatus(''); setBulkAllowCreatorPick(''); setBulkCommissionRate(''); }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>설정 변경</DialogTitle>
            <DialogDescription>
              선택한 {selectedIds.size}개 상품의 설정을 일괄 변경합니다. 변경하지 않을 항목은 비워두세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">판매 상태</Label>
              <Select value={bulkStatus} onValueChange={setBulkStatus}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="변경 없음" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">판매중</SelectItem>
                  <SelectItem value="INACTIVE">판매중지</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">크리에이터 픽 허용</Label>
              <Select value={bulkAllowCreatorPick} onValueChange={setBulkAllowCreatorPick}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="변경 없음" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">ON</SelectItem>
                  <SelectItem value="false">OFF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">기본 수익률 (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                placeholder="변경 없음"
                value={bulkCommissionRate}
                onChange={(e) => setBulkCommissionRate(e.target.value)}
                className="h-10"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowSettingsModal(false)} disabled={isSubmitting}>
              취소
            </Button>
            <Button onClick={handleBulkUpdate} disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />적용 중...</> : '적용'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
