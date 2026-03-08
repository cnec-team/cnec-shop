'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
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
  const { user, buyer } = useUser();
  const params = useParams();
  const locale = params.locale as string;
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!buyer) return;

      try {
        const data = await getBuyerDashboardData(buyer.id);
        setSubscriptions(data.subscriptions || []);
        setRecentOrders(data.recentOrders || []);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [buyer]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Orders',
      value: buyer?.total_orders || buyer?.totalOrders || 0,
      icon: ShoppingBag,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Points Balance',
      value: `${((buyer?.points_balance || buyer?.pointsBalance || 0) as number).toLocaleString()} P`,
      icon: Gift,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Subscriptions',
      value: subscriptions.length,
      icon: Heart,
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
    },
    {
      label: 'Reviews Written',
      value: buyer?.total_reviews || buyer?.totalReviews || 0,
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
            Welcome back, {buyer?.nickname || user?.name}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Discover new products from your favorite creators
          </p>
        </div>
        {(buyer?.eligible_for_creator || buyer?.eligibleForCreator) && (
          <Link href={`/${locale}/buyer/become-creator`}>
            <Button className="btn-gold gap-2">
              <Sparkles className="h-4 w-4" />
              Become a Creator
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
                My Subscriptions
              </CardTitle>
              <CardDescription>Creator shops you follow</CardDescription>
            </div>
            <Link href={`/${locale}/buyer/subscriptions`}>
              <Button variant="ghost" size="sm">
                View All <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {subscriptions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Heart className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No subscriptions yet</p>
                <p className="text-sm">Discover amazing creator shops!</p>
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
                Recent Orders
              </CardTitle>
              <CardDescription>Your latest purchases</CardDescription>
            </div>
            <Link href={`/${locale}/buyer/orders`}>
              <Button variant="ghost" size="sm">
                View All <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No orders yet</p>
                <p className="text-sm">Start shopping from creator malls!</p>
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
                        {order.status}
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
            <h3 className="font-semibold">Earn More Points!</h3>
            <p className="text-sm text-muted-foreground">
              Write a review and earn 500P. Share on Instagram and get 1,000P!
            </p>
          </div>
          <Link href={`/${locale}/buyer/reviews`}>
            <Button variant="outline">Write Review</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
