'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ShoppingBag,
  Store,
  Megaphone,
  MoreHorizontal,
  ImageIcon,
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Coins,
  UserPlus,
  Trophy,
  BookOpen,
  Bell,
  Settings,
  Video,
  ChevronRight,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface MoreMenuItem {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface MoreMenuSection {
  label: string;
  items: MoreMenuItem[];
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const params = useParams();
  const locale = params.locale as string;
  const [moreOpen, setMoreOpen] = useState(false);

  const base = `/${locale}/creator`;

  const tabs = [
    { title: '홈', href: `${base}/dashboard`, icon: LayoutDashboard },
    { title: '상품', href: `${base}/products`, icon: ShoppingBag },
    { title: '내 샵', href: `${base}/shop`, icon: Store },
    { title: '캠페인', href: `${base}/campaigns`, icon: Megaphone },
    { title: '더보기', href: '#more', icon: MoreHorizontal },
  ] as const;

  const moreMenuSections: MoreMenuSection[] = [
    {
      label: '내 셀렉트샵',
      items: [
        { title: '배너 관리', description: '샵 배너 이미지 설정', href: `${base}/banners`, icon: ImageIcon },
      ],
    },
    {
      label: '판매',
      items: [
        { title: '판매 현황', description: '매출 및 수익 확인', href: `${base}/sales`, icon: TrendingUp },
        { title: '주문 관리', description: '주문 내역 추적', href: `${base}/orders`, icon: ShoppingCart },
      ],
    },
    {
      label: '정산 & 활동',
      items: [
        { title: '내 정산', description: '입금 내역 확인', href: `${base}/settlements`, icon: DollarSign },
        { title: '포인트', description: '포인트 적립 및 출금', href: `${base}/points`, icon: Coins },
        { title: '등급', description: '크리에이터 등급 혜택', href: `${base}/grade`, icon: Trophy },
        { title: '추천', description: '친구 초대하고 혜택 받기', href: `${base}/referral`, icon: UserPlus },
      ],
    },
    {
      label: '기타',
      items: [
        { title: '알림', description: '새로운 소식 확인', href: `${base}/notifications`, icon: Bell },
        { title: '가이드', description: '크넥 활용 가이드', href: `${base}/guides`, icon: BookOpen },
        { title: '라이브', description: '라이브 방송 관리', href: `${base}/live`, icon: Video },
        { title: '설정', description: '계정 및 알림 설정', href: `${base}/settings`, icon: Settings },
      ],
    },
  ];

  const isTabActive = (href: string) => {
    if (href === '#more') return false;
    return pathname === href || pathname.startsWith(href + '/');
  };

  // Check if any "more" menu item is active
  const isMoreActive = moreMenuSections.some((section) =>
    section.items.some((item) => pathname === item.href || pathname.startsWith(item.href + '/'))
  );

  return (
    <>
      {/* Bottom Tab Bar - mobile only */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-background border-t border-border">
        <div
          className="flex items-center justify-around"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          {tabs.map((tab) => {
            const isMore = tab.href === '#more';
            const active = isMore ? isMoreActive || moreOpen : isTabActive(tab.href);

            if (isMore) {
              return (
                <button
                  key="more"
                  onClick={() => setMoreOpen(true)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-0.5 py-2 px-3 min-w-[64px] min-h-[56px] transition-colors',
                    active ? 'text-primary' : 'text-gray-400'
                  )}
                >
                  <MoreHorizontal className="h-5 w-5" />
                  <span className="text-[10px] font-medium">{tab.title}</span>
                </button>
              );
            }

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 py-2 px-3 min-w-[64px] min-h-[56px] transition-colors',
                  active ? 'text-primary' : 'text-gray-400'
                )}
              >
                <tab.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{tab.title}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* More Drawer — list card style */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader className="pb-3">
            <SheetTitle className="text-lg">더보기</SheetTitle>
          </SheetHeader>
          <div className="space-y-6 pb-8">
            {moreMenuSections.map((section) => (
              <div key={section.label}>
                <p className="text-xs font-semibold text-muted-foreground mb-2 px-1">
                  {section.label}
                </p>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50 overflow-hidden">
                  {section.items.map((item) => {
                    const active = pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMoreOpen(false)}
                        className={cn(
                          'flex items-center gap-4 px-4 py-3.5 transition-colors',
                          active ? 'bg-primary/5' : 'hover:bg-gray-50'
                        )}
                      >
                        <div className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                          active ? 'bg-primary/10 text-primary' : 'bg-gray-50 text-gray-400'
                        )}>
                          <item.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            'text-sm font-medium',
                            active ? 'text-primary' : 'text-gray-900'
                          )}>
                            {item.title}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
