'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/lib/hooks/use-user';
import { getBuyerSubscriptions, unsubscribeFromCreator } from '@/lib/actions/buyer';
import { Button } from '@/components/ui/button';
import {
  Heart,
  Store,
  Loader2,
  UserMinus,
} from 'lucide-react';
import { toast } from 'sonner';

type Subscription = Awaited<ReturnType<typeof getBuyerSubscriptions>>[number];

export default function BuyerSubscriptionsPage() {
  const { buyer } = useUser();
  const params = useParams();
  const locale = params.locale as string;
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  const buyerId = buyer?.id;
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!buyerId || fetchedRef.current) return;
    fetchedRef.current = true;

    const loadSubscriptions = async () => {
      try {
        const data = await getBuyerSubscriptions(buyerId);
        setSubscriptions(data || []);
      } catch (error) {
        console.error('Failed to load subscriptions:', error);
        toast.error('구독 목록을 불러오는데 실패했습니다');
      } finally {
        setIsLoading(false);
      }
    };

    loadSubscriptions();
  }, [buyerId]);

  const handleUnsubscribe = async (subId: string) => {
    if (!confirm('정말 구독을 취소하시겠어요?')) return;

    try {
      await unsubscribeFromCreator(subId);
      setSubscriptions(subs => subs.filter(s => s.id !== subId));
      toast.success('구독이 해제되었습니다');
    } catch (error) {
      toast.error('구독 해제에 실패했습니다');
    }
  };

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
        <h1 className="text-xl font-bold text-gray-900">구독 중인 샵</h1>
        <p className="text-sm text-gray-500 mt-1">
          좋아하는 크리에이터 샵의 새 소식을 받아보세요
        </p>
      </div>

      {/* Count */}
      {subscriptions.length > 0 && (
        <p className="text-sm text-gray-500">
          구독 중 <span className="font-bold text-gray-900">{subscriptions.length}개</span>
        </p>
      )}

      {subscriptions.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="py-12 text-center">
            <div className="mx-auto w-12 h-12 flex items-center justify-center mb-4">
              <Heart className="h-12 w-12 text-gray-300" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              구독 중인 샵이 없어요
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              마음에 드는 크리에이터 샵을 찾아 구독해보세요!
            </p>
            <Button asChild className="bg-gray-900 text-white rounded-xl h-11 px-6">
              <Link href={`/${locale}/creators`}>크리에이터 샵 둘러보기</Link>
            </Button>
          </div>
        </div>
      ) : (
        /* Subscription Cards */
        <div className="space-y-3">
          {subscriptions.map((sub) => {
            const creator = sub.creator;
            const shopSlug = creator.shopId || creator.username;
            const displayName = creator.displayName || creator.shopId || creator.username || '';
            const initial = displayName.charAt(0) || 'S';

            return (
              <div
                key={sub.id}
                className="bg-white rounded-2xl border border-gray-100 p-5"
              >
                <div className="flex items-center gap-3">
                  {/* Profile Image */}
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                    {creator.profileImageUrl ? (
                      <img
                        src={creator.profileImageUrl}
                        alt={displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-bold text-gray-400">{initial}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      {displayName}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      @{shopSlug}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      asChild
                      className="bg-gray-900 text-white rounded-xl h-9 px-4 text-xs font-medium"
                    >
                      <Link href={`/${locale}/shop/${shopSlug}`}>
                        <Store className="h-3.5 w-3.5 mr-1.5" />
                        샵 보기
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      className="border-gray-200 rounded-xl h-9 px-3 text-xs font-medium text-gray-500 hover:text-red-500 hover:border-red-200"
                      onClick={() => handleUnsubscribe(sub.id)}
                    >
                      <UserMinus className="h-3.5 w-3.5 mr-1" />
                      구독 취소
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
