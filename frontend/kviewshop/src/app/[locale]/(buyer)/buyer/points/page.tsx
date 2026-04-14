'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@/lib/hooks/use-user';
import { getBuyerPointsHistory } from '@/lib/actions/buyer';
import {
  Gift,
  Star,
  Users,
  ShoppingBag,
  Loader2,
} from 'lucide-react';

interface PointTransaction {
  id: string;
  amount: string | number;
  balanceAfter?: string | number | null;
  pointType?: string;
  type?: string;
  description?: string | null;
  createdAt: string | Date;
}

export default function BuyerPointsPage() {
  const { buyer } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [history, setHistory] = useState<PointTransaction[]>([]);

  const buyerId = buyer?.id;
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!buyerId || fetchedRef.current) return;
    fetchedRef.current = true;

    const loadHistory = async () => {
      try {
        const data = await getBuyerPointsHistory(buyerId);
        setHistory(data || []);
      } catch (error) {
        console.error('Failed to load history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [buyerId]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'review_text':
      case 'review_instagram':
      case 'REVIEW':
        return <Star className="h-4 w-4" />;
      case 'purchase':
      case 'PURCHASE':
      case 'use_order':
        return <ShoppingBag className="h-4 w-4" />;
      case 'referral':
      case 'REFERRAL':
        return <Users className="h-4 w-4" />;
      default:
        return <Gift className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'review_text':
        return '텍스트 리뷰 적립';
      case 'review_instagram':
        return '인스타그램 리뷰 적립';
      case 'REVIEW':
        return '리뷰 적립';
      case 'purchase':
      case 'PURCHASE':
        return '구매 적립';
      case 'referral':
      case 'REFERRAL':
        return '친구 추천 적립';
      case 'event':
        return '이벤트 적립';
      case 'use_order':
        return '주문 사용';
      case 'expiry':
        return '포인트 만료';
      case 'admin_adjustment':
        return '관리자 조정';
      case 'SIGNUP_BONUS':
        return '가입 보너스';
      case 'PERSONA_BONUS':
        return '페르소나 보너스';
      default:
        return type;
    }
  };

  const balance = Number(buyer?.points_balance ?? buyer?.pointsBalance ?? 0);
  const totalEarned = Number(buyer?.total_points_earned ?? buyer?.totalPointsEarned ?? 0);
  const totalUsed = Number(buyer?.total_points_used ?? buyer?.totalPointsUsed ?? 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">내 포인트</h1>
        <p className="text-sm text-gray-500 mt-1">
          적립하고 사용하는 포인트를 확인하세요
        </p>
      </div>

      {/* Dark Balance Card */}
      <div className="bg-gray-900 text-white rounded-2xl p-6">
        <p className="text-sm text-gray-400">보유 포인트</p>
        <p className="text-3xl font-bold text-white mt-1">
          {balance.toLocaleString()} P
        </p>
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-700">
          <p className="text-sm text-gray-400">
            총 적립 <span className="text-white font-medium">{totalEarned.toLocaleString()}P</span>
          </p>
          <p className="text-sm text-gray-400">
            총 사용 <span className="text-white font-medium">{totalUsed.toLocaleString()}P</span>
          </p>
        </div>
      </div>

      {/* How to Earn Points */}
      <div>
        <h2 className="text-sm font-bold text-gray-900 mb-3">포인트 적립 방법</h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <Star className="h-5 w-5 text-yellow-500 mb-2" />
            <p className="text-sm font-semibold text-gray-900">리뷰 작성</p>
            <p className="text-xs text-gray-400 mt-1">텍스트 리뷰 500P</p>
            <p className="text-xs text-gray-400">인스타그램 리뷰 1,000P</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <Users className="h-5 w-5 text-blue-500 mb-2" />
            <p className="text-sm font-semibold text-gray-900">친구 추천</p>
            <p className="text-xs text-gray-400 mt-1">친구 1명 가입 시 1,000P</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <Gift className="h-5 w-5 text-green-500 mb-2" />
            <p className="text-sm font-semibold text-gray-900">이벤트 참여</p>
            <p className="text-xs text-gray-400 mt-1">프로모션 참여 시 보너스 적립</p>
          </div>
        </div>
      </div>

      {/* Points History */}
      <div>
        <h2 className="text-sm font-bold text-gray-900 mb-3">포인트 내역</h2>
        {history.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="py-10 text-center">
              <Gift className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-sm font-semibold text-gray-900 mb-1">
                아직 포인트 내역이 없어요
              </p>
              <p className="text-xs text-gray-400">
                리뷰를 작성하거나 이벤트에 참여해 포인트를 적립하세요
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
            {history.map((item) => {
              const amount = Number(item.amount);
              const isPositive = amount > 0;

              return (
                <div key={item.id} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                      isPositive ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-500'
                    }`}>
                      {getTypeIcon(item.pointType || item.type || '')}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {getTypeLabel(item.pointType || item.type || '')}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(item.createdAt).toLocaleDateString('ko-KR')}
                        {item.description && ` · ${item.description}`}
                      </p>
                    </div>
                  </div>
                  <p className={`text-sm font-bold ${
                    isPositive ? 'text-blue-600' : 'text-red-500'
                  }`}>
                    {isPositive ? '+' : ''}{amount.toLocaleString()}P
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
