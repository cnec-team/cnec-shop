'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { calculateDDay, getDDayLabel } from '@/lib/utils/date';
import {
  Megaphone,
  Users,
  ArrowRight,
  Clock,
  Package,
  Search,
  SlidersHorizontal,
  X,
  Sparkles,
} from 'lucide-react';
import { BrandBadge } from '@/components/common/BrandBadge';
import {
  getCreatorSession,
  getAvailableCampaigns,
  getMyParticipations,
} from '@/lib/actions/creator';

type CampaignStatus = 'RECRUITING' | 'ACTIVE' | 'ENDED' | 'PAUSED' | 'DRAFT';

interface CampaignWithDetails {
  id: string;
  brandId: string;
  type: string;
  title: string;
  description: string | null;
  status: CampaignStatus;
  startAt: string | null;
  endAt: string | null;
  commissionRate: number;
  totalStock: number | null;
  soldCount: number | null;
  recruitmentType?: string;
  targetParticipants?: number | null;
  conditions?: string | null;
  createdAt: string;
  brand?: { id: string; brandName: string; companyName: string; logoUrl?: string | null } | null;
  products?: Array<{ id: string; campaignId: string; productId: string; campaignPrice: number; product?: { id: string; name: string | null; nameKo: string | null; thumbnailUrl: string | null; imageUrl: string | null; images: string[] } | null }>;
  participantCount?: number;
}

interface MyParticipation {
  id: string;
  campaignId: string;
  creatorId: string;
  status: string;
  appliedAt: string;
  approvedAt: string | null;
  campaign: CampaignWithDetails | null;
}

const STATUS_BADGE: Record<string, string> = {
  RECRUITING: 'bg-blue-50 text-blue-700',
  ACTIVE: 'bg-emerald-50 text-emerald-700',
  ENDED: 'bg-gray-50 text-gray-400',
  DRAFT: 'bg-gray-100 text-gray-600',
  PAUSED: 'bg-amber-50 text-amber-700',
};

const STATUS_LABEL: Record<string, string> = {
  RECRUITING: '모집중',
  ACTIVE: '진행중',
  ENDED: '종료',
  DRAFT: '작성중',
  PAUSED: '일시중지',
};

const PARTICIPATION_STATUS_LABEL: Record<string, string> = {
  PENDING: '승인대기',
  APPROVED: '승인됨',
  REJECTED: '거절됨',
};

const PARTICIPATION_BADGE: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  APPROVED: 'bg-emerald-50 text-emerald-700',
  REJECTED: 'bg-red-50 text-red-700',
};

const CATEGORY_FILTERS = ['내 수익순', '마감 임박', '스킨케어', '헤어', '바디'];

