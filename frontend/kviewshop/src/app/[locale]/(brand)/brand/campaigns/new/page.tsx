'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrandSession, getActiveProducts, createCampaign } from '@/lib/actions/brand';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

type CampaignType = 'GONGGU' | 'ALWAYS';
type RecruitmentType = 'OPEN' | 'APPROVAL';

const STEPS = [
  { label: '기본 정보', description: '캠페인의 기본 설정' },
  { label: '상품/가격', description: '상품 선택 및 캠페인 가격 설정' },
  { label: '수수료', description: '크리에이터 수수료 설정' },
  { label: '모집 방식', description: '크리에이터 모집 조건 설정' },
];

interface ProductData {
  id: string;
  name: string | null;
  originalPrice: number | string | null;
  salePrice: number | string | null;
  stock: number;
}

interface SelectedProduct {
  productId: string;
  productName: string;
  campaignPrice: string;
  perCreatorLimit: string;
}

export default function NewCampaignPage() {
  const router = useRouter();
  const [brand, setBrand] = useState<{ id: string } | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Basic info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [campaignType, setCampaignType] = useState<CampaignType>('GONGGU');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');

  // Step 2: Products
  const [products, setProducts] = useState<ProductData[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>(
    []
  );

  // Step 3: Commission
  const [commissionRate, setCommissionRate] = useState('10');
  const [totalStock, setTotalStock] = useState('');

  // Step 4: Recruitment
  const [recruitmentType, setRecruitmentType] =
    useState<RecruitmentType>('OPEN');
  const [targetParticipants, setTargetParticipants] = useState('');
  const [conditions, setConditions] = useState('');

  // Load products for selection
  useEffect(() => {
    async function load() {
      try {
        const brandData = await getBrandSession();
        if (!brandData) {
          setProductsLoading(false);
          return;
        }
        setBrand(brandData);

        const data = await getActiveProducts(brandData.id);
        setProducts(data as any);
      } catch (err) {
        console.error('Failed to fetch products:', err);
      } finally {
        setProductsLoading(false);
      }
    }

    load();
  }, []);

  function toggleProduct(product: ProductData) {
    const exists = selectedProducts.find(
      (sp) => sp.productId === product.id
    );
    if (exists) {
      setSelectedProducts(
        selectedProducts.filter((sp) => sp.productId !== product.id)
      );
    } else {
      setSelectedProducts([
        ...selectedProducts,
        {
          productId: product.id,
          productName: product.name || '',
          campaignPrice: String(product.salePrice ?? 0),
          perCreatorLimit: '',
        },
      ]);
    }
  }

  function updateSelectedProduct(
    productId: string,
    field: 'campaignPrice' | 'perCreatorLimit',
    value: string
  ) {
    setSelectedProducts(
      selectedProducts.map((sp) =>
        sp.productId === productId ? { ...sp, [field]: value } : sp
      )
    );
  }

  function validateStep(): boolean {
    setError(null);
    switch (currentStep) {
      case 0:
        if (!title.trim()) {
          setError('캠페인명을 입력해주세요.');
          return false;
        }
        if (campaignType === 'GONGGU') {
          if (!startAt) {
            setError('시작일시를 입력해주세요.');
            return false;
          }
          if (!endAt) {
            setError('종료일시를 입력해주세요.');
            return false;
          }
          if (new Date(endAt) <= new Date(startAt)) {
            setError('종료일시는 시작일시 이후여야 합니다.');
            return false;
          }
        }
        return true;
      case 1:
        if (selectedProducts.length === 0) {
          setError('최소 1개 이상의 상품을 선택해주세요.');
          return false;
        }
        for (const sp of selectedProducts) {
          if (!sp.campaignPrice || Number(sp.campaignPrice) <= 0) {
            setError(
              `${sp.productName}의 캠페인 가격을 올바르게 입력해주세요.`
            );
            return false;
          }
        }
        return true;
      case 2:
        if (
          !commissionRate ||
          Number(commissionRate) < 0 ||
          Number(commissionRate) > 100
        ) {
          setError('수수료율을 올바르게 입력해주세요 (0-100%).');
          return false;
        }
        return true;
      case 3:
        return true;
      default:
        return true;
    }
  }

  function handleNext() {
    if (validateStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    }
  }

  function handlePrev() {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }

  async function handleSave() {
    if (!brand?.id) return;
    if (!validateStep()) return;

    setIsSaving(true);
    setError(null);

    try {
      await createCampaign({
        brandId: brand.id,
        type: campaignType,
        title: title.trim(),
        description: description.trim() || undefined,
        recruitmentType,
        commissionRate: Number(commissionRate),
        totalStock: totalStock ? Number(totalStock) : undefined,
        targetParticipants: targetParticipants
          ? Number(targetParticipants)
          : undefined,
        conditions: conditions.trim() || undefined,
        startAt: campaignType === 'GONGGU' ? new Date(startAt).toISOString() : undefined,
        endAt: campaignType === 'GONGGU' ? new Date(endAt).toISOString() : undefined,
        products: selectedProducts.map((sp) => ({
          productId: sp.productId,
          campaignPrice: Number(sp.campaignPrice),
          perCreatorLimit: sp.perCreatorLimit
            ? Number(sp.perCreatorLimit)
            : undefined,
        })),
      });

      // Navigate based on type
      if (campaignType === 'GONGGU') {
        router.push('../campaigns/gonggu');
      } else {
        router.push('../campaigns/always');
      }
    } catch (err) {
      console.error('Failed to create campaign:', err);
      setError('캠페인 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">새 캠페인 만들기</h1>
        <Button variant="outline" onClick={() => router.back()}>
          취소
        </Button>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((step, index) => (
          <div key={index} className="flex items-center gap-2">
            <button
              onClick={() => {
                if (index < currentStep) setCurrentStep(index);
              }}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                index === currentStep
                  ? 'bg-primary text-primary-foreground'
                  : index < currentStep
                    ? 'bg-primary/20 text-primary cursor-pointer'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {index + 1}
            </button>
            <span
              className={`hidden text-sm sm:inline ${
                index === currentStep
                  ? 'font-medium'
                  : 'text-muted-foreground'
              }`}
            >
              {step.label}
            </span>
            {index < STEPS.length - 1 && (
              <Separator className="w-6" orientation="horizontal" />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Step 1: Basic Info */}
      {currentStep === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
            <CardDescription>캠페인의 기본 정보를 입력하세요.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">캠페인명 *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="캠페인명을 입력하세요"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">설명</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="캠페인에 대한 설명을 입력하세요"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>캠페인 유형 *</Label>
              <Select
                value={campaignType}
                onValueChange={(value) =>
                  setCampaignType(value as CampaignType)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GONGGU">공구 (기간 한정)</SelectItem>
                  <SelectItem value="ALWAYS">상시 (기간 무제한)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {campaignType === 'GONGGU' && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startAt">시작 일시 *</Label>
                  <Input
                    id="startAt"
                    type="datetime-local"
                    value={startAt}
                    onChange={(e) => setStartAt(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endAt">종료 일시 *</Label>
                  <Input
                    id="endAt"
                    type="datetime-local"
                    value={endAt}
                    onChange={(e) => setEndAt(e.target.value)}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Products/Pricing */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>상품 / 가격 설정</CardTitle>
            <CardDescription>
              캠페인에 포함할 상품을 선택하고 캠페인 가격을 설정하세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {productsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <p className="py-4 text-center text-muted-foreground">
                등록된 판매 가능 상품이 없습니다. 먼저 상품을 등록해주세요.
              </p>
            ) : (
              <div className="space-y-3">
                {products.map((product) => {
                  const isSelected = selectedProducts.some(
                    (sp) => sp.productId === product.id
                  );
                  const selectedData = selectedProducts.find(
                    (sp) => sp.productId === product.id
                  );

                  return (
                    <div
                      key={product.id}
                      className={`rounded-lg border p-4 transition-colors ${
                        isSelected ? 'border-primary bg-primary/5' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleProduct(product)}
                        />
                        <div className="flex-1">
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            정가: {Number(product.originalPrice ?? 0).toLocaleString('ko-KR')}
                            원 / 판매가:{' '}
                            {Number(product.salePrice ?? 0).toLocaleString('ko-KR')}원 /
                            재고: {product.stock}
                          </p>
                        </div>
                      </div>

                      {isSelected && selectedData && (
                        <div className="mt-3 grid grid-cols-1 gap-3 pl-7 sm:grid-cols-2">
                          <div className="space-y-1">
                            <Label className="text-xs">캠페인 가격 (원)</Label>
                            <Input
                              type="number"
                              min="0"
                              value={selectedData.campaignPrice}
                              onChange={(e) =>
                                updateSelectedProduct(
                                  product.id,
                                  'campaignPrice',
                                  e.target.value
                                )
                              }
                              placeholder="0"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">
                              크리에이터 당 수량 제한
                            </Label>
                            <Input
                              type="number"
                              min="0"
                              value={selectedData.perCreatorLimit}
                              onChange={(e) =>
                                updateSelectedProduct(
                                  product.id,
                                  'perCreatorLimit',
                                  e.target.value
                                )
                              }
                              placeholder="제한 없음"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {selectedProducts.length > 0 && (
              <div className="rounded-md bg-muted p-3">
                <p className="text-sm font-medium">
                  선택된 상품: {selectedProducts.length}개
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Commission */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>크리에이터 수익 설정</CardTitle>
            <CardDescription>
              크리에이터에게 지급할 수익률을 설정하세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="commissionRate">크리에이터 수익률 (%) *</Label>
              <p className="text-sm text-muted-foreground">
                크리에이터가 판매를 성사시켰을 때 지급되는 수익 비율입니다.
              </p>
              <Input
                id="commissionRate"
                type="number"
                min="0"
                max="100"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                className="w-40"
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="totalStock">전체 수량 제한</Label>
              <p className="text-sm text-muted-foreground">
                캠페인 전체에서 판매 가능한 총 수량입니다. 비워두면 제한 없음.
              </p>
              <Input
                id="totalStock"
                type="number"
                min="0"
                value={totalStock}
                onChange={(e) => setTotalStock(e.target.value)}
                className="w-40"
                placeholder="제한 없음"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Recruitment */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>모집 방식</CardTitle>
            <CardDescription>
              크리에이터 참여 모집 방식을 설정하세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>모집 방식 *</Label>
              <RadioGroup
                value={recruitmentType}
                onValueChange={(value) =>
                  setRecruitmentType(value as RecruitmentType)
                }
              >
                <div className="flex items-start gap-3 rounded-lg border p-4">
                  <RadioGroupItem value="OPEN" id="open" className="mt-0.5" />
                  <div>
                    <Label htmlFor="open" className="cursor-pointer">
                      자동 승인 (OPEN)
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      크리에이터가 신청하면 자동으로 참여가 승인됩니다.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg border p-4">
                  <RadioGroupItem
                    value="APPROVAL"
                    id="approval"
                    className="mt-0.5"
                  />
                  <div>
                    <Label htmlFor="approval" className="cursor-pointer">
                      승인제 (APPROVAL)
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      브랜드가 크리에이터 참여를 직접 승인합니다.
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="targetParticipants">목표 참여 크리에이터 수</Label>
              <Input
                id="targetParticipants"
                type="number"
                min="0"
                value={targetParticipants}
                onChange={(e) => setTargetParticipants(e.target.value)}
                className="w-40"
                placeholder="제한 없음"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="conditions">참여 조건</Label>
              <p className="text-sm text-muted-foreground">
                크리에이터가 참여하기 위해 충족해야 할 조건을 입력하세요.
              </p>
              <Textarea
                id="conditions"
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                placeholder="예: 팔로워 1,000명 이상, 뷰티 카테고리 크리에이터"
                rows={3}
              />
            </div>

            {/* Summary */}
            <Separator />

            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <p className="font-semibold">캠페인 요약</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">캠페인명:</span>
                <span>{title || '-'}</span>
                <span className="text-muted-foreground">유형:</span>
                <span>
                  <Badge variant="outline">
                    {campaignType === 'GONGGU' ? '공구' : '상시'}
                  </Badge>
                </span>
                <span className="text-muted-foreground">선택 상품:</span>
                <span>{selectedProducts.length}개</span>
                <span className="text-muted-foreground">수수료율:</span>
                <span>{commissionRate}%</span>
                <span className="text-muted-foreground">모집 방식:</span>
                <span>
                  {recruitmentType === 'OPEN' ? '자동 승인' : '승인제'}
                </span>
                {campaignType === 'GONGGU' && startAt && (
                  <>
                    <span className="text-muted-foreground">기간:</span>
                    <span className="text-xs">
                      {startAt} ~ {endAt}
                    </span>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentStep === 0}
        >
          이전
        </Button>
        <div className="flex gap-3">
          {currentStep < STEPS.length - 1 ? (
            <Button onClick={handleNext}>다음</Button>
          ) : (
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? '저장 중...' : '캠페인 생성'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
