'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getBrandSession, createProduct } from '@/lib/actions/brand';
import { PRODUCT_CATEGORY_LABELS, SHIPPING_FEE_TYPE_LABELS } from '@/types/database';
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
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
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
  CheckCircle,
  Package,
  Image as ImageIcon,
  FileText,
  Truck,
  Percent,
  Save,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

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

interface SectionProps {
  title: string;
  description?: string;
  icon: React.ReactNode;
  isComplete: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function Section({ title, description, icon, isComplete, defaultOpen = false, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <button
        type="button"
        className="flex w-full items-center justify-between p-5 text-left hover:bg-gray-50/50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${isComplete ? 'bg-green-500/10 text-green-600' : 'bg-gray-100 text-muted-foreground'}`}>
            {isComplete ? <CheckCircle className="h-4 w-4" /> : icon}
          </div>
          <div>
            <p className="text-sm font-semibold">{title}</p>
            {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isComplete && (
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          )}
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>
      {open && (
        <CardContent className="border-t px-5 py-5 space-y-4">
          {children}
        </CardContent>
      )}
    </Card>
  );
}

export default function NewProductPage() {
  const router = useRouter();
  const [brand, setBrand] = useState<{ id: string } | null>(null);
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

  const basicComplete = !!name.trim() && !!originalPrice && !!salePrice && !!stock;
  const imageComplete = !!mainImage;
  const descriptionComplete = !!description.trim();

  // Estimated revenue calculation
  const estimatedRevenue = salePrice ? Number(salePrice) * (1 - commissionRate / 100) : 0;

  async function handleSave() {
    if (!brand?.id) return;

    if (!name.trim()) { setError('상품명을 입력해주세요.'); return; }
    if (!originalPrice || Number(originalPrice) <= 0) { setError('정가를 올바르게 입력해주세요.'); return; }
    if (!salePrice || Number(salePrice) <= 0) { setError('판매가를 올바르게 입력해주세요.'); return; }
    if (!stock || Number(stock) < 0) { setError('재고를 올바르게 입력해주세요.'); return; }

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
    <div className="space-y-5 max-w-3xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">새 상품 등록</h1>
          <p className="text-sm text-muted-foreground mt-1">상품 정보를 단계별로 입력하세요</p>
        </div>
        <Button variant="outline" onClick={() => router.back()} size="sm">
          취소
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* 1. Basic Info */}
      <Section
        title="기본 정보"
        description="상품명, 카테고리, 가격"
        icon={<Package className="h-4 w-4" />}
        isComplete={basicComplete}
        defaultOpen
      >
        <div className="space-y-2">
          <Label htmlFor="name">상품명 *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="상품명을 입력하세요"
            className="h-10"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">카테고리 *</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as ProductCategory)}>
            <SelectTrigger className="w-full h-10">
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
            <Label htmlFor="originalPrice">정가 (원) *</Label>
            <Input id="originalPrice" type="number" min="0" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} placeholder="0" className="h-10" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="salePrice">판매가 (원) *</Label>
            <Input id="salePrice" type="number" min="0" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} placeholder="0" className="h-10" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stock">재고 *</Label>
            <Input id="stock" type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="0" className="h-10" />
          </div>
        </div>

        {originalPrice && salePrice && Number(originalPrice) > Number(salePrice) && (
          <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            할인율: {Math.round((1 - Number(salePrice) / Number(originalPrice)) * 100)}%
          </div>
        )}
      </Section>

      {/* 2. Images */}
      <Section
        title="이미지"
        description="대표, 추가, 썸네일"
        icon={<ImageIcon className="h-4 w-4" />}
        isComplete={imageComplete}
      >
        <div className="space-y-2">
          <Label>대표 이미지</Label>
          <div className="max-w-xs">
            <ImageUpload value={mainImage} onChange={setMainImage} placeholder="대표 이미지를 업로드하세요" folder="products" />
          </div>
        </div>

        <div className="space-y-2">
          <Label>추가 이미지</Label>
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
            {additionalImages.length < 8 && (
              <ImageUpload value="" onChange={(url) => { if (url) setAdditionalImages([...additionalImages, url]); }} placeholder="추가 이미지" folder="products" />
            )}
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label>대표 썸네일 이미지</Label>
          <div className="max-w-xs">
            <ImageUpload value={thumbnailUrl} onChange={setThumbnailUrl} placeholder="썸네일 이미지" folder="products" />
          </div>
          <p className="text-xs text-muted-foreground">비워두면 대표 이미지가 사용됩니다.</p>
        </div>
      </Section>

      {/* 3. Description */}
      <Section
        title="상세 설명"
        description="설명, 용량, 성분, 사용법"
        icon={<FileText className="h-4 w-4" />}
        isComplete={descriptionComplete}
      >
        <div className="space-y-2">
          <Label htmlFor="description">상품 설명</Label>
          <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="상품에 대한 상세 설명을 입력하세요" rows={5} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="volume">용량/수량</Label>
          <Input id="volume" value={volume} onChange={(e) => setVolume(e.target.value)} placeholder="예: 50ml, 100g, 30매" className="h-10" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ingredients">성분</Label>
          <Textarea id="ingredients" value={ingredients} onChange={(e) => setIngredients(e.target.value)} placeholder="성분 목록을 입력하세요" rows={3} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="howToUse">사용법</Label>
          <Textarea id="howToUse" value={howToUse} onChange={(e) => setHowToUse(e.target.value)} placeholder="사용 방법을 입력하세요" rows={3} />
        </div>
      </Section>

      {/* 4. Shipping */}
      <Section
        title="배송·교환 정보"
        description="배송비, 택배사, 반품 정책"
        icon={<Truck className="h-4 w-4" />}
        isComplete={true}
      >
        <div className="space-y-3">
          <Label>배송비 유형 *</Label>
          <RadioGroup value={shippingFeeType} onValueChange={(v) => setShippingFeeType(v as ShippingFeeType)} className="flex flex-wrap gap-4">
            {Object.entries(SHIPPING_FEE_TYPE_LABELS).map(([value, label]) => (
              <div key={value} className="flex items-center space-x-2">
                <RadioGroupItem value={value} id={`shipping-type-${value}`} />
                <Label htmlFor={`shipping-type-${value}`} className="font-normal cursor-pointer">{label}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {(shippingFeeType === 'PAID' || shippingFeeType === 'CONDITIONAL_FREE') && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="shippingFee">배송비 (원)</Label>
              <Input id="shippingFee" type="number" min="0" value={shippingFee} onChange={(e) => setShippingFee(e.target.value)} placeholder="3000" className="h-10" />
            </div>
            {shippingFeeType === 'CONDITIONAL_FREE' && (
              <div className="space-y-2">
                <Label htmlFor="freeShippingThreshold">무료배송 기준 금액 (원)</Label>
                <Input id="freeShippingThreshold" type="number" min="0" value={freeShippingThreshold} onChange={(e) => setFreeShippingThreshold(e.target.value)} placeholder="50000" className="h-10" />
              </div>
            )}
          </div>
        )}

        <Separator />

        <div className="space-y-2">
          <Label htmlFor="courier">택배사</Label>
          <Select value={courier} onValueChange={setCourier}>
            <SelectTrigger className="w-full sm:w-[250px] h-10">
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
          <Label htmlFor="shippingInfo">배송 안내</Label>
          <Textarea id="shippingInfo" value={shippingInfo} onChange={(e) => setShippingInfo(e.target.value)} placeholder="예상 배송일, 주의사항 등" rows={3} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="returnPolicy">교환/환불 정책</Label>
          <Textarea id="returnPolicy" value={returnPolicy} onChange={(e) => setReturnPolicy(e.target.value)} placeholder="교환 및 환불 관련 정책" rows={3} />
        </div>
      </Section>

      {/* 5. Commission */}
      <Section
        title="커미션 설정"
        description="판매 상태 및 수수료율"
        icon={<Percent className="h-4 w-4" />}
        isComplete={true}
        defaultOpen
      >
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <Label>판매 상태</Label>
            <p className="text-xs text-muted-foreground mt-0.5">활성화하면 캠페인에 상품을 사용할 수 있습니다</p>
          </div>
          <Switch checked={isActive} onCheckedChange={setIsActive} />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <Label>크리에이터픽 허용</Label>
            <p className="text-xs text-muted-foreground mt-0.5">크리에이터가 자유롭게 이 상품을 픽할 수 있습니다</p>
          </div>
          <Switch checked={allowCreatorPick} onCheckedChange={setAllowCreatorPick} />
        </div>

        <div className="space-y-4 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <Label>기본 수수료율</Label>
            <span className="text-lg font-bold text-primary">{commissionRate}%</span>
          </div>
          <Slider
            value={[commissionRate]}
            onValueChange={([v]) => setCommissionRate(v)}
            min={0}
            max={50}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>50%</span>
          </div>

          {salePrice && (
            <div className="rounded-lg bg-blue-50 px-4 py-3 mt-2">
              <p className="text-xs text-blue-600 mb-1">예상 수익 (판매가 기준)</p>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-blue-700">
                  {Math.round(estimatedRevenue).toLocaleString('ko-KR')}원
                </span>
                <span className="text-xs text-blue-500">
                  / 판매가 {Number(salePrice).toLocaleString('ko-KR')}원
                </span>
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* Fixed bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white/95 backdrop-blur-sm px-6 py-3 lg:left-60">
        <div className="flex items-center justify-end gap-3 max-w-3xl mx-auto">
          <Button variant="outline" onClick={() => router.back()} className="h-10 md:h-10">
            취소
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="h-10 md:h-10 min-w-[120px]">
            <Save className="h-4 w-4 mr-1.5" />
            {isSaving ? '저장 중...' : '등록하기'}
          </Button>
        </div>
      </div>
    </div>
  );
}
