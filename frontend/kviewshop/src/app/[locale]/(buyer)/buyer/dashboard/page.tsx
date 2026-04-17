'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@/lib/hooks/use-user';
import { getBuyerHomeData } from '@/lib/actions/buyer';
import { Button } from '@/components/ui/button';
import { Package, ChevronRight, Gift, Truck, Loader2 } from 'lucide-react';
import { getCourierLabel, getTrackingUrl } from '@/lib/utils/courier';

const STATUS_LABELS: Record<string, string> = {
  PAID: '결제완료',
  PREPARING: '상품준비중',
  SHIPPING: '배송중',
  DELIVERED: '배송완료',
  CONFIRMED: '구매확정',
  CANCELLED: '취소',
  REFUNDED: '환불',
};

const STATUS_COLORS: Record<string, string> = {
  PAID: 'bg-gray-100 text-gray-600',
  PREPARING: 'bg-amber-50 text-amber-600',
  SHIPPING: 'bg-blue-50 text-blue-600',
  DELIVERED: 'bg-emerald-50 text-emerald-600',
  CONFIRMED: 'bg-emerald-50 text-emerald-600',
  CANCELLED: 'bg-red-50 text-red-600',
  REFUNDED: 'bg-red-50 text-red-600',
};

interface RecentOrder {
  id: string;
  orderNumber: string | null;
  totalAmount: number;
  status: string;
  createdAt: string;
  trackingNumber: string | null;
  courierCode: string | null;
  productName: string | null;
  productImage: string | null;
  itemCount: number;
  unitPrice: number;
  quantity: number;
}

interface HomeData {
  recentOrders: RecentOrder[];
  activeCount: number;
  statusCounts: Record<string, number>;
  pointsBalance: number;
}

export default function BuyerDashboardPage() {
  const { user, buyer, isLoading: isUserLoading } = useUser();
  const params = useParams();
  const locale = params.locale as string;
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [data, setData] = useState<HomeData | null>(null);
  const fetchedRef = useRef(false);

  const buyerId = buyer?.id;

  useEffect(() => {
    if (isUserLoading || !buyerId || fetchedRef.current) return;
    fetchedRef.current = true;

    const loadData = async () => {
      try {
        const result = await getBuyerHomeData(buyerId);
        setData(result);
      } catch (error) {
        console.error('대시보드 데이터 로드 실패:', error);
      } finally {
        setIsDataLoading(false);
      }
    };

    loadData();
  }, [isUserLoading, buyerId]);

  const isLoading = isUserLoading || isDataLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const displayName = buyer?.nickname || user?.name || '고객';
  const shippingCount = data?.statusCounts?.['SHIPPING'] ?? 0;

  return (
    <div className="space-y-6 max-w-lg mx-auto pb-20">
      {/* Greeting */}
      <div className="px-1">
        <p className="text-lg font-semibold">
          안녕하세요, {displayName}님
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Active Orders Card */}
        <Link href={`/${locale}/buyer/orders`}>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <Package className="h-5 w-5 text-blue-500" />
              <ChevronRight className="h-4 w-4 text-gray-300" />
            </div>
            <p className="text-2xl font-bold">{data?.activeCount ?? 0}</p>
            <p className="text-sm text-gray-500 mt-1">진행 중 주문</p>
            {shippingCount > 0 && (
              <p className="text-xs text-blue-500 mt-1">배송중 {shippingCount}</p>
            )}
          </div>
        </Link>

        {/* Points Card */}
        <Link href={`/${locale}/buyer/points`}>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <Gift className="h-5 w-5 text-primary" />
              <ChevronRight className="h-4 w-4 text-gray-300" />
            </div>
            <p className="text-2xl font-bold">
              {(data?.pointsBalance ?? 0).toLocaleString()}
              <span className="text-base font-medium ml-0.5">P</span>
            </p>
            <p className="text-sm text-gray-500 mt-1">보유 포인트</p>
          </div>
        </Link>
      </div>

      {/* Recent Orders Section */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-base font-semibold">최근 주문</h2>
          <Link
            href={`/${locale}/buyer/orders`}
            className="text-sm text-gray-400 flex items-center gap-0.5"
          >
            전체보기
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {!data?.recentOrders || data.recentOrders.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-200" />
            <p className="font-semibold text-gray-700 mb-1">
              아직 주문 내역이 없어요
            </p>
            <p className="text-sm text-gray-400 mb-5">
              크리에이터가 추천하는 상품을 구경해보세요
            </p>
            <Link href={`/${locale}/creators`}>
              <Button size="sm" variant="outline" className="rounded-full">
                쇼핑하러 가기
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {data.recentOrders.map((order) => {
              const trackingUrl = getTrackingUrl(order.courierCode, order.trackingNumber);
              return (
                <Link
                  key={order.id}
                  href={`/${locale}/buyer/orders/${order.id}`}
                  className="block bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex gap-3">
                    {/* Product Image */}
                    <div className="relative w-[60px] h-[60px] rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                      {order.productImage ? (
                        <Image
                          src={order.productImage}
                          alt={order.productName || '상품'}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-300" />
                        </div>
                      )}
                    </div>

                    {/* Order Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {order.productName || '상품'}
                        {order.itemCount > 1 && (
                          <span className="text-gray-400 font-normal">
                            {' '}외 {order.itemCount - 1}건
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {order.unitPrice.toLocaleString()}원
                        {order.quantity > 1 && ` x ${order.quantity}`}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {STATUS_LABELS[order.status] || order.status}
                        </span>
                        {order.status === 'SHIPPING' && order.courierCode && (
                          <span className="text-xs text-gray-400">
                            {getCourierLabel(order.courierCode)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Tracking Button */}
                    {order.status === 'SHIPPING' && trackingUrl && (
                      <div className="flex-shrink-0 self-center">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.open(trackingUrl, '_blank', 'noopener,noreferrer');
                          }}
                          className="p-2 rounded-full bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors"
                        >
                          <Truck className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
