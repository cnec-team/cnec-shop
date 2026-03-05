'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/auth';
import type {
  Campaign,
  CampaignParticipation,
  Creator,
} from '@/types/database';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface CreatorParticipation {
  creator: Creator;
  campaigns: {
    campaign: Campaign;
    status: string;
    applied_at: string;
  }[];
  totalOrders: number;
  totalSales: number;
}

function formatCurrency(num: number): string {
  return `${num.toLocaleString('ko-KR')}원`;
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}

export default function BrandCreatorsPage() {
  const { brand, isLoading: authLoading } = useAuthStore();
  const [creatorData, setCreatorData] = useState<CreatorParticipation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!brand?.id) {
      if (!authLoading) setIsLoading(false);
      return;
    }

    async function fetchCreatorData() {
      const supabase = getClient();
      const brandId = brand!.id;

      try {
        // 1. Get brand campaigns
        const { data: campaigns } = await supabase
          .from('campaigns')
          .select('id, title, type, status')
          .eq('brand_id', brandId);

        const campaignIds = (campaigns ?? []).map((c) => c.id);
        const campaignMap = new Map(
          (campaigns ?? []).map((c) => [c.id, c as Campaign])
        );

        if (campaignIds.length === 0) {
          setIsLoading(false);
          return;
        }

        // 2. Get participations
        const { data: participations } = await supabase
          .from('campaign_participations')
          .select('*, creator:creators(*)')
          .in('campaign_id', campaignIds);

        // Count pending
        const pending = (participations ?? []).filter(
          (p) => p.status === 'PENDING'
        );
        setPendingCount(pending.length);

        // 3. Get orders per creator
        const { data: orders } = await supabase
          .from('orders')
          .select('creator_id, total_amount, status')
          .eq('brand_id', brandId)
          .neq('status', 'CANCELLED');

        const ordersByCreator = new Map<
          string,
          { count: number; total: number }
        >();
        for (const order of orders ?? []) {
          if (!order.creator_id) continue;
          const existing = ordersByCreator.get(order.creator_id) ?? {
            count: 0,
            total: 0,
          };
          existing.count += 1;
          existing.total += order.total_amount || 0;
          ordersByCreator.set(order.creator_id, existing);
        }

        // 4. Group by creator
        const creatorMap = new Map<string, CreatorParticipation>();
        for (const p of participations ?? []) {
          if (!p.creator) continue;
          const creator = p.creator as Creator;
          const existing = creatorMap.get(creator.id);
          const campaignData = campaignMap.get(p.campaign_id);

          const campaignEntry = {
            campaign: campaignData as Campaign,
            status: p.status,
            applied_at: p.applied_at,
          };

          if (existing) {
            existing.campaigns.push(campaignEntry);
          } else {
            const orderData = ordersByCreator.get(creator.id) ?? {
              count: 0,
              total: 0,
            };
            creatorMap.set(creator.id, {
              creator,
              campaigns: [campaignEntry],
              totalOrders: orderData.count,
              totalSales: orderData.total,
            });
          }
        }

        setCreatorData(
          Array.from(creatorMap.values()).sort(
            (a, b) => b.totalSales - a.totalSales
          )
        );
      } catch (error) {
        console.error('Failed to fetch creator data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCreatorData();
  }, [brand?.id, authLoading]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">크리에이터 관리</h1>
          <p className="text-sm text-muted-foreground">
            캠페인에 참여 중인 크리에이터를 관리합니다.
          </p>
        </div>
        {pendingCount > 0 && (
          <Link href="creators/pending">
            <Button variant="outline">
              승인 대기{' '}
              <Badge variant="destructive" className="ml-2">
                {pendingCount}
              </Badge>
            </Button>
          </Link>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">전체 크리에이터</p>
            <p className="text-2xl font-bold">{creatorData.length}명</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">승인 대기</p>
            <p className="text-2xl font-bold">{pendingCount}명</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">총 크리에이터 매출</p>
            <p className="text-2xl font-bold">
              {formatCurrency(
                creatorData.reduce((sum, c) => sum + c.totalSales, 0)
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Creator list */}
      <Card>
        <CardHeader>
          <CardTitle>참여 크리에이터</CardTitle>
          <CardDescription>
            캠페인에 참여(승인됨/대기 중) 크리에이터 목록입니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton />
          ) : creatorData.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">
                아직 참여 크리에이터가 없습니다.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>크리에이터</TableHead>
                  <TableHead>SNS</TableHead>
                  <TableHead>참여 캠페인</TableHead>
                  <TableHead className="text-right">주문수</TableHead>
                  <TableHead className="text-right">매출</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {creatorData.map((data) => (
                  <TableRow key={data.creator.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {data.creator.display_name.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {data.creator.display_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            @{data.creator.shop_id}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {data.creator.instagram_handle && (
                          <Badge variant="outline" className="text-xs">
                            IG @{data.creator.instagram_handle}
                          </Badge>
                        )}
                        {data.creator.youtube_handle && (
                          <Badge variant="outline" className="text-xs">
                            YT @{data.creator.youtube_handle}
                          </Badge>
                        )}
                        {data.creator.tiktok_handle && (
                          <Badge variant="outline" className="text-xs">
                            TT @{data.creator.tiktok_handle}
                          </Badge>
                        )}
                        {!data.creator.instagram_handle &&
                          !data.creator.youtube_handle &&
                          !data.creator.tiktok_handle && (
                            <span className="text-xs text-muted-foreground">
                              -
                            </span>
                          )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {data.campaigns.slice(0, 2).map((cp, index) => (
                          <Badge
                            key={index}
                            variant={
                              cp.status === 'APPROVED'
                                ? 'default'
                                : cp.status === 'PENDING'
                                  ? 'secondary'
                                  : 'destructive'
                            }
                            className="text-xs"
                          >
                            {cp.campaign?.title?.slice(0, 15) ?? '캠페인'}
                          </Badge>
                        ))}
                        {data.campaigns.length > 2 && (
                          <span className="text-xs text-muted-foreground">
                            +{data.campaigns.length - 2}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {data.totalOrders.toLocaleString('ko-KR')}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(data.totalSales)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
