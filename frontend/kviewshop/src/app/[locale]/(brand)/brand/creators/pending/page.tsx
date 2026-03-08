'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrandSession, getPendingParticipations, handleParticipationAction } from '@/lib/actions/brand';
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
  participation: {
    id: string;
    campaignId: string;
    creatorId: string;
    status: string;
    message: string | null;
    appliedAt: string;
    approvedAt: string | null;
  };
  creator: {
    id: string;
    shopId: string | null;
    displayName: string | null;
    bio: string | null;
    profileImageUrl: string | null;
    instagramHandle?: string | null;
    youtubeHandle?: string | null;
    tiktokHandle?: string | null;
    totalSales: number | null;
    totalEarnings: number | null;
  } | null;
  campaign: {
    id: string;
    title: string;
    type: string;
    status: string;
    commissionRate: number | null;
    recruitmentType: string | null;
  } | null;
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
  const [brand, setBrand] = useState<{ id: string } | null>(null);
  const [pendingList, setPendingList] = useState<PendingParticipation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const brandData = await getBrandSession();
      if (brandData) setBrand(brandData);
      else setIsLoading(false);
    }
    init();
  }, []);

  useEffect(() => {
    if (!brand?.id) return;

    async function fetchPending() {
      try {
        const result = await getPendingParticipations(brand!.id);
        setPendingList(result as PendingParticipation[]);
      } catch (error) {
        console.error('Failed to fetch pending list:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPending();
  }, [brand?.id]);

  async function handleAction(
    participationId: string,
    action: 'APPROVED' | 'REJECTED'
  ) {
    setProcessingId(participationId);
    try {
      await handleParticipationAction(participationId, action);
      setPendingList(
        pendingList.filter((p) => p.participation.id !== participationId)
      );
    } catch (error) {
      console.error('Failed to process participation:', error);
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
                      {(item.creator?.displayName ?? '').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">
                      {item.creator?.displayName}
                    </CardTitle>
                    <CardDescription>
                      @{item.creator?.shopId}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Creator info */}
                <div className="flex flex-wrap gap-1">
                  {(item.creator as any)?.instagramHandle && (
                    <Badge variant="outline" className="text-xs">
                      IG @{(item.creator as any).instagramHandle}
                    </Badge>
                  )}
                  {(item.creator as any)?.youtubeHandle && (
                    <Badge variant="outline" className="text-xs">
                      YT @{(item.creator as any).youtubeHandle}
                    </Badge>
                  )}
                  {(item.creator as any)?.tiktokHandle && (
                    <Badge variant="outline" className="text-xs">
                      TT @{(item.creator as any).tiktokHandle}
                    </Badge>
                  )}
                </div>

                {item.creator?.bio && (
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
                    {item.campaign?.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">유형:</span>{' '}
                    {item.campaign?.type === 'GONGGU' ? '공구' : '상시'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">신청일:</span>{' '}
                    {formatDate(item.participation.appliedAt)}
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
                      {(Number(item.creator?.totalSales) ?? 0).toLocaleString('ko-KR')}원
                    </p>
                  </div>
                  <div className="rounded-md bg-muted/50 p-2 text-center">
                    <p className="text-xs text-muted-foreground">총 수익</p>
                    <p className="font-medium">
                      {(Number(item.creator?.totalEarnings) ?? 0).toLocaleString('ko-KR')}원
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
