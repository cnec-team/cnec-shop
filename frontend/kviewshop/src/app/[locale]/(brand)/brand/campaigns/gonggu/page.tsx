'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getBrandCampaigns, getBrandSession, updateCampaignStatus } from '@/lib/actions/brand';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { calculateDDay, getDDayLabel } from '@/lib/utils/date';
import {
  Megaphone,
  Plus,
  Calendar,
  Users,
  ArrowRight,
  Package,
  Percent,
  Sparkles,
  Rocket,
  BarChart3,
  Loader2,
} from 'lucide-react';

function formatCurrency(num: number): string {
  return `${num.toLocaleString('ko-KR')}원`;
}

const STATUS_CONFIG: Record<string, {
  label: string;
  badgeCls: string;
  borderCls: string;
}> = {
  DRAFT: {
    label: '작성중',
    badgeCls: 'bg-gray-100 text-gray-600 border-0',
    borderCls: 'border-l-4 border-l-gray-300',
  },
  RECRUITING: {
    label: '모집중',
    badgeCls: 'bg-blue-100 text-blue-700 border-0',
    borderCls: 'border-l-4 border-l-blue-500',
  },
  ACTIVE: {
    label: '진행중',
    badgeCls: 'bg-green-100 text-green-700 border-0',
    borderCls: 'border-l-4 border-l-green-500',
  },
  ENDED: {
    label: '종료',
    badgeCls: 'bg-gray-100 text-gray-400 border-0',
    borderCls: 'border-l-4 border-l-gray-200',
  },
};

