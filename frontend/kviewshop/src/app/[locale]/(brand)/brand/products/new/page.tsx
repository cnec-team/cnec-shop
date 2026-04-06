'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getBrandSession, createProduct } from '@/lib/actions/brand';
import { PRODUCT_CATEGORY_LABELS, SHIPPING_FEE_TYPE_LABELS } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import ImageUpload from '@/components/common/ImageUpload';
import {
  AlertCircle,
  Check,
  Package,
  Image as ImageIcon,
  FileText,
  Truck,
  Percent,
  Info,
  Lightbulb,
  X,
  CircleDollarSign,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';

type ProductCategory = string;
type ShippingFeeType = string;

const COURIERS = [
  { code: 'cj', name: 'CJ대한통운' },
  { code: 'hanjin', name: '한진택배' },
  { code: 'logen', name: '로젠택배' },
  { code: 'epost', name: '우체국택배' },
  { code: 'lotte', name: '롯데택배' },
  { code: 'etc', name: '기타' },
];

/* ── 공통 인라인 스타일 클래스 ───────────────── */
const inputCls =
  'h-12 rounded-[14px] border-[1.5px] border-gray-100 focus:border-blue-600 focus:ring-[3px] focus:ring-blue-50 text-[14px] placeholder:text-gray-300';
const selectTriggerCls =
  'h-12 rounded-[14px] border-[1.5px] border-gray-100 focus:border-blue-600 focus:ring-[3px] focus:ring-blue-50 text-[14px]';
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
  id: string;
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

export default function NewProductPage() {
  const router = useRouter();
  const [brand, setBrand] = useState<{
    id: string;
    creatorCommissionRate?: number | null;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Basic info
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('skincare');
  const [originalPrice, setOriginalPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [stock, setStock] = useState('');

  // Detail
  const [mainImage, setMainImage] = useState('');
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [volume, setVolume] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [howToUse, setHowToUse] = useState('');

  // Detail URL (new)
  const [detailUrl, setDetailUrl] = useState('');

  // Collapsible for direct input fields
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Thumbnail
  const [thumbnailUrl, setThumbnailUrl] = useState('');

  // Shipping info
  const [shippingFeeType, setShippingFeeType] = useState<ShippingFeeType>('FREE');
  const [shippingFee, setShippingFee] = useState('');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState('');
  const [courier, setCourier] = useState('');
  const [shippingInfo, setShippingInfo] = useState('');
  const [returnPolicy, setReturnPolicy] = useState('');

  // Sales settings
  const [isActive, setIsActive] = useState(true);
  const [allowCreatorPick, setAllowCreatorPick] = useState(true);
  const [commissionRate, setCommissionRate] = useState(10);

  useEffect(() => {
    async function load() {
      const brandData = await getBrandSession();
      if (brandData) setBrand(brandData);
    }
    load();
  }, []);

  const discountRate =
    originalPrice && salePrice && Number(originalPrice) > Number(salePrice)
      ? Math.round((1 - Number(salePrice) / Number(originalPrice)) * 100)
      : null;

  // Commission preview calculation
  const salePriceNum = Number(salePrice) || 0;
  const brandCommissionRate = brand?.creatorCommissionRate ?? null;
  const effectiveRate = brandCommissionRate ?? 10;
  const isDefaultRate = brandCommissionRate === null || brandCommissionRate === undefined;
  const commissionAmount = Math.round(salePriceNum * effectiveRate / 100);

  function handleMainImageValidation(file: File) {
    const img = new Image();
    img.onload = () => {
      if (img.width < 800 || img.height < 800) {
        toast.warning(
          '이미지 크기가 800×800px보다 작아요. 상품 페이지에서 흐릿하게 보일 수 있어요.'
        );
      }
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  }

  async function handleSave() {
    if (!brand?.id) return;

    if (!name.trim()) { setError('상품명을 입력해주세요.'); return; }
    if (!originalPrice || Number(originalPrice) <= 0) { setError('정가를 올바르게 입력해주세요.'); return; }
    if (!salePrice || Number(salePrice) <= 0) { setError('판매가를 올바르게 입력해주세요.'); return; }
    if (!stock || Number(stock) < 0) { setError('재고를 올바르게 입력해주세요.'); return; }

    // Validate detail URL format if provided
    if (detailUrl.trim() && !detailUrl.trim().startsWith('https://')) {
      setError('상세페이지 URL은 https://로 시작해야 합니다.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const images: string[] = [];
      if (mainImage.trim()) images.push(mainImage.trim());
      images.push(...additionalImages.filter(Boolean));

      await createProduct({
        brandId: brand.id,
        name: name.trim(),
        category,
        description: description.trim() || undefined,
        originalPrice: Number(originalPrice),
        salePrice: Number(salePrice),
        stock: Number(stock),
        images,
        thumbnailUrl: thumbnailUrl.trim() || undefined,
        volume: volume.trim() || undefined,
        ingredients: ingredients.trim() || undefined,
        howToUse: howToUse.trim() || undefined,
        detailUrl: detailUrl.trim() || undefined,
        shippingFeeType,
        shippingFee: shippingFeeType !== 'FREE' ? Number(shippingFee) || 0 : 0,
        freeShippingThreshold:
          shippingFeeType === 'CONDITIONAL_FREE'
            ? Number(freeShippingThreshold) || 0
            : undefined,
        courier: courier || undefined,
        shippingInfo: shippingInfo.trim() || undefined,
        returnPolicy: returnPolicy.trim() || undefined,
        status: isActive ? 'ACTIVE' : 'INACTIVE',
        allowCreatorPick,
        defaultCommissionRate: commissionRate,
      });

      router.push('../products');
    } catch (err) {
      console.error('Failed to create product:', err);
      setError('상품 등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-28">
      <div className="max-w-[680px] mx-auto px-4 pt-8">
        {/* ── Page Header ────────────────────────── */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex items-center justify-center w-9 h-9 rounded-[10px] bg-blue-600">
            <Package className="w-[18px] h-[18px] text-white" />
          </div>
          <div>
            <h1 className="text-[22px] font-extrabold text-gray-900 leading-tight">
              새 상품 등록
            </h1>
            <p className="text-[13px] text-gray-400 mt-0.5">
              상품 정보를 단계별로 입력하세요
            </p>
          </div>
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

        {/* ── 1. 기본 정보 ────────────────────────── */}
        <SectionCard title="기본 정보">
          <div className="space-y-2">
            <Label htmlFor="name" className={labelCls}>
              상품명 <span className="text-blue-600">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="상품명을 입력하세요"
              className={inputCls}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category" className={labelCls}>
              카테고리 <span className="text-blue-600">*</span>
            </Label>
            <Select value={category} onValueChange={(v) => setCategory(v as ProductCategory)}>
              <SelectTrigger className={`w-full ${selectTriggerCls}`}>
                <SelectValue placeholder="카테고리 선택" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PRODUCT_CATEGORY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="originalPrice" className={labelCls}>
                정가 <span className="text-blue-600">*</span>
              </Label>
              <PriceInput id="originalPrice" value={originalPrice} onChange={setOriginalPrice} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salePrice" className={labelCls}>
                판매가 <span className="text-blue-600">*</span>
              </Label>
              <PriceInput id="salePrice" value={salePrice} onChange={setSalePrice} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock" className={labelCls}>
                재고 <span className="text-blue-600">*</span>
              </Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="0"
                className={`${inputCls} text-right`}
                style={{ fontVariantNumeric: 'tabular-nums' }}
              />
            </div>
          </div>

          {/* Discount banner */}
          {discountRate !== null && (
            <div className="flex items-center gap-2.5 bg-blue-50 rounded-xl p-3">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="text-[13px] font-medium text-blue-700">
                할인율 {discountRate}% 자동 적용
              </span>
            </div>
          )}

          {/* Commission Preview */}
          {salePriceNum > 0 && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <CircleDollarSign className="h-4 w-4 text-blue-600" />
                <span className="text-[13px] font-semibold text-blue-900">
                  예상 크리에이터 커미션
                </span>
              </div>
              <p className="text-[13px] text-blue-800">
                판매가{' '}
                <span className="font-semibold">
                  ₩{salePriceNum.toLocaleString()}
                </span>{' '}
                × 커미션율{' '}
                <span className="font-semibold">
                  {effectiveRate}%{isDefaultRate && ' (기본값)'}
                </span>{' '}
                ={' '}
                <span className="font-semibold text-blue-700">
                  ₩{commissionAmount.toLocaleString()}
                </span>{' '}
                / 건
              </p>
              <p className="text-[11px] text-gray-500">
                커미션율은 캠페인 생성 시 변경할 수 있어요
              </p>
            </div>
          )}

          {/* Tip box */}
          <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-[10px] bg-amber-200 shrink-0">
              <Lightbulb className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <p className="text-[13px] font-semibold" style={{ color: '#92400E' }}>
                공구 성공 팁
              </p>
              <p className="text-[12px] mt-0.5" style={{ color: '#B45309' }}>
                쿠팡/올리브영에 없는 구성(세트+증정)으로 등록하면 가격 비교 불가능 → 크리에이터가 자신 있게 홍보
              </p>
            </div>
          </div>
        </SectionCard>

        {/* ── 2. 이미지 ──────────────────────────── */}
        <SectionCard title="이미지">
          <div className="space-y-2">
            <Label className={labelCls}>대표 이미지</Label>
            <p className="text-[12px] text-gray-400">
              1:1 정사각형 권장 · 최소 800×800px · JPG/PNG/WebP
            </p>
            <div className="max-w-xs">
              <ImageUpload value={mainImage} onChange={setMainImage} placeholder="대표 이미지를 업로드하세요" folder="products" onFileSelected={handleMainImageValidation} />
            </div>
          </div>

          <div className="space-y-2">
            <Label className={labelCls}>추가 이미지 (최대 5장)</Label>
            <p className="text-[12px] text-gray-400">
              상품 구성, 텍스처, 사용샷 등 다양한 각도의 이미지를 추가하면 전환율이 올라가요
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {additionalImages.map((url, idx) => (
                <ImageUpload
                  key={idx}
                  value={url}
                  onChange={(newUrl) => {
                    const updated = [...additionalImages];
                    if (newUrl) { updated[idx] = newUrl; } else { updated.splice(idx, 1); }
                    setAdditionalImages(updated);
                  }}
                  placeholder="추가 이미지"
                  folder="products"
                />
              ))}
              {additionalImages.length < 5 && (
                <ImageUpload value="" onChange={(url) => { if (url) setAdditionalImages([...additionalImages, url]); }} placeholder="추가 이미지" folder="products" />
              )}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5 space-y-2">
            <Label className={labelCls}>대표 썸네일 이미지</Label>
            <div className="max-w-xs">
              <ImageUpload value={thumbnailUrl} onChange={setThumbnailUrl} placeholder="썸네일 이미지" folder="products" />
            </div>
            <p className="text-[12px] text-gray-400">비워두면 대표 이미지가 사용됩니다.</p>
          </div>
        </SectionCard>

        {/* ── 3. 상세 정보 ───────────────────────── */}
        <SectionCard title="상세 정보">
          {/* Detail URL */}
          <div className="space-y-2">
            <Label htmlFor="detailUrl" className={labelCls}>기존 상품 상세페이지 URL</Label>
            <Input
              id="detailUrl"
              type="url"
              value={detailUrl}
              onChange={(e) => setDetailUrl(e.target.value)}
              placeholder="https://smartstore.naver.com/brand/products/12345"
              className={inputCls}
            />
            <p className="text-[12px] text-gray-400">
              스마트스토어, 카페24 등 기존 상세페이지 링크를 입력하면 구매자가 바로 확인할 수 있어요
            </p>
          </div>

          {/* Collapsible: Direct Input Fields */}
          <div className="rounded-[14px] border-[1.5px] border-gray-100">
            <button
              type="button"
              onClick={() => setIsDetailOpen(!isDetailOpen)}
              className="flex items-center justify-between w-full px-5 py-3.5 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 rounded-[14px] transition-colors"
            >
              <span>직접 입력 (선택)</span>
              {isDetailOpen ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </button>
            {isDetailOpen && (
              <div className="px-5 pb-5 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="description" className={labelCls}>상품 설명</Label>
                  <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="상품에 대한 상세 설명을 입력하세요" rows={5} className={textareaCls} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="volume" className={labelCls}>용량/수량</Label>
                  <Input id="volume" value={volume} onChange={(e) => setVolume(e.target.value)} placeholder="예: 50ml, 100g, 30매" className={inputCls} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ingredients" className={labelCls}>성분</Label>
                  <Textarea id="ingredients" value={ingredients} onChange={(e) => setIngredients(e.target.value)} placeholder="성분 목록을 입력하세요" rows={3} className={textareaCls} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="howToUse" className={labelCls}>사용법</Label>
                  <Textarea id="howToUse" value={howToUse} onChange={(e) => setHowToUse(e.target.value)} placeholder="사용 방법을 입력하세요" rows={3} className={textareaCls} />
                </div>
              </div>
            )}
          </div>
        </SectionCard>

        {/* ── 4. 배송·교환 정보 ─────────────────── */}
        <SectionCard title="배송·교환 정보">
          <div className="space-y-3">
            <Label className={labelCls}>
              배송비 유형 <span className="text-blue-600">*</span>
            </Label>
            <RadioGroup value={shippingFeeType} onValueChange={(v) => setShippingFeeType(v as ShippingFeeType)} className="flex flex-wrap gap-3">
              {Object.entries(SHIPPING_FEE_TYPE_LABELS).map(([value, label]) => (
                <label
                  key={value}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-[12px] border-[1.5px] cursor-pointer transition-colors text-[13px] ${
                    shippingFeeType === value
                      ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                      : 'border-gray-100 text-gray-600 hover:border-gray-200'
                  }`}
                >
                  <RadioGroupItem value={value} id={`shipping-type-${value}`} className="sr-only" />
                  {label}
                </label>
              ))}
            </RadioGroup>
          </div>

          {(shippingFeeType === 'PAID' || shippingFeeType === 'CONDITIONAL_FREE') && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="shippingFee" className={labelCls}>배송비</Label>
                <PriceInput id="shippingFee" value={shippingFee} onChange={setShippingFee} placeholder="3000" />
              </div>
              {shippingFeeType === 'CONDITIONAL_FREE' && (
                <div className="space-y-2">
                  <Label htmlFor="freeShippingThreshold" className={labelCls}>무료배송 기준 금액</Label>
                  <PriceInput id="freeShippingThreshold" value={freeShippingThreshold} onChange={setFreeShippingThreshold} placeholder="50000" />
                </div>
              )}
            </div>
          )}

          <div className="border-t border-gray-100 pt-5 space-y-2">
            <Label htmlFor="courier" className={labelCls}>택배사</Label>
            <Select value={courier} onValueChange={setCourier}>
              <SelectTrigger className={`w-full sm:w-[250px] ${selectTriggerCls}`}>
                <SelectValue placeholder="택배사 선택" />
              </SelectTrigger>
              <SelectContent>
                {COURIERS.map((c) => (
                  <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shippingInfo" className={labelCls}>배송 안내</Label>
            <Textarea id="shippingInfo" value={shippingInfo} onChange={(e) => setShippingInfo(e.target.value)} placeholder="예상 배송일, 주의사항 등" rows={3} className={textareaCls} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="returnPolicy" className={labelCls}>교환/환불 정책</Label>
            <Textarea id="returnPolicy" value={returnPolicy} onChange={(e) => setReturnPolicy(e.target.value)} placeholder="교환 및 환불 관련 정책" rows={3} className={textareaCls} />
          </div>
        </SectionCard>

        {/* ── 5. 크리에이터 수익 설정 ───────────── */}
        <SectionCard title="크리에이터 수익 설정">
          <div className="flex items-center justify-between rounded-[14px] border-[1.5px] border-gray-100 p-4">
            <div>
              <Label className={labelCls}>판매 상태</Label>
              <p className="text-[12px] text-gray-400 mt-0.5">활성화하면 캠페인에 상품을 사용할 수 있습니다</p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          <div className="flex items-center justify-between rounded-[14px] border-[1.5px] border-gray-100 p-4">
            <div>
              <Label className={labelCls}>크리에이터픽 허용</Label>
              <p className="text-[12px] text-gray-400 mt-0.5">크리에이터가 자유롭게 이 상품을 픽할 수 있습니다</p>
            </div>
            <Switch checked={allowCreatorPick} onCheckedChange={setAllowCreatorPick} />
          </div>

          <div className="rounded-[14px] border-[1.5px] border-gray-100 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <Label className={labelCls}>크리에이터 수익률</Label>
              <span className="text-lg font-bold text-blue-600" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {commissionRate}%
              </span>
            </div>
            <Slider
              value={[commissionRate]}
              onValueChange={([v]) => setCommissionRate(v)}
              min={0}
              max={50}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-[11px] text-gray-400">
              <span>0%</span>
              <span>50%</span>
            </div>

            {salePrice && (
              <div className="bg-[#ECFDF5] rounded-xl px-4 py-3 mt-1">
                <p className="text-[12px] text-[#059669] mb-1">크리에이터가 1개 팔면</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-[#059669]" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    ₩{Math.round(Number(salePrice) * commissionRate / 100).toLocaleString('ko-KR')} 수익
                  </span>
                  <span className="text-[11px] text-[#059669]/70">
                    (판매가 {Number(salePrice).toLocaleString('ko-KR')}원의 {commissionRate}%)
                  </span>
                </div>
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      {/* ── Fixed Bottom CTA ─────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-100 bg-white/95 backdrop-blur-sm lg:left-60">
        <div className="flex items-center justify-end gap-3 max-w-[680px] mx-auto px-4 py-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="h-[52px] px-7 rounded-[14px] border-[1.5px] border-gray-200 text-[14px] font-semibold text-gray-600"
          >
            취소
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="h-[52px] px-8 rounded-[14px] bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-semibold shadow-lg shadow-blue-600/25 min-w-[140px]"
          >
            {isSaving ? '저장 중...' : '등록하기'}
          </Button>
        </div>
      </div>
    </div>
  );
}
