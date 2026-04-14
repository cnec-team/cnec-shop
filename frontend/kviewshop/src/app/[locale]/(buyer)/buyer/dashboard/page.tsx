'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/lib/hooks/use-user';
import { getBuyerDashboardData } from '@/lib/actions/buyer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ShoppingBag,
  Heart,
  Gift,
  Star,
  TrendingUp,
  Package,
  ChevronRight,
  Loader2,
  Sparkles,
} from 'lucide-react';

export default function BuyerDashboardPage() {
  const { user, buyer, isLoading: isUserLoading } = useUser();
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [redirected, setRedirected] = useState(false);

  useEffect(() => {
    // 유저 로딩이 끝날 때까지 대기
    if (isUserLoading) return;

    // 비로그인 상태면 로그인 페이지로 리다이렉트 (무한 API 호출 방지)
    if (!user || !buyer) {
      if (!redirected) {
        setRedirected(true);
        router.replace(`/${locale}/buyer/login`);
      }
      setIsDataLoading(false);
      return;
    }

    const loadDashboardData = async () => {
      try {
        const data = await getBuyerDashboardData(buyer.id);
        setSubscriptions(data.subscriptions || []);
        setRecentOrders(data.recentOrders || []);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsDataLoading(false);
      }
    };

    loadDashboardData();
  }, [buyer, isUserLoading]);

  const isLoading = isUserLoading || isDataLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const ORDER_STATUS_LABELS: Record<string, string> = {
    PENDING: '결제대기',
    PAID: '결제완료',
    PREPARING: '배송준비',
    SHIPPING: '배송중',
    DELIVERED: '배송완료',
    CONFIRMED: '구매확정',
    CANCELLED: '취소',
    REFUNDED: '환불',
  };

  const statCards = [
    {
      label: '총 주문',
      value: (buyer?.totalOrders ?? buyer?.total_orders ?? 0),
      icon: ShoppingBag,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: '포인트',
      value: `${(Number(buyer?.pointsBalance ?? buyer?.points_balance ?? 0)).toLocaleString()} P`,
      icon: Gift,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: '구독',
      value: subscriptions.length,
      icon: Heart,
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
    },
    {
      label: '작성한 리뷰',
      value: (buyer?.totalReviews ?? buyer?.total_reviews ?? 0),
      icon: Star,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
      case 'DELIVERED':
        return 'bg-green-500/10 text-green-500';
      case 'SHIPPING':
        return 'bg-blue-500/10 text-blue-500';
      case 'PAID':
      case 'PREPARING':
        return 'bg-purple-500/10 text-purple-500';
      case 'PENDING':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'CANCELLED':
      case 'REFUNDED':
        return 'bg-red-500/10 text-red-500';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold">
            {buyer?.nickname || user?.name}님, 안녕하세요!
          </h1>
          <p className="text-muted-foreground mt-1">
            크리에이터 추천 제품을 만나보세요
          </p>
        </div>
        {(buyer?.eligibleForCreator ?? buyer?.eligible_for_creator ?? false) && (
          <Link href={`/${locale}/buyer/become-creator`}>
            <Button className="btn-gold gap-2">
              <Sparkles className="h-4 w-4" />
              크리에이터 되기
            </Button>
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Subscribed Malls */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-pink-500" />
                구독 중인 샵
              </CardTitle>
              <CardDescription>팔로우 중인 크리에이터 샵</CardDescription>
            </div>
            <Link href={`/${locale}/buyer/subscriptions`}>
              <Button variant="ghost" size="sm">
                전체 보기 <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {subscriptions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Heart className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>아직 구독한 샵이 없어요</p>
                <p className="text-sm">크리에이터 샵을 둘러보세요!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {subscriptions.map((sub: any) => (
                  <Link
                    key={sub.id}
                    href={`/${locale}/@${sub.creator.shopId || sub.creator.username}`}
                    className="group"
                  >
                    <div className="p-4 rounded-lg border border-border/50 hover:border-primary/50 transition-colors text-center">
                      <Avatar className="h-12 w-12 mx-auto mb-2 ring-2 ring-offset-2 ring-offset-background"
                        style={{ ['--ring-color' as any]: sub.creator.themeColor || sub.creator.backgroundColor }}
                      >
                        <AvatarImage src={sub.creator.profileImageUrl || ''} />
                        <AvatarFallback
                          style={{ backgroundColor: sub.creator.themeColor || sub.creator.backgroundColor || '#666' }}
                          className="text-white"
                        >
                          {sub.creator.displayName?.charAt(0) || (sub.creator.shopId || sub.creator.username || 'C').charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-medium text-sm truncate group-hover:text-primary">
                        {sub.creator.displayName || sub.creator.shopId || sub.creator.username}
                      </p>
                      <p className="text-xs text-muted-foreground">@{sub.creator.shopId || sub.creator.username}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-500" />
                최근 주문
              </CardTitle>
              <CardDescription>최근 구매 내역</CardDescription>
            </div>
            <Link href={`/${locale}/buyer/orders`}>
              <Button variant="ghost" size="sm">
                전체 보기 <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>아직 주문 내역이 없어요</p>
                <p className="text-sm">크리에이터 샵에서 쇼핑을 시작해보세요!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order: any) => (
                  <Link
                    key={order.id}
                    href={`/${locale}/buyer/orders/${order.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:border-primary/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-sm">{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {Number(order.totalAmount).toLocaleString()}
                      </p>
                      <Badge variant="secondary" className={getStatusColor(order.status)}>
                        {ORDER_STATUS_LABELS[order.status] || order.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Points Earning Tip */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="flex items-center gap-4 pt-6">
          <div className="p-3 rounded-full bg-primary/20">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">더 많은 포인트를 모으세요!</h3>
            <p className="text-sm text-muted-foreground">
              리뷰 작성 500P, 인스타그램 공유 1,000P 적립!
            </p>
          </div>
          <Link href={`/${locale}/buyer/reviews`}>
            <Button variant="outline">리뷰 쓰기</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