function getDday(endAt: string | null): string | null {
  if (!endAt) return null;
  const days = calculateDDay(endAt);
  if (days <= 0) return days === 0 ? 'D-DAY' : '종료됨';
  return getDDayLabel(days);
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

function CampaignCard({
  campaign,
  isUpdating,
  onStatusChange,
}: {
  campaign: GongguCampaign;
  isUpdating: boolean;
  onStatusChange: (id: string, status: string) => void;
}) {
  const config = STATUS_CONFIG[campaign.status] ?? STATUS_CONFIG.DRAFT;
  const dday = getDday(campaign.endAt);
  const progressPercent = campaign.totalStock && campaign.totalStock > 0
    ? Math.min((campaign.soldCount / campaign.totalStock) * 100, 100) : 0;
  const commissionRate = Number(campaign.commissionRate) * 100;

  return (
    <div className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow ${config.borderCls} overflow-hidden`}>
      <div className="p-6 space-y-4">
        {/* Header: Status + D-day */}
        <div className="flex items-center justify-between">
          <Badge className={config.badgeCls}>
            {config.label}
          </Badge>
          {dday && (campaign.status === 'ACTIVE' || campaign.status === 'RECRUITING') && (
            <span className="text-sm font-semibold text-orange-600">{dday}</span>
          )}
        </div>

        {/* Title */}
        <div>
          <Link href={`../campaigns/${campaign.id}`} className="hover:underline">
            <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{campaign.title}</h3>
          </Link>
        </div>

        {/* Info Pills */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg">
            <Package className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs text-gray-600">상품 {campaign.products.length}개</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg">
            <Percent className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs text-gray-600">커미션 {commissionRate}%</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg">
            <Users className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs text-gray-600">{campaign.recruitmentType === 'OPEN' ? '자동승인' : '승인제'}</span>
          </div>
        </div>

        {/* Period */}
        {campaign.startAt && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              {new Date(campaign.startAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
              {campaign.endAt && ` ~ ${new Date(campaign.endAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}`}
            </span>
          </div>
        )}

        {/* Product List */}
        {campaign.products.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
            {campaign.products.slice(0, 2).map((cp) => (
              <div key={cp.id} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 truncate flex-1 mr-2">{cp.product?.name ?? '상품'}</span>
                <span className="text-sm font-semibold text-gray-900 shrink-0">{formatCurrency(Number(cp.campaignPrice))}</span>
              </div>
            ))}
            {campaign.products.length > 2 && (
              <p className="text-xs text-gray-400">+{campaign.products.length - 2}개 더</p>
            )}
          </div>
        )}

        {/* Progress Bar */}
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">판매 진행률</span>
            <span className="text-xs font-medium text-gray-700">
              {campaign.soldCount.toLocaleString('ko-KR')} / {(campaign.totalStock ?? 0).toLocaleString('ko-KR')}개
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                campaign.status === 'ACTIVE' ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* CTA Section */}
        <div className="space-y-2">
          {/* Status-specific guidance */}
          {campaign.status === 'DRAFT' && (
            <p className="text-xs text-gray-400">모집을 시작하면 크리에이터가 이 캠페인을 보고 참여할 수 있어요</p>
          )}
          {campaign.status === 'RECRUITING' && (
            <p className="text-xs text-blue-500">크리에이터가 참여 중이에요. 캠페인을 시작하면 판매가 시작됩니다</p>
          )}
          {campaign.status === 'ACTIVE' && dday && (
            <p className="text-xs text-green-600">공구가 진행 중이에요! {dday === '종료됨' ? '종료 예정' : `${dday}일 남았어요`}</p>
          )}
          {campaign.status === 'ENDED' && (
            <p className="text-xs text-gray-400">공구가 종료되었어요</p>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            {campaign.status === 'DRAFT' && (
              <>
                <Button
                  size="sm"
                  className="h-10 flex-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
                  disabled={isUpdating}
                  onClick={() => onStatusChange(campaign.id, 'RECRUITING')}
                >
                  {isUpdating ? (
                    <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />처리 중...</>
                  ) : (
                    <><Sparkles className="h-4 w-4 mr-1.5" />모집 시작하기</>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-10 px-4 rounded-lg border-gray-200 text-gray-500 text-sm"
                  disabled={isUpdating}
                  onClick={() => onStatusChange(campaign.id, 'ENDED')}
                >
                  취소
                </Button>
              </>
            )}
            {campaign.status === 'RECRUITING' && (
              <>
                <Button
                  size="sm"
                  className="h-10 flex-1 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium"
                  disabled={isUpdating}
                  onClick={() => onStatusChange(campaign.id, 'ACTIVE')}
                >
                  {isUpdating ? (
                    <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />처리 중...</>
                  ) : (
                    <><Rocket className="h-4 w-4 mr-1.5" />캠페인 시작</>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-10 px-4 rounded-lg border-gray-200 text-gray-500 text-sm"
                  disabled={isUpdating}
                  onClick={() => onStatusChange(campaign.id, 'ENDED')}
                >
                  취소
                </Button>
              </>
            )}
            {campaign.status === 'ACTIVE' && (
              <Button
                size="sm"
                variant="outline"
                className="h-10 px-4 rounded-lg border-red-200 text-red-500 hover:bg-red-50 text-sm"
                disabled={isUpdating}
                onClick={() => onStatusChange(campaign.id, 'ENDED')}
              >
                {isUpdating ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />처리 중...</> : '종료하기'}
              </Button>
            )}
            {campaign.status === 'ENDED' && (
              <Link href={`../campaigns/${campaign.id}`}>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-10 px-4 rounded-lg border-gray-200 text-gray-500 text-sm"
                >
                  <BarChart3 className="h-4 w-4 mr-1.5" />
                  결과 보기
                </Button>
              </Link>
            )}
            <Link href={`../campaigns/${campaign.id}`} className="ml-auto">
              <Button size="sm" variant="ghost" className="h-10 px-3 rounded-lg text-gray-400 hover:text-gray-600 text-sm">
                상세 <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
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
      toast.success(
        newStatus === 'RECRUITING' ? '모집이 시작되었습니다!' :
        newStatus === 'ACTIVE' ? '캠페인이 시작되었습니다!' :
        newStatus === 'ENDED' ? '캠페인이 종료되었습니다.' : '상태가 변경되었습니다.'
      );
      await load();
    } catch (error) {
      toast.error('상태 변경에 실패했습니다.');
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
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">공구 캠페인</h1>
          <p className="text-sm text-gray-400 mt-1">기간 한정 공동구매 캠페인을 관리합니다</p>
        </div>
        <Link href="../campaigns/new">
          <Button size="sm" className="h-10 px-5 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium">
            <Plus className="h-4 w-4 mr-1.5" />
            새 캠페인
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-5 w-10" />
              </div>
              <Skeleton className="h-6 w-48" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-24 rounded-lg" />
                <Skeleton className="h-8 w-24 rounded-lg" />
                <Skeleton className="h-8 w-20 rounded-lg" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-50 mb-4">
              <Package className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-lg font-semibold text-gray-900 mb-1">아직 공구 캠페인이 없어요</p>
            <p className="text-sm text-gray-400 mb-6">첫 공구를 시작해보세요!</p>
            <Link href="../campaigns/new">
              <Button className="h-10 px-6 rounded-lg">
                <Plus className="h-4 w-4 mr-1.5" />
                새 캠페인 만들기
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              isUpdating={updatingId === campaign.id}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
