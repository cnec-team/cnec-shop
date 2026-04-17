'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Instagram,
  CheckCircle,
  AlertCircle,
  Clock,
  Link2Off,
  Loader2,
  RefreshCw,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';

interface InstagramData {
  brandInstagramHandle: string | null;
  brandInstagramHandleStatus: string;
  brandInstagramHandleVerifiedAt: string | null;
  brandInstagramDailySentCount: number;
}

const DAILY_LIMIT = 50;

function statusBadge(status: string, handle: string | null) {
  switch (status) {
    case 'NOT_LINKED':
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-600">
          <Link2Off className="mr-1 h-3 w-3" />
          연동되지 않음
        </Badge>
      );
    case 'PENDING':
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
          <Clock className="mr-1 h-3 w-3" />
          연동 진행 중
        </Badge>
      );
    case 'VERIFIED':
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-700">
          <CheckCircle className="mr-1 h-3 w-3" />
          연동 완료 @{handle}
        </Badge>
      );
    case 'FAILED':
      return (
        <Badge variant="destructive">
          <AlertCircle className="mr-1 h-3 w-3" />
          연동 실패
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function BrandInstagramIntegrationPage() {
  const [data, setData] = useState<InstagramData | null>(null);
  const [loading, setLoading] = useState(true);
  const [handle, setHandle] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/brand/instagram');
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await res.json();
        setData(json);
        if (json.brandInstagramHandle) {
          setHandle(json.brandInstagramHandle);
        }
      } catch {
        toast.error('인스타그램 연동 정보를 불러오지 못했습니다');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  async function handleSubmit() {
    const trimmed = handle.trim().replace(/^@/, '');
    if (!trimmed) {
      toast.error('인스타그램 핸들을 입력해주세요');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/brand/instagram', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandInstagramHandle: trimmed }),
      });
      if (!res.ok) throw new Error('Failed to update');
      const json = await res.json();
      setData(json);
      toast.success('인스타그램 연동을 시작합니다');
    } catch {
      toast.error('연동 요청에 실패했습니다');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRetry() {
    setSubmitting(true);
    try {
      const res = await fetch('/api/brand/instagram', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandInstagramHandle: data?.brandInstagramHandle ?? handle.trim().replace(/^@/, ''),
        }),
      });
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      setData(json);
      toast.success('재연동 요청을 보냈습니다');
    } catch {
      toast.error('재연동 요청에 실패했습니다');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  const status = data?.brandInstagramHandleStatus ?? 'NOT_LINKED';
  const dailySent = data?.brandInstagramDailySentCount ?? 0;
  const dailyPercent = Math.min(100, (dailySent / DAILY_LIMIT) * 100);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">인스타그램 연동</h1>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <Instagram className="h-5 w-5" />
          <CardTitle>연동 상태</CardTitle>
          <div className="ml-auto">
            {statusBadge(status, data?.brandInstagramHandle ?? null)}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* NOT_LINKED: Input form */}
          {status === 'NOT_LINKED' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                인스타그램 핸들을 입력하여 DM 발송 기능을 연동하세요.
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    @
                  </span>
                  <Input
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="instagram_handle"
                    className="pl-7"
                  />
                </div>
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  연동하기
                </Button>
              </div>
            </div>
          )}

          {/* PENDING: Extension install message */}
          {status === 'PENDING' && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800">
                    크롬 확장을 설치하면 연동이 완료됩니다
                  </p>
                  <p className="mt-1 text-sm text-yellow-700">
                    CNEC Shop 크롬 확장 프로그램을 설치하고 인스타그램에
                    로그인하면 자동으로 연동이 완료됩니다.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* VERIFIED: Daily usage */}
          {status === 'VERIFIED' && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-green-50 p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <p className="font-medium text-green-800">
                    @{data?.brandInstagramHandle} 연동 완료
                  </p>
                </div>
                {data?.brandInstagramHandleVerifiedAt && (
                  <p className="mt-1 text-xs text-green-600">
                    연동일:{' '}
                    {new Date(
                      data.brandInstagramHandleVerifiedAt
                    ).toLocaleDateString('ko-KR')}
                  </p>
                )}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">오늘 발송</span>
                  <span className="font-medium">
                    {dailySent} / {DAILY_LIMIT}건
                  </span>
                </div>
                <Progress value={dailyPercent} className="h-2" />
              </div>
            </div>
          )}

          {/* FAILED: Retry */}
          {status === 'FAILED' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium text-red-800">
                      세션이 만료되었습니다. 재로그인 필요
                    </p>
                    <p className="mt-1 text-sm text-red-700">
                      인스타그램 세션이 만료되어 DM 발송이 중지되었습니다.
                      크롬 확장에서 다시 로그인해주세요.
                    </p>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleRetry}
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                재연동하기
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
