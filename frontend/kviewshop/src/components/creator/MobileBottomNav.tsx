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
  FolderHeart,
  Sparkles,
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
  X,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface MoreMenuItem {
  title: string;
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
        { title: '컬렉션 관리', href: `${base}/collections`, icon: FolderHeart },
        { title: '뷰티 루틴', href: `${base}/routines`, icon: Sparkles },
        { title: '배너 관리', href: `${base}/banners`, icon: ImageIcon },
      ],
    },
    {
      label: '판매',
      items: [
        { title: '판매 현황', href: `${base}/sales`, icon: TrendingUp },
        { title: '주문 관리', href: `${base}/orders`, icon: ShoppingCart },
      ],
    },
    {
      label: '정산 & 활동',
      items: [
        { title: '내 정산', href: `${base}/settlements`, icon: DollarSign },
        { title: '포인트', href: `${base}/points`, icon: Coins },
        { title: '등급', href: `${base}/grade`, icon: Trophy },
        { title: '추천', href: `${base}/referral`, icon: UserPlus },
      ],
    },
    {
      label: '기타',
      items: [
        { title: '알림', href: `${base}/notifications`, icon: Bell },
        { title: '가이드', href: `${base}/guides`, icon: BookOpen },
        { title: '라이브', href: `${base}/live`, icon: Video },
        { title: '설정', href: `${base}/settings`, icon: Settings },
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

      {/* More Drawer */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader className="pb-2">
            <SheetTitle className="text-lg">더보기</SheetTitle>
          </SheetHeader>
          <div className="space-y-5 pb-6">
            {moreMenuSections.map((section) => (
              <div key={section.label}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                  {section.label}
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {section.items.map((item) => {
                    const active = pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMoreOpen(false)}
                        className={cn(
                          'flex flex-col items-center gap-1.5 rounded-xl p-3 min-h-[72px] transition-colors',
                          active
                            ? 'bg-primary/10 text-primary'
                            : 'text-foreground hover:bg-muted'
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="text-[11px] font-medium text-center leading-tight">
                          {item.title}
                        </span>
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
