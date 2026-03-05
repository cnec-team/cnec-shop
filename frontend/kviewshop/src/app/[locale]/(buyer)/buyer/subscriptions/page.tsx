'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/lib/hooks/use-user';
import { getClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
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
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';

interface Subscription {
  id: string;
  status: 'active' | 'paused' | 'cancelled';
  notify_new_products: boolean;
  notify_sales: boolean;
  notify_live_streams: boolean;
  subscribed_at: string;
  creator: {
    id: string;
    shop_id: string | null;
    username: string | null;
    display_name: string;
    profile_image: string | null;
    profile_image_url: string | null;
    theme_color: string | null;
    background_color: string | null;
    bio: string | null;
  };
}

export default function BuyerSubscriptionsPage() {
  const { buyer } = useUser();
  const params = useParams();
  const locale = params.locale as string;
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const loadSubscriptions = async () => {
      if (!buyer) return;

      try {
        const supabase = getClient();
        const { data, error } = await supabase
          .from('mall_subscriptions')
          .select(`
            *,
            creator:creators (
              id,
              shop_id,
              username,
              display_name,
              profile_image,
              profile_image_url,
              theme_color,
              background_color,
              bio
            )
          `)
          .eq('buyer_id', buyer.id)
          .order('subscribed_at', { ascending: false });

        if (error) throw error;
        setSubscriptions(data || []);
      } catch (error) {
        console.error('Failed to load subscriptions:', error);
        toast.error('Failed to load subscriptions');
      } finally {
        setIsLoading(false);
      }
    };

    loadSubscriptions();
  }, [buyer]);

  const handleUpdateNotifications = async (
    subId: string,
    field: 'notify_new_products' | 'notify_sales' | 'notify_live_streams',
    value: boolean
  ) => {
    try {
      const supabase = getClient();
      await supabase
        .from('mall_subscriptions')
        .update({ [field]: value })
        .eq('id', subId);

      setSubscriptions(subs =>
        subs.map(s => s.id === subId ? { ...s, [field]: value } : s)
      );
      toast.success('Notification settings updated');
    } catch (error) {
      toast.error('Failed to update settings');
    }
  };

  const handleUnsubscribe = async (subId: string) => {
    try {
      const supabase = getClient();
      await supabase
        .from('mall_subscriptions')
        .update({ status: 'cancelled', unsubscribed_at: new Date().toISOString() })
        .eq('id', subId);

      setSubscriptions(subs => subs.filter(s => s.id !== subId));
      toast.success('Unsubscribed successfully');
    } catch (error) {
      toast.error('Failed to unsubscribe');
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
          {subscriptions.map((sub) => (
            <Card key={sub.id} className="overflow-hidden">
              <div
                className="h-2"
                style={{ backgroundColor: sub.creator.theme_color || sub.creator.background_color || '#666' }}
              />
              <CardHeader className="pb-2">
                <div className="flex items-start gap-4">
                  <Link href={`/${locale}/@${sub.creator.shop_id || sub.creator.username}`}>
                    <Avatar className="h-14 w-14 ring-2 ring-offset-2"
                      style={{ ['--tw-ring-color' as any]: sub.creator.theme_color || sub.creator.background_color }}
                    >
                      <AvatarImage src={sub.creator.profile_image_url || sub.creator.profile_image || ''} />
                      <AvatarFallback
                        style={{ backgroundColor: sub.creator.theme_color || sub.creator.background_color || '#666' }}
                        className="text-white text-lg"
                      >
                        {sub.creator.display_name?.charAt(0) || (sub.creator.shop_id || sub.creator.username || 'C').charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/${locale}/@${sub.creator.shop_id || sub.creator.username}`}
                      className="font-semibold hover:text-primary transition-colors"
                    >
                      {sub.creator.display_name || sub.creator.shop_id || sub.creator.username}
                    </Link>
                    <p className="text-sm text-muted-foreground">@{sub.creator.shop_id || sub.creator.username}</p>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      Since {new Date(sub.subscribed_at).toLocaleDateString()}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/${locale}/@${sub.creator.shop_id || sub.creator.username}`}>
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {sub.creator.bio && (
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
                        'notify_new_products',
                        !sub.notify_new_products
                      )}
                      className={`p-2 rounded-lg text-xs flex flex-col items-center gap-1 transition-colors ${
                        sub.notify_new_products
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
                        'notify_sales',
                        !sub.notify_sales
                      )}
                      className={`p-2 rounded-lg text-xs flex flex-col items-center gap-1 transition-colors ${
                        sub.notify_sales
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <Bell className="h-4 w-4" />
                      Sales
                    </button>
                    <button
                      onClick={() => handleUpdateNotifications(
                        sub.id,
                        'notify_live_streams',
                        !sub.notify_live_streams
                      )}
                      className={`p-2 rounded-lg text-xs flex flex-col items-center gap-1 transition-colors ${
                        sub.notify_live_streams
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <Video className="h-4 w-4" />
                      Live
                    </button>
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
