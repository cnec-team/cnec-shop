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
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Megaphone,
  Plus,
  Calendar,
  Users,
  ArrowRight,
} from 'lucide-react';

function formatCurrency(num: number): string {
  return `${num.toLocaleString('ko-KR')}원`;
}

function getStatusStyle(status: string): string {
  switch (status) {
    case 'DRAFT': return 'bg-gray-500/10 text-gray-600 border-gray-200';
    case 'RECRUITING': return 'bg-blue-500/10 text-blue-600 border-blue-200';
    case 'ACTIVE': return 'bg-green-500/10 text-green-600 border-green-200';
    case 'ENDED': return 'bg-red-500/10 text-red-600 border-red-200';
    default: return '';
  }
}

function getDday(endAt: string | null): string | null {
  if (!endAt) return null;
  const diff = Math.ceil((new Date(endAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return '종료됨';
  if (diff === 0) return 'D-DAY';
  return `D-${diff}`;
}

interface GongguCampaign {
  id: string;
  title: string;
  description: string | null;
  status: string;
  recruitmentType: string;
  commissionRate: number | string;
  soldCount: number;
  totalStock: number | null;
  startAt: string | null;
  endAt: string | null;
  createdAt: string;
  products: Array<{
    id: string;
    campaignPrice: number | string;
    product: { name: string | null } | null;
  }>;
}

export default function GongguCampaignsPage() {
  const [brand, setBrand] = useState<{ id: string } | null>(null);
  const [campaigns, setCampaigns] = useState<GongguCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function load() {
    try {
      const brandData = await getBrandSession();
      if (!brandData) { setIsLoading(false); return; }
      setBrand(brandData);
      const data = await getBrandCampaigns(brandData.id, 'GONGGU');
      setCampaigns(data as any);
    } catch (error) {
      console.error('Failed to fetch gonggu campaigns:', error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

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
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">공구 캠페인</h1>
          <p className="text-sm text-muted-foreground mt-1">기간 한정 공동구매 캠페인을 관리합니다</p>
        </div>
        <Link href="../campaigns/new">
          <Button size="sm" className="h-9">
            <Plus className="h-4 w-4 mr-1.5" />
            새 캠페인
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="bg-white rounded-xl">
              <CardContent className="p-5 space-y-3">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-2 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <Card className="bg-white rounded-xl border shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Megaphone className="h-16 w-16 text-muted-foreground/20 mb-4" />
            <p className="text-lg font-medium mb-1">공구 캠페인으로 크리에이터와 함께 판매해보세요</p>
            <p className="text-sm text-muted-foreground mb-6">
              기간 한정 공동구매로 매출을 극대화할 수 있어요
            </p>
            <Link href="../campaigns/new">
              <Button>
                <Plus className="h-4 w-4 mr-1.5" />
                캠페인 만들기
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {campaigns.map((campaign) => {
            const progressPercent = campaign.totalStock && campaign.totalStock > 0
              ? (campaign.soldCount / campaign.totalStock) * 100 : 0;
            const isUpdating = updatingId === campaign.id;
            const dday = getDday(campaign.endAt);

            return (
              <Card key={campaign.id} className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="p-5 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <Link href={`../campaigns/${campaign.id}`} className="hover:underline">
                        <h3 className="font-semibold truncate">{campaign.title}</h3>
                      </Link>
                      {campaign.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {campaign.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {dday && campaign.status === 'ACTIVE' && (
                        <Badge variant="outline" className="text-[10px] bg-orange-50 text-orange-600 border-orange-200">
                          {dday}
                        </Badge>
                      )}
                      <Badge variant="outline" className={getStatusStyle(campaign.status)}>
                        {CAMPAIGN_STATUS_LABELS[campaign.status as keyof typeof CAMPAIGN_STATUS_LABELS]}
                      </Badge>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">판매 진행률</span>
                      <span className="font-medium">
                        {campaign.soldCount.toLocaleString('ko-KR')} / {(campaign.totalStock ?? 0).toLocaleString('ko-KR')}
                      </span>
                    </div>
                    <Progress value={progressPercent} className="h-2" />
                  </div>

                  {/* Meta */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {campaign.startAt && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(campaign.startAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                        {campaign.endAt && ` ~ ${new Date(campaign.endAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}`}
                      </span>
                    )}
                    <span>수수료 {Number(campaign.commissionRate) * 100}%</span>
                    <span>{campaign.recruitmentType === 'OPEN' ? '자동 승인' : '승인제'}</span>
                  </div>

                  {/* Products */}
                  {campaign.products && campaign.products.length > 0 && (
                    <div className="rounded-lg bg-gray-50 p-3 space-y-1">
                      {campaign.products.slice(0, 2).map((cp) => (
                        <div key={cp.id} className="flex items-center justify-between text-sm">
                          <span className="truncate text-muted-foreground">{cp.product?.name ?? '상품'}</span>
                          <span className="font-medium shrink-0 ml-2">{formatCurrency(Number(cp.campaignPrice))}</span>
                        </div>
                      ))}
                      {campaign.products.length > 2 && (
                        <p className="text-xs text-muted-foreground">+{campaign.products.length - 2}개 더</p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t">
                    {campaign.status === 'DRAFT' && (
                      <>
                        <Button size="sm" className="h-8 text-xs flex-1" disabled={isUpdating}
                          onClick={() => handleStatusChange(campaign.id, 'RECRUITING')}>
                          {isUpdating ? '처리 중...' : '모집 시작'}
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs" disabled={isUpdating}
                          onClick={() => handleStatusChange(campaign.id, 'ENDED')}>
                          취소
                        </Button>
                      </>
                    )}
                    {campaign.status === 'RECRUITING' && (
                      <>
                        <Button size="sm" className="h-8 text-xs flex-1" disabled={isUpdating}
                          onClick={() => handleStatusChange(campaign.id, 'ACTIVE')}>
                          {isUpdating ? '처리 중...' : '캠페인 시작'}
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs" disabled={isUpdating}
                          onClick={() => handleStatusChange(campaign.id, 'ENDED')}>
                          취소
                        </Button>
                      </>
                    )}
                    {campaign.status === 'ACTIVE' && (
                      <Button size="sm" variant="destructive" className="h-8 text-xs" disabled={isUpdating}
                        onClick={() => handleStatusChange(campaign.id, 'ENDED')}>
                        {isUpdating ? '처리 중...' : '종료'}
                      </Button>
                    )}
                    {campaign.status === 'ENDED' && (
                      <span className="text-xs text-muted-foreground py-1">종료된 캠페인</span>
                    )}
                    <Link href={`../campaigns/${campaign.id}`} className="ml-auto">
                      <Button size="sm" variant="ghost" className="h-8 text-xs">
                        상세 <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