export default function CreatorGongguPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const [campaigns, setCampaigns] = useState<CampaignWithDetails[]>([]);
  const [myParticipations, setMyParticipations] = useState<MyParticipation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'available' | 'active' | 'ended'>('available');
  const [showAiCard, setShowAiCard] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      const creatorData = await getCreatorSession();

      try {
        const [campaignData, participationData] = await Promise.all([
          getAvailableCampaigns(),
          creatorData ? getMyParticipations(creatorData.id) : Promise.resolve([]),
        ]);
        if (!cancelled) {
          setCampaigns(campaignData as unknown as CampaignWithDetails[]);
          setMyParticipations(participationData as unknown as MyParticipation[]);
        }
      } catch (error) {
        console.error('Failed to fetch campaigns:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, []);

  // Only RECRUITING status for the available tab
  const recruitingCampaigns = useMemo(
    () => campaigns.filter((c) => c.status === 'RECRUITING'),
    [campaigns]
  );

  // Participations where approved and campaign is active/recruiting
  const activeCampaigns = useMemo(
    () => myParticipations.filter(
      (p) => p.status === 'APPROVED' && p.campaign && (p.campaign.status === 'RECRUITING' || p.campaign.status === 'ACTIVE')
    ),
    [myParticipations]
  );

  // Participations where campaign ended or participation rejected
  const endedCampaigns = useMemo(
    () => myParticipations.filter(
      (p) => p.campaign && (p.campaign.status === 'ENDED' || p.status === 'REJECTED')
    ),
    [myParticipations]
  );

  const getDDay = (endAt?: string | null) => {
    if (!endAt) return null;
    const days = calculateDDay(endAt);
    if (days <= 0) return days === 0 ? 'D-Day' : '종료';
    return getDDayLabel(days);
  };

  const getEstimatedEarnings = (campaign: CampaignWithDetails) => {
    const avgPrice = (campaign.products ?? []).reduce((sum, p) => sum + Number(p.campaignPrice), 0) / Math.max((campaign.products ?? []).length, 1);
    return Math.round(avgPrice * Number(campaign.commissionRate));
  };

  // Campaigns that are closing soon (within 3 days)
  const urgentCampaigns = useMemo(() => {
    return recruitingCampaigns.filter((c) => {
      if (!c.endAt) return false;
      const days = calculateDDay(c.endAt);
      return days >= 0 && days <= 3;
    });
  }, [recruitingCampaigns]);

  if (loading) {
    return (
      <div className="space-y-4 max-w-3xl">
        <Skeleton className="h-10 w-full rounded-xl" />
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const renderCampaignCard = (campaign: CampaignWithDetails) => {
    const dDay = getDDay(campaign.endAt);
    const earnings = getEstimatedEarnings(campaign);
    const primaryProduct = campaign.products?.[0];
    const product = primaryProduct?.product;
    const productName = product?.nameKo || product?.name || null;
    const productImage = product?.thumbnailUrl || product?.imageUrl || product?.images?.[0] || null;
    const campaignPrice = primaryProduct ? Number(primaryProduct.campaignPrice) : 0;
    const originalPrice = product ? campaignPrice / (1 - Number(campaign.commissionRate)) : 0;
    const discountPercent = originalPrice > 0 ? Math.round((1 - campaignPrice / originalPrice) * 100) : 0;
    const soldCount = campaign.soldCount ?? 0;
    const totalStock = campaign.totalStock ?? 0;
    const progressPercent = totalStock > 0 ? Math.min(Math.round((soldCount / totalStock) * 100), 100) : 0;

    return (
      <div
        key={campaign.id}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer hover:border-gray-300 transition-colors"
        onClick={() => router.push(`/${locale}/creator/campaigns/${campaign.id}`)}
      >
        <div className="p-4 flex gap-3">
          {/* Product thumbnail */}
          <div className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden shrink-0">
            {productImage ? (
              <img src={productImage} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-6 h-6 text-gray-300" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {campaign.brand && (
              <span className="text-[11px] text-gray-400 font-medium">{campaign.brand.brandName}</span>
            )}
            {productName && (
              <p className="text-sm font-semibold text-gray-900 line-clamp-1 mt-0.5">{productName}</p>
            )}
            <div className="flex items-baseline gap-1.5 mt-1">
              {discountPercent > 0 && (
                <span className="text-sm font-bold text-red-500">{discountPercent}%</span>
              )}
              <span className="text-sm font-bold text-gray-900">{campaignPrice > 0 ? `₩${campaignPrice.toLocaleString()}` : ''}</span>
              {originalPrice > 0 && discountPercent > 0 && (
                <span className="text-xs text-gray-400 line-through">₩{Math.round(originalPrice).toLocaleString()}</span>
              )}
            </div>
            {earnings > 0 && (
              <p className="text-xs text-emerald-600 font-semibold mt-1">
                내 수익 ₩{earnings.toLocaleString()}
                <span className="text-gray-400 font-normal ml-1">1개 팔면</span>
              </p>
            )}
          </div>
        </div>

        {/* Bottom: progress + action */}
        <div className="px-4 pb-4">
          {totalStock > 0 && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
                <span>{soldCount}개 판매</span>
                <span>{totalStock}개 목표</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-foreground rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
          <div onClick={(e) => e.stopPropagation()}>
            <Button
              className="w-full h-9 rounded-xl text-sm bg-foreground text-white hover:bg-foreground/90 flex items-center justify-center gap-1"
              onClick={() => router.push(`/${locale}/creator/campaigns/${campaign.id}`)}
            >
              공구 참여하기
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">공동구매</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            지금 진행 중인 공구 {activeCampaigns.length}건 | 참여 가능 공구 {recruitingCampaigns.length}건
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <Search className="h-4.5 w-4.5 text-gray-600" />
          </button>
          <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <SlidersHorizontal className="h-4.5 w-4.5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Pill Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('available')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeTab === 'available'
              ? 'bg-foreground text-white'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          참여 가능 {recruitingCampaigns.length}
        </button>
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeTab === 'active'
              ? 'bg-foreground text-white'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          참여 중 {activeCampaigns.length}
        </button>
        <button
          onClick={() => setActiveTab('ended')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeTab === 'ended'
              ? 'bg-foreground text-white'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          종료 {endedCampaigns.length}
        </button>
      </div>

      {/* Category Filter Pills */}
      {activeTab === 'available' && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORY_FILTERS.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(activeFilter === filter ? null : filter)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                activeFilter === filter
                  ? 'bg-foreground text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      )}

      {/* AI Strategy Card */}
      {activeTab === 'available' && showAiCard && recruitingCampaigns.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 relative">
          <button
            onClick={() => setShowAiCard(false)}
            className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center hover:bg-emerald-100 transition-colors"
          >
            <X className="h-3.5 w-3.5 text-emerald-600" />
          </button>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkles className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-bold text-emerald-800">AI 공략</span>
          </div>
          <p className="text-sm text-emerald-700 font-medium">
            지금 공유하면 10명 달성 확률 87%
          </p>
          <p className="text-xs text-emerald-600 mt-0.5">
            인스타 스토리 멤블링 3종류가 준비됐어요
          </p>
        </div>
      )}

      {activeTab === 'available' ? (
        recruitingCampaigns.length === 0 ? (
          <div className="text-center py-16">
            <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mx-auto">
              <Megaphone className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <p className="mt-4 font-bold">새 공구가 열리면 알려드릴게요</p>
            <p className="text-xs text-muted-foreground mt-1">평균 첫 공구 수익 ₩12,400</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Urgent section */}
            {urgentCampaigns.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-700">마감 임박</span>
                </div>
                {urgentCampaigns.map((campaign) => renderCampaignCard(campaign))}
              </div>
            )}

            {/* All campaigns */}
            {recruitingCampaigns
              .filter((c) => !urgentCampaigns.some((u) => u.id === c.id))
              .map((campaign) => renderCampaignCard(campaign))}
          </div>
        )
      ) : activeTab === 'active' ? (
        activeCampaigns.length === 0 ? (
          <div className="text-center py-16">
            <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mx-auto">
              <Megaphone className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <p className="mt-4 font-bold">참여 중인 공구가 없어요</p>
            <p className="text-xs text-muted-foreground mt-1">공구에 참여하면 내 샵에서 바로 판매할 수 있어요</p>
            <Button variant="outline" className="mt-3 rounded-xl" onClick={() => setActiveTab('available')}>
              참여 가능 캠페인 보기
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {activeCampaigns.map((p) => {
              const campaign = p.campaign;
              if (!campaign) return null;
              const dDay = getDDay(campaign.endAt);
              const earnings = getEstimatedEarnings(campaign);
              const primaryProduct = campaign.products?.[0];
              const product = primaryProduct?.product;
              const productName = product?.nameKo || product?.name || null;
              const productImage = product?.thumbnailUrl || product?.imageUrl || product?.images?.[0] || null;
              const campaignPrice = primaryProduct ? Number(primaryProduct.campaignPrice) : 0;
              const soldCount = campaign.soldCount ?? 0;
              const totalStock = campaign.totalStock ?? 0;
              const progressPercent = totalStock > 0 ? Math.min(Math.round((soldCount / totalStock) * 100), 100) : 0;

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer hover:border-gray-300 transition-colors"
                  onClick={() => router.push(`/${locale}/creator/campaigns/${campaign.id}`)}
                >
                  <div className="p-4 flex gap-3">
                    <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                      {productImage ? (
                        <img src={productImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[campaign.status] || 'bg-gray-100 text-gray-600'}`}>
                          {STATUS_LABEL[campaign.status] || campaign.status}
                        </span>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${PARTICIPATION_BADGE[p.status] || 'bg-gray-100 text-gray-600'}`}>
                          {PARTICIPATION_STATUS_LABEL[p.status] || p.status}
                        </span>
                        {dDay && <span className="text-[10px] text-gray-400">{dDay}</span>}
                      </div>
                      {campaign.brand && (
                        <span className="text-[11px] text-gray-400 font-medium">{campaign.brand.brandName}</span>
                      )}
                      {productName && (
                        <p className="text-sm font-semibold text-gray-900 line-clamp-1">{productName}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5 text-xs">
                        {earnings > 0 && (
                          <span className="text-emerald-600 font-semibold">내 수익 ₩{earnings.toLocaleString()}</span>
                        )}
                        {campaignPrice > 0 && (
                          <span className="text-gray-900 font-semibold">₩{campaignPrice.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {totalStock > 0 && (
                    <div className="px-4 pb-3">
                      <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
                        <span>{soldCount}개 판매</span>
                        <span>{totalStock}개 목표</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-foreground rounded-full transition-all"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : (
        endedCampaigns.length === 0 ? (
          <div className="text-center py-16">
            <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mx-auto">
              <Megaphone className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <p className="mt-4 font-bold">종료된 공구가 없어요</p>
          </div>
        ) : (
          <div className="space-y-3">
            {endedCampaigns.map((p) => {
              const campaign = p.campaign;
              if (!campaign) return null;
              const earnings = getEstimatedEarnings(campaign);
              const primaryProduct = campaign.products?.[0];
              const product = primaryProduct?.product;
              const productName = product?.nameKo || product?.name || null;
              const productImage = product?.thumbnailUrl || product?.imageUrl || product?.images?.[0] || null;

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer hover:border-gray-300 transition-colors"
                  onClick={() => router.push(`/${locale}/creator/campaigns/${campaign.id}`)}
                >
                  <div className="p-4 flex gap-3">
                    <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden shrink-0 opacity-60">
                      {productImage ? (
                        <img src={productImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[campaign.status] || 'bg-gray-100 text-gray-600'}`}>
                          {STATUS_LABEL[campaign.status] || campaign.status}
                        </span>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${PARTICIPATION_BADGE[p.status] || 'bg-gray-100 text-gray-600'}`}>
                          {PARTICIPATION_STATUS_LABEL[p.status] || p.status}
                        </span>
                      </div>
                      {campaign.brand && (
                        <span className="text-[11px] text-gray-400 font-medium">{campaign.brand.brandName}</span>
                      )}
                      {productName && (
                        <p className="text-sm font-medium text-gray-500 line-clamp-1">{productName}</p>
                      )}
                      {earnings > 0 && (
                        <span className="text-xs text-gray-400 mt-1">
                          수익 ₩{earnings.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
