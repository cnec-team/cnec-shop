'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrandSession, getPendingParticipations, handleParticipationAction } from '@/lib/actions/brand';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  ExternalLink,
  Instagram,
  ArrowLeft,
  UserCheck,
  Clock,
  MessageSquare,
} from 'lucide-react';

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
    skinType?: string | null;
    skinConcerns?: string[];
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
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function PendingCreatorsPage() {
  const router = useRouter();
  const [brand, setBrand] = useState<{ id: string } | null>(null);
  const [pendingList, setPendingList] = useState<PendingParticipation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});
  const [showRejectForm, setShowRejectForm] = useState<Record<string, boolean>>({});

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

  async function handleAction(participationId: string, action: 'APPROVED' | 'REJECTED') {
    setProcessingId(participationId);
    try {
      await handleParticipationAction(participationId, action);
      setPendingList(pendingList.filter((p) => p.participation.id !== participationId));
    } catch (error) {
      console.error('Failed to process participation:', error);
    }
    setProcessingId(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="h-8 w-8 p-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">승인 대기</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{pendingList.length}건의 승인 요청</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="bg-white rounded-xl">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-20" /></div>
                </div>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : pendingList.length === 0 ? (
        <Card className="bg-white rounded-xl border shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <UserCheck className="h-16 w-16 text-muted-foreground/20 mb-4" />
            <p className="text-lg font-medium mb-1">승인 대기 중인 크리에이터가 없습니다</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push('../creators')}>
              크리에이터 목록으로
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {pendingList.map((item) => (
            <Card key={item.participation.id} className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              <div className="p-5 space-y-4">
                {/* Creator profile */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    {item.creator?.profileImageUrl && (
                      <AvatarImage src={item.creator.profileImageUrl} alt={item.creator.displayName ?? ''} />
                    )}
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                      {(item.creator?.displayName ?? '').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">{item.creator?.displayName}</p>
                      {item.creator?.shopId && (
                        <a href={`/shop/${item.creator.shopId}`} target="_blank" rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">@{item.creator?.shopId}</p>
                  </div>
                  {item.creator?.instagramHandle && (
                    <a href={`https://instagram.com/${item.creator.instagramHandle}`} target="_blank" rel="noopener noreferrer"
                      className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-accent transition-colors">
                      <Instagram className="h-4 w-4 text-pink-500" />
                    </a>
                  )}
                </div>

                {/* SNS & beauty */}
                <div className="flex flex-wrap gap-1">
                  {item.creator?.instagramHandle && (
                    <Badge variant="outline" className="text-[10px]">IG @{item.creator.instagramHandle}</Badge>
                  )}
                  {item.creator?.youtubeHandle && (
                    <Badge variant="outline" className="text-[10px]">YT @{item.creator.youtubeHandle}</Badge>
                  )}
                  {item.creator?.tiktokHandle && (
                    <Badge variant="outline" className="text-[10px]">TT @{item.creator.tiktokHandle}</Badge>
                  )}
                  {item.creator?.skinType && (
                    <Badge variant="secondary" className="text-[10px]">{item.creator.skinType}</Badge>
                  )}
                  {item.creator?.skinConcerns?.map((c) => (
                    <Badge key={c} variant="outline" className="text-[10px]">{c}</Badge>
                  ))}
                </div>

                {item.creator?.bio && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{item.creator.bio}</p>
                )}

                {/* Campaign info */}
                <div className="rounded-lg bg-gray-50 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{item.campaign?.title}</p>
                    <Badge variant="outline" className="text-[10px]">
                      {item.campaign?.type === 'GONGGU' ? '공구' : '상시'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDate(item.participation.appliedAt)}
                  </div>
                </div>

                {/* Application message */}
                {item.participation.message && (
                  <div className="rounded-lg border bg-blue-50/50 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <MessageSquare className="h-3 w-3 text-blue-500" />
                      <p className="text-xs font-medium text-blue-600">신청 메시지</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.participation.message}</p>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-gray-50 p-2.5 text-center">
                    <p className="text-[10px] text-muted-foreground">총 매출</p>
                    <p className="text-sm font-bold">{(Number(item.creator?.totalSales) || 0).toLocaleString('ko-KR')}원</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2.5 text-center">
                    <p className="text-[10px] text-muted-foreground">총 수익</p>
                    <p className="text-sm font-bold">{(Number(item.creator?.totalEarnings) || 0).toLocaleString('ko-KR')}원</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button className="flex-1 h-10" disabled={processingId === item.participation.id}
                    onClick={() => handleAction(item.participation.id, 'APPROVED')}>
                    {processingId === item.participation.id ? '처리 중...' : '승인'}
                  </Button>
                  {!showRejectForm[item.participation.id] ? (
                    <Button variant="destructive" className="flex-1 h-10" disabled={processingId === item.participation.id}
                      onClick={() => setShowRejectForm({ ...showRejectForm, [item.participation.id]: true })}>
                      거절
                    </Button>
                  ) : (
                    <Button variant="destructive" className="flex-1 h-10" disabled={processingId === item.participation.id}
                      onClick={() => handleAction(item.participation.id, 'REJECTED')}>
                      {processingId === item.participation.id ? '처리 중...' : '거절 확인'}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
