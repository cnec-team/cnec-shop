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
  brand?: { id: string; brandName: string; companyName: string } | null;
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

export default function CreatorCampaignsPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const [campaigns, setCampaigns] = useState<CampaignWithDetails[]>([]);
  const [myParticipations, setMyParticipations] = useState<MyParticipation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'recruiting' | 'my'>('recruiting');

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

  // Only RECRUITING status for the recruiting tab
  const recruitingCampaigns = useMemo(
    () => campaigns.filter((c) => c.status === 'RECRUITING'),
    [campaigns]
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

  return (
    <div className="space-y-4 max-w-3xl">
      {/* Header */}
      <div className="hidden md:block">
        <h1 className="text-xl font-bold text-gray-900">캠페인</h1>
        <p className="text-sm text-gray-400 mt-0.5">진행 중인 캠페인에 참여하세요</p>
      </div>

      {/* Tab Switcher */}
      <div className="flex rounded-xl bg-gray-100 p-1 gap-1">
        <button
          onClick={() => setActiveTab('recruiting')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'recruiting' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
          }`}
        >
          모집중
          {recruitingCampaigns.length > 0 && (
            <span className="ml-1.5 bg-blue-50 text-blue-700 text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
              {recruitingCampaigns.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('my')}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'my' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
          }`}
        >
          내 캠페인
        </button>
      </div>

      {activeTab === 'recruiting' ? (
        recruitingCampaigns.length === 0 ? (
          <div className="text-center py-16">
            <Megaphone className="mx-auto h-12 w-12 text-gray-200" />
            <p className="mt-4 text-gray-400">참여 가능한 캠페인이 없습니다</p>
            <p className="text-xs text-gray-300 mt-1">새로운 캠페인이 열리면 알려드릴게요</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {recruitingCampaigns.map((campaign) => {
              const dDay = getDDay(campaign.endAt);
              const earnings = getEstimatedEarnings(campaign);

              const primaryProduct = campaign.products?.[0]?.product;
              const productName = primaryProduct?.nameKo || primaryProduct?.name || null;
              const productImage = primaryProduct?.thumbnailUrl || primaryProduct?.imageUrl || primaryProduct?.images?.[0] || null;

              return (
                <div
                  key={campaign.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col cursor-pointer hover:border-gray-300 transition-colors"
                  onClick={() => router.push(`/${locale}/creator/campaigns/${campaign.id}`)}
                >
                  {/* Top row */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[campaign.status] || ''}`}>
                      {STATUS_LABEL[campaign.status] || campaign.status}
                    </span>
                    {dDay && (
                      <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" /> {dDay}
                      </span>
                    )}
                  </div>

                  {/* Product thumbnail + name */}
                  {productName && (
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                        {productImage ? (
                          <img src={productImage} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-4 h-4 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2 leading-tight">{productName}</p>
                    </div>
                  )}

                  {/* Title */}
                  <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-1">{campaign.title}</h3>
                  {campaign.brand && (
                    <BrandBadge brandName={campaign.brand.brandName} />
                  )}

                  {/* Stats */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-xs">
                    {earnings > 0 && (
                      <span className="text-earnings font-semibold">
                        1개 팔면 ₩{earnings.toLocaleString()}
                      </span>
                    )}
                    {Number(campaign.commissionRate) > 0 && (
                      <span className="text-gray-500">
                        커미션 {Math.round(Number(campaign.commissionRate) * 100)}%
                      </span>
                    )}
                    {campaign.endAt && (
                      <span className="text-gray-400 flex items-center gap-0.5">
                        <Clock className="h-3 w-3" />
                        {new Date(campaign.endAt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })}까지
                      </span>
                    )}
                    <span className="text-gray-400 flex items-center gap-0.5 ml-auto">
                      <Users className="h-3 w-3" />
                      {campaign.participantCount ?? 0}{campaign.targetParticipants ? `/${campaign.targetParticipants}` : ''}명
                    </span>
                  </div>

                  {/* Action */}
                  <div className="mt-4" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      className="w-full h-10 rounded-xl text-sm border-gray-200 hover:bg-gray-50 flex items-center justify-center gap-1"
                      onClick={() => router.push(`/${locale}/creator/campaigns/${campaign.id}`)}
                    >
                      자세히 보기
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* My Campaigns Tab — inline list */
        myParticipations.length === 0 ? (
          <div className="text-center py-16">
            <Megaphone className="mx-auto h-12 w-12 text-gray-200" />
            <p className="mt-4 text-gray-400">참여한 캠페인이 없습니다</p>
            <Button
              variant="outline"
              className="mt-3 rounded-xl"
              onClick={() => setActiveTab('recruiting')}
            >
              캠페인 둘러보기
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {myParticipations.map((p) => {
              const campaign = p.campaign;
              if (!campaign) return null;
              const dDay = getDDay(campaign.endAt);

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 cursor-pointer hover:border-gray-300 transition-colors"
                  onClick={() => router.push(`/${locale}/creator/campaigns/${campaign.id}`)}
                >
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
                    <p className="text-sm font-medium text-gray-900 truncate">{campaign.title}</p>
                    {campaign.brand && <BrandBadge brandName={campaign.brand.brandName} />}
                  </div>
                  <span className="text-xs text-earnings font-semibold whitespace-nowrap">
                    팔면 ₩{getEstimatedEarnings(campaign).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        )
      )}

    </div>
  );
}
