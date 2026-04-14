'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/lib/hooks/use-user';
import { getBuyerSubscriptions, updateSubscriptionNotifications, unsubscribeFromCreator } from '@/lib/actions/buyer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Heart,
  Bell,
  BellOff,
  ShoppingBag,
  Video,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

export default function BuyerSubscriptionsPage() {
  const { buyer } = useUser();
  const params = useParams();
  const locale = params.locale as string;
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);

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

  const handleUpdateNotifications = async (
    subId: string,
    field: 'notifyNewProducts' | 'notifySales',
    value: boolean
  ) => {
    try {
      await updateSubscriptionNotifications(subId, field, value);
      setSubscriptions(subs =>
        subs.map(s => s.id === subId ? { ...s, [field]: value } : s)
      );
      toast.success('알림 설정이 변경되었습니다');
    } catch (error) {
      toast.error('설정 변경에 실패했습니다');
    }
  };

  const handleUnsubscribe = async (subId: string) => {
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold flex items-center gap-2">
          <Heart className="h-8 w-8 text-pink-500" />
          My Subscriptions
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your subscribed creator malls
        </p>
      </div>

      {subscriptions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Heart className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No subscriptions yet</h3>
            <p className="text-muted-foreground mb-4">
              Discover amazing creator shops and subscribe to get updates!
            </p>
            <Button asChild>
              <Link href={`/${locale}`}>Explore Shops</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {subscriptions.map((sub: any) => (
            <Card key={sub.id} className="overflow-hidden">
              <div
                className="h-2"
                style={{ backgroundColor: sub.creator?.themeColor || sub.creator?.backgroundColor || '#666' }}
              />
              <CardHeader className="pb-2">
                <div className="flex items-start gap-4">
                  <Link href={`/${locale}/@${sub.creator?.shopId || sub.creator?.username}`}>
                    <Avatar className="h-14 w-14 ring-2 ring-offset-2"
                      style={{ ['--tw-ring-color' as any]: sub.creator?.themeColor || sub.creator?.backgroundColor }}
                    >
                      <AvatarImage src={sub.creator?.profileImageUrl || ''} />
                      <AvatarFallback
                        style={{ backgroundColor: sub.creator?.themeColor || sub.creator?.backgroundColor || '#666' }}
                        className="text-white text-lg"
                      >
                        {sub.creator?.displayName?.charAt(0) || (sub.creator?.shopId || sub.creator?.username || 'C').charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/${locale}/@${sub.creator?.shopId || sub.creator?.username}`}
                      className="font-semibold hover:text-primary transition-colors"
                    >
                      {sub.creator?.displayName || sub.creator?.shopId || sub.creator?.username}
                    </Link>
                    <p className="text-sm text-muted-foreground">@{sub.creator?.shopId || sub.creator?.username}</p>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      Since {new Date(sub.subscribedAt).toLocaleDateString()}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/${locale}/@${sub.creator?.shopId || sub.creator?.username}`}>
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {sub.creator?.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {sub.creator.bio}
                  </p>
                )}

                {/* Notification Settings */}
                <div className="space-y-3 pt-2 border-t">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Notifications
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleUpdateNotifications(
                        sub.id,
                        'notifyNewProducts',
                        !sub.notifyNewProducts
                      )}
                      className={`p-2 rounded-lg text-xs flex flex-col items-center gap-1 transition-colors ${
                        sub.notifyNewProducts
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <ShoppingBag className="h-4 w-4" />
                      Products
                    </button>
                    <button
                      onClick={() => handleUpdateNotifications(
                        sub.id,
                        'notifySales',
                        !sub.notifySales
                      )}
                      className={`p-2 rounded-lg text-xs flex flex-col items-center gap-1 transition-colors ${
                        sub.notifySales
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <Bell className="h-4 w-4" />
                      Sales
                    </button>
                    <div
                      className="p-2 rounded-lg text-xs flex flex-col items-center gap-1 bg-muted text-muted-foreground"
                    >
                      <Video className="h-4 w-4" />
                      Live
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-destructive hover:text-destructive"
                  onClick={() => handleUnsubscribe(sub.id)}
                >
                  <BellOff className="h-4 w-4 mr-2" />
                  Unsubscribe
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
