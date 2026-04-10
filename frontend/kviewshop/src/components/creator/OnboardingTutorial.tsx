'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  PartyPopper,
  Store,
  ShoppingBag,
  Share2,
  Rocket,
  ChevronRight,
  ChevronLeft,
  X,
  Check,
  Copy,
  Plus,
  Loader2,
  Package,
  EyeOff,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { useOnboardingStore } from '@/lib/store/onboarding';
import { formatCurrency } from '@/lib/i18n/config';
import { getShopUrl } from '@/lib/utils/beauty-labels';
import {
  getCreatorSession,
  getPickableProducts,
  addProductToShop,
  triggerMissionCheck,
} from '@/lib/actions/creator';

interface RecommendedProduct {
  id: string;
  name: string;
  salePrice: number;
  images: string[] | null;
  defaultCommissionRate: number;
  brand: { brandName: string } | null;
}

const STEPS = [
  { icon: PartyPopper, title: '부담 없이 시작하세요!', color: 'text-yellow-500' },
  { icon: Store, title: '내 샵을 꾸며보세요', color: 'text-blue-500' },
  { icon: ShoppingBag, title: '상품을 추가하면 바로 판매 시작!', color: 'text-green-500' },
  { icon: Share2, title: 'SNS에 공유하세요', color: 'text-purple-500' },
  { icon: Rocket, title: 'CS 걱정 제로!', color: 'text-primary' },
];

