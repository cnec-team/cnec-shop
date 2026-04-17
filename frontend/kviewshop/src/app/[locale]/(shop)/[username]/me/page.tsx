'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/lib/hooks/use-user';
import {
  User,
  Package,
  Truck,
  CheckCircle,
  RotateCcw,
  ShoppingBag,
  Heart,
  Clock,
  MapPin,
  CreditCard,
  Ticket,
  Gift,
  Settings,
  Bell,
  HelpCircle,
  LogOut,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { getBuyerHomeData } from '@/lib/actions/buyer';

interface StatusCounts {
  PAID: number;
  SHIPPING: number;
  DELIVERED: number;
  REFUNDED: number;
}

export default function ShopMyPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const username = params.username as string;
  const { user, buyer, isLoading: isUserLoading, signOut } = useUser();
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    PAID: 0,
    SHIPPING: 0,
    DELIVERED: 0,
    REFUNDED: 0,
  });
  const [pointsBalance, setPointsBalance] = useState(0);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const fetchedRef = useRef(false);

  const buyerId = buyer?.id;

  useEffect(() => {
    if (isUserLoading || !buyerId || fetchedRef.current) return;
    fetchedRef.current = true;

    const loadData = async () => {
      try {
        const result = await getBuyerHomeData(buyerId);
        if (result?.statusCounts) {
          setStatusCounts({
            PAID: result.statusCounts['PAID'] ?? 0,
            SHIPPING: result.statusCounts['SHIPPING'] ?? 0,
            DELIVERED: result.statusCounts['DELIVERED'] ?? 0,
            REFUNDED: result.statusCounts['REFUNDED'] ?? 0,
          });
        }
        setPointsBalance(result?.pointsBalance ?? 0);
      } catch (error) {
        console.error('마이페이지 데이터 로드 실패:', error);
      } finally {
        setIsDataLoading(false);
      }
    };

    loadData();
  }, [isUserLoading, buyerId]);

  // Not logged in → prompt login
  if (!isUserLoading && !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h1 className="text-lg font-bold text-gray-900 mb-2">로그인이 필요해요</h1>
          <p className="text-sm text-gray-400 mb-6">
            주문내역, 포인트 등을 확인하려면 로그인하세요
          </p>
          <Link
            href={`/${locale}/buyer/login?returnUrl=${encodeURIComponent(`/${locale}/${username}/me`)}`}
            className="inline-flex items-center justify-center h-12 px-8 bg-gray-900 text-white rounded-xl font-semibold text-sm"
          >
            로그인
          </Link>
        </div>
      </div>
    );
  }

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const displayName = buyer?.nickname || user?.name || '고객';

  const handleSignOut = async () => {
    await signOut();
    router.push(`/${locale}/${username}`);
  };

  const orderStatuses = [
    { key: 'PAID', label: '결제완료', icon: Package, count: statusCounts.PAID },
    { key: 'SHIPPING', label: '배송중', icon: Truck, count: statusCounts.SHIPPING },
    { key: 'DELIVERED', label: '배송완료', icon: CheckCircle, count: statusCounts.DELIVERED },
    { key: 'REFUNDED', label: '교환/반품', icon: RotateCcw, count: statusCounts.REFUNDED },
  ];

  const menuItems = [
    { label: '장바구니', icon: ShoppingBag, href: `/${locale}/${username}/checkout` },
    { label: '찜한 상품', icon: Heart, href: `/${locale}/${username}/me/wishlist` },
    { label: '최근 본 상품', icon: Clock, href: `/${locale}/${username}/me/recent` },
    { divider: true },
    { label: '배송지 관리', icon: MapPin, href: `/${locale}/buyer/settings` },
    { label: '결제수단', icon: CreditCard, href: `/${locale}/buyer/settings` },
    { label: '쿠폰함', icon: Ticket, href: `/${locale}/buyer/points` },
    { label: '포인트', icon: Gift, href: `/${locale}/buyer/points`, badge: `${pointsBalance.toLocaleString()}P` },
    { divider: true },
    { label: '회원정보', icon: Settings, href: `/${locale}/buyer/settings` },
    { label: '알림설정', icon: Bell, href: `/${locale}/buyer/settings` },
    { label: '1:1 문의', icon: HelpCircle, href: `/${locale}/help` },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-lg mx-auto">
        {/* User card */}
        <div className="bg-white px-5 py-6">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
              <User className="w-6 h-6 text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold text-gray-900 truncate">{displayName}</p>
              <p className="text-sm text-gray-400">{user?.email || ''}</p>
            </div>
          </div>
        </div>

        {/* Order status counts */}
        <div className="bg-white mt-2 px-5 py-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">주문/배송</h2>
            <Link
              href={`/${locale}/buyer/orders`}
              className="text-xs text-gray-400 flex items-center gap-0.5"
            >
              전체보기
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {orderStatuses.map((status) => (
              <Link
                key={status.key}
                href={`/${locale}/buyer/orders?status=${status.key}`}
                className="flex flex-col items-center gap-1.5 py-2"
              >
                <div className="relative">
                  <status.icon className="w-5 h-5 text-gray-400" />
                  {status.count > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
                      {status.count}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-600">{status.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Menu list */}
        <div className="bg-white mt-2">
          {menuItems.map((item, index) => {
            if ('divider' in item && item.divider) {
              return <div key={`divider-${index}`} className="h-2 bg-gray-50" />;
            }
            const menuItem = item as { label: string; icon: any; href: string; badge?: string };
            return (
              <Link
                key={menuItem.label}
                href={menuItem.href}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors"
              >
                <menuItem.icon className="w-5 h-5 text-gray-400" />
                <span className="flex-1 text-sm text-gray-900">{menuItem.label}</span>
                {menuItem.badge && (
                  <span className="text-sm font-medium text-gray-500">{menuItem.badge}</span>
                )}
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </Link>
            );
          })}
        </div>

        {/* Logout */}
        <div className="bg-white mt-2">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-5 py-3.5 w-full hover:bg-gray-50 transition-colors"
          >
            <LogOut className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-500">로그아웃</span>
          </button>
        </div>
      </div>
    </div>
  );
}
