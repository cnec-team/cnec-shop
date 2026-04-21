'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Store, Clock, TrendingUp } from 'lucide-react';
import { getCreatorApprovalStats } from '@/lib/actions/admin';

export default function AdminApprovalsPage() {
  const params = useParams();
  const locale = params.locale as string;
  const [stats, setStats] = useState({ creatorPending: 0, creatorTodayNew: 0, brandPending: 0, brandTodayNew: 0, avgReviewHours: null as number | null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCreatorApprovalStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    {
      title: '크리에이터 대기',
      value: stats.creatorPending,
      unit: '명',
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      href: `/${locale}/admin/approvals/creators?status=PENDING`,
    },
    {
      title: '크리에이터 오늘 신규',
      value: stats.creatorTodayNew,
      unit: '명',
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-50',
      href: `/${locale}/admin/approvals/creators`,
    },
    {
      title: '브랜드 대기',
      value: stats.brandPending,
      unit: '개',
      icon: Store,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      href: `/${locale}/admin/brands`,
    },
    {
      title: '평균 심사 시간',
      value: stats.avgReviewHours ?? '-',
      unit: stats.avgReviewHours !== null ? '시간' : '',
      icon: Clock,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      href: '#',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold">승인 관리</h1>
        <p className="text-muted-foreground">크리에이터 및 브랜드 가입 심사를 관리합니다.</p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.title} href={card.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl ${card.bg} flex items-center justify-center`}>
                    <card.icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{card.title}</p>
                    {loading ? (
                      <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                    ) : (
                      <p className="text-2xl font-bold">
                        {card.value}{card.unit}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Link href={`/${locale}/admin/approvals/creators`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <Users className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold">크리에이터 승인 관리</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                가입 신청한 크리에이터의 SNS 프로필을 확인하고 승인/거절합니다.
                일괄 승인도 가능합니다.
              </p>
              {stats.creatorPending > 0 && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                  {stats.creatorPending}명 대기 중
                </div>
              )}
            </CardContent>
          </Card>
        </Link>

        <Link href={`/${locale}/admin/brands`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <Store className="h-5 w-5 text-orange-600" />
                <h2 className="text-lg font-semibold">브랜드 승인 관리</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                가입 신청한 브랜드의 사업자 정보를 확인하고 승인/거절합니다.
              </p>
              {stats.brandPending > 0 && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-800">
                  {stats.brandPending}개 대기 중
                </div>
              )}
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
