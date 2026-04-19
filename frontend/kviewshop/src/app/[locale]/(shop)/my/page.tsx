'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
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
  ClipboardList,
} from 'lucide-react';
import { getBuyerHomeData } from '@/lib/actions/buyer';

interface StatusCounts {
  PAID: number;
  PREPARING: number;
  SHIPPING: number;
  DELIVERED: number;
  REFUNDED: number;
}

interface FrequentShop {
  id: string;
  username: string;
  displayName: string | null;
  profileImage: string | null;
  purchaseCount: number;
}

export default function GlobalMyPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const { user, buyer, isLoading: isUserLoading, signOut } = useUser();
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    PAID: 0,
    PREPARING: 0,
    SHIPPING: 0,
    DELIVERED: 0,
    REFUNDED: 0,
  });
  const [pointsBalance, setPointsBalance] = useState(0);
  const [frequentShops, setFrequentShops] = useState<FrequentShop[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [lastShop, setLastShop] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const buyerId = buyer?.id;

  useEffect(() => {
    const match = document.cookie.match(/(?:^|;\s*)last_shop_id=([^;]*)/);
    if (match) setLastShop(match[1]);
  }, []);

  useEffect(() => {
    if (isUserLoading || !buyerId || fetchedRef.current) return;
    fetchedRef.current = true;

    const loadData = async () => {
      try {
        const [result, shopsRes] = await Promise.all([
          getBuyerHomeData(buyerId),
          fetch('/api/me/frequent-shops').then(r => r.ok ? r.json() : { shops: [] }),
        ]);

        if (result?.statusCounts) {
          setStatusCounts({
            PAID: result.statusCounts['PAID'] ?? 0,
            PREPARING: result.statusCounts['PREPARING'] ?? 0,
            SHIPPING: result.statusCounts['SHIPPING'] ?? 0,
            DELIVERED: result.statusCounts['DELIVERED'] ?? 0,
            REFUNDED: result.statusCounts['REFUNDED'] ?? 0,
          });
        }
        setPointsBalance(result?.pointsBalance ?? 0);
        setFrequentShops(shopsRes.shops || []);
      } catch (error: any) {
        console.error('마이페이지 데이터 로드 실패:', {
          message: error?.message,
          stack: error?.stack,
          cause: error?.cause,
        });
      } finally {
        setIsDataLoading(false);
      }
    };

    loadData();
  }, [isUserLoading, buyerId]);

  // Not logged in → prompt login
  if (!isUserLoading && !user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <h1 className="text-lg font-bold text-gray-900 mb-2">로그인이 필요해요</h1>
        <p className="text-sm text-gray-400 mb-6">
          주문내역, 포인트 등을 확인하려면 로그인하세요
        </p>
        <Link
          href={`/${locale}/buyer/login?returnUrl=${encodeURIComponent(`/${locale}/my`)}`}
          className="inline-flex items-center justify-center h-12 px-8 bg-gray-900 text-white rounded-xl font-semibold text-sm"
        >
          로그인
        </Link>
      </div>
    );
  }

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const displayName = buyer?.nickname || user?.name || '고객';

  const handleSignOut = async () => {
    await signOut();
    router.push(`/${locale}`);
  };

  const orderStatuses = [
    { key: 'PAID', label: '결제완료', icon: CreditCard, count: statusCounts.PAID },
    { key: 'PREPARING', label: '준비중', icon: ClipboardList, count: statusCounts.PREPARING },
    { key: 'SHIPPING', label: '배송중', icon: Truck, count: statusCounts.SHIPPING },
    { key: 'DELIVERED', label: '배송완료', icon: CheckCircle, count: statusCounts.DELIVERED },
    { key: 'REFUNDED', label: '취소/교환', icon: RotateCcw, count: statusCounts.REFUNDED },
  ];

  const quickAccess = [
    { label: '찜', icon: Heart, href: `/${locale}/my/wishlist` },
    { label: '최근 본', icon: Clock, href: `/${locale}/my/recent` },
    { label: '문의', icon: HelpCircle, href: `/${locale}/my/inquiries` },
  ];

  const menuSections = [
    {
      items: [
        { label: '포인트', icon: Gift, href: `/${locale}/my/points`, badge: `${pointsBalance.toLocaleString()}P` },
        { label: '쿠폰함', icon: Ticket, href: `/${locale}/my/coupons` },
      ],
    },
    {
      items: [
        { label: '배송지 관리', icon: MapPin, href: `/${locale}/my/addresses` },
        { label: '알림 설정', icon: Bell, href: `/${locale}/my/notifications` },
      ],
    },
    {
      items: [
        { label: '회원정보', icon: Settings, href: `/${locale}/my/profile` },
      ],
    },
  ];

  return (
    <div className="pb-4">
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
            <Link
              href={`/${locale}/my/profile`}
              className="text-xs text-gray-400 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50"
            >
              편집
            </Link>
          </div>
        </div>

        {/* Order status counts */}
        <div className="bg-white mt-2 px-5 py-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">주문/배송</h2>
            <Link
              href={`/${locale}/my/orders`}
              className="text-xs text-gray-400 flex items-center gap-0.5"
            >
              전체보기
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-5 gap-1">
            {orderStatuses.map((status) => (
              <Link
                key={status.key}
                href={`/${locale}/my/orders?status=${status.key}`}
                className="flex flex-col items-center gap-1.5 py-2 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="relative">
                  <status.icon className="w-5 h-5 text-gray-400" />
                  {status.count > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
                      {status.count}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-gray-600">{status.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Frequent shops */}
        <div className="bg-white mt-2 px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-gray-900">자주 가는 샵</h3>
            <span className="text-[11px] text-gray-400">최근 6개월</span>
          </div>
          {frequentShops.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto scrollbar-hide -mx-1 px-1">
              {frequentShops.map(shop => (
                <Link
                  key={shop.id}
                  href={`/${locale}/${shop.username}`}
                  className="flex flex-col items-center gap-1.5 flex-shrink-0 w-[72px] group"
                >
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-pink-100 to-purple-100 relative ring-2 ring-white group-hover:ring-pink-200 transition">
                    {shop.profileImage ? (
                      <Image
                        src={shop.profileImage}
                        alt={shop.displayName || shop.username}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] text-gray-800 font-medium truncate w-full text-center">
                    {shop.displayName || shop.username}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {shop.purchaseCount}회 구매
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-sm text-gray-400">
              아직 구매 이력이 없어요
              <div className="mt-3">
                <Link
                  href={`/${locale}`}
                  className="inline-block px-4 py-2 bg-gray-900 text-white text-xs rounded-full"
                >
                  샵 둘러보기
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Quick access */}
        <div className="bg-white mt-2 px-5 py-4">
          <div className="grid grid-cols-3 gap-2">
            {quickAccess.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <item.icon className="w-5 h-5 text-gray-400" />
                <span className="text-[11px] text-gray-600">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Menu sections */}
        {menuSections.map((section, sIdx) => (
          <div key={sIdx} className="bg-white mt-2">
            {section.items.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors"
              >
                <item.icon className="w-5 h-5 text-gray-400" />
                <span className="flex-1 text-sm text-gray-900">{item.label}</span>
                {'badge' in item && item.badge && (
                  <span className="text-sm font-medium text-gray-500">{item.badge}</span>
                )}
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </Link>
            ))}
          </div>
        ))}

        {/* Shop link */}
        {lastShop && (
          <div className="bg-white mt-2">
            <Link
              href={`/${locale}/${lastShop}`}
              className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors"
            >
              <ShoppingBag className="w-5 h-5 text-gray-400" />
              <span className="flex-1 text-sm text-gray-900">크리에이터 샵으로</span>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </Link>
          </div>
        )}

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
