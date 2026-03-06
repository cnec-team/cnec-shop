'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, PartyPopper, ArrowRight, Gift, Star } from 'lucide-react';

export default function SignupCompletePage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const [isLoading, setIsLoading] = useState(true);
  const [totalPoints, setTotalPoints] = useState(0);
  const [error, setError] = useState(false);

  useEffect(() => {
    const completeOnboarding = async () => {
      try {
        const supabase = getClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push(`/${locale}/login`);
          return;
        }

        const res = await fetch('/api/creator/onboarding-complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!res.ok) {
          throw new Error('Failed to complete onboarding');
        }

        const data = await res.json();
        setTotalPoints(data.totalPoints ?? 5000);
      } catch (err) {
        console.error('Onboarding complete error:', err);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    completeOnboarding();
  }, [locale, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-pink-50 to-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
          <p className="text-sm text-gray-500">가입을 완료하고 있어요...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-pink-50 to-white p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="mb-4 text-gray-600">포인트 적립 중 문제가 발생했습니다.</p>
            <Button onClick={() => router.push(`/${locale}/creator/dashboard`)}>
              대시보드로 이동
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-pink-50 to-white p-4">
      <Card className="w-full max-w-md overflow-hidden">
        {/* Celebration Header */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-500 p-8 text-center text-white">
          <div className="mb-3 flex justify-center gap-2">
            <Star className="h-6 w-6 animate-pulse" />
            <PartyPopper className="h-8 w-8" />
            <Star className="h-6 w-6 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold">가입 완료!</h1>
          <p className="mt-2 text-pink-100">크넥샵 크리에이터가 되신 것을 환영합니다</p>
        </div>

        <CardContent className="p-6">
          {/* Points Earned */}
          <div className="mb-6 rounded-xl border-2 border-pink-100 bg-pink-50 p-5">
            <div className="mb-3 flex items-center gap-2">
              <Gift className="h-5 w-5 text-pink-500" />
              <span className="font-semibold text-gray-900">축하 포인트 적립!</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">가입 축하 포인트</span>
                <span className="font-medium text-pink-600">+3,000P</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">페르소나 완료 보너스</span>
                <span className="font-medium text-pink-600">+2,000P</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between text-base font-bold">
                <span className="text-gray-900">총 적립</span>
                <span className="text-pink-600">{totalPoints.toLocaleString()}P</span>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="mb-6 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">다음 할 일</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs text-green-600">1</span>
                <span>첫 상품을 추가하고 <strong>1,000P</strong>를 받으세요</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-600">2</span>
                <span>SNS에 샵을 공유하고 <strong>2,000P</strong>를 받으세요</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs text-purple-600">3</span>
                <span>30일 이내 미션을 완료하고 최대 <strong>11,000P</strong>를 모으세요</span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <Button
            onClick={() => router.push(`/${locale}/creator/dashboard`)}
            className="w-full bg-pink-500 hover:bg-pink-600"
            size="lg"
          >
            내 샵 바로가기
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
