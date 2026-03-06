'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { getClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/auth';
import type { ProductCategory } from '@/types/database';
import { PRODUCT_CATEGORY_LABELS } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const VALID_CATEGORIES = ['SKINCARE', 'MAKEUP', 'BODY', 'HAIR', 'ETC'] as const;
const CATEGORY_MAP: Record<string, ProductCategory> = {
  SKINCARE: 'skincare',
  MAKEUP: 'makeup',
  BODY: 'body',
  HAIR: 'hair',
  ETC: 'etc',
};

const MAX_ROWS = 100;

interface BulkProductRow {
  rowIndex: number;
  product_name: string;
  category: string;
  price: number;
  sale_price?: number;
  stock: number;
  commission_rate: number;
  description?: string;
  image_url?: string;
  allow_creator_pick: boolean;
  errors: string[];
}

function validateRow(row: Record<string, unknown>, index: number): BulkProductRow {
  const errors: string[] = [];

  const productName = String(row['product_name'] ?? '').trim();
  if (!productName) errors.push('상품명 필수');

  const categoryRaw = String(row['category'] ?? '').trim().toUpperCase();
  if (!categoryRaw) {
    errors.push('카테고리 필수');
  } else if (!VALID_CATEGORIES.includes(categoryRaw as typeof VALID_CATEGORIES[number])) {
    errors.push(`카테고리 오류: ${categoryRaw} (SKINCARE/MAKEUP/BODY/HAIR/ETC)`);
  }

  const price = Number(row['price']);
  if (!price || price <= 0) errors.push('정상가 필수 (양수)');

  const salePriceRaw = row['sale_price'];
  const salePrice = salePriceRaw ? Number(salePriceRaw) : undefined;
  if (salePrice !== undefined && salePrice <= 0) errors.push('할인가는 양수여야 합니다');
  if (salePrice !== undefined && price > 0 && salePrice > price) errors.push('할인가가 정상가보다 높습니다');

  const stock = Number(row['stock']);
  if (isNaN(stock) || stock < 0) errors.push('재고 필수 (0 이상)');

  const commissionRate = Number(row['commission_rate']);
  if (isNaN(commissionRate) || commissionRate < 0 || commissionRate > 100) {
    errors.push('수수료율 0~100 범위');
  }

  const allowPickRaw = String(row['allow_creator_pick'] ?? 'Y').trim().toUpperCase();
  const allowCreatorPick = allowPickRaw !== 'N';

  return {
    rowIndex: index + 2, // Excel row (1-indexed header + 1-indexed data)
    product_name: productName,
    category: categoryRaw,
    price: price || 0,
    sale_price: salePrice,
    stock: stock || 0,
    commission_rate: commissionRate || 0,
    description: String(row['description'] ?? '').trim() || undefined,
    image_url: String(row['image_url'] ?? '').trim() || undefined,
    allow_creator_pick: allowCreatorPick,
    errors,
  };
}

function downloadTemplate() {
  const headers = [
    'product_name',
    'category',
    'price',
    'sale_price',
    'stock',
    'commission_rate',
    'description',
    'image_url',
    'allow_creator_pick',
  ];

  const exampleRow = [
    '수분 크림 50ml',
    'SKINCARE',
    35000,
    29000,
    100,
    15,
    '촉촉한 수분 크림',
    '',
    'Y',
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '상품목록');
  XLSX.writeFile(wb, 'cnec_product_template.xlsx');
}

