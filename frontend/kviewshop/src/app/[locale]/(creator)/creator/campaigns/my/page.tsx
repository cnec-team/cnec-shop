'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  Megaphone,
  Calendar,
  Percent,
  Clock,
  CheckCircle,
  XCircle,
  Hourglass,
} from 'lucide-react';
import { getClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/auth';
import type {
  CampaignParticipation,
  Campaign,
  Brand,
  ParticipationStatus,
  CampaignStatus,
} from '@/types/database';
import { CAMPAIGN_STATUS_LABELS } from '@/types/database';

interface ParticipationWithDetails extends CampaignParticipation {
  campaign?: Campaign & { brand?: Brand };
}

export default function CreatorMyCampaignsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const { creator, isLoading: authLoading } = useAuthStore();

  const [participations, setParticipations] = useState<ParticipationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !creator) {
      if (!authLoading) setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchData() {
      try {
        const supabase = getClient();

        const [participationsRes, campaignsRes, brandsRes] = await Promise.all([
          supabase
            .from('campaign_participations')
            .select('*')
            .eq('creator_id', creator!.id)
            .order('applied_at', { ascending: false }),
          supabase.from('campaigns').select('*'),
          supabase.from('brands').select('*'),
        ]);

        if (cancelled) return;

        // Build brand map
        const brandMap: Record<string, Brand> = {};
        for (const b of brandsRes.data ?? []) {
          brandMap[b.id] = b;
        }

        // Build campaign map
        const campaignMap: Record<string, Campaign & { brand?: Brand }> = {};
        for (const c of campaignsRes.data ?? []) {
          campaignMap[c.id] = { ...c, brand: brandMap[c.brand_id] };
        }

        const combined: ParticipationWithDetails[] = (participationsRes.data ?? []).map((p) => ({
          ...p,
          campaign: campaignMap[p.campaign_id],
        }));

        setParticipations(combined);
      } catch (error) {
        console.error('Failed to fetch participations:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [authLoading, creator]);

  const getParticipationStatusBadge = (status: ParticipationStatus) => {
    switch (status) {
      case 'PENDING':
        return {
          label: '대기중',
          className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
          icon: <Hourglass className="h-3 w-3" />,
        };
      case 'APPROVED':
        return {
          label: '승인됨',
          className: 'bg-green-500/10 text-green-600 border-green-500/30',
          icon: <CheckCircle className="h-3 w-3" />,
        };
      case 'REJECTED':
        return {
          label: '거절됨',
          className: 'bg-red-500/10 text-red-600 border-red-500/30',
          icon: <XCircle className="h-3 w-3" />,
        };
    }
  };

  const getCampaignStatusBadge = (status: CampaignStatus) => {
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

  const getDDay = (endAt?: string) => {
    if (!endAt) return null;
    const end = new Date(endAt);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return '종료';
    if (diff === 0) return 'D-Day';
    return `D-${diff}`;
  };

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/${locale}/creator/campaigns`}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            뒤로
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">내 캠페인</h1>
          <p className="text-sm text-muted-foreground">
            참여 신청한 캠페인 목록입니다
          </p>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">
              {participations.filter((p) => p.status === 'PENDING').length}
            </p>
            <p className="text-xs text-muted-foreground">대기중</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              {participations.filter((p) => p.status === 'APPROVED').length}
            </p>
            <p className="text-xs text-muted-foreground">승인됨</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">
              {participations.filter((p) => p.status === 'REJECTED').length}
            </p>
            <p className="text-xs text-muted-foreground">거절됨</p>
          </CardContent>
        </Card>
      </div>

      {/* Participations List */}
      {participations.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Megaphone className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">참여한 캠페인이 없습니다</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href={`/${locale}/creator/campaigns`}>캠페인 둘러보기</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {participations.map((participation) => {
            const campaign = participation.campaign;
            const statusInfo = getParticipationStatusBadge(participation.status);
            const dDay = campaign?.end_at ? getDDay(campaign.end_at) : null;

            return (
              <Card key={participation.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Status & campaign type badges */}
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={statusInfo.className}>
                          {statusInfo.icon}
                          <span className="ml-1">{statusInfo.label}</span>
                        </Badge>
                        {campaign && (
                          <>
                            <Badge className={getCampaignStatusBadge(campaign.status)}>
                              {CAMPAIGN_STATUS_LABELS[campaign.status]}
                            </Badge>
                            <Badge variant="outline">
                              {campaign.type === 'GONGGU' ? '공구' : '상시'}
                            </Badge>
                          </>
                        )}
                      </div>

                      {/* Campaign title */}
                      <h3 className="font-medium">
                        {campaign?.title ?? '캠페인'}
                      </h3>

                      {/* Brand name */}
                      {campaign?.brand && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {campaign.brand.brand_name}
                        </p>
                      )}

                      {/* Details row */}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        {campaign?.start_at && campaign?.end_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(campaign.start_at).toLocaleDateString('ko-KR')} ~{' '}
                            {new Date(campaign.end_at).toLocaleDateString('ko-KR')}
                          </span>
                        )}
                        {campaign && (
                          <span className="flex items-center gap-1">
                            <Percent className="h-3 w-3" />
                            내 수익 {(campaign.commission_rate * 100).toFixed(0)}%
                          </span>
                        )}
                        <span>
                          신청일: {new Date(participation.applied_at).toLocaleDateString('ko-KR')}
                        </span>
                      </div>

                      {/* Message */}
                      {participation.message && (
                        <p className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded">
                          {participation.message}
                        </p>
                      )}
                    </div>

                    {/* D-Day */}
                    {dDay && (
                      <Badge
                        variant="secondary"
                        className={
                          dDay === '종료'
                            ? 'bg-gray-100 text-gray-600'
                            : 'bg-orange-100 text-orange-600'
                        }
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        {dDay}
                      </Badge>
                    )}
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
