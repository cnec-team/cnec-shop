'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Users,
  Percent,
  Truck,
  Package,
  Loader2,
  Clock,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { calculateDDay, getDDayLabel } from '@/lib/utils/date';
import {
  getCreatorCampaignDetail,
  applyCampaignParticipation,
  addCampaignShopItems,
} from '@/lib/actions/creator';

type CampaignDetail = Awaited<ReturnType<typeof getCreatorCampaignDetail>>;

const STATUS_LABEL: Record<string, string> = {
  RECRUITING: '모집중',
  ACTIVE: '진행중',
  ENDED: '종료',
  DRAFT: '작성중',
  PAUSED: '일시중지',
};

const STATUS_BADGE: Record<string, string> = {
  RECRUITING: 'bg-blue-50 text-blue-700',
  ACTIVE: 'bg-emerald-50 text-emerald-700',
  ENDED: 'bg-gray-50 text-gray-400',
  DRAFT: 'bg-gray-100 text-gray-600',
  PAUSED: 'bg-amber-50 text-amber-700',
};

const SHIPPING_LABELS: Record<string, string> = {
  FREE: '무료배송',
  PAID: '유료배송',
  CONDITIONAL_FREE: '조건부 무료',
};

function formatDate(date?: string | null) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function formatWon(amount: number) {
  return '₩' + Math.round(amount).toLocaleString('ko-KR');
}

