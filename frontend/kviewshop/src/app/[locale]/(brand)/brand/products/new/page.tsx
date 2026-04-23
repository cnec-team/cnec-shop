'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { ArrowLeft, AlertCircle, X } from 'lucide-react';
import { getBrandSession, createProduct, getActiveProducts } from '@/lib/actions/brand';
import { Stepper } from '@/components/brand/ProductForm/Stepper';
import { BasicInfoSection } from '@/components/brand/ProductForm/BasicInfoSection';
import { ImagesSection } from '@/components/brand/ProductForm/ImagesSection';
import {
  DetailsSection,
  type DeliveryEta,
  type ShippingChoice,
} from '@/components/brand/ProductForm/DetailsSection';
import { CreatorSettingsSection } from '@/components/brand/ProductForm/CreatorSettingsSection';
import { ProductDescriptionSection } from '@/components/brand/ProductForm/ProductDescriptionSection';
import { TrustPolicySection } from '@/components/brand/ProductForm/ChannelPricesSection';
import { IngredientPainPointSection } from '@/components/brand/ProductForm/IngredientPainPointSection';
import type { IngredientItem } from '@/components/brand/ProductForm/IngredientPicker';

const STEPS = [
  { label: '기본 정보' },
  { label: '성분 & 매칭' },
  { label: '사진' },
  { label: '상세' },
  { label: '크리에이터 설정' },
];

const DELIVERY_TO_TEXT: Record<DeliveryEta, string> = {
  D1_2: '주문 후 1-2일 이내 배송',
  D2_3: '주문 후 2-3일 이내 배송',
  D3_5: '주문 후 3-5일 이내 배송',
  D5_7: '주문 후 5-7일 이내 배송',
};

const DRAFT_KEY = 'brand:product:new:draft';