export default function BulkUploadPage() {
  const router = useRouter();
  const { brand } = useAuthStore();
  const [parsedRows, setParsedRows] = useState<BulkProductRow[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [fileName, setFileName] = useState<string>('');

  const hasErrors = parsedRows.some((r) => r.errors.length > 0);
  const validCount = parsedRows.filter((r) => r.errors.length === 0).length;

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'xlsx' && ext !== 'csv' && ext !== 'xls') {
      toast.error('xlsx, xls, csv 파일만 지원합니다.');
      return;
    }

    setIsUploading(true);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

        if (jsonRows.length === 0) {
          toast.error('데이터가 없습니다. 템플릿을 확인해주세요.');
          setIsUploading(false);
          return;
        }

        if (jsonRows.length > MAX_ROWS) {
          toast.error(`한 번에 최대 ${MAX_ROWS}개까지 업로드 가능합니다. (현재 ${jsonRows.length}개)`);
          setIsUploading(false);
          return;
        }

        const validated = jsonRows.map((row, index) => validateRow(row, index));
        setParsedRows(validated);

        const errorCount = validated.filter((r) => r.errors.length > 0).length;
        if (errorCount > 0) {
          toast.error(`${errorCount}개 행에 오류가 있습니다. 확인 후 수정해주세요.`);
        } else {
          toast.success(`${validated.length}개 상품이 파싱되었습니다.`);
        }
      } catch {
        toast.error('파일 파싱에 실패했습니다.');
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsBinaryString(file);

    // Reset input for re-upload
    e.target.value = '';
  }, []);

  const handleBulkRegister = async () => {
    if (!brand?.id) {
      toast.error('브랜드 정보를 불러올 수 없습니다.');
      return;
    }
    if (hasErrors) {
      toast.error('오류가 있는 행을 수정한 후 다시 업로드해주세요.');
      return;
    }

    setIsRegistering(true);
    try {
      const supabase = getClient();

      const products = parsedRows.map((row) => ({
        brand_id: brand.id,
        name: row.product_name,
        category: CATEGORY_MAP[row.category] || 'etc',
        original_price: row.price,
        sale_price: row.sale_price ?? row.price,
        stock: row.stock,
        default_commission_rate: row.commission_rate,
        description: row.description ?? null,
        images: row.image_url ? [row.image_url] : [],
        thumbnail_url: row.image_url ?? null,
        allow_creator_pick: row.allow_creator_pick,
        status: 'ACTIVE' as const,
        shipping_fee_type: 'PAID' as const,
        shipping_fee: brand.default_shipping_fee ?? 3000,
      }));

      const { error } = await supabase.from('products').insert(products);

      if (error) {
        console.error('Bulk insert error:', error);
        toast.error('상품 등록에 실패했습니다: ' + error.message);
        return;
      }

      toast.success(`${products.length}개 상품이 등록되었습니다!`);
      router.push('../products');
    } catch (err) {
      console.error('Bulk register error:', err);
      toast.error('상품 등록 중 오류가 발생했습니다.');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="../products">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            돌아가기
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">상품 일괄 등록</h1>
          <p className="text-sm text-muted-foreground">
            엑셀 파일로 최대 {MAX_ROWS}개 상품을 한 번에 등록합니다.
          </p>
        </div>
      </div>

      {/* Step 1: Template & Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            파일 업로드
          </CardTitle>
          <CardDescription>
            템플릿을 다운로드한 후 작성하여 업로드하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              템플릿 다운로드
            </Button>

            <label>
              <Button variant="default" asChild disabled={isUploading}>
                <span className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? '파싱 중...' : '엑셀/CSV 업로드'}
                </span>
              </Button>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>

            {fileName && (
              <span className="flex items-center text-sm text-muted-foreground">
                {fileName}
              </span>
            )}
          </div>

          <div className="mt-4 text-xs text-muted-foreground space-y-1">
            <p>* category: SKINCARE / MAKEUP / BODY / HAIR / ETC</p>
            <p>* allow_creator_pick: Y 또는 N (기본 Y)</p>
            <p>* sale_price: 미입력 시 정상가와 동일</p>
            <p>* 한 번에 최대 {MAX_ROWS}개</p>
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Preview Table */}
      {parsedRows.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>미리보기</CardTitle>
                <CardDescription>
                  총 {parsedRows.length}개 중 {validCount}개 정상,{' '}
                  {parsedRows.length - validCount}개 오류
                </CardDescription>
              </div>
              <Button
                onClick={handleBulkRegister}
                disabled={hasErrors || isRegistering || parsedRows.length === 0}
              >
                {isRegistering ? '등록 중...' : `${validCount}개 상품 등록`}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">행</TableHead>
                    <TableHead>상품명</TableHead>
                    <TableHead>카테고리</TableHead>
                    <TableHead className="text-right">정가</TableHead>
                    <TableHead className="text-right">할인가</TableHead>
                    <TableHead className="text-right">재고</TableHead>
                    <TableHead className="text-right">수수료(%)</TableHead>
                    <TableHead>크리에이터픽</TableHead>
                    <TableHead>상태</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedRows.map((row) => {
                    const hasRowError = row.errors.length > 0;
                    return (
                      <TableRow
                        key={row.rowIndex}
                        className={hasRowError ? 'bg-destructive/5' : ''}
                      >
                        <TableCell className="font-mono text-xs">
                          {row.rowIndex}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {row.product_name || (
                            <span className="text-destructive">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {CATEGORY_MAP[row.category]
                            ? PRODUCT_CATEGORY_LABELS[CATEGORY_MAP[row.category]]
                            : row.category || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.price > 0
                            ? `${row.price.toLocaleString('ko-KR')}원`
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.sale_price
                            ? `${row.sale_price.toLocaleString('ko-KR')}원`
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right">{row.stock}</TableCell>
                        <TableCell className="text-right">
                          {row.commission_rate}%
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={row.allow_creator_pick ? 'default' : 'outline'}
                          >
                            {row.allow_creator_pick ? '허용' : '미허용'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {hasRowError ? (
                            <div className="flex items-start gap-1">
                              <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                              <div className="text-xs text-destructive">
                                {row.errors.map((err, i) => (
                                  <p key={i}>{err}</p>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
