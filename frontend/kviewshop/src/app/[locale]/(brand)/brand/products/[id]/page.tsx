'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getBrandProductById, updateProduct } from '@/lib/actions/brand';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import ImageUpload from '@/components/common/ImageUpload';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';

const COURIERS = [
  { code: 'cj', name: 'CJ대한통운' },
  { code: 'hanjin', name: '한진택배' },
  { code: 'logen', name: '로젠택배' },
  { code: 'epost', name: '우체국택배' },
  { code: 'lotte', name: '롯데택배' },
  { code: 'etc', name: '기타' },
];

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Basic info
  const [name, setName] = useState('');
  const [category, setCategory] = useState('skincare');
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
  const [thumbnailUrl, setThumbnailUrl] = useState('');

  // Shipping
  const [shippingFeeType, setShippingFeeType] = useState('FREE');
  const [shippingFee, setShippingFee] = useState('');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState('');
  const [courier, setCourier] = useState('');
  const [shippingInfo, setShippingInfo] = useState('');
  const [returnPolicy, setReturnPolicy] = useState('');

  // Sales settings
  const [isActive, setIsActive] = useState(true);
  const [allowCreatorPick, setAllowCreatorPick] = useState(true);
  const [allowTrial, setAllowTrial] = useState(true);
  const [commissionRate, setCommissionRate] = useState('10');

  // Channel prices (Price Scout)
  const [channelCoupang, setChannelCoupang] = useState('');
  const [channelNaver, setChannelNaver] = useState('');
  const [channelOlive, setChannelOlive] = useState('');
  const [channelSmart, setChannelSmart] = useState('');
  const [channelCoupangUrl, setChannelCoupangUrl] = useState('');
  const [channelNaverUrl, setChannelNaverUrl] = useState('');
  const [channelOliveUrl, setChannelOliveUrl] = useState('');
  const [channelSmartUrl, setChannelSmartUrl] = useState('');
  const [isExclusive, setIsExclusive] = useState(false);
  const [channelSaving, setChannelSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const product = await getBrandProductById(productId);
        if (!product) {
          setError('상품을 찾을 수 없습니다.');
          setLoading(false);
          return;
        }

        setName(product.name ?? '');
        setCategory(product.category ?? 'skincare');
        setOriginalPrice(product.originalPrice ? String(Number(product.originalPrice)) : '');
        setSalePrice(product.salePrice ? String(Number(product.salePrice)) : '');
        setStock(String(product.stock));
        setDescription(product.description ?? '');
        setVolume(product.volume ?? '');
        setIngredients(product.ingredients ?? '');
        setHowToUse(product.howToUse ?? '');
        setThumbnailUrl(product.thumbnailUrl ?? '');
        setShippingFeeType(product.shippingFeeType ?? 'FREE');
        setShippingFee(product.shippingFee ? String(Number(product.shippingFee)) : '');
        setFreeShippingThreshold(product.freeShippingThreshold ? String(Number(product.freeShippingThreshold)) : '');
        setCourier(product.courier ?? '');
        setShippingInfo(product.shippingInfo ?? '');
        setReturnPolicy(product.returnPolicy ?? '');
        setIsActive(product.status === 'ACTIVE');
        setAllowCreatorPick(product.allowCreatorPick);
        setAllowTrial(product.allowTrial ?? true);
        // DB stores decimal (0.10), display as percentage (10)
        setCommissionRate(String(Number(product.defaultCommissionRate) * 100));

        // Images
        const imgs = product.images ?? [];
        if (imgs.length > 0) {
          setMainImage(imgs[0]);
          setAdditionalImages(imgs.slice(1));
        }

        // Load channel prices
        try {
          const cpRes = await fetch(`/api/brand/products/${productId}/channel-prices`);
          if (cpRes.ok) {
            const cpData = await cpRes.json();
            setIsExclusive(cpData.isExclusive ?? false);
            for (const ch of cpData.channels ?? []) {
              const p = String(ch.price);
              const u = ch.url ?? '';
              if (ch.name === '쿠팡') { setChannelCoupang(p); setChannelCoupangUrl(u); }
              else if (ch.name === '네이버') { setChannelNaver(p); setChannelNaverUrl(u); }
              else if (ch.name === '올리브영') { setChannelOlive(p); setChannelOliveUrl(u); }
              else if (ch.name === '스마트스토어') { setChannelSmart(p); setChannelSmartUrl(u); }
            }
          }
        } catch { /* channel prices optional */ }
      } catch {
        setError('상품을 불러오는 데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [productId]);

  async function handleSave() {
    if (!name.trim()) {
      setError('상품명을 입력해주세요.');
      toast.error('상품명을 입력해주세요');
      return;
    }
    if (!originalPrice || Number(originalPrice) <= 0) {
      setError('정가를 올바르게 입력해주세요.');
      toast.error('정가를 올바르게 입력해주세요');
      return;
    }
    if (!salePrice || Number(salePrice) <= 0) {
      setError('판매가를 올바르게 입력해주세요.');
      toast.error('판매가를 올바르게 입력해주세요');
      return;
    }

    // Channel price validation
    const hasAnyChannel = [channelCoupang, channelNaver, channelOlive, channelSmart].some(
      (v) => v && Number(v) > 0
    );
    if (!hasAnyChannel && !isExclusive) {
      setError('최소 1개 채널의 판매가를 입력해주세요.');
      toast.error('최소 1개 채널의 판매가를 입력해주세요');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const images: string[] = [];
      if (mainImage.trim()) images.push(mainImage.trim());
      images.push(...additionalImages.filter(Boolean));

      await updateProduct(productId, {
        name: name.trim(),
        category,
        description: description.trim() || null,
        originalPrice: Number(originalPrice),
        salePrice: Number(salePrice),
        stock: Number(stock),
        images,
        thumbnailUrl: thumbnailUrl.trim() || null,
        volume: volume.trim() || null,
        ingredients: ingredients.trim() || null,
        howToUse: howToUse.trim() || null,
        shippingFeeType,
        shippingFee: shippingFeeType !== 'FREE' ? Number(shippingFee) || 0 : 0,
        freeShippingThreshold:
          shippingFeeType === 'CONDITIONAL_FREE'
            ? Number(freeShippingThreshold) || 0
            : null,
        courier: courier || null,
        shippingInfo: shippingInfo.trim() || null,
        returnPolicy: returnPolicy.trim() || null,
        status: isActive ? 'ACTIVE' : 'INACTIVE',
        allowCreatorPick,
        allowTrial,
        defaultCommissionRate: Number(commissionRate),
      });

      // Save channel prices
      const channels = [
        { name: '쿠팡', price: Number(channelCoupang) || 0, url: channelCoupangUrl },
        { name: '네이버', price: Number(channelNaver) || 0, url: channelNaverUrl },
        { name: '올리브영', price: Number(channelOlive) || 0, url: channelOliveUrl },
        { name: '스마트스토어', price: Number(channelSmart) || 0, url: channelSmartUrl },
      ].filter((c) => c.price > 0);

      await fetch(`/api/brand/products/${productId}/channel-prices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channels, isExclusive }),
      });

      toast.success('상품 정보가 저장되었습니다');
    } catch (err) {
      console.error('Failed to update product:', err);
      setError('상품 수정에 실패했습니다. 다시 시도해주세요.');
      toast.error('저장에 실패했습니다. 다시 시도해주세요');
    } finally {
      setIsSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">상품 수정</h1>
        <Button variant="outline" onClick={() => router.back()}>
          뒤로
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
          <CardDescription>상품의 기본 정보를 수정하세요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">상품명 *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="상품명을 입력하세요"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">카테고리 *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="카테고리 선택" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PRODUCT_CATEGORY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="originalPrice">정가 (원) *</Label>
              <Input
                id="originalPrice"
                type="number"
                min="0"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salePrice">판매가 (원) *</Label>
              <Input
                id="salePrice"
                type="number"
                min="0"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">재고 *</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail */}
      <Card>
        <CardHeader>
          <CardTitle>상세 정보</CardTitle>
          <CardDescription>상품의 이미지 및 상세 설명을 수정하세요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>대표 이미지</Label>
            <div className="max-w-xs">
              <ImageUpload
                value={mainImage}
                onChange={setMainImage}
                placeholder="대표 이미지를 업로드하세요"
                folder="products"
              />
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
                    if (newUrl) {
                      updated[idx] = newUrl;
                    } else {
                      updated.splice(idx, 1);
                    }
                    setAdditionalImages(updated);
                  }}
                  placeholder="추가 이미지"
                  folder="products"
                />
              ))}
              {additionalImages.length < 8 && (
                <ImageUpload
                  value=""
                  onChange={(url) => {
                    if (url) setAdditionalImages([...additionalImages, url]);
                  }}
                  placeholder="추가 이미지"
                  folder="products"
                />
              )}
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="description">상품 설명</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="상품에 대한 상세 설명을 입력하세요"
              rows={5}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="volume">용량/수량</Label>
            <Input
              id="volume"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              placeholder="예: 50ml, 100g, 30매"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ingredients">성분</Label>
            <Textarea
              id="ingredients"
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              placeholder="성분 목록을 입력하세요"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="howToUse">사용법</Label>
            <Textarea
              id="howToUse"
              value={howToUse}
              onChange={(e) => setHowToUse(e.target.value)}
              placeholder="사용 방법을 입력하세요"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Thumbnail */}
      <Card>
        <CardHeader>
          <CardTitle>대표 이미지</CardTitle>
          <CardDescription>상품 목록에 표시될 대표 썸네일 이미지를 설정하세요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>대표 썸네일 이미지</Label>
            <div className="max-w-xs">
              <ImageUpload
                value={thumbnailUrl}
                onChange={setThumbnailUrl}
                placeholder="썸네일 이미지를 업로드하세요"
                folder="products"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shipping */}
      <Card>
        <CardHeader>
          <CardTitle>배송 정보</CardTitle>
          <CardDescription>배송비, 택배사, 교환/환불 정책을 설정하세요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>배송비 유형 *</Label>
            <RadioGroup
              value={shippingFeeType}
              onValueChange={setShippingFeeType}
              className="flex flex-wrap gap-4"
            >
              {Object.entries(SHIPPING_FEE_TYPE_LABELS).map(([value, label]) => (
                <div key={value} className="flex items-center space-x-2">
                  <RadioGroupItem value={value} id={`shipping-type-${value}`} />
                  <Label htmlFor={`shipping-type-${value}`} className="font-normal cursor-pointer">
                    {label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {(shippingFeeType === 'PAID' || shippingFeeType === 'CONDITIONAL_FREE') && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="shippingFee">배송비 (원)</Label>
                <Input
                  id="shippingFee"
                  type="number"
                  min="0"
                  value={shippingFee}
                  onChange={(e) => setShippingFee(e.target.value)}
                  placeholder="3000"
                />
              </div>
              {shippingFeeType === 'CONDITIONAL_FREE' && (
                <div className="space-y-2">
                  <Label htmlFor="freeShippingThreshold">무료배송 기준 금액 (원)</Label>
                  <Input
                    id="freeShippingThreshold"
                    type="number"
                    min="0"
                    value={freeShippingThreshold}
                    onChange={(e) => setFreeShippingThreshold(e.target.value)}
                    placeholder="50000"
                  />
                </div>
              )}
            </div>
          )}

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="courier">택배사</Label>
            <Select value={courier} onValueChange={setCourier}>
              <SelectTrigger className="w-full sm:w-[250px]">
                <SelectValue placeholder="택배사 선택" />
              </SelectTrigger>
              <SelectContent>
                {COURIERS.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shippingInfo">배송 안내</Label>
            <Textarea
              id="shippingInfo"
              value={shippingInfo}
              onChange={(e) => setShippingInfo(e.target.value)}
              placeholder="예상 배송일, 주의사항 등을 입력하세요"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="returnPolicy">교환/환불 정책</Label>
            <Textarea
              id="returnPolicy"
              value={returnPolicy}
              onChange={(e) => setReturnPolicy(e.target.value)}
              placeholder="교환 및 환불 관련 정책을 입력하세요"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Channel Prices (Price Scout) */}
      <Card>
        <CardHeader>
          <CardTitle>기존 채널 판매가</CardTitle>
          <CardDescription>다른 판매 채널의 가격을 입력하세요. 크리에이터에게 가격 비교 정보가 제공됩니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {![channelCoupang, channelNaver, channelOlive, channelSmart].some(
            (v) => v && Number(v) > 0
          ) && !isExclusive && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              최소 1개 채널의 판매가를 입력해주세요.
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>쿠팡 가격 (원)</Label>
              <Input type="number" min="0" value={channelCoupang} onChange={(e) => setChannelCoupang(e.target.value)} placeholder="0" />
              <Input value={channelCoupangUrl} onChange={(e) => setChannelCoupangUrl(e.target.value)} placeholder="쿠팡 상품 URL (선택)" className="text-xs" />
            </div>
            <div className="space-y-2">
              <Label>네이버 가격 (원)</Label>
              <Input type="number" min="0" value={channelNaver} onChange={(e) => setChannelNaver(e.target.value)} placeholder="0" />
              <Input value={channelNaverUrl} onChange={(e) => setChannelNaverUrl(e.target.value)} placeholder="네이버 상품 URL (선택)" className="text-xs" />
            </div>
            <div className="space-y-2">
              <Label>올리브영 가격 (원)</Label>
              <Input type="number" min="0" value={channelOlive} onChange={(e) => setChannelOlive(e.target.value)} placeholder="0" />
              <Input value={channelOliveUrl} onChange={(e) => setChannelOliveUrl(e.target.value)} placeholder="올리브영 상품 URL (선택)" className="text-xs" />
            </div>
            <div className="space-y-2">
              <Label>스마트스토어 가격 (원)</Label>
              <Input type="number" min="0" value={channelSmart} onChange={(e) => setChannelSmart(e.target.value)} placeholder="0" />
              <Input value={channelSmartUrl} onChange={(e) => setChannelSmartUrl(e.target.value)} placeholder="스마트스토어 상품 URL (선택)" className="text-xs" />
            </div>
          </div>
          <Separator />
          <div className="flex items-center gap-3">
            <Checkbox
              id="isExclusive"
              checked={isExclusive}
              onCheckedChange={(checked) => setIsExclusive(checked as boolean)}
            />
            <label htmlFor="isExclusive" className="text-sm cursor-pointer">
              이 상품은 크넥샵 독점 구성입니다
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Sales Settings */}
      <Card>
        <CardHeader>
          <CardTitle>판매 설정</CardTitle>
          <CardDescription>판매 상태 및 크리에이터 설정을 관리합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>판매 상태</Label>
              <p className="text-sm text-muted-foreground">
                활성화하면 캠페인에 상품을 사용할 수 있습니다.
              </p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>상품 추천 허용</Label>
              <p className="text-sm text-muted-foreground">
                크리에이터가 자유롭게 이 상품을 픽할 수 있도록 허용합니다.
              </p>
            </div>
            <Switch checked={allowCreatorPick} onCheckedChange={setAllowCreatorPick} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>체험 신청 허용</Label>
              <p className="text-sm text-muted-foreground">
                크리에이터가 이 상품의 체험을 신청할 수 있습니다.
              </p>
            </div>
            <Switch checked={allowTrial} onCheckedChange={setAllowTrial} />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="commissionRate">크리에이터 수익률 (%)</Label>
            <p className="text-sm text-muted-foreground">
              상품 추천 시 적용되는 기본 수익률입니다.
            </p>
            <Input
              id="commissionRate"
              type="number"
              min="0"
              max="100"
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
              className="w-32"
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.back()}>
          취소
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? '저장 중...' : '상품 수정'}
        </Button>
      </div>
    </div>
  );
}
