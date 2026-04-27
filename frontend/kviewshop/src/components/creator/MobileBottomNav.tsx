'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  ShoppingBag,
  Store,
  Wallet,
  User,
} from 'lucide-react';

export function MobileBottomNav() {
  const pathname = usePathname();
  const params = useParams();
  const locale = params.locale as string;

  const base = `/${locale}/creator`;

  const tabs = [
    { title: '홈', href: `${base}/dashboard`, icon: Home },
    { title: '공구', href: `${base}/campaigns/gonggu`, icon: ShoppingBag },
    { title: '내 샵', href: `${base}/shop/products`, icon: Store },
    { title: '정산', href: `${base}/settlements`, icon: Wallet },
    { title: 'MY', href: `${base}/settings`, icon: User },
  ] as const;

  const isTabActive = (href: string) => {
    if (href.includes('/campaigns/')) {
      return pathname.includes('/campaigns');
    }
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white border-t border-gray-200">
      <div
        className="flex items-center justify-around"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {tabs.map((tab) => {
          const active = isTabActive(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 py-2 px-3 min-w-[64px] min-h-[56px] transition-colors',
                active ? 'text-foreground font-semibold' : 'text-muted-foreground'
              )}
            >
              <tab.icon className={cn('h-5 w-5', active && 'stroke-[2.5]')} />
              <span className={cn('text-[10px]', active ? 'font-semibold' : 'font-medium')}>
                {tab.title}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
