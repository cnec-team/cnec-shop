'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
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
  Megaphone,
  Users,
  Loader2,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/i18n/config';
import { BrandBadge } from '@/components/common/BrandBadge';
import {
  getCreatorSession,
  getAvailableCampaigns,
  getMyParticipations,
  applyCampaignParticipation,
  addCampaignShopItems,
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
  products?: Array<{ id: string; campaignId: string; productId: string; campaignPrice: number }>;
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
  const locale = params.locale as string;
  const [creator, setCreator] = useState<{ id: string } | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignWithDetails[]>([]);
  const [myParticipations, setMyParticipations] = useState<MyParticipation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'recruiting' | 'my'>('recruiting');

  // Apply dialog
  const [applyOpen, setApplyOpen] = useState(false);
  const [applyingCampaign, setApplyingCampaign] = useState<CampaignWithDetails | null>(null);
  const [applyMessage, setApplyMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      const creatorData = await getCreatorSession();
      if (creatorData && !cancelled) setCreator(creatorData as any);

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
    const end = new Date(endAt);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return '종료';
    if (diff === 0) return 'D-Day';
    return `D-${diff}`;
  };

  const getEstimatedEarnings = (campaign: CampaignWithDetails) => {
    const avgPrice = (campaign.products ?? []).reduce((sum, p) => sum + Number(p.campaignPrice), 0) / Math.max((campaign.products ?? []).length, 1);
    return Math.round(avgPrice * Number(campaign.commissionRate));
  };

  const handleApplyApproval = (campaign: CampaignWithDetails) => {
    setApplyingCampaign(campaign);
    setApplyMessage('');
    setApplyOpen(true);
  };

  const handleSubmitApply = async () => {
    if (!creator || !applyingCampaign) return;
    setSubmitting(true);
    try {
      await applyCampaignParticipation({
        campaignId: applyingCampaign.id,
        status: 'PENDING',
        message: applyMessage.trim() || undefined,
      });
      toast.success('공구 참여 신청이 완료되었습니다. 내 샵에 자동 추가됩니다');
      setApplyOpen(false);
    } catch (error: any) {
      if (error?.message?.includes('Unique')) toast.error('이미 공구 참여한 캠페인입니다');
      else toast.error('참여에 실패했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinOpen = async (campaign: CampaignWithDetails) => {
    if (!creator) return;
    setSubmitting(true);
    try {
      await applyCampaignParticipation({ campaignId: campaign.id, status: 'APPROVED' });
      const productIds = (campaign.products ?? []).map((cp) => cp.productId);
      if (productIds.length > 0) await addCampaignShopItems(campaign.id, productIds);
      toast.success('공구 참여가 완료되었습니다. 내 샵에 자동 추가됩니다');
    } catch (error: any) {
      if (error?.message?.includes('Unique')) toast.error('이미 참여 중인 캠페인입니다');
      else toast.error('참여에 실패했습니다');
    } finally {
      setSubmitting(false);
    }
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

              return (
                <div key={campaign.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col">
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

                  {/* Title */}
                  <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-1">{campaign.title}</h3>
                  {campaign.brand && (
                    <BrandBadge brandName={campaign.brand.brandName} />
                  )}

                  {/* Stats */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-xs">
                    {earnings > 0 && (
                      <span className="text-earnings font-semibold">
                        판매 수익 ₩{earnings.toLocaleString()}
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
                  <div className="mt-4">
                    {campaign.recruitmentType === 'APPROVAL' ? (
                      <Button
                        className="w-full h-10 bg-gray-900 text-white hover:bg-gray-800 rounded-xl text-sm"
                        onClick={() => handleApplyApproval(campaign)}
                        disabled={submitting}
                      >
                        참여하기
                      </Button>
                    ) : (
                      <Button
                        className="w-full h-10 bg-gray-900 text-white hover:bg-gray-800 rounded-xl text-sm"
                        onClick={() => handleJoinOpen(campaign)}
                        disabled={submitting}
                      >
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : '바로 참여'}
                      </Button>
                    )}
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
                <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
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
                    판매 수익 ₩{getEstimatedEarnings(campaign).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Apply Dialog */}
      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>공구 참여</DialogTitle>
            <DialogDescription>{applyingCampaign?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>참여 메시지 (선택)</Label>
              <Textarea
                placeholder="브랜드에 전달할 메시지를 입력하세요"
                value={applyMessage}
                onChange={(e) => setApplyMessage(e.target.value)}
                rows={4}
              />
            </div>
            {applyingCampaign?.conditions && (
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs font-medium text-gray-500 mb-1">참여 조건</p>
                <p className="text-sm text-gray-700">{applyingCampaign.conditions}</p>
              </div>
            )}
          </div>
          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" onClick={() => setApplyOpen(false)} className="flex-1 rounded-xl h-12">
              취소
            </Button>
            <Button onClick={handleSubmitApply} disabled={submitting} className="flex-1 bg-gray-900 text-white hover:bg-gray-800 rounded-xl h-12">
              {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />참여 중...</> : '공구 참여하기'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