export default function CreatorCampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const campaignId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<CampaignDetail>(null);
  const [selectedProductIdx, setSelectedProductIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Apply dialog (APPROVAL flow)
  const [applyOpen, setApplyOpen] = useState(false);
  const [applyMessage, setApplyMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getCreatorCampaignDetail(campaignId);
        if (!cancelled) setCampaign(data);
      } catch (err) {
        console.error('Failed to load campaign detail:', err);
        toast.error('캠페인 정보를 불러오지 못했습니다');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [campaignId]);

  if (loading) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto pb-28">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="aspect-square w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-16">
        <Info className="mx-auto h-12 w-12 text-gray-200" />
        <p className="mt-4 text-gray-400">캠페인을 찾을 수 없습니다</p>
        <Button
          variant="outline"
          className="mt-3 rounded-xl"
          onClick={() => router.push(`/${locale}/creator/campaigns`)}
        >
          목록으로
        </Button>
      </div>
    );
  }

  const primaryProduct = campaign.products[selectedProductIdx] ?? campaign.products[0];
  const productImages = primaryProduct?.product?.images?.length
    ? primaryProduct.product.images
    : primaryProduct?.product?.thumbnailUrl
    ? [primaryProduct.product.thumbnailUrl]
    : primaryProduct?.product?.imageUrl
    ? [primaryProduct.product.imageUrl]
    : [];

  const commissionPct = Math.round(campaign.commissionRate * 100);
  const salePrice = primaryProduct
    ? primaryProduct.campaignPrice
    : 0;
  const originalPrice = primaryProduct?.product?.originalPrice ?? 0;
  const discountRate =
    originalPrice > 0 && salePrice < originalPrice
      ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
      : 0;

  const earnPerUnit = Math.round(salePrice * campaign.commissionRate);

  const dDay = campaign.endAt ? calculateDDay(campaign.endAt) : null;
  const dDayLabel =
    dDay != null ? (dDay > 0 ? getDDayLabel(dDay) : dDay === 0 ? 'D-Day' : '종료') : null;

  const recruitmentLabel =
    campaign.recruitmentType === 'APPROVAL' ? '승인제' : '자유참여';
  const campaignTypeLabel = campaign.type === 'GONGGU' ? '공구' : '상시';

  const hasApplied = !!campaign.myParticipation;
  const myStatusLabel =
    campaign.myParticipation?.status === 'PENDING'
      ? '승인 대기중'
      : campaign.myParticipation?.status === 'APPROVED'
      ? '참여 중'
      : campaign.myParticipation?.status === 'REJECTED'
      ? '거절됨'
      : null;

  const brandShippingLabel = (() => {
    const product = primaryProduct?.product;
    if (!product) return null;
    const type = product.shippingFeeType;
    if (type === 'FREE') return '무료배송';
    if (type === 'CONDITIONAL_FREE' && product.freeShippingThreshold) {
      return `${formatWon(product.freeShippingThreshold)} 이상 무료배송`;
    }
    if (type === 'PAID' && product.shippingFee) {
      return `${formatWon(product.shippingFee)}`;
    }
    return SHIPPING_LABELS[type] ?? '유료배송';
  })();

  async function handleApplyApproval() {
    setSubmitting(true);
    try {
      await applyCampaignParticipation({
        campaignId: campaign!.id,
        status: 'PENDING',
        message: applyMessage.trim() || undefined,
      });
      toast.success('공구 참여 신청이 완료되었습니다');
      setApplyOpen(false);
      const refreshed = await getCreatorCampaignDetail(campaignId);
      setCampaign(refreshed);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('Unique')) toast.error('이미 신청한 캠페인입니다');
      else toast.error('참여 신청에 실패했습니다');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleJoinOpen() {
    setSubmitting(true);
    try {
      await applyCampaignParticipation({
        campaignId: campaign!.id,
        status: 'APPROVED',
      });
      const productIds = campaign!.products.map((cp) => cp.productId);
      if (productIds.length > 0) {
        await addCampaignShopItems(campaign!.id, productIds);
      }
      toast.success('공구 참여가 완료되었습니다. 내 샵에 추가되었습니다');
      const refreshed = await getCreatorCampaignDetail(campaignId);
      setCampaign(refreshed);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('Unique')) toast.error('이미 참여 중인 캠페인입니다');
      else toast.error('참여에 실패했습니다');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto pb-28 space-y-4">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        뒤로
      </button>

      {/* Hero: Product images */}
      <Card className="overflow-hidden p-0 rounded-2xl border-gray-100 shadow-sm">
        <div className="relative aspect-square w-full bg-gray-100">
          {productImages[0] ? (
            <Image
              src={productImages[0]}
              alt={primaryProduct?.product?.name ?? campaign.title}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-12 w-12 text-gray-300" />
            </div>
          )}
          {dDayLabel && (
            <div className="absolute top-3 left-3 bg-black/70 text-white text-xs font-semibold px-3 py-1 rounded-full">
              {dDayLabel}
            </div>
          )}
          <div className="absolute top-3 right-3 flex gap-1.5">
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                STATUS_BADGE[campaign.status] || 'bg-gray-100 text-gray-600'
              }`}
            >
              {STATUS_LABEL[campaign.status] || campaign.status}
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/90 text-gray-700">
              {campaignTypeLabel}
            </span>
          </div>
        </div>
        {productImages.length > 1 && (
          <div className="flex gap-2 p-3 overflow-x-auto">
            {productImages.map((img, i) => (
              <button
                key={img + i}
                onClick={() => setSelectedProductIdx(0)}
                className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100"
              >
                <Image src={img} alt={`image-${i}`} fill className="object-cover" sizes="64px" />
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Title + Brand */}
      <Card className="rounded-2xl border-gray-100 shadow-sm">
        <CardContent className="p-5 space-y-3">
          <h1 className="text-xl font-bold text-gray-900 leading-tight">
            {campaign.title}
          </h1>
          {campaign.description && (
            <p className="text-sm text-gray-500 whitespace-pre-wrap leading-relaxed">
              {campaign.description}
            </p>
          )}

          {campaign.brand && (
            <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
              <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center flex-shrink-0">
                {campaign.brand.logoUrl ? (
                  <Image
                    src={campaign.brand.logoUrl}
                    alt={campaign.brand.brandName ?? ''}
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                ) : (
                  <Building2 className="w-4 h-4 text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {campaign.brand.brandName ?? campaign.brand.companyName}
                </p>
                {campaign.brand.description && (
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {campaign.brand.description}
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product info */}
      {primaryProduct?.product && (
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardContent className="p-5 space-y-3">
            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
              <Package className="h-4 w-4 text-gray-400" />
              상품 정보
            </h2>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {primaryProduct.product.name}
              </p>
              {primaryProduct.product.volume && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {primaryProduct.product.volume}
                </p>
              )}
            </div>

            {/* Price */}
            <div className="flex items-end gap-2">
              {originalPrice > 0 && originalPrice !== salePrice && (
                <span className="text-sm text-gray-300 line-through">
                  {formatWon(originalPrice)}
                </span>
              )}
              {discountRate > 0 && (
                <span className="text-sm font-bold text-red-500">
                  {discountRate}%
                </span>
              )}
              <span className="text-xl font-bold text-gray-900">
                {formatWon(salePrice)}
              </span>
              <span className="text-xs text-gray-400 mb-0.5">공구가</span>
            </div>

            {/* Product description */}
            {primaryProduct.product.description && (
              <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed pt-2 border-t border-gray-100">
                {primaryProduct.product.description}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Multiple products list */}
      {campaign.products.length > 1 && (
        <Card className="rounded-2xl border-gray-100 shadow-sm">
          <CardContent className="p-5 space-y-3">
            <h2 className="text-sm font-semibold text-gray-900">
              포함 상품 ({campaign.products.length}개)
            </h2>
            <div className="space-y-2">
              {campaign.products.map((cp, idx) => (
                <button
                  key={cp.id}
                  onClick={() => setSelectedProductIdx(idx)}
                  className={`flex items-center gap-3 w-full p-2 rounded-xl text-left transition-colors ${
                    idx === selectedProductIdx
                      ? 'bg-gray-50 border border-gray-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden relative flex-shrink-0">
                    {cp.product?.thumbnailUrl || cp.product?.images?.[0] ? (
                      <Image
                        src={cp.product.thumbnailUrl || cp.product.images[0]}
                        alt={cp.product.name ?? ''}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      <Package className="w-4 h-4 text-gray-300 m-auto mt-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {cp.product?.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      공구가 {formatWon(cp.campaignPrice)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campaign conditions */}
      <Card className="rounded-2xl border-gray-100 shadow-sm">
        <CardContent className="p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
            <Info className="h-4 w-4 text-gray-400" />
            캠페인 조건
          </h2>
          <div className="space-y-2.5 text-sm">
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-gray-400">기간</p>
                <p className="text-gray-900">
                  {campaign.startAt ? formatDate(campaign.startAt) : '-'}
                  {campaign.endAt ? ` ~ ${formatDate(campaign.endAt)}` : ''}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Users className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-gray-400">모집 방식</p>
                <p className="text-gray-900">
                  {recruitmentLabel} · 참여 크리에이터 {campaign.participantCount}명
                  {campaign.targetParticipants ? `/${campaign.targetParticipants}명` : ''}
                </p>
              </div>
            </div>
            {campaign.totalStock != null && (
              <div className="flex items-start gap-2">
                <Package className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-gray-400">한정 수량</p>
                  <p className="text-gray-900">
                    총 {campaign.totalStock.toLocaleString()}개
                    {campaign.soldCount > 0 && ` · 판매 ${campaign.soldCount}개`}
                  </p>
                </div>
              </div>
            )}
            {brandShippingLabel && (
              <div className="flex items-start gap-2">
                <Truck className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-gray-400">배송비</p>
                  <p className="text-gray-900">{brandShippingLabel}</p>
                </div>
              </div>
            )}
            {campaign.conditions && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-1">참여 조건</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {campaign.conditions}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Commission calculator */}
      <Card className="rounded-2xl border-gray-100 shadow-sm bg-gradient-to-br from-emerald-50/60 to-blue-50/60">
        <CardContent className="p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
            <Percent className="h-4 w-4 text-emerald-600" />
            내 예상 수익
          </h2>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-700">
              {formatWon(earnPerUnit)}
            </span>
            <span className="text-sm text-gray-500">/ 1개 판매 시</span>
          </div>
          <p className="text-xs text-gray-500">
            내 수익 {commissionPct}% 기준
          </p>
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/80">
            {[1, 5, 10].map((qty) => (
              <div
                key={qty}
                className="bg-white rounded-xl p-2.5 text-center border border-gray-100"
              >
                <p className="text-[10px] text-gray-400">{qty}개 판매</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">
                  {formatWon(earnPerUnit * qty)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Earnings structure */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900">내 수익 구조</h3>
        <div className="space-y-2.5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">상품 판매가</span>
            <span className="font-semibold text-gray-900">{formatWon(salePrice)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">내 수익 {commissionPct}%</span>
            <span className="font-semibold text-blue-600">{formatWon(earnPerUnit)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">크넥 수수료</span>
            <span className="font-bold text-green-600">0원</span>
          </div>
          <div className="border-t border-gray-100 pt-2">
            <p className="text-sm font-medium text-gray-900">
              1개 팔면 {formatWon(earnPerUnit)}이 내 통장에 들어와요.
            </p>
          </div>
        </div>
        <p className="text-xs text-gray-500 pt-1">
          수수료는 브랜드가 부담해요. 크리에이터님은 추천만 하세요.
        </p>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-60 z-40 bg-white border-t border-gray-100 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="flex-1">
            <p className="text-[10px] text-gray-400">1개 판매 시 수익</p>
            <p className="text-base font-bold text-emerald-700">
              {formatWon(earnPerUnit)}
            </p>
          </div>
          {hasApplied ? (
            <Button
              disabled
              className="flex-[2] h-12 rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-100"
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              {myStatusLabel}
            </Button>
          ) : campaign.recruitmentType === 'APPROVAL' ? (
            <Button
              onClick={() => setApplyOpen(true)}
              disabled={submitting || campaign.status !== 'RECRUITING'}
              className="flex-[2] h-12 rounded-xl bg-gray-900 text-white hover:bg-gray-800 text-sm font-semibold"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                '참여 신청하기'
              )}
            </Button>
          ) : (
            <Button
              onClick={handleJoinOpen}
              disabled={submitting || campaign.status !== 'RECRUITING'}
              className="flex-[2] h-12 rounded-xl bg-gray-900 text-white hover:bg-gray-800 text-sm font-semibold"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                '바로 참여하기'
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Approval dialog */}
      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>공구 참여 신청</DialogTitle>
            <DialogDescription>{campaign.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>참여 메시지 (선택)</Label>
              <Textarea
                placeholder="브랜드에 전달할 메시지를 입력하세요"
                value={applyMessage}
                onChange={(e) => setApplyMessage(e.target.value)}
                rows={4}
              />
            </div>
            {campaign.conditions && (
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs font-medium text-gray-500 mb-1">참여 조건</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {campaign.conditions}
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setApplyOpen(false)}
              className="flex-1 rounded-xl h-12"
            >
              취소
            </Button>
            <Button
              onClick={handleApplyApproval}
              disabled={submitting}
              className="flex-1 bg-gray-900 text-white hover:bg-gray-800 rounded-xl h-12"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  신청 중...
                </>
              ) : (
                '신청하기'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
