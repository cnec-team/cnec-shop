'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getBrandSession, getBrandCreatorsData } from '@/lib/actions/brand';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ExternalLink,
  Users,
  UserCheck,
  TrendingUp,
  ArrowRight,
  Instagram,
} from 'lucide-react';

interface CreatorParticipation {
  creator: {
    id: string;
    shopId: string | null;
    displayName: string | null;
    profileImageUrl: string | null;
    instagramHandle: string | null;
    youtubeHandle: string | null;
    tiktokHandle: string | null;
    skinType: string | null;
    skinConcerns: string[];
  };
  campaigns: {
    campaign: { id: string; title: string; type: string; status: string } | null;
    status: string;
    appliedAt: string;
  }[];
  totalOrders: number;
  totalSales: number;
}

function formatCurrency(num: number): string {
  return `${num.toLocaleString('ko-KR')}원`;
}

export default function BrandCreatorsPage() {
  const [brand, setBrand] = useState<{ id: string } | null>(null);
  const [creatorData, setCreatorData] = useState<CreatorParticipation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

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
    async function fetchCreatorData() {
      try {
        const result = await getBrandCreatorsData(brand!.id);
        setCreatorData(
          (result.creators as CreatorParticipation[]).sort((a, b) => b.totalSales - a.totalSales)
        );
        setPendingCount(result.pendingCount);
      } catch (error) {
        console.error('Failed to fetch creator data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCreatorData();
  }, [brand?.id]);

  const totalRevenue = creatorData.reduce((sum, c) => sum + c.totalSales, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">크리에이터 관리</h1>
          <p className="text-sm text-muted-foreground mt-1">캠페인에 참여 중인 크리에이터를 관리합니다</p>
        </div>
        <div className="flex gap-2">
          <Link href="creators/performance">
            <Button variant="outline" size="sm" className="h-9">
              <TrendingUp className="h-4 w-4 mr-1.5" />
              성과 분석
            </Button>
          </Link>
          {pendingCount > 0 && (
            <Link href="creators/pending">
              <Button size="sm" className="h-9">
                <UserCheck className="h-4 w-4 mr-1.5" />
                승인 대기
                <Badge variant="destructive" className="ml-1.5 text-[10px] px-1.5 py-0">{pendingCount}</Badge>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="bg-white rounded-xl border shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground font-medium">전체 크리에이터</p>
              <Users className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold">{creatorData.length}명</p>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl border shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground font-medium">승인 대기</p>
              <UserCheck className="h-4 w-4 text-orange-500" />
            </div>
            <p className="text-2xl font-bold">{pendingCount}명</p>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl border shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground font-medium">총 크리에이터 매출</p>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Creator cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="bg-white rounded-xl">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : creatorData.length === 0 ? (
        <Card className="bg-white rounded-xl border shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-16 w-16 text-muted-foreground/20 mb-4" />
            <p className="text-lg font-medium mb-1">아직 참여 크리에이터가 없습니다</p>
            <p className="text-sm text-muted-foreground">
              캠페인을 생성하면 크리에이터가 참여 신청할 수 있어요
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {creatorData.map((data) => (
            <Card key={data.creator.id} className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5 space-y-4">
                {/* Profile */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    {data.creator.profileImageUrl && (
                      <AvatarImage src={data.creator.profileImageUrl} alt={data.creator.displayName ?? ''} />
                    )}
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                      {(data.creator.displayName ?? '').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{data.creator.displayName}</p>
                    <p className="text-xs text-muted-foreground">@{data.creator.shopId}</p>
                  </div>
                  {data.creator.instagramHandle && (
                    <a
                      href={`https://instagram.com/${data.creator.instagramHandle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-accent transition-colors"
                    >
                      <Instagram className="h-4 w-4 text-pink-500" />
                    </a>
                  )}
                </div>

                {/* Beauty profile */}
                {(data.creator.skinType || (data.creator.skinConcerns && data.creator.skinConcerns.length > 0)) && (
                  <div className="flex flex-wrap gap-1">
                    {data.creator.skinType && (
                      <Badge variant="secondary" className="text-[10px]">{data.creator.skinType}</Badge>
                    )}
                    {data.creator.skinConcerns?.map((c) => (
                      <Badge key={c} variant="outline" className="text-[10px]">{c}</Badge>
                    ))}
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-gray-50 p-2 text-center">
                    <p className="text-[10px] text-muted-foreground">캠페인</p>
                    <p className="text-sm font-bold">{data.campaigns.length}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2 text-center">
                    <p className="text-[10px] text-muted-foreground">주문</p>
                    <p className="text-sm font-bold">{data.totalOrders}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2 text-center">
                    <p className="text-[10px] text-muted-foreground">매출</p>
                    <p className="text-sm font-bold">{data.totalSales >= 10000 ? `${(data.totalSales / 10000).toFixed(0)}만` : data.totalSales.toLocaleString('ko-KR')}</p>
                  </div>
                </div>

                {/* Campaigns */}
                {data.campaigns.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {data.campaigns.slice(0, 2).map((cp, i) => (
                      <Badge key={i} variant={cp.status === 'APPROVED' ? 'default' : cp.status === 'PENDING' ? 'secondary' : 'destructive'} className="text-[10px]">
                        {cp.campaign?.title?.slice(0, 12) ?? '캠페인'}
                      </Badge>
                    ))}
                    {data.campaigns.length > 2 && (
                      <Badge variant="outline" className="text-[10px]">+{data.campaigns.length - 2}</Badge>
                    )}
                  </div>
                )}

                {/* Shop link */}
                {data.creator.shopId && (
                  <div className="pt-2 border-t">
                    <a href={`/shop/${data.creator.shopId}`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      샵 보기 <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
