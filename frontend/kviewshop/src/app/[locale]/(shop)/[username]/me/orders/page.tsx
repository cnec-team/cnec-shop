'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@/lib/hooks/use-user';
import { getBuyerOrdersWithFilters } from '@/lib/actions/buyer';
import { PageHeader } from '@/components/shop/PageHeader';
import { EmptyState } from '@/components/shop/EmptyState';
import { Button } from '@/components/ui/button';
import { Package, Truck, ChevronRight, Loader2, User, Search, MessageCircle, Star, ShoppingBag, RotateCcw } from 'lucide-react';
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
  PAID: 'bg-blue-50 text-blue-600',
  PREPARING: 'bg-amber-50 text-amber-600',
  SHIPPING: 'bg-purple-50 text-purple-600',
  DELIVERED: 'bg-emerald-50 text-emerald-600',
  CONFIRMED: 'bg-emerald-50 text-emerald-600',
  CANCELLED: 'bg-gray-100 text-gray-500',
  REFUNDED: 'bg-gray-100 text-gray-500',
};

interface OrderItem {
  id: string;
  productName: string;
  productImage: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Order {
  id: string;
  orderNumber: string | null;
  totalAmount: number;
  shippingFee: number;
  status: string;
  createdAt: string;
  trackingNumber: string | null;
  courierCode: string | null;
  items: OrderItem[];
}

interface FilterTab {
  key: string;
  label: string;
}

const FILTER_TABS: FilterTab[] = [
  { key: 'all', label: '전체' },
  { key: 'PAID', label: '결제완료' },
  { key: 'PREPARING', label: '준비중' },
  { key: 'SHIPPING', label: '배송중' },
  { key: 'DELIVERED', label: '배송완료' },
  { key: 'CANCELLED', label: '취소/교환' },
];

function groupByDate(orders: Order[]): { date: string; orders: Order[] }[] {
  const groups: { date: string; orders: Order[] }[] = [];
  for (const order of orders) {
    const dateStr = new Date(order.createdAt).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const existing = groups.find((g) => g.date === dateStr);
    if (existing) existing.orders.push(order);
    else groups.push({ date: dateStr, orders: [order] });
  }
  return groups;
}

export default function ShopOrdersListPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = params.locale as string;
  const username = params.username as string;
  const { user, buyer, isLoading: isUserLoading } = useUser();

  const initialStatus = searchParams.get('status') || 'all';
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [totalCount, setTotalCount] = useState(0);
  const [activeTab, setActiveTab] = useState(initialStatus);
  const fetchedRef = useRef(false);

  const buyerId = buyer?.id;

