'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  const [statusFilter, setStatusFilter] = useState<string>('all');

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

  const filteredCampaigns = useMemo(() => {
    if (statusFilter === 'all') return campaigns;
    return campaigns.filter((c) => c.status === statusFilter);
  }, [campaigns, statusFilter]);

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
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">캠페인 둘러보기</h1>
          <p className="text-sm text-muted-foreground">
            진행 중인 공구/상시 캠페인에 참여하세요
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/${locale}/creator/campaigns/my`}>
            내 캠페인
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </div>

      {/* Filter */}
      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="상태 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="RECRUITING">모집중</SelectItem>
            <SelectItem value="ACTIVE">진행중</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Campaign Grid */}
      {filteredCampaigns.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Megaphone className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">참여 가능한 캠페인이 없습니다</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCampaigns.map((campaign) => {
            const dDay = getDDay(campaign.endAt);

            return (
              <Card key={campaign.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getStatusBadgeVariant(campaign.status)}>
                          {CAMPAIGN_STATUS_LABELS[campaign.status as keyof typeof CAMPAIGN_STATUS_LABELS]}
                        </Badge>
                        <Badge variant="outline">
                          {campaign.type === 'GONGGU' ? '공구' : '상시'}
                        </Badge>
                      </div>
                      <CardTitle className="text-base line-clamp-2">
                        {campaign.title}
                      </CardTitle>
                    </div>
                    {dDay && (
                      <Badge
                        variant="secondary"
                        className={
                          dDay === '종료'
                            ? 'bg-gray-100 text-gray-600'
                            : dDay === 'D-Day'
                            ? 'bg-red-100 text-red-600'
                            : 'bg-orange-100 text-orange-600'
                        }
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        {dDay}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  {/* Campaign info */}
                  <div className="space-y-2 text-sm flex-1">
                    {campaign.brand && (
                      <p className="text-muted-foreground">
                        {campaign.brand.brandName}
                      </p>
                    )}
                    {campaign.description && (
                      <p className="text-muted-foreground line-clamp-2">
                        {campaign.description}
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {campaign.startAt
                            ? new Date(campaign.startAt).toLocaleDateString('ko-KR')
                            : '-'}{' '}
                          ~{' '}
                          {campaign.endAt
                            ? new Date(campaign.endAt).toLocaleDateString('ko-KR')
                            : '-'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Percent className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs">
                          내 수익 {(campaign.commissionRate * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs">
                          {campaign.participantCount ?? 0}
                          {campaign.targetParticipants
                            ? ` / ${campaign.targetParticipants}명`
                            : '명 참여'}
                        </span>
                      </div>
                      {campaign.totalStock && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground">
                            판매 {campaign.soldCount} / {campaign.totalStock}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-4">
                    {campaign.recruitmentType === 'APPROVAL' ? (
                      <Button
                        className="w-full"
                        onClick={() => handleApplyApproval(campaign)}
                        disabled={submitting}
                      >
                        {submitting ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Megaphone className="h-4 w-4 mr-1" />
                        )}
                        참여 신청
                      </Button>
                    ) : (
                      <Button
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white"
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

      {/* Apply Dialog (for APPROVAL type campaigns) */}
      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSubmitApply} disabled={submitting}>
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
