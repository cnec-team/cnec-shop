'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Clock, CheckCircle2, XCircle, Instagram, Youtube,
  MessageCircle, RefreshCw, ArrowRight,
} from 'lucide-react';

interface CreatorData {
  id: string;
  status: string;
  displayName: string | null;
  shopId: string | null;
  instagramHandle: string | null;
  youtubeHandle: string | null;
  tiktokHandle: string | null;
  primaryCategory: string | null;
  categories: string[];
  bio: string | null;
  submittedAt: Date | null;
  rejectionReason: string | null;
  createdAt: Date;
}

function timeElapsed(date: Date | string | null): string {
  if (!date) return '-';
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return '방금 전 신청';
  if (hours < 24) return `신청 후 ${hours}시간 경과`;
  const days = Math.floor(hours / 24);
  return `신청 후 ${days}일 ${hours % 24}시간 경과`;
}

export function CreatorPendingClient({ creator, locale }: { creator: CreatorData; locale: string }) {
  const router = useRouter();
  const isRejected = creator.status === 'REJECTED';
  const [refreshing, setRefreshing] = useState(false);

  // Auto-refresh every 30 seconds to check status change
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 30000);
    return () => clearInterval(interval);
  }, [router]);

  function handleRefresh() {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 1000);
  }

  const timelineSteps = [
    { label: '신청 완료', done: true, icon: CheckCircle2 },
    { label: '심사 중', done: !isRejected, icon: Clock, active: !isRejected },
    { label: isRejected ? '거절' : '승인', done: false, icon: isRejected ? XCircle : CheckCircle2, rejected: isRejected },
  ];

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Status badge */}
        <div className="text-center">
          {isRejected ? (
            <>
              <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold">심사가 완료되었어요</h1>
              <p className="text-muted-foreground mt-1">아쉽게도 이번에는 승인이 어려웠어요</p>
            </>
          ) : (
            <>
              <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4 animate-pulse">
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
              <h1 className="text-2xl font-bold">심사 중이에요</h1>
              <p className="text-muted-foreground mt-1">1~2영업일 내 결과를 알려드릴게요</p>
            </>
          )}
        </div>

        {/* Timeline */}
        <div className="flex items-center justify-center gap-0 py-4">
          {timelineSteps.map((step, i) => (
            <div key={step.label} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step.rejected ? 'bg-red-100' :
                  step.done ? 'bg-green-100' :
                  step.active ? 'bg-blue-100 animate-pulse' : 'bg-muted'
                }`}>
                  <step.icon className={`h-5 w-5 ${
                    step.rejected ? 'text-red-500' :
                    step.done ? 'text-green-500' :
                    step.active ? 'text-blue-500' : 'text-muted-foreground'
                  }`} />
                </div>
                <span className="text-xs text-muted-foreground">{step.label}</span>
              </div>
              {i < timelineSteps.length - 1 && (
                <div className={`w-12 h-0.5 mx-1 ${step.done ? 'bg-green-300' : 'bg-muted'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Time elapsed */}
        {!isRejected && creator.submittedAt && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {timeElapsed(creator.submittedAt)} / 평균 1.5일
            </p>
          </div>
        )}

        {/* Rejection reason */}
        {isRejected && creator.rejectionReason && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-red-800 mb-2">거절 사유</h3>
              <p className="text-sm text-red-700">{creator.rejectionReason}</p>
            </CardContent>
          </Card>
        )}

        {/* Submitted info summary */}
        <Card>
          <CardContent className="pt-6 space-y-3">
            <h3 className="font-semibold">제출한 정보</h3>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">활동명</span>
                <span className="font-medium">{creator.displayName || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">샵 ID</span>
                <span className="font-medium">{creator.shopId || '-'}</span>
              </div>
              {creator.instagramHandle && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-1"><Instagram className="h-3.5 w-3.5" /> Instagram</span>
                  <span className="font-medium">@{creator.instagramHandle}</span>
                </div>
              )}
              {creator.youtubeHandle && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-1"><Youtube className="h-3.5 w-3.5" /> YouTube</span>
                  <span className="font-medium">{creator.youtubeHandle}</span>
                </div>
              )}
              {creator.primaryCategory && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">카테고리</span>
                  <Badge variant="outline" className="text-xs">{creator.primaryCategory}</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Info box */}
        {!isRejected && (
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" /> 이메일로 심사 결과를 보내드려요</p>
                <p className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" /> 승인 시 가입 축하 3,000원 자동 지급</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {isRejected && (
            <Button className="w-full h-14 text-base font-semibold rounded-xl" onClick={() => router.push(`/${locale}/signup?role=creator&reapply=true`)}>
              정보 수정 후 재신청하기
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          )}
          <Button variant="outline" className="w-full h-12 rounded-xl" onClick={() => router.push(`/${locale}`)}>
            크넥샵 둘러보기
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1 h-10" onClick={handleRefresh}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              새로고침
            </Button>
            <Button
              variant="ghost"
              className="flex-1 h-10"
              onClick={() => window.open('https://pf.kakao.com/_cnecshop', '_blank')}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              문의하기
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
