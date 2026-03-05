'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/auth';
import type {
  Campaign,
  CampaignParticipation,
  Creator,
} from '@/types/database';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';

interface PendingParticipation {
  participation: CampaignParticipation;
  creator: Creator;
  campaign: Campaign;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function CardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="mt-4 h-8 w-full" />
      </CardContent>
    </Card>
  );
}

export default function PendingCreatorsPage() {
  const router = useRouter();
  const { brand, isLoading: authLoading } = useAuthStore();
  const [pendingList, setPendingList] = useState<PendingParticipation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!brand?.id) {
      if (!authLoading) setIsLoading(false);
      return;
    }

    async function fetchPending() {
      const supabase = getClient();
      const brandId = brand!.id;

      try {
        // 1. Get brand campaign IDs
        const { data: campaigns } = await supabase
          .from('campaigns')
          .select('id, title, type, status, commission_rate, recruitment_type')
          .eq('brand_id', brandId);

        const campaignIds = (campaigns ?? []).map((c) => c.id);
        const campaignMap = new Map(
          (campaigns ?? []).map((c) => [c.id, c as Campaign])
        );

        if (campaignIds.length === 0) {
          setIsLoading(false);
          return;
        }

        // 2. Get pending participations with creator data
        const { data: participations } = await supabase
          .from('campaign_participations')
          .select('*, creator:creators(*)')
          .eq('status', 'PENDING')
          .in('campaign_id', campaignIds)
          .order('applied_at', { ascending: true });

        const result: PendingParticipation[] = [];
        for (const p of participations ?? []) {
          if (!p.creator) continue;
          const campaign = campaignMap.get(p.campaign_id);
          if (!campaign) continue;

          result.push({
            participation: p as CampaignParticipation,
            creator: p.creator as Creator,
            campaign,
          });
        }

        setPendingList(result);
      } catch (error) {
        console.error('Failed to fetch pending list:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPending();
  }, [brand?.id, authLoading]);

  async function handleAction(
    participationId: string,
    action: 'APPROVED' | 'REJECTED'
  ) {
    setProcessingId(participationId);
    const supabase = getClient();

    const updateData: Record<string, unknown> = { status: action };
    if (action === 'APPROVED') {
      updateData.approved_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('campaign_participations')
      .update(updateData)
      .eq('id', participationId);

    if (!error) {
      setPendingList(
        pendingList.filter((p) => p.participation.id !== participationId)
      );
    }
    setProcessingId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">승인 대기 크리에이터</h1>
          <p className="text-sm text-muted-foreground">
            캠페인 참여를 승인하거나 거절할 수 있습니다.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          뒤로
        </Button>
      </div>

      {/* Count */}
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">승인 대기</p>
          <p className="text-2xl font-bold">{pendingList.length}건</p>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : pendingList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">
              승인 대기 중인 크리에이터가 없습니다.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push('../creators')}
            >
              크리에이터 목록으로
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {pendingList.map((item) => (
            <Card key={item.participation.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {item.creator.display_name.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">
                      {item.creator.display_name}
                    </CardTitle>
                    <CardDescription>
                      @{item.creator.shop_id}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Creator info */}
                <div className="flex flex-wrap gap-1">
                  {item.creator.instagram_handle && (
                    <Badge variant="outline" className="text-xs">
                      IG @{item.creator.instagram_handle}
                    </Badge>
                  )}
                  {item.creator.youtube_handle && (
                    <Badge variant="outline" className="text-xs">
                      YT @{item.creator.youtube_handle}
                    </Badge>
                  )}
                  {item.creator.tiktok_handle && (
                    <Badge variant="outline" className="text-xs">
                      TT @{item.creator.tiktok_handle}
                    </Badge>
                  )}
                </div>

                {item.creator.bio && (
                  <p className="text-sm text-muted-foreground">
                    {item.creator.bio.slice(0, 120)}
                    {item.creator.bio.length > 120 ? '...' : ''}
                  </p>
                )}

                <Separator />

                {/* Campaign info */}
                <div className="space-y-1">
                  <p className="text-sm">
                    <span className="font-medium">신청 캠페인:</span>{' '}
                    {item.campaign.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">유형:</span>{' '}
                    {item.campaign.type === 'GONGGU' ? '공구' : '상시'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">신청일:</span>{' '}
                    {formatDate(item.participation.applied_at)}
                  </p>
                  {item.participation.message && (
                    <div className="mt-2 rounded-md bg-muted p-3">
                      <p className="text-xs font-medium text-muted-foreground">
                        신청 메시지
                      </p>
                      <p className="text-sm">{item.participation.message}</p>
                    </div>
                  )}
                </div>

                {/* Creator stats */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-md bg-muted/50 p-2 text-center">
                    <p className="text-xs text-muted-foreground">총 매출</p>
                    <p className="font-medium">
                      {(item.creator.total_sales ?? 0).toLocaleString('ko-KR')}원
                    </p>
                  </div>
                  <div className="rounded-md bg-muted/50 p-2 text-center">
                    <p className="text-xs text-muted-foreground">총 수익</p>
                    <p className="font-medium">
                      {(item.creator.total_earnings ?? 0).toLocaleString('ko-KR')}원
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Action buttons */}
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    disabled={processingId === item.participation.id}
                    onClick={() =>
                      handleAction(item.participation.id, 'APPROVED')
                    }
                  >
                    {processingId === item.participation.id
                      ? '처리 중...'
                      : '승인'}
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    disabled={processingId === item.participation.id}
                    onClick={() =>
                      handleAction(item.participation.id, 'REJECTED')
                    }
                  >
                    {processingId === item.participation.id
                      ? '처리 중...'
                      : '거절'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
