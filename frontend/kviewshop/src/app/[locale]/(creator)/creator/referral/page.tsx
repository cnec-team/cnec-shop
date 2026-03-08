'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Copy, Check, UserPlus, Users, ShoppingCart, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/i18n/config';
import { getCreatorSession, getCreatorReferralData } from '@/lib/actions/creator';

interface ReferralStats {
  totalInvited: number;
  signupComplete: number;
  firstSaleComplete: number;
  totalReward: number;
}

interface ReferralEntry {
  id: string;
  referredId: string | null;
  status: string;
  referrerRewardTotal: number;
  createdAt: string;
}

export default function CreatorReferralPage() {
  const params = useParams();
  const locale = params.locale as string;
  const [creator, setCreator] = useState<{ id: string } | null>(null);
  const [referralCode, setReferralCode] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [stats, setStats] = useState<ReferralStats>({ totalInvited: 0, signupComplete: 0, firstSaleComplete: 0, totalReward: 0 });
  const [referrals, setReferrals] = useState<ReferralEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchReferral() {
      const creatorData = await getCreatorSession();
      if (!creatorData || cancelled) {
        if (!cancelled) setLoading(false);
        return;
      }
      setCreator(creatorData as any);

      try {
        const data = await getCreatorReferralData();
        if (!cancelled) {
          setReferralCode(data.referralCode);
          setShareLink(data.shareLink);
          setStats(data.stats);
          setReferrals(data.referrals);
        }
      } catch (error) {
        console.error('Failed to fetch referral:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchReferral();
    return () => { cancelled = true; };
  }, []);

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    toast.success('추천 링크가 복사되었습니다!');
    setTimeout(() => setCopied(false), 2000);
  };

  const statusLabels: Record<string, string> = {
    PENDING: '대기 중',
    SIGNUP_COMPLETE: '가입 완료',
    FIRST_SALE_COMPLETE: '첫 판매 완료',
  };

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    SIGNUP_COMPLETE: 'bg-blue-100 text-blue-800',
    FIRST_SALE_COMPLETE: 'bg-green-100 text-green-800',
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">추천</h1>
        <p className="text-sm text-muted-foreground">친구를 초대하면 서로 포인트를 받아요!</p>
      </div>

      {/* Share Link */}
      <Card className="border-primary/30">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-medium mb-1">내 추천 링크</p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={shareLink}
                  className="flex-1 px-3 py-2 border rounded-md text-sm bg-muted font-mono"
                />
                <Button variant="outline" size="sm" onClick={copyLink}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-xs text-muted-foreground">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-semibold text-foreground">초대자 보상</p>
                <p>&#8361;5,000</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-semibold text-foreground">피초대자 보상</p>
                <p>&#8361;3,000</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-semibold text-foreground">친구 첫 판매 시</p>
                <p>추가 &#8361;3,000</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '총 초대', value: stats.totalInvited, icon: UserPlus },
          { label: '가입 완료', value: stats.signupComplete, icon: Users },
          { label: '첫 판매', value: stats.firstSaleComplete, icon: ShoppingCart },
          { label: '총 보상', value: formatCurrency(stats.totalReward, locale), icon: Gift },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <stat.icon className="h-5 w-5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-lg font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Referral List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">초대 내역</CardTitle>
        </CardHeader>
        <CardContent>
          {referrals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">아직 초대한 친구가 없습니다</p>
          ) : (
            <div className="space-y-3">
              {referrals.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div>
                    <p className="text-sm">초대된 크리에이터</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[r.status] || 'bg-gray-100'}`}>
                      {statusLabels[r.status] || r.status}
                    </span>
                    <span className="text-sm font-medium text-green-600">
                      +{formatCurrency(r.referrerRewardTotal, locale)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
