'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getBrandSession, getPendingParticipations, handleParticipationAction } from '@/lib/actions/brand';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ExternalLink,
  Instagram,
  ArrowLeft,
  UserCheck,
  Clock,
  MessageSquare,
} from 'lucide-react';
import { getSkinTypeLabel, getSkinConcernLabel } from '@/lib/utils/beauty-labels';

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
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft className="h-4 w-4 text-gray-500" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">승인 대기</h1>
          <p className="text-xs text-gray-400 mt-0.5">{pendingList.length}건의 승인 요청</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : pendingList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
          <UserCheck className="h-16 w-16 text-gray-200 mx-auto mb-4" />
          <p className="text-base font-medium text-gray-900 mb-1">승인 대기 중인 크리에이터가 없습니다</p>
          <Button variant="outline" className="mt-4 rounded-xl" onClick={() => router.push('../creators')}>
            크리에이터 목록으로
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {pendingList.map((item) => (
            <div key={item.participation.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 space-y-4">
                {/* Creator profile */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    {item.creator?.profileImageUrl && (
                      <AvatarImage src={item.creator.profileImageUrl} alt={item.creator.displayName ?? ''} />
                    )}
                    <AvatarFallback className="bg-gray-100 text-gray-500 text-sm font-medium">
                      {(item.creator?.displayName ?? '').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 truncate">{item.creator?.displayName}</p>
                    </div>
                    <p className="text-xs text-gray-400">@{item.creator?.shopId}</p>
                  </div>
                  <div className="flex gap-1">
                    {item.creator?.instagramHandle && (
                      <a href={`https://instagram.com/${item.creator.instagramHandle}`} target="_blank" rel="noopener noreferrer"
                        className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                        <Instagram className="h-4 w-4 text-pink-500" />
                      </a>
                    )}
                    {item.creator?.shopId && (
                      <a href={`/shop/${item.creator.shopId}`} target="_blank" rel="noopener noreferrer"
                        className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                        <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Beauty tags — Korean labels */}
                <div className="flex flex-wrap gap-1.5">
                  {item.creator?.skinType && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {getSkinTypeLabel(item.creator.skinType)}
                    </span>
                  )}
                  {item.creator?.skinConcerns?.map((c) => (
                    <span key={c} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-50 text-gray-500">
                      {getSkinConcernLabel(c)}
                    </span>
                  ))}
                </div>

                {item.creator?.bio && (
                  <p className="text-xs text-gray-500 line-clamp-2">{item.creator.bio}</p>
                )}

                {/* Campaign info */}
                <div className="rounded-xl bg-gray-50 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{item.campaign?.title}</p>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                      {item.campaign?.type === 'GONGGU' ? '공구' : '상시'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-1">
                    <Clock className="h-2.5 w-2.5" />
                    {formatDate(item.participation.appliedAt)}
                  </div>
                </div>

                {/* Message */}
                {item.participation.message && (
                  <div className="rounded-xl bg-blue-50 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <MessageSquare className="h-3 w-3 text-blue-500" />
                      <p className="text-[10px] font-medium text-blue-600">신청 메시지</p>
                    </div>
                    <p className="text-xs text-gray-600">{item.participation.message}</p>
                  </div>
                )}

                {/* Actions — big buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1 h-12 bg-gray-900 text-white hover:bg-gray-800 rounded-xl text-sm font-semibold"
                    disabled={processingId === item.participation.id}
                    onClick={() => handleAction(item.participation.id, 'APPROVED')}
                  >
                    {processingId === item.participation.id ? '처리 중...' : '승인'}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 h-12 bg-red-50 text-red-700 hover:bg-red-100 border-red-100 rounded-xl text-sm font-semibold"
                    disabled={processingId === item.participation.id}
                    onClick={() => handleAction(item.participation.id, 'REJECTED')}
                  >
                    거절
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
