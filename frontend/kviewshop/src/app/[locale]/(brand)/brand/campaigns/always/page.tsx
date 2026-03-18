'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getBrandCampaigns, getBrandSession, updateCampaignStatus } from '@/lib/actions/brand';
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
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

function formatCurrency(num: number): string {
  return `${num.toLocaleString('ko-KR')}원`;
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

interface AlwaysCampaign {
  id: string;
  title: string;
  description: string | null;
  status: string;
  recruitmentType: string;
  commissionRate: number | string;
  soldCount: number;
  createdAt: string;
  products: Array<{
    id: string;
    campaignPrice: number | string;
    product: { name: string | null } | null;
  }>;
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

export default function AlwaysCampaignsPage() {
  const [brand, setBrand] = useState<{ id: string } | null>(null);
  const [campaigns, setCampaigns] = useState<AlwaysCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function load() {
    try {
      const brandData = await getBrandSession();
      if (!brandData) {
        setIsLoading(false);
        return;
      }
      setBrand(brandData);

      const data = await getBrandCampaigns(brandData.id, 'ALWAYS');
      setCampaigns(data as any);
    } catch (error) {
      console.error('Failed to fetch always campaigns:', error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleStatusChange(campaignId: string, newStatus: string) {
    setUpdatingId(campaignId);
    try {
      await updateCampaignStatus(campaignId, newStatus);
      await load();
    } catch (error) {
      console.error('Failed to update campaign status:', error);
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">상시 캠페인</h1>
          <p className="text-sm text-muted-foreground">
            기간 제한 없이 상시 운영되는 캠페인을 관리합니다.
          </p>
        </div>
        <Link href="../campaigns/new">
          <Button>새 캠페인 만들기</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            상시 캠페인 목록{' '}
            <span className="text-sm font-normal text-muted-foreground">
              ({campaigns.length}개)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton />
          ) : campaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">
                등록된 상시 캠페인이 없습니다.
              </p>
              <Link href="../campaigns/new" className="mt-4">
                <Button variant="outline">첫 상시 캠페인 만들기</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>캠페인명</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>모집 방식</TableHead>
                  <TableHead className="text-right">수수료율</TableHead>
                  <TableHead className="text-right">판매수</TableHead>
                  <TableHead>포함 상품</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => {
                  const isUpdating = updatingId === campaign.id;
                  return (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">
                        <Link href={`../campaigns/${campaign.id}`} className="hover:underline">
                          <div>
                            <p>{campaign.title}</p>
                            {campaign.description && (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {campaign.description}
                              </p>
                            )}
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(campaign.status)}>
                          {CAMPAIGN_STATUS_LABELS[campaign.status as keyof typeof CAMPAIGN_STATUS_LABELS]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {campaign.recruitmentType === 'OPEN'
                            ? '자동 승인'
                            : '승인제'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {Number(campaign.commissionRate) * 100}%
                      </TableCell>
                      <TableCell className="text-right">
                        {campaign.soldCount.toLocaleString('ko-KR')}
                      </TableCell>
                      <TableCell>
                        {campaign.products &&
                        campaign.products.length > 0 ? (
                          <div className="space-y-0.5">
                            {campaign.products
                              .slice(0, 2)
                              .map((cp) => (
                                <p
                                  key={cp.id}
                                  className="text-sm truncate max-w-[160px]"
                                >
                                  {cp.product?.name ?? '상품'}{' '}
                                  <span className="text-muted-foreground">
                                    ({formatCurrency(Number(cp.campaignPrice))})
                                  </span>
                                </p>
                              ))}
                            {campaign.products.length > 2 && (
                              <p className="text-xs text-muted-foreground">
                                +{campaign.products.length - 2}개 더
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            -
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {campaign.status === 'DRAFT' && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                disabled={isUpdating}
                                onClick={() => handleStatusChange(campaign.id, 'RECRUITING')}
                              >
                                모집 시작
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={isUpdating}
                                onClick={() => handleStatusChange(campaign.id, 'ENDED')}
                              >
                                취소
                              </Button>
                            </>
                          )}
                          {campaign.status === 'RECRUITING' && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                disabled={isUpdating}
                                onClick={() => handleStatusChange(campaign.id, 'ACTIVE')}
                              >
                                시작
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={isUpdating}
                                onClick={() => handleStatusChange(campaign.id, 'ENDED')}
                              >
                                취소
                              </Button>
                            </>
                          )}
                          {campaign.status === 'ACTIVE' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={isUpdating}
                              onClick={() => handleStatusChange(campaign.id, 'ENDED')}
                            >
                              종료
                            </Button>
                          )}
                          {campaign.status === 'ENDED' && (
                            <span className="text-xs text-muted-foreground">종료됨</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