export function OnboardingTutorial() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;

  const {
    tutorialCompleted,
    tutorialDismissed,
    neverShowAgain,
    currentStep,
    completedSteps,
    setCurrentStep,
    completeStep,
    completeTutorial,
    dismissTutorial,
    setNeverShowAgain,
  } = useOnboardingStore();

  const [visible, setVisible] = useState(false);
  const [shopUrl, setShopUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [products, setProducts] = useState<RecommendedProduct[]>([]);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (tutorialCompleted || tutorialDismissed || neverShowAgain) {
      setVisible(false);
      return;
    }

    async function check() {
      try {
        const creator = await getCreatorSession();
        if (!creator) return;

        const c = creator as Record<string, any>;
        setShopUrl(c.shopId ? getShopUrl(c.shopId) : '');

        // Fetch products for step 3
        const data = await getPickableProducts(c.id);
        setProducts((data.products as unknown as RecommendedProduct[]).slice(0, 3));

        setVisible(true);
      } catch {
        // silently fail
      }
    }

    check();
  }, [tutorialCompleted, tutorialDismissed, neverShowAgain]);

  if (!visible) return null;

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTutorial();
      setVisible(false);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    dismissTutorial();
    setVisible(false);
  };

  const handleGoToShop = () => {
    completeStep(1);
    dismissTutorial();
    router.push(`/${locale}/creator/shop`);
  };

  const handleAddProduct = async (product: RecommendedProduct) => {
    setAddingId(product.id);
    try {
      await addProductToShop(product.id);
      setAddedIds((prev) => new Set([...prev, product.id]));
      completeStep(2);
      toast.success('내 샵에 추가되었습니다!');
      try { await triggerMissionCheck('FIRST_PRODUCT'); } catch {}
    } catch (error: any) {
      if (error?.message?.includes('Unique')) {
        setAddedIds((prev) => new Set([...prev, product.id]));
        toast.info('이미 추가된 상품입니다');
      } else {
        toast.error('추가에 실패했습니다');
      }
    } finally {
      setAddingId(null);
    }
  };

  const handleCopyLink = () => {
    if (!shopUrl) return;
    navigator.clipboard.writeText(shopUrl);
    setCopied(true);
    completeStep(3);
    toast.success('링크가 복사되었습니다!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFinish = () => {
    completeStep(4);
    completeTutorial();
    setVisible(false);
    router.push(`/${locale}/creator/dashboard`);
  };

  const StepIcon = STEPS[currentStep].icon;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div className="bg-background w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-0">
          {/* Step indicators */}
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentStep
                    ? 'w-6 bg-primary'
                    : i < currentStep || completedSteps.includes(i)
                    ? 'w-1.5 bg-primary/50'
                    : 'w-1.5 bg-muted-foreground/20'
                }`}
              />
            ))}
          </div>
          <button
            onClick={handleSkip}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 pt-4">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className={`h-16 w-16 rounded-2xl bg-muted flex items-center justify-center ${STEPS[currentStep].color}`}>
              <StepIcon className="h-8 w-8" />
            </div>
            {completedSteps.includes(currentStep) && (
              <div className="absolute ml-12 mt-12 h-6 w-6 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="h-3.5 w-3.5 text-white" />
              </div>
            )}
          </div>

          {/* Step Title */}
          <h2 className="text-xl font-bold text-center mb-2">
            {STEPS[currentStep].title}
          </h2>

          {/* Step Content */}
          {currentStep === 0 && (
            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground leading-relaxed">
                써보고 좋으면 스토리 올리고,<br />
                반응 좋으면 공구 도전!
              </p>
              <div className="bg-blue-50 text-blue-700 rounded-xl p-3 text-xs flex items-center gap-2 text-left">
                <Info className="h-4 w-4 shrink-0" />
                <span>프로필을 등록해야 체험 신청을 할 수 있어요</span>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                프로필 사진과 샵 이름을 설정해서<br />
                나만의 셀렉트샵을 완성해보세요.
              </p>
              <Button onClick={handleGoToShop} className="w-full h-12">
                <Store className="h-4 w-4 mr-2" />
                샵 설정하기
              </Button>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center mb-4">
                마음에 드는 상품을 1탭으로 내 샵에 추가하세요!
              </p>
              {products.length > 0 ? (
                <div className="space-y-2">
                  {products.map((product) => {
                    const isAdded = addedIds.has(product.id);
                    const earnings = Math.round(product.salePrice * product.defaultCommissionRate);

                    return (
                      <div
                        key={product.id}
                        className="flex items-center gap-3 p-2.5 rounded-xl border bg-card"
                      >
                        <div className="h-14 w-14 rounded-lg bg-muted overflow-hidden shrink-0">
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Package className="h-6 w-6 text-muted-foreground/30" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{product.name}</p>
                          <p className="text-xs text-primary font-semibold">
                            팔면 {formatCurrency(earnings, 'KRW')}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant={isAdded ? 'outline' : 'default'}
                          className="h-9 px-3 shrink-0"
                          disabled={isAdded || addingId === product.id}
                          onClick={() => handleAddProduct(product)}
                        >
                          {addingId === product.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : isAdded ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  추천 상품을 불러오는 중...
                </p>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                내 샵 링크를 SNS에 공유하면<br />
                팔로워들이 바로 구매할 수 있어요!
              </p>
              {shopUrl ? (
                <div className="space-y-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="font-mono text-xs text-primary break-all">{shopUrl}</p>
                  </div>
                  <Button
                    onClick={handleCopyLink}
                    variant={copied ? 'outline' : 'default'}
                    className="w-full h-12"
                  >
                    {copied ? (
                      <><Check className="h-4 w-4 mr-2" />복사 완료!</>
                    ) : (
                      <><Copy className="h-4 w-4 mr-2" />내 샵 링크 복사</>
                    )}
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">샵 설정을 먼저 완료해주세요</p>
              )}
            </div>
          )}

          {currentStep === 4 && (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                배송·교환·환불은 브랜드가,<br />
                크넥이 관리. CS 걱정 제로!
              </p>
              {addedIds.size > 0 && (
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
                  <p className="text-xs text-muted-foreground mb-1">추가한 상품</p>
                  <p className="text-2xl font-bold text-primary">{addedIds.size}개</p>
                </div>
              )}
              <Button onClick={handleFinish} className="w-full h-12">
                <Rocket className="h-4 w-4 mr-2" />
                대시보드로 이동
              </Button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between p-4 pt-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="h-10"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            이전
          </Button>
          {currentStep < STEPS.length - 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNext}
              className="h-10"
            >
              다음
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>

        {/* Never show again */}
        <div className="flex justify-center pb-4">
          <button
            onClick={() => {
              setNeverShowAgain();
              setVisible(false);
            }}
            className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors flex items-center gap-1.5 py-1 px-2"
          >
            <EyeOff className="h-3.5 w-3.5" />
            다시 보지 않기
          </button>
        </div>
      </div>
    </div>
  );
}
