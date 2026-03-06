'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Bell,
  ShoppingCart,
  Truck,
  DollarSign,
  Megaphone,
  Info,
  Check,
  Loader2,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth';
import type { NotificationType } from '@/types/database';

interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link_url?: string;
  is_read: boolean;
  created_at: string;
}

const mockNotifications: NotificationItem[] = [
  {
    id: '1',
    type: 'ORDER',
    title: '새 주문 발생',
    message: '뷰티진 샵에서 하우파파 로션 1건이 판매되었습니다. 예상 수익: ₩3,705',
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: '2',
    type: 'CAMPAIGN',
    title: '공구 승인',
    message: '누씨오 특가전 캠페인 참여가 승인되었습니다.',
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: '3',
    type: 'SETTLEMENT',
    title: '정산 예정 안내',
    message: '1월 정산금 ₩45,200이 2월 20일에 지급됩니다.',
    is_read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: '4',
    type: 'SHIPPING',
    title: '배송 완료',
    message: '주문 CNEC-20260210-12345의 배송이 완료되었습니다.',
    is_read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: '5',
    type: 'CAMPAIGN',
    title: '새 공구 캠페인',
    message: '하우파파 3월 공구 캠페인이 오픈되었습니다. 내 수익 20%!',
    is_read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
];

const TABS: { value: string; label: string; type?: NotificationType }[] = [
  { value: 'all', label: '전체' },
  { value: 'ORDER', label: '주문', type: 'ORDER' },
  { value: 'SHIPPING', label: '배송', type: 'SHIPPING' },
  { value: 'SETTLEMENT', label: '정산', type: 'SETTLEMENT' },
  { value: 'CAMPAIGN', label: '캠페인', type: 'CAMPAIGN' },
  { value: 'SYSTEM', label: '시스템', type: 'SYSTEM' },
];

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'ORDER':
      return ShoppingCart;
    case 'SHIPPING':
      return Truck;
    case 'SETTLEMENT':
      return DollarSign;
    case 'CAMPAIGN':
      return Megaphone;
    case 'SYSTEM':
    default:
      return Info;
  }
}

function getNotificationColor(type: NotificationType) {
  switch (type) {
    case 'ORDER':
      return 'text-blue-500 bg-blue-500/10';
    case 'SHIPPING':
      return 'text-purple-500 bg-purple-500/10';
    case 'SETTLEMENT':
      return 'text-green-500 bg-green-500/10';
    case 'CAMPAIGN':
      return 'text-orange-500 bg-orange-500/10';
    case 'SYSTEM':
    default:
      return 'text-gray-500 bg-gray-500/10';
  }
}

function formatDate(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function CreatorNotificationsPage() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) {
      // Use mock data for MVP
      setNotifications(mockNotifications);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/notifications?userId=${user.id}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch {
      // Fallback to mock data on error
      setNotifications(mockNotifications);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (notification: NotificationItem) => {
    if (notification.is_read) return;

    if (user?.id) {
      try {
        await fetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationId: notification.id }),
        });
      } catch {
        console.error('Failed to mark notification as read');
      }
    }

    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
    );
  };

  const handleMarkAllRead = async () => {
    if (user?.id) {
      try {
        await fetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ markAllRead: true, userId: user.id }),
        });
      } catch {
        console.error('Failed to mark all as read');
      }
    }

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const filteredNotifications =
    activeTab === 'all'
      ? notifications
      : notifications.filter((n) => n.type === activeTab);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-headline font-bold flex items-center gap-2">
            <Bell className="h-6 w-6 sm:h-7 sm:w-7" />
            알림
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            주문, 배송, 정산, 캠페인 관련 알림을 확인하세요
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            className="shrink-0"
          >
            <Check className="h-4 w-4 mr-1" />
            모두 읽음으로 표시
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto overflow-x-auto">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-xs sm:text-sm">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* All tab content shares the same rendering logic */}
        {TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            {tab.value === activeTab && (
              <>
                {filteredNotifications.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 sm:py-16">
                      <div className="text-center">
                        <Bell className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/50" />
                        <p className="mt-4 text-muted-foreground text-sm sm:text-base">
                          알림이 없습니다
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {filteredNotifications.map((notification) => {
                      const Icon = getNotificationIcon(notification.type);
                      const colorClass = getNotificationColor(notification.type);
                      return (
                        <Card
                          key={notification.id}
                          className={`cursor-pointer transition-colors hover:bg-muted/30 ${
                            !notification.is_read ? 'border-primary/20 bg-primary/5' : ''
                          }`}
                          onClick={() => handleMarkAsRead(notification)}
                        >
                          <CardContent className="p-4 sm:p-5">
                            <div className="flex gap-3 sm:gap-4">
                              {/* Icon */}
                              <div
                                className={`shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${colorClass}`}
                              >
                                <Icon className="h-5 w-5" />
                              </div>

                              {/* Content */}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <h3
                                        className={`text-sm font-semibold truncate ${
                                          !notification.is_read
                                            ? 'text-foreground'
                                            : 'text-muted-foreground'
                                        }`}
                                      >
                                        {notification.title}
                                      </h3>
                                      {!notification.is_read && (
                                        <span className="shrink-0 h-2 w-2 rounded-full bg-blue-500" />
                                      )}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {notification.message}
                                    </p>
                                  </div>
                                  <span className="shrink-0 text-xs text-muted-foreground/60 whitespace-nowrap">
                                    {formatDate(notification.created_at)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
