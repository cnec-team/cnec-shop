'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@/lib/hooks/use-user';
import { getBuyerOrders } from '@/lib/actions/buyer';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  ShoppingBag,
  ChevronRight,
  Search,
  Loader2,
  Star,
  RefreshCw,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { getTrackingUrl, getCourierLabel } from '@/lib/utils/courier';

const statusConfig: Record<string, { icon: typeof Clock; color: string; bgColor: string; label: string }> = {
  PENDING: { icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-500/10', label: '결제대기' },
  PAID: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-500/10', label: '결제완료' },
  PREPARING: { icon: Package, color: 'text-blue-600', bgColor: 'bg-blue-500/10', label: '배송준비중' },
  SHIPPING: { icon: Truck, color: 'text-purple-600', bgColor: 'bg-purple-500/10', label: '배송중' },
  DELIVERED: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-500/10', label: '배송완료' },
  CONFIRMED: { icon: CheckCircle, color: 'text-green-700', bgColor: 'bg-green-600/10', label: '구매확정' },
  CANCELLED: { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-500/10', label: '주문취소' },
  REFUNDED: { icon: XCircle, color: 'text-gray-600', bgColor: 'bg-gray-500/10', label: '환불완료' },
};

type TabKey = 'all' | 'paid' | 'preparing' | 'shipping' | 'delivered' | 'cancelled';

const TABS: { key: TabKey; label: string; statuses: string[] }[] = [
  { key: 'all', label: '전체', statuses: [] },
  { key: 'paid', label: '결제완료', statuses: ['PAID'] },
  { key: 'preparing', label: '배송준비', statuses: ['PREPARING'] },
  { key: 'shipping', label: '배송중', statuses: ['SHIPPING'] },
  { key: 'delivered', label: '배송완료', statuses: ['DELIVERED', 'CONFIRMED'] },
  { key: 'cancelled', label: '취소/환불', statuses: ['CANCELLED', 'REFUNDED'] },
];

export default function BuyerOrdersPage() {
  const params = useParams();
  const locale = params.locale as string;
  const { buyer } = useUser();

  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!buyer || fetchedRef.current) return;
    fetchedRef.current = true;

    const loadOrders = async () => {
      try {
        const ordersData = await getBuyerOrders(buyer.id);
        setOrders(ordersData || []);
      } catch (error) {
        console.error('Failed to load orders:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, [buyer]);

  // Count per tab
  const tabCounts = useMemo(() => {
    const counts: Record<TabKey, number> = { all: 0, paid: 0, preparing: 0, shipping: 0, delivered: 0, cancelled: 0 };
    for (const order of orders) {
      counts.all++;
      for (const tab of TABS) {
        if (tab.key !== 'all' && tab.statuses.includes(order.status)) {
          counts[tab.key]++;
        }
      }
    }
    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    let filtered = orders;

    // Filter by tab
    const tab = TABS.find((t) => t.key === activeTab);
    if (tab && tab.statuses.length > 0) {
      filtered = filtered.filter((o) => tab.statuses.includes(o.status));
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.orderNumber?.toLowerCase().includes(query) ||
          o.creator?.displayName?.toLowerCase().includes(query) ||
          o.items?.some((item: any) => (item.productName || item.product?.name || '').toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [activeTab, searchQuery, orders]);

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return '₩' + Number(amount).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold flex items-center gap-3">
          <Package className="h-8 w-8" />
          주문내역
        </h1>
        <p className="text-muted-foreground mt-1">
          주문 현황을 확인하세요
        </p>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="주문번호, 상품명으로 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const count = tabCounts[tab.key];
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`text-xs ${isActive ? 'opacity-80' : 'opacity-60'}`}>
                  ({count})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16">
            <ShoppingBag className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h2 className="text-xl font-semibold mb-2">주문 내역이 없어요</h2>
            <p className="text-muted-foreground mb-6">
              {activeTab === 'all'
                ? '아직 주문하신 내역이 없어요'
                : '해당하는 주문이 없어요'}
            </p>
            <Link href={'/' + locale + '/buyer/subscriptions'}>
              <Button>쇼핑하러 가기</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const status = statusConfig[order.status] || statusConfig.PENDING;
            const StatusIcon = status.icon;
            const trackingUrl = getTrackingUrl(order.courierCode, order.trackingNumber);

            return (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader className="pb-3 bg-muted/30">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">주문번호</p>
                        <p className="font-mono font-semibold">{order.orderNumber}</p>
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-sm text-muted-foreground">주문일</p>
                        <p className="font-medium">{formatDate(order.createdAt)}</p>
                      </div>
                    </div>
                    <Badge className={status.bgColor + ' ' + status.color + ' border-0'}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {status.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {/* Creator Info */}
                  {order.creator && (
                    <Link
                      href={'/' + locale + '/@' + (order.creator.shopId || order.creator.username)}
                      className="flex items-center gap-2 mb-4 text-sm hover:text-primary transition-colors"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: order.creator.themeColor || order.creator.backgroundColor || '#000' }}
                      />
                      <span>{order.creator.displayName || order.creator.shopId || order.creator.username}</span>
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  )}

                  {/* Order Items */}
                  <div className="space-y-3">
                    {order.items?.slice(0, 3).map((item: any) => {
                      const itemName = item.productName || item.product?.name || '상품';
                      const itemImage = item.productImage || item.product?.imageUrl;
                      return (
                        <div key={item.id} className="flex gap-3">
                          <div className="relative w-16 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                            {itemImage ? (
                              <Image
                                src={itemImage}
                                alt={itemName}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ShoppingBag className="h-6 w-6 text-muted-foreground/50" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{itemName}</p>
                            <p className="text-sm text-muted-foreground">
                              수량: {item.quantity} x {formatCurrency(Number(item.unitPrice))}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    {order.items && order.items.length > 3 && (
                      <p className="text-sm text-muted-foreground">
                        외 {order.items.length - 3}건
                      </p>
                    )}
                  </div>

                  {/* Tracking Info */}
                  {order.trackingNumber && (
                    <div className="mt-4 p-3 bg-muted/50 rounded-lg flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {getCourierLabel(order.courierCode)} {order.trackingNumber}
                        </p>
                      </div>
                      {trackingUrl && (
                        <a href={trackingUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="gap-1 text-purple-600">
                            <Truck className="h-3 w-3" />
                            배송 조회
                          </Button>
                        </a>
                      )}
                    </div>
                  )}

                  {/* Order Total and Actions */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground">결제금액</p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(Number(order.totalAmount))}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {/* Status-based CTA buttons */}
                      {['PAID', 'PREPARING'].includes(order.status) && (
                        <Button variant="outline" size="sm" className="gap-1 text-muted-foreground">
                          주문 취소 문의
                        </Button>
                      )}
                      {order.status === 'SHIPPING' && trackingUrl && (
                        <a href={trackingUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="gap-1 text-purple-600 border-purple-200">
                            <Truck className="h-4 w-4" />
                            배송 조회
                          </Button>
                        </a>
                      )}
                      {order.status === 'DELIVERED' && (
                        <>
                          <Link href={'/' + locale + '/buyer/reviews?orderId=' + order.id}>
                            <Button size="sm" className="gap-1">
                              <Star className="h-4 w-4" />
                              리뷰 작성
                            </Button>
                          </Link>
                        </>
                      )}
                      {order.status === 'CONFIRMED' && (
                        <Link href={'/' + locale + '/@' + (order.creator?.shopId || order.creator?.username || '')}>
                          <Button variant="outline" size="sm" className="gap-1">
                            <RefreshCw className="h-4 w-4" />
                            재구매
                          </Button>
                        </Link>
                      )}
                      <Link href={'/' + locale + '/buyer/orders/' + order.id}>
                        <Button variant="ghost" size="sm">
                          상세보기
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
