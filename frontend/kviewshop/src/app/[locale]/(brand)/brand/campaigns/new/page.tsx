'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getBrandSession, getActiveProducts, createCampaign, getBrandCampaignById } from '@/lib/actions/brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { DatePicker } from '@/components/ui/date-picker';
import { Slider } from '@/components/ui/slider';
import {
  AlertCircle,
  Check,
  Clock,
  Megaphone,
  ShoppingBag,
  Percent,
  Users,
  Repeat,
  Info,
  Lightbulb,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { CNEC_COMMISSION_RATE } from '@/lib/constants';

type CampaignType = 'GONGGU' | 'ALWAYS';
type RecruitmentType = 'OPEN' | 'APPROVAL';

const STEPS = [
  { label: '기본 정보', icon: Megaphone },
  { label: '상품/가격', icon: ShoppingBag },
  { label: '수수료', icon: Percent },
  { label: '모집 방식', icon: Users },
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

/* ── 공통 인라인 스타일 클래스 ───────────────── */
const inputCls =
  'h-12 rounded-[14px] border-[1.5px] border-gray-100 focus:border-blue-600 focus:ring-[3px] focus:ring-blue-50 text-[14px] placeholder:text-gray-300';
const textareaCls =
  'rounded-[14px] border-[1.5px] border-gray-100 focus:border-blue-600 focus:ring-[3px] focus:ring-blue-50 text-[14px] placeholder:text-gray-300';
const labelCls = 'text-[13px] font-semibold text-gray-900';

/* ── Section Card ─────────────────────────── */
function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-7 mb-4">
      <div className="flex items-center gap-2 mb-6">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
        <h2 className="text-[15px] font-bold text-gray-900">{title}</h2>
      </div>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

/* ── Price Input with "원" suffix ─────────── */
function PriceInput({
  id,
  value,
  onChange,
  placeholder = '0',
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <Input
        id={id}
        type="number"
        min="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${inputCls} text-right pr-10`}
        style={{ fontVariantNumeric: 'tabular-nums' }}
      />
      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-gray-400 pointer-events-none">
        원
      </span>
    </div>
  );
}

export default function NewCampaignPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const duplicateId = searchParams.get('duplicate');
  const [brand, setBrand] = useState<{ id: string } | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Basic info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [campaignType, setCampaignType] = useState<CampaignType>('GONGGU');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // Step 2: Products
  const [products, setProducts] = useState<ProductData[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);

  // Step 3: Commission
  const [commissionRate, setCommissionRate] = useState('');
  const [totalStock, setTotalStock] = useState('');

  // Price Scout warnings
  const [productsWithoutPrices, setProductsWithoutPrices] = useState<Set<string>>(new Set());

  // Step 4: Recruitment
  const [recruitmentType, setRecruitmentType] = useState<RecruitmentType>('OPEN');
  const [targetParticipants, setTargetParticipants] = useState('');
  const [conditions, setConditions] = useState('');
  const [recruitStartDate, setRecruitStartDate] = useState<Date | undefined>(undefined);
  const [recruitEndDate, setRecruitEndDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    async function load() {
      try {
        const brandData = await getBrandSession();
        if (!brandData) { setProductsLoading(false); return; }
        setBrand(brandData);
        const brandRate = brandData.creatorCommissionRate ?? 15;
        if (brandRate > 0 && !commissionRate) setCommissionRate(String(brandRate));
        const data = await getActiveProducts(brandData.id);
        setProducts(data as any);

        // Check which products have no channel prices
        const noPriceIds = new Set<string>();
        for (const p of data as Array<{ id: string }>) {
          try {
            const res = await fetch(`/api/brand/products/${p.id}/channel-prices`);
            if (res.ok) {
              const cpData = await res.json();
              if (!cpData.channels || cpData.channels.length === 0) {
                noPriceIds.add(p.id);
              }
            } else {
              noPriceIds.add(p.id);
            }
          } catch {
            noPriceIds.add(p.id);
          }
        }
        setProductsWithoutPrices(noPriceIds);

        // 캠페인 복제 시 데이터 프리필
        if (duplicateId) {
          try {
            const source = await getBrandCampaignById(duplicateId);
            if (source) {
              setTitle(`${source.title} (복제)`);
              setDescription(source.description || '');
              setCampaignType(source.type as CampaignType);
              if (source.commissionRate) {
                setCommissionRate(String(Math.round(Number(source.commissionRate) * 100)));
              }
              setRecruitmentType((source.recruitmentType || 'OPEN') as RecruitmentType);
              if (source.targetParticipants) setTargetParticipants(String(source.targetParticipants));
              if (source.conditions) setConditions(source.conditions);
              if (source.totalStock) setTotalStock(String(source.totalStock));
            }
          } catch {
            // 복제 실패 시 무시
          }
        }
      } catch (err) {
        console.error('Failed to fetch products:', err);
      } finally {
        setProductsLoading(false);
      }
    }
    load();
  }, []);

  function toggleProduct(product: ProductData) {
    const exists = selectedProducts.find((sp) => sp.productId === product.id);
    if (exists) {
      setSelectedProducts(selectedProducts.filter((sp) => sp.productId !== product.id));
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

  function updateSelectedProduct(productId: string, field: 'campaignPrice' | 'perCreatorLimit', value: string) {
    setSelectedProducts(
      selectedProducts.map((sp) => (sp.productId === productId ? { ...sp, [field]: value } : sp))
    );
  }

  function validateStep(): boolean {
    setError(null);
    switch (currentStep) {
      case 0:
        if (!title.trim()) { setError('캠페인명을 입력해주세요.'); return false; }
        if (campaignType === 'GONGGU') {
          if (!startDate) { setError('시작일을 선택해주세요.'); return false; }
          if (!endDate) { setError('종료일을 선택해주세요.'); return false; }
          if (endDate <= startDate) { setError('종료일은 시작일 이후여야 합니다.'); return false; }
        }
        return true;
      case 1:
        if (selectedProducts.length === 0) { setError('최소 1개 이상의 상품을 선택해주세요.'); return false; }
        for (const sp of selectedProducts) {
          if (!sp.campaignPrice || Number(sp.campaignPrice) <= 0) {
            setError(`${sp.productName}의 캠페인 가격을 올바르게 입력해주세요.`);
            return false;
          }
        }
        return true;
      case 2:
        if (!commissionRate || Number(commissionRate) < 0 || Number(commissionRate) > 100) {
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
    if (validateStep()) setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
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
        targetParticipants: targetParticipants ? Number(targetParticipants) : undefined,
        conditions: conditions.trim() || undefined,
        startAt: campaignType === 'GONGGU' && startDate ? startDate.toISOString() : undefined,
        endAt: campaignType === 'GONGGU' && endDate ? endDate.toISOString() : undefined,
        recruitStartAt: recruitStartDate ? recruitStartDate.toISOString() : undefined,
        recruitEndAt: recruitEndDate ? recruitEndDate.toISOString() : undefined,
        products: selectedProducts.map((sp) => ({
          productId: sp.productId,
          campaignPrice: Number(sp.campaignPrice),
          perCreatorLimit: sp.perCreatorLimit ? Number(sp.perCreatorLimit) : undefined,
        })),
      });

      toast.success('캠페인이 생성되었습니다');
      if (campaignType === 'GONGGU') {
        router.push('../campaigns/gonggu');
      } else {
        router.push('../campaigns/always');
      }
    } catch (err) {
      console.error('Failed to create campaign:', err);
      setError('캠페인 생성에 실패했습니다. 다시 시도해주세요.');
      toast.error('캠페인 생성에 실패했습니다. 다시 시도해주세요');
    } finally {
      setIsSaving(false);
    }
  }

  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-28">
      <div className="max-w-[680px] mx-auto px-4 pt-8">
        {/* ── Page Header ────────────────────────── */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex items-center justify-center w-9 h-9 rounded-[10px] bg-blue-600">
            <Megaphone className="w-[18px] h-[18px] text-white" />
          </div>
          <div>
            <h1 className="text-[22px] font-extrabold text-gray-900 leading-tight">
              새 캠페인 만들기
            </h1>
            <p className="text-[13px] text-gray-400 mt-0.5">
              캠페인 정보를 단계별로 설정하세요
            </p>
          </div>
        </div>

        {/* ── Step Indicator ─────────────────────── */}
        <div className="flex items-center justify-center gap-0 mb-8">
          {STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const isCurrent = index === currentStep;
            const isCompleted = index < currentStep;

            return (
              <div key={index} className="flex items-center">
                <button
                  onClick={() => { if (isCompleted) setCurrentStep(index); }}
                  className={`flex flex-col items-center gap-1.5 ${isCompleted ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all ${
                      isCurrent
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                        : isCompleted
                          ? 'bg-[#ECFDF5] text-[#059669]'
                          : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-[18px] h-[18px]" />
                    ) : (
                      <StepIcon className="w-[18px] h-[18px]" />
                    )}
                  </div>
                  <span
                    className={`text-[11px] font-medium ${
                      isCurrent ? 'text-blue-600' : isCompleted ? 'text-[#059669]' : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </button>
                {index < STEPS.length - 1 && (
                  <div
                    className={`w-10 h-[2px] mx-2 mt-[-18px] ${
                      index < currentStep ? 'bg-[#059669]' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* ── Error Banner ────────────────────────── */}
        {error && (
          <div className="flex items-center gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-5 py-3.5 text-[13px] text-red-600 mb-4">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)}>
              <X className="h-3.5 w-3.5 text-red-400" />
            </button>
          </div>
        )}

        {/* ── Step 1: 기본 정보 ──────────────────── */}
        {currentStep === 0 && (
          <SectionCard title="기본 정보">
            <div className="space-y-2">
              <Label htmlFor="title" className={labelCls}>
                캠페인명 <span className="text-blue-600">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="캠페인명을 입력하세요"
                className={inputCls}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className={labelCls}>설명</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="캠페인에 대한 설명을 입력하세요"
                rows={3}
                className={textareaCls}
              />
            </div>

            <div className="space-y-3">
              <Label className={labelCls}>
                캠페인 유형 <span className="text-blue-600">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCampaignType('GONGGU')}
                  className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-[1.5px] transition-all ${
                    campaignType === 'GONGGU'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${campaignType === 'GONGGU' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    <Clock className="w-5 h-5" />
                  </div>
                  <span className={`text-[14px] font-semibold ${campaignType === 'GONGGU' ? 'text-blue-700' : 'text-gray-600'}`}>
                    공구 (기간 한정)
                  </span>
                  <span className={`text-[11px] ${campaignType === 'GONGGU' ? 'text-blue-500' : 'text-gray-400'}`}>
                    시작/종료일 설정
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setCampaignType('ALWAYS')}
                  className={`flex flex-col items-center gap-2 p-5 rounded-2xl border-[1.5px] transition-all ${
                    campaignType === 'ALWAYS'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${campaignType === 'ALWAYS' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    <Repeat className="w-5 h-5" />
                  </div>
                  <span className={`text-[14px] font-semibold ${campaignType === 'ALWAYS' ? 'text-blue-700' : 'text-gray-600'}`}>
                    상시 (기간 무제한)
                  </span>
                  <span className={`text-[11px] ${campaignType === 'ALWAYS' ? 'text-blue-500' : 'text-gray-400'}`}>
                    기간 제한 없음
                  </span>
                </button>
              </div>
            </div>

            {campaignType === 'GONGGU' && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className={labelCls}>
                    시작일 <span className="text-blue-600">*</span>
                  </Label>
                  <DatePicker
                    value={startDate}
                    onChange={setStartDate}
                    placeholder="YYYY. MM. DD. HH:mm"
                    minDate={new Date()}
                    maxDate={(() => { const d = new Date(); d.setDate(d.getDate() + 30); return d; })()}
                    helperText="등록/수정일로부터 30일 이내로 선택 가능"
                    showTime
                  />
                </div>
                <div className="space-y-2">
                  <Label className={labelCls}>
                    종료일 <span className="text-blue-600">*</span>
                  </Label>
                  <DatePicker
                    value={endDate}
                    onChange={setEndDate}
                    placeholder="YYYY. MM. DD. HH:mm"
                    minDate={startDate ?? new Date()}
                    maxDate={(() => { const base = startDate ?? new Date(); const d = new Date(base); d.setDate(d.getDate() + 30); return d; })()}
                    helperText="시작일로부터 30일 이내로 선택 가능"
                    showTime
                  />
                </div>
              </div>
            )}
          </SectionCard>
        )}

        {/* ── Step 2: 상품/가격 설정 ─────────────── */}
        {currentStep === 1 && (
          <SectionCard title="상품 / 가격 설정">
            {productsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-[14px]" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 mb-3">
                  <ShoppingBag className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-[14px] text-gray-500">등록된 판매 가능 상품이 없습니다.</p>
                <p className="text-[12px] text-gray-400 mt-1">먼저 상품을 등록해주세요.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {products.map((product) => {
                  const isSelected = selectedProducts.some((sp) => sp.productId === product.id);
                  const selectedData = selectedProducts.find((sp) => sp.productId === product.id);

                  return (
                    <div
                      key={product.id}
                      className={`rounded-[14px] border-[1.5px] p-4 transition-all ${
                        isSelected ? 'border-blue-600 bg-blue-50/50' : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleProduct(product)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-medium text-gray-900 truncate">{product.name}</p>
                          <p className="text-[12px] text-gray-400 mt-0.5" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            정가 {Number(product.originalPrice ?? 0).toLocaleString('ko-KR')}원 · 판매가 {Number(product.salePrice ?? 0).toLocaleString('ko-KR')}원 · 재고 {product.stock}
                          </p>
                        </div>
                      </div>

                      {isSelected && selectedData && (
                        <div className="mt-3 grid grid-cols-1 gap-3 pl-7 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <Label className="text-[12px] font-medium text-gray-500">캠페인 가격</Label>
                            <PriceInput
                              value={selectedData.campaignPrice}
                              onChange={(v) => updateSelectedProduct(product.id, 'campaignPrice', v)}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[12px] font-medium text-gray-500">크리에이터 당 수량 제한</Label>
                            <Input
                              type="number"
                              min="0"
                              value={selectedData.perCreatorLimit}
                              onChange={(e) => updateSelectedProduct(product.id, 'perCreatorLimit', e.target.value)}
                              placeholder="제한 없음"
                              className={inputCls}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {selectedProducts.some((sp) => productsWithoutPrices.has(sp.productId)) && (
              <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span className="text-[13px] text-amber-800">
                  선택한 상품 중 기존 채널 가격이 없는 상품이 있습니다. 상품 관리에서 입력해주세요.
                </span>
              </div>
            )}

            {selectedProducts.length > 0 && (
              <div className="flex items-center gap-2.5 bg-blue-50 rounded-xl p-3">
                <Info className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-[13px] font-medium text-blue-700">
                  선택된 상품: {selectedProducts.length}개
                </span>
              </div>
            )}
          </SectionCard>
        )}

        {/* ── Step 3: 크리에이터 수익 설정 ──────── */}
        {currentStep === 2 && (() => {
          const rate = Number(commissionRate) || 15;
          const firstProduct = selectedProducts[0];
          const rawPrice = firstProduct ? Number(firstProduct.campaignPrice) : 0;
          const hasProduct = rawPrice > 0;
          const basePrice = hasProduct ? rawPrice : 30000;
          const creatorFee = Math.round(basePrice * (rate / 100));
          const cnecFee = Math.round(basePrice * CNEC_COMMISSION_RATE);
          const brandNet = basePrice - creatorFee - cnecFee;
          const brandPct = Math.round((brandNet / basePrice) * 100);

          const guidelines = [
            { range: '10~15%', label: '일반 크리에이터 참여에 적합해요', min: 10, max: 15 },
            { range: '15~20%', label: '인기 크리에이터도 적극 참여하는 수수료예요', min: 15, max: 20 },
            { range: '20~25%', label: '프리미엄 크리에이터 확보에 유리해요', min: 20, max: 25 },
            { range: '25%+', label: '대부분의 크리에이터가 우선 참여하고 싶어해요', min: 25, max: 100 },
          ];

          return (
            <>
              <SectionCard title="크리에이터 수익 설정">
                {/* Slider */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className={labelCls}>
                      크리에이터 수익률 <span className="text-blue-600">*</span>
                    </Label>
                    <span className="text-2xl font-bold text-blue-600" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {rate}%
                    </span>
                  </div>
                  <Slider
                    value={[rate]}
                    onValueChange={([v]) => setCommissionRate(String(v))}
                    min={5}
                    max={40}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[11px] text-gray-400">
                    <span>5%</span>
                    <span>40%</span>
                  </div>
                </div>

                {/* Guideline Card */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <div className="flex items-center gap-1.5 mb-3">
                    <Lightbulb className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-900">수수료 가이드</span>
                  </div>
                  <div className="space-y-1.5">
                    {guidelines.map((g) => {
                      const active = rate >= g.min && rate < (g.min === 25 ? 101 : g.max + 1);
                      return (
                        <div key={g.range} className="flex gap-2 text-sm">
                          <span className={`w-16 shrink-0 font-medium ${active ? 'text-blue-600' : 'text-gray-500'}`}>
                            {g.range}
                          </span>
                          <span className={active ? 'text-blue-600 font-medium' : 'text-gray-600'}>
                            {g.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-blue-700 mt-3">
                    높은 수수료 = 더 많은 크리에이터 참여 = 더 많은 판매
                  </p>
                </div>

                {/* Settlement Simulation */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">예상 정산 시뮬레이션</h3>
                  {!hasProduct && (
                    <p className="text-xs text-gray-400 mb-3">예시: ₩30,000 기준</p>
                  )}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">상품 판매가</span>
                      <span className="text-sm font-semibold text-gray-900">₩{basePrice.toLocaleString('ko-KR')}</span>
                    </div>
                    <div className="border-t border-gray-100" />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">크리에이터 수수료 {rate}%</span>
                      <span className="text-sm font-semibold text-gray-900">-₩{creatorFee.toLocaleString('ko-KR')}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-sm text-gray-600">크넥 수수료 {Math.round(CNEC_COMMISSION_RATE * 100)}%</span>
                        <p className="text-xs text-gray-400">결제 수수료 포함</p>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">-₩{cnecFee.toLocaleString('ko-KR')}</span>
                    </div>
                    <div className="border-t border-gray-100" />
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-gray-900">브랜드 정산 예상액</span>
                      <span className="text-lg font-bold text-blue-600">
                        ₩{brandNet.toLocaleString('ko-KR')}
                        <span className="text-sm font-medium text-gray-500 ml-1">({brandPct}%)</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-1.5 mt-4 pt-3 border-t border-gray-50">
                    <Info className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-500">
                      크넥 수수료 {Math.round(CNEC_COMMISSION_RATE * 100)}%에 PG 결제 수수료가 포함되어 있어요. 추가 비용은 없습니다.
                    </p>
                  </div>
                </div>

                {/* Zero-cost banner */}
                <div className="flex items-start gap-2.5 bg-green-50 border border-green-100 rounded-lg p-3">
                  <Check className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-800">사용료 0원. 팔린 만큼만 수수료가 발생해요.</p>
                    <p className="text-xs text-green-700 mt-0.5">월 고정비, 입점비, 광고비 — 전부 없습니다.</p>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="수량 제한">
                <div className="space-y-2">
                  <Label htmlFor="totalStock" className={labelCls}>전체 수량 제한</Label>
                  <p className="text-[12px] text-gray-400">
                    캠페인 전체에서 판매 가능한 총 수량입니다. 비워두면 제한 없음.
                  </p>
                  <Input
                    id="totalStock"
                    type="number"
                    min="0"
                    value={totalStock}
                    onChange={(e) => setTotalStock(e.target.value)}
                    className={`w-40 ${inputCls}`}
                    placeholder="제한 없음"
                  />
                </div>
              </SectionCard>
            </>
          );
        })()}

        {/* ── Step 4: 모집 방식 ──────────────────── */}
        {currentStep === 3 && (
          <>
            <SectionCard title="모집 방식">
              <div className="space-y-3">
                <Label className={labelCls}>
                  모집 방식 <span className="text-blue-600">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRecruitmentType('OPEN')}
                    className={`flex flex-col items-start gap-1.5 p-4 rounded-2xl border-[1.5px] transition-all text-left ${
                      recruitmentType === 'OPEN'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <span className={`text-[14px] font-semibold ${recruitmentType === 'OPEN' ? 'text-blue-700' : 'text-gray-700'}`}>
                      자동 승인
                    </span>
                    <span className={`text-[12px] ${recruitmentType === 'OPEN' ? 'text-blue-500' : 'text-gray-400'}`}>
                      신청 즉시 참여 승인
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecruitmentType('APPROVAL')}
                    className={`flex flex-col items-start gap-1.5 p-4 rounded-2xl border-[1.5px] transition-all text-left ${
                      recruitmentType === 'APPROVAL'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <span className={`text-[14px] font-semibold ${recruitmentType === 'APPROVAL' ? 'text-blue-700' : 'text-gray-700'}`}>
                      승인제
                    </span>
                    <span className={`text-[12px] ${recruitmentType === 'APPROVAL' ? 'text-blue-500' : 'text-gray-400'}`}>
                      브랜드가 직접 승인
                    </span>
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5 space-y-2">
                <Label htmlFor="targetParticipants" className={labelCls}>목표 참여 크리에이터 수</Label>
                <Input
                  id="targetParticipants"
                  type="number"
                  min="0"
                  value={targetParticipants}
                  onChange={(e) => setTargetParticipants(e.target.value)}
                  className={`w-40 ${inputCls}`}
                  placeholder="제한 없음"
                />
              </div>

              <div className="border-t border-gray-100 pt-5 space-y-2">
                <Label className={labelCls}>모집 기간</Label>
                <p className="text-[12px] text-gray-400">
                  크리에이터 모집 시작일과 종료일을 설정하세요. 비워두면 캠페인 기간과 동일하게 적용됩니다.
                </p>
                <div className="flex items-center gap-3">
                  <DatePicker value={recruitStartDate} onChange={setRecruitStartDate} placeholder="모집 시작일" />
                  <span className="text-gray-400">~</span>
                  <DatePicker value={recruitEndDate} onChange={setRecruitEndDate} placeholder="모집 종료일" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="conditions" className={labelCls}>참여 조건</Label>
                <p className="text-[12px] text-gray-400">
                  크리에이터가 참여하기 위해 충족해야 할 조건을 입력하세요.
                </p>
                <Textarea
                  id="conditions"
                  value={conditions}
                  onChange={(e) => setConditions(e.target.value)}
                  placeholder="예: 팔로워 1,000명 이상, 뷰티 카테고리 크리에이터"
                  rows={3}
                  className={textareaCls}
                />
              </div>
            </SectionCard>

            {/* ── Campaign Summary ──────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 p-7 mb-4">
              <div className="flex items-center gap-2 mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#059669] shrink-0" />
                <h2 className="text-[15px] font-bold text-gray-900">캠페인 요약</h2>
              </div>
              <div className="space-y-3">
                {[
                  { label: '캠페인명', value: title || '-' },
                  {
                    label: '유형',
                    value: (
                      <Badge className="bg-blue-50 text-blue-700 border-0 font-medium text-[12px]">
                        {campaignType === 'GONGGU' ? '공구' : '상시'}
                      </Badge>
                    ),
                  },
                  { label: '선택 상품', value: `${selectedProducts.length}개` },
                  { label: '수수료율', value: `${commissionRate}%` },
                  { label: '모집 방식', value: recruitmentType === 'OPEN' ? '자동 승인' : '승인제' },
                  ...(campaignType === 'GONGGU' && startDate
                    ? [{ label: '기간', value: `${startDate.toLocaleDateString('ko-KR')} ~ ${endDate?.toLocaleDateString('ko-KR') ?? ''}` }]
                    : []),
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-[13px] text-gray-400">{row.label}</span>
                    <span className="text-[13px] font-medium text-gray-900">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Fixed Bottom Navigation ──────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100 bg-white/95 backdrop-blur-sm lg:left-60">
        <div className="flex items-center justify-between max-w-[680px] mx-auto px-4 py-4">
          <Button
            variant="outline"
            onClick={currentStep === 0 ? () => router.back() : handlePrev}
            className="h-[52px] px-7 rounded-[14px] border-[1.5px] border-gray-200 text-[14px] font-semibold text-gray-600"
          >
            {currentStep === 0 ? '취소' : '이전'}
          </Button>
          {isLastStep ? (
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="h-[52px] px-8 rounded-[14px] bg-green-600 hover:bg-green-700 text-white text-[14px] font-semibold shadow-lg shadow-green-600/25 min-w-[160px]"
            >
              {isSaving ? '저장 중...' : '캠페인 생성하기'}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="h-[52px] px-8 rounded-[14px] bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-semibold shadow-lg shadow-blue-600/25 min-w-[120px]"
            >
              다음
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
