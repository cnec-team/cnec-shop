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
import { ExternalLink } from 'lucide-react';
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
          (result.creators as CreatorParticipation[]).sort(
            (a, b) => b.totalSales - a.totalSales
          )
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">크리에이터 관리</h1>
          <p className="text-sm text-muted-foreground">
            캠페인에 참여 중인 크리에이터를 관리합니다.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="creators/performance">
            <Button variant="outline">크리에이터 성과</Button>
          </Link>
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
                  <TableHead>뷰티 프로필</TableHead>
                  <TableHead>참여 캠페인</TableHead>
                  <TableHead className="text-right">주문수</TableHead>
                  <TableHead className="text-right">매출</TableHead>
                  <TableHead>샵</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {creatorData.map((data) => (
                  <TableRow key={data.creator.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          {data.creator.profileImageUrl && (
                            <AvatarImage src={data.creator.profileImageUrl} alt={data.creator.displayName ?? ''} />
                          )}
                          <AvatarFallback className="text-xs">
                            {(data.creator.displayName ?? '').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {data.creator.displayName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            @{data.creator.shopId}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {data.creator.instagramHandle && (
                          <a
                            href={`https://instagram.com/${data.creator.instagramHandle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1"
                          >
                            <Badge variant="outline" className="text-xs">
                              IG @{data.creator.instagramHandle}
                            </Badge>
                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                          </a>
                        )}
                        {data.creator.youtubeHandle && (
                          <Badge variant="outline" className="text-xs">
                            YT @{data.creator.youtubeHandle}
                          </Badge>
                        )}
                        {data.creator.tiktokHandle && (
                          <Badge variant="outline" className="text-xs">
                            TT @{data.creator.tiktokHandle}
                          </Badge>
                        )}
                        {!data.creator.instagramHandle &&
                          !data.creator.youtubeHandle &&
                          !data.creator.tiktokHandle && (
                            <span className="text-xs text-muted-foreground">
                              -
                            </span>
                          )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {data.creator.skinType && (
                          <Badge variant="outline" className="text-xs">
                            {data.creator.skinType}
                          </Badge>
                        )}
                        {data.creator.skinConcerns?.map((concern) => (
                          <Badge key={concern} variant="outline" className="text-xs">
                            {concern}
                          </Badge>
                        ))}
                        {!data.creator.skinType && (!data.creator.skinConcerns || data.creator.skinConcerns.length === 0) && (
                          <span className="text-xs text-muted-foreground">-</span>
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
                    <TableCell>
                      {data.creator.shopId ? (
                        <a
                          href={`/shop/${data.creator.shopId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                          샵 보기
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
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