  const loadOrders = useCallback(
    async (status: string) => {
      if (!buyerId) return;
      setIsLoading(true);
      try {
        const result = await getBuyerOrdersWithFilters(buyerId, status);
        setOrders(result.orders);
        setStatusCounts(result.statusCounts);
        setTotalCount(result.totalCount);
      } catch (error: any) {
        console.error('주문 데이터 로드 실패:', {
          message: error?.message,
          stack: error?.stack,
          cause: error?.cause,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [buyerId]
  );

  useEffect(() => {
    if (!buyerId || fetchedRef.current) return;
    fetchedRef.current = true;
    loadOrders(initialStatus);
  }, [buyerId, loadOrders, initialStatus]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    loadOrders(tab);
  };

  const getTabCount = (key: string): number => {
    if (key === 'all') return totalCount;
    return statusCounts[key] ?? 0;
  };

  // Not logged in
  if (!isUserLoading && !user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <h1 className="text-lg font-bold text-gray-900 mb-2">로그인이 필요해요</h1>
        <p className="text-sm text-gray-400 mb-6">
          주문내역을 확인하려면 로그인하세요
        </p>
        <div className="space-y-3">
          <Link
            href={`/${locale}/buyer/login?returnUrl=${encodeURIComponent(`/${locale}/${username}/me/orders`)}`}
            className="inline-flex items-center justify-center h-12 px-8 bg-gray-900 text-white rounded-xl font-semibold text-sm w-full max-w-xs"
          >
            로그인
          </Link>
          <Link
            href={`/${locale}/${username}/orders/lookup`}
            className="inline-flex items-center justify-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
          >
            <Search className="w-4 h-4" />
            비회원 주문 조회
          </Link>
        </div>
      </div>
    );
  }

  const dateGroups = groupByDate(orders);

  if (isUserLoading || (isLoading && orders.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="pb-4">
      <PageHeader
        title="주문내역"
        subtitle="주문하신 상품의 배송 현황을 확인하세요"
        backLink={`/${locale}/${username}/me`}
      />

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        {/* Status Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {FILTER_TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const count = getTabCount(tab.key);
            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                  isActive
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Loading overlay */}
        {isLoading && orders.length > 0 && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        )}

        {/* Orders List */}
        {!isLoading && orders.length === 0 ? (
          <EmptyState
            icon={Package}
            title={activeTab === 'all' ? '아직 주문내역이 없어요' : '해당하는 주문이 없어요'}
            description="크리에이터가 추천하는 상품을 구경해보세요"
            actionLabel="샵 둘러보기"
            actionHref={`/${locale}/${username}`}
          />
        ) : (
          <div className="space-y-6">
            {dateGroups.map((group) => (
              <div key={group.date}>
                <p className="text-xs text-gray-400 font-medium mb-2 px-1">
                  {group.date}
                </p>
                <div className="space-y-3">
                  {group.orders.map((order) => {
                    const trackingUrl = getTrackingUrl(order.courierCode, order.trackingNumber);
                    return (
                      <div
                        key={order.id}
                        className="bg-white rounded-2xl border border-gray-100 p-4"
                      >
                        {/* Order Number */}
                        <p className="text-xs text-gray-400 mb-3">{order.orderNumber}</p>

                        {/* Items */}
                        <div className="space-y-3">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex gap-3">
                              <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                                {item.productImage ? (
                                  <Image
                                    src={item.productImage}
                                    alt={item.productName}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package className="h-6 w-6 text-gray-300" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{item.productName}</p>
                                <p className="text-sm text-gray-500 mt-0.5">
                                  {item.unitPrice.toLocaleString()}원
                                  {item.quantity > 1 && ` x ${item.quantity}`}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Status + Actions */}
                        <div className="mt-3 pt-3 border-t border-gray-50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {STATUS_LABELS[order.status] || order.status}
                              </span>
                              {order.status === 'SHIPPING' && order.courierCode && (
                                <span className="text-xs text-gray-400">
                                  {getCourierLabel(order.courierCode)} {order.trackingNumber}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Action buttons by status */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link href={`/${locale}/${username}/me/orders/${order.id}`}>
                              <Button variant="outline" size="sm" className="text-xs h-8 rounded-full gap-1">
                                주문상세
                                <ChevronRight className="h-3 w-3" />
                              </Button>
                            </Link>

                            {order.status === 'SHIPPING' && trackingUrl && (
                              <a href={trackingUrl} target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="sm" className="text-xs h-8 gap-1 rounded-full">
                                  <Truck className="h-3 w-3" />
                                  배송조회
                                </Button>
                              </a>
                            )}

                            {['PAID', 'PREPARING', 'SHIPPING'].includes(order.status) && (
                              <Link href={`/${locale}/${username}/me/orders/${order.id}/inquiry`}>
                                <Button variant="outline" size="sm" className="text-xs h-8 gap-1 rounded-full">
                                  <MessageCircle className="h-3 w-3" />
                                  1:1 문의
                                </Button>
                              </Link>
                            )}

                            {['DELIVERED', 'CONFIRMED'].includes(order.status) && (
                              <>
                                <Link href={`/${locale}/${username}/me/orders/${order.id}/review/write`}>
                                  <Button variant="outline" size="sm" className="text-xs h-8 gap-1 rounded-full">
                                    <Star className="h-3 w-3" />
                                    후기 작성
                                  </Button>
                                </Link>
                                <Link href={`/${locale}/${username}/me/orders/${order.id}/inquiry`}>
                                  <Button variant="outline" size="sm" className="text-xs h-8 gap-1 rounded-full">
                                    <MessageCircle className="h-3 w-3" />
                                    1:1 문의
                                  </Button>
                                </Link>
                              </>
                            )}

                            {['CANCELLED', 'REFUNDED'].includes(order.status) && (
                              <Link href={`/${locale}/${username}`}>
                                <Button variant="outline" size="sm" className="text-xs h-8 gap-1 rounded-full">
                                  <ShoppingBag className="h-3 w-3" />
                                  재구매
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
