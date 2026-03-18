'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
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
  Calendar,
  Users,
  Percent,
  Loader2,
  ArrowRight,
  Clock,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getCreatorSession,
  getAvailableCampaigns,
  applyCampaignParticipation,
  addCampaignShopItems,
} from '@/lib/actions/creator';
import { CAMPAIGN_STATUS_LABELS } from '@/types/database';

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

export default function CreatorCampaignsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const [creator, setCreator] = useState<{ id: string } | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignWithDetails[]>([]);
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
        const data = await getAvailableCampaigns();
        if (!cancelled) {
          setCampaigns(data as unknown as CampaignWithDetails[]);
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

  const recruitingCampaigns = useMemo(
    () => campaigns.filter((c) => c.status === 'RECRUITING' || c.status === 'ACTIVE'),
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

  const getStatusBadgeVariant = (status: CampaignStatus) => {
    switch (status) {
      case 'RECRUITING':
        return 'bg-green-500/10 text-green-600 border-green-500/30';
      case 'ACTIVE':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/30';
      case 'ENDED':
        return 'bg-gray-500/10 text-gray-600 border-gray-500/30';
      default:
        return '';
    }
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
      toast.success('참여 신청이 완료되었습니다');
      setApplyOpen(false);
    } catch (error: any) {
      if (error?.message?.includes('Unique')) {
        toast.error('이미 참여 신청한 캠페인입니다');
      } else {
        toast.error('신청에 실패했습니다');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinOpen = async (campaign: CampaignWithDetails) => {
    if (!creator) return;
    setSubmitting(true);

    try {
      await applyCampaignParticipation({
        campaignId: campaign.id,
        status: 'APPROVED',
      });

      const productIds = (campaign.products ?? []).map((cp) => cp.productId);
      if (productIds.length > 0) {
        await addCampaignShopItems(campaign.id, productIds);
      }

      toast.success('캠페인 참여가 완료되었습니다');
    } catch (error: any) {
      if (error?.message?.includes('Unique')) {
        toast.error('이미 참여 중인 캠페인입니다');
      } else {
        toast.error('참여에 실패했습니다');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full rounded-lg" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">캠페인</h1>
          <p className="text-sm text-muted-foreground">
            진행 중인 공구/상시 캠페인에 참여하세요
          </p>
        </div>
      </div>

      {/* Mobile Tab Switcher */}
      <div className="flex rounded-lg bg-muted p-1 gap-1">
        <button
          onClick={() => setActiveTab('recruiting')}
          className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'recruiting'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground'
          }`}
        >
          공구 모집중
          {recruitingCampaigns.length > 0 && (
            <Badge className="ml-1.5 bg-primary text-white text-[10px] px-1.5 py-0">
              {recruitingCampaigns.length}
            </Badge>
          )}
        </button>
        <button
          onClick={() => setActiveTab('my')}
          className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'my'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground'
          }`}
        >
          내 캠페인
        </button>
      </div>

      {activeTab === 'recruiting' ? (
        <>
          {/* Campaign Grid */}
          {recruitingCampaigns.length === 0 ? (
            <div className="text-center py-16">
              <Megaphone className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">참여 가능한 캠페인이 없습니다</p>
              <p className="text-xs text-muted-foreground mt-1">새로운 캠페인이 열리면 알려드릴게요</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {recruitingCampaigns.map((campaign) => {
                const dDay = getDDay(campaign.endAt);

                return (
                  <Card key={campaign.id} className="flex flex-col overflow-hidden">
                    <CardContent className="p-3 sm:p-4 flex-1 flex flex-col">
                      {/* Top: Status + D-Day */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <Badge className={`text-[10px] ${getStatusBadgeVariant(campaign.status)}`}>
                            {CAMPAIGN_STATUS_LABELS[campaign.status as keyof typeof CAMPAIGN_STATUS_LABELS]}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            {campaign.type === 'GONGGU' ? '공구' : '상시'}
                          </Badge>
                        </div>
                        {dDay && (
                          <Badge
                            variant="secondary"
                            className={`text-[10px] ${
                              dDay === '종료'
                                ? 'bg-gray-100 text-gray-600'
                                : dDay === 'D-Day'
                                ? 'bg-red-100 text-red-600'
                                : 'bg-orange-100 text-orange-600'
                            }`}
                          >
                            <Clock className="h-2.5 w-2.5 mr-0.5" />
                            {dDay}
                          </Badge>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="font-semibold text-sm sm:text-base line-clamp-2 mb-1">
                        {campaign.title}
                      </h3>

                      {/* Brand & Info */}
                      <div className="flex-1 space-y-1.5 text-xs text-muted-foreground">
                        {campaign.brand && (
                          <p className="font-medium text-foreground/80">{campaign.brand.brandName}</p>
                        )}
                        {campaign.description && (
                          <p className="line-clamp-2">{campaign.description}</p>
                        )}
                      </div>

                      {/* Stats Row */}
                      <div className="flex items-center gap-3 mt-3 text-xs">
                        <div className="flex items-center gap-1">
                          <Percent className="h-3 w-3 text-primary" />
                          <span className="font-semibold text-primary">
                            내 수익 {(campaign.commissionRate * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span>
                            {campaign.participantCount ?? 0}
                            {campaign.targetParticipants ? `/${campaign.targetParticipants}` : ''}명
                          </span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="mt-3">
                        {campaign.recruitmentType === 'APPROVAL' ? (
                          <Button
                            className="w-full h-10"
                            onClick={() => handleApplyApproval(campaign)}
                            disabled={submitting}
                          >
                            {submitting ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <Megaphone className="h-4 w-4 mr-1" />
                            )}
                            참여하기
                          </Button>
                        ) : (
                          <Button
                            className="w-full h-10 bg-orange-500 hover:bg-orange-600 text-white"
                            onClick={() => handleJoinOpen(campaign)}
                            disabled={submitting}
                          >
                            {submitting ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <ArrowRight className="h-4 w-4 mr-1" />
                            )}
                            바로 참여
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* My Campaigns Tab */
        <div className="text-center py-16">
          <Link href={`/${locale}/creator/campaigns/my`}>
            <Button variant="outline" size="lg">
              내 캠페인 보기
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      )}

      {/* Apply Dialog */}
      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>캠페인 참여 신청</DialogTitle>
            <DialogDescription>
              {applyingCampaign?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>참여 신청 메시지 (선택)</Label>
              <Textarea
                placeholder="브랜드에 전달할 메시지를 입력하세요"
                value={applyMessage}
                onChange={(e) => setApplyMessage(e.target.value)}
                rows={4}
              />
            </div>
            {applyingCampaign?.conditions && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs font-medium text-muted-foreground mb-1">참여 조건</p>
                <p className="text-sm">{applyingCampaign.conditions}</p>
              </div>
            )}
          </div>
          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" onClick={() => setApplyOpen(false)} className="flex-1">
              취소
            </Button>
            <Button onClick={handleSubmitApply} disabled={submitting} className="flex-1">
              {submitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />신청 중...</>
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
