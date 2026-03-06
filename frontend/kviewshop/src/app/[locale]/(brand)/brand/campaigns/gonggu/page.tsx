'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/auth';
import type { Campaign, CampaignProduct, Product } from '@/types/database';
import { CAMPAIGN_STATUS_LABELS } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

function formatCurrency(num: number): string {
  return `${num.toLocaleString('ko-KR')}원`;
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

function getStatusVariant(
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'ACTIVE':
      return 'default';
    case 'RECRUITING':
      return 'secondary';
    case 'ENDED':
      return 'destructive';
    default:
      return 'outline';
  }
}

interface GongguCampaign extends Campaign {
  campaign_products?: (CampaignProduct & { product?: Product })[];
}

function CampaignCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-4 w-40" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function GongguCampaignsPage() {
  const { brand, isLoading: authLoading } = useAuthStore();
  const [campaigns, setCampaigns] = useState<GongguCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!brand?.id) {
      if (!authLoading) setIsLoading(false);
      return;
    }

    async function fetchCampaigns() {
      const supabase = getClient();
      const { data, error } = await supabase
        .from('campaigns')
        .select(
          '*, campaign_products:campaign_products(*, product:products(*))'
        )
        .eq('brand_id', brand!.id)
        .eq('type', 'GONGGU')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch gonggu campaigns:', error);
      } else {
        setCampaigns((data ?? []) as GongguCampaign[]);
      }
      setIsLoading(false);
    }

    fetchCampaigns();
  }, [brand?.id, authLoading]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">공구 캠페인</h1>
          <p className="text-sm text-muted-foreground">
            기간 한정 공동구매 캠페인을 관리합니다.
          </p>
        </div>
        <Link href="../campaigns/new">
          <Button>새 캠페인 만들기</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <CampaignCardSkeleton key={i} />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">
              등록된 공구 캠페인이 없습니다.
            </p>
            <Link href="../campaigns/new" className="mt-4">
              <Button variant="outline">첫 공구 캠페인 만들기</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {campaigns.map((campaign) => {
            const progressPercent =
              campaign.total_stock && campaign.total_stock > 0
                ? (campaign.sold_count / campaign.total_stock) * 100
                : 0;

            return (
              <Card key={campaign.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">
                        {campaign.title}
                      </CardTitle>
                      <CardDescription>
                        {campaign.description
                          ? campaign.description.slice(0, 80) +
                            (campaign.description.length > 80 ? '...' : '')
                          : '설명 없음'}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusVariant(campaign.status)}>
                      {CAMPAIGN_STATUS_LABELS[campaign.status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>판매 진행률</span>
                      <span>
                        {campaign.sold_count.toLocaleString('ko-KR')} /{' '}
                        {(campaign.total_stock ?? 0).toLocaleString('ko-KR')}
                      </span>
                    </div>
                    <Progress value={progressPercent} />
                  </div>

                  {/* Date range */}
                  <div className="text-sm text-muted-foreground">
                    {campaign.start_at && (
                      <span>시작: {formatDate(campaign.start_at)}</span>
                    )}
                    {campaign.start_at && campaign.end_at && (
                      <span> ~ </span>
                    )}
                    {campaign.end_at && (
                      <span>종료: {formatDate(campaign.end_at)}</span>
                    )}
                  </div>

                  {/* Products */}
                  {campaign.campaign_products &&
                    campaign.campaign_products.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium">포함 상품</p>
                        {campaign.campaign_products.map((cp) => (
                          <div
                            key={cp.id}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="truncate">
                              {cp.product?.name ?? '상품'}
                            </span>
                            <span className="text-muted-foreground">
                              {formatCurrency(cp.campaign_price)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                  {/* Meta */}
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>수수료 {campaign.commission_rate}%</span>
                    <span>
                      모집 방식:{' '}
                      {campaign.recruitment_type === 'OPEN'
                        ? '자동 승인'
                        : '승인제'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