export default function NewProductPage() {
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = (params?.locale as string) ?? 'ko';
  const productsPath = `/${locale}/brand/products`;

  const [brand, setBrand] = useState<{ id: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Section 1: Basic
  const [name, setName] = useState('');
  const [category, setCategory] = useState('skincare');
  const [originalPrice, setOriginalPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [stock, setStock] = useState('');

  // Section 1.5: Ingredients & Pain Points
  const [selectedIngredients, setSelectedIngredients] = useState<IngredientItem[]>([]);
  const [selectedPainPoints, setSelectedPainPoints] = useState<Record<string, number>>({});

  // Section 2: Images
  const [images, setImages] = useState<string[]>([]);

  // Section 3: Details
  const [detailUrl, setDetailUrl] = useState('');
  const [shippingChoice, setShippingChoice] = useState<ShippingChoice>('FREE');
  const [shippingFee, setShippingFee] = useState('3000');
  const [deliveryEta, setDeliveryEta] = useState<DeliveryEta>('D2_3');

  // Section 3.5: Description (optional)
  const [description, setDescription] = useState('');
  const [volume, setVolume] = useState('');
  const [ingredientsText, setIngredientsText] = useState('');
  const [howToUse, setHowToUse] = useState('');

  // Section 3.6: Shipping extras (optional)
  const [courier, setCourier] = useState('');
  const [returnPolicy, setReturnPolicy] = useState('');
  const [shippingInfoText, setShippingInfoText] = useState('');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState('');

  // Section 3.7: Trust Policy (optional)
  const [lowestPriceGuarantee, setLowestPriceGuarantee] = useState(false);
  const [cnecExclusive, setCnecExclusive] = useState(false);

  // Section 4: Creator
  const [isActive, setIsActive] = useState(true);
  const [allowCreatorPick, setAllowCreatorPick] = useState(true);
  const [allowTrial, setAllowTrial] = useState(true);
  const [commissionRate, setCommissionRate] = useState(15);
  const [commissionLoaded, setCommissionLoaded] = useState(false);

  // Stepper progress detection
  const stepStatus = useMemo(() => {
    const completed: number[] = [];
    if (name.trim() && Number(originalPrice) > 0 && Number(salePrice) > 0 && Number(stock) >= 0) {
      completed.push(0);
    }
    if (selectedIngredients.length > 0) completed.push(1);
    if (images.length > 0) completed.push(2);
    if (detailUrl.trim() || shippingChoice) completed.push(3);
    completed.push(4);
    let current = 0;
    if (!completed.includes(0)) current = 0;
    else if (!completed.includes(1)) current = 1;
    else if (!completed.includes(2)) current = 2;
    else if (!completed.includes(3)) current = 3;
    else current = 4;
    return { completed, current };
  }, [name, originalPrice, salePrice, stock, selectedIngredients, images, detailUrl, shippingChoice]);

  useEffect(() => {
    async function load() {
      const b = await getBrandSession();
      if (b) {
        setBrand(b);
        if (!commissionLoaded) {
          const brandRate = b.creatorCommissionRate ?? 15;
          if (brandRate > 0) setCommissionRate(brandRate);
          setCommissionLoaded(true);
        }
      }
    }
    load();

    // Restore draft
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        try {
          const d = JSON.parse(raw);
          if (d.name) setName(d.name);
          if (d.category) setCategory(d.category);
          if (d.originalPrice) setOriginalPrice(d.originalPrice);
          if (d.salePrice) setSalePrice(d.salePrice);
          if (d.stock) setStock(d.stock);
          if (Array.isArray(d.images)) setImages(d.images);
          if (d.detailUrl) setDetailUrl(d.detailUrl);
          if (d.shippingChoice) setShippingChoice(d.shippingChoice);
          if (d.shippingFee) setShippingFee(d.shippingFee);
          if (d.deliveryEta) setDeliveryEta(d.deliveryEta);
          if (typeof d.isActive === 'boolean') setIsActive(d.isActive);
          if (typeof d.allowCreatorPick === 'boolean') setAllowCreatorPick(d.allowCreatorPick);
          if (typeof d.allowTrial === 'boolean') setAllowTrial(d.allowTrial);
          if (typeof d.commissionRate === 'number') setCommissionRate(d.commissionRate);
        } catch {
          /* ignore */
        }
      }
    }
  }, []);

  const isValid =
    name.trim().length > 0 &&
    Number(originalPrice) > 0 &&
    Number(salePrice) > 0 &&
    Number(stock) >= 0;

  async function handleDraftSave() {
    if (!brand?.id) return;
    if (!name.trim()) {
      setError('임시저장하려면 상품명을 입력해주세요');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await createProduct({
        brandId: brand.id,
        name: name.trim(),
        category,
        originalPrice: Number(originalPrice) || 0,
        salePrice: Number(salePrice) || 0,
        stock: Number(stock) || 0,
        images,
        detailUrl: detailUrl.trim() || undefined,
        shippingFeeType: shippingChoice === 'FREE' ? 'FREE' : shippingChoice,
        shippingFee: shippingChoice !== 'FREE' ? Number(shippingFee) || 0 : 0,
        shippingInfo: DELIVERY_TO_TEXT[deliveryEta],
        allowCreatorPick,
        allowTrial,
        defaultCommissionRate: commissionRate,
        heroIngredients: selectedIngredients.map(i => i.id),
        targetPainPoints: Object.keys(selectedPainPoints),
        lowestPriceGuarantee,
        cnecExclusive,
        asDraft: true,
      });
      localStorage.removeItem(DRAFT_KEY);
      toast.success('임시저장 했어요');
      router.push(productsPath);
    } catch (err) {
      console.error('Failed to save draft:', err);
      setError('임시저장에 실패했어요');
      toast.error('임시저장에 실패했어요');
    } finally {
      setIsSaving(false);
    }
  }

  function handleLocalDraftSave() {
    const draft = {
      name,
      category,
      originalPrice,
      salePrice,
      stock,
      images,
      detailUrl,
      shippingChoice,
      shippingFee,
      deliveryEta,
      isActive,
      allowCreatorPick,
      allowTrial,
      commissionRate,
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    toast.success('임시저장 했어요');
  }

  async function handleSave() {
    if (!brand?.id) return;
    if (!isValid) {
      setError('필수 정보를 모두 입력해주세요');
      return;
    }
    if (detailUrl.trim() && !detailUrl.trim().startsWith('https://')) {
      setError('상세페이지 URL은 https://로 시작해야 해요');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await createProduct({
        brandId: brand.id,
        name: name.trim(),
        category,
        description: description.trim() || undefined,
        originalPrice: Number(originalPrice),
        salePrice: Number(salePrice),
        stock: Number(stock),
        images,
        volume: volume.trim() || undefined,
        ingredients: ingredientsText.trim() || undefined,
        howToUse: howToUse.trim() || undefined,
        detailUrl: detailUrl.trim() || undefined,
        shippingFeeType: shippingChoice === 'FREE' ? 'FREE' : shippingChoice,
        shippingFee: shippingChoice !== 'FREE' ? Number(shippingFee) || 0 : 0,
        freeShippingThreshold: shippingChoice === 'CONDITIONAL_FREE' ? Number(freeShippingThreshold) || 0 : undefined,
        courier: courier || undefined,
        shippingInfo: shippingInfoText.trim() || DELIVERY_TO_TEXT[deliveryEta],
        returnPolicy: returnPolicy.trim() || undefined,
        status: isActive ? 'ACTIVE' : 'INACTIVE',
        allowCreatorPick,
        allowTrial,
        defaultCommissionRate: commissionRate,
        heroIngredients: selectedIngredients.map(i => i.id),
        targetPainPoints: Object.keys(selectedPainPoints),
        lowestPriceGuarantee,
        cnecExclusive,
      });

      try {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#2563eb', '#1e40af', '#0ea5e9', '#22c55e', '#fde047'],
        });
      } catch {
        /* ignore confetti errors */
      }
      localStorage.removeItem(DRAFT_KEY);
      // 첫 상품인지 확인
      const allProducts = brand ? await getActiveProducts(brand.id) : [];
      if (allProducts.length <= 1) {
        toast.success('첫 상품이 등록됐어요!');
      } else {
        toast.success('상품이 등록되었어요');
      }
      router.push(productsPath);
    } catch (err) {
      console.error('Failed to create product:', err);
      setError('상품 등록에 실패했어요. 잠시 후 다시 시도해주세요');
      toast.error('상품 등록에 실패했어요');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="mx-auto max-w-3xl px-4 pt-6 sm:px-6">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-white hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            뒤로
          </button>
          <button
            type="button"
            onClick={handleLocalDraftSave}
            className="rounded-full px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-white hover:text-gray-900"
          >
            빠른저장
          </button>
        </div>

        {/* Heading */}
        <header className="mt-4">
          <h1 className="text-3xl font-bold text-gray-900">새 상품 등록</h1>
          <p className="mt-1.5 text-sm text-gray-500">
            공구에 올릴 상품 정보를 입력해주세요
          </p>
        </header>

        {/* Sticky Stepper */}
        <div className="sticky top-2 z-30 mt-6 rounded-3xl border border-gray-100 bg-white/90 p-4 shadow-sm backdrop-blur sm:p-5">
          <Stepper
            steps={STEPS}
            current={stepStatus.current}
            completed={stepStatus.completed}
          />
        </div>

        {error ? (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} aria-label="닫기">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}

        <div className="mt-6 space-y-6">
          <BasicInfoSection
            name={name}
            setName={setName}
            category={category}
            setCategory={setCategory}
            originalPrice={originalPrice}
            setOriginalPrice={setOriginalPrice}
            salePrice={salePrice}
            setSalePrice={setSalePrice}
            stock={stock}
            setStock={setStock}
          />

          <IngredientPainPointSection
            selectedIngredients={selectedIngredients}
            onIngredientsChange={setSelectedIngredients}
            selectedPainPoints={selectedPainPoints}
            onPainPointsChange={setSelectedPainPoints}
          />

          <ImagesSection images={images} onChange={setImages} />

          <DetailsSection
            detailUrl={detailUrl}
            setDetailUrl={setDetailUrl}
            shippingChoice={shippingChoice}
            setShippingChoice={setShippingChoice}
            shippingFee={shippingFee}
            setShippingFee={setShippingFee}
            freeShippingThreshold={freeShippingThreshold}
            setFreeShippingThreshold={setFreeShippingThreshold}
            deliveryEta={deliveryEta}
            setDeliveryEta={setDeliveryEta}
            courier={courier}
            setCourier={setCourier}
            shippingInfo={shippingInfoText}
            setShippingInfo={setShippingInfoText}
            returnPolicy={returnPolicy}
            setReturnPolicy={setReturnPolicy}
          />

          <ProductDescriptionSection
            description={description}
            setDescription={setDescription}
            volume={volume}
            setVolume={setVolume}
            ingredients={ingredientsText}
            setIngredients={setIngredientsText}
            howToUse={howToUse}
            setHowToUse={setHowToUse}
          />

          <TrustPolicySection
            lowestPriceGuarantee={lowestPriceGuarantee}
            setLowestPriceGuarantee={setLowestPriceGuarantee}
            cnecExclusive={cnecExclusive}
            setCnecExclusive={setCnecExclusive}
          />

          <CreatorSettingsSection
            isActive={isActive}
            setIsActive={setIsActive}
            allowCreatorPick={allowCreatorPick}
            setAllowCreatorPick={setAllowCreatorPick}
            allowTrial={allowTrial}
            setAllowTrial={setAllowTrial}
            commissionRate={commissionRate}
            setCommissionRate={setCommissionRate}
            salePrice={Number(salePrice) || 0}
          />
        </div>
      </div>

      {/* Fixed bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-100 bg-white/95 backdrop-blur lg:left-60">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex h-12 items-center justify-center rounded-full bg-gray-100 px-6 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            취소
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDraftSave}
              disabled={isSaving || !name.trim()}
              className={`inline-flex h-12 items-center justify-center rounded-full border border-gray-300 px-6 text-sm font-medium transition-colors ${
                isSaving || !name.trim()
                  ? 'cursor-not-allowed bg-gray-50 text-gray-300'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              임시저장
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!isValid || isSaving}
              className={`inline-flex h-12 min-w-[140px] items-center justify-center rounded-full px-8 text-sm font-medium text-white transition-colors ${
                !isValid || isSaving
                  ? 'cursor-not-allowed bg-gray-300'
                  : 'bg-gray-900 hover:bg-gray-800'
              }`}
            >
              {isSaving ? '등록 중…' : '등록 완료'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
