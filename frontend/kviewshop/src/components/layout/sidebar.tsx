'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  DollarSign,
  Users,
  Store,
  Settings,
  Menu,
  X,
  Megaphone,
  UserCheck,
  TrendingUp,
  Palette,
  FolderHeart,
  Sparkles,
  ImageIcon,
  Bell,
} from 'lucide-react';
import type { UserRole } from '@/types/database';
import type { Locale } from '@/lib/i18n/config';

interface SidebarProps {
  role: UserRole;
  locale: Locale;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  label?: string;
  items: NavItem[];
}

export function Sidebar({ role, locale }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const getSections = (): NavSection[] => {
    const base = `/${locale}`;
    switch (role) {
      case 'super_admin':
        return [{
          items: [
            { title: '대시보드', href: `${base}/admin/dashboard`, icon: LayoutDashboard },
            { title: '브랜드 관리', href: `${base}/admin/brands`, icon: Store },
            { title: '크리에이터 관리', href: `${base}/admin/creators`, icon: Users },
            { title: '정산 관리', href: `${base}/admin/settlements`, icon: DollarSign },
            { title: '설정', href: `${base}/admin/settings`, icon: Settings },
          ],
        }];
      case 'brand_admin':
        return [
          { items: [{ title: '대시보드', href: `${base}/brand/dashboard`, icon: LayoutDashboard }] },
          {
            label: '상품 관리',
            items: [
              { title: '전체 상품', href: `${base}/brand/products`, icon: Package },
              { title: '상품 등록', href: `${base}/brand/products/new`, icon: Package },
            ],
          },
          {
            label: '캠페인 관리',
            items: [
              { title: '공구 캠페인', href: `${base}/brand/campaigns/gonggu`, icon: Megaphone },
              { title: '상시 캠페인', href: `${base}/brand/campaigns/always`, icon: Megaphone },
              { title: '캠페인 생성', href: `${base}/brand/campaigns/new`, icon: Megaphone },
            ],
          },
          { items: [{ title: '주문 관리', href: `${base}/brand/orders`, icon: ShoppingCart }] },
          {
            label: '크리에이터',
            items: [
              { title: '참여 현황', href: `${base}/brand/creators`, icon: Users },
              { title: '승인 대기', href: `${base}/brand/creators/pending`, icon: UserCheck },
            ],
          },
          {
            items: [
              { title: '정산', href: `${base}/brand/settlements`, icon: DollarSign },
              { title: '설정', href: `${base}/brand/settings`, icon: Settings },
            ],
          },
        ];
      case 'creator':
        return [
          { items: [{ title: '대시보드', href: `${base}/creator/dashboard`, icon: LayoutDashboard }] },
          { label: '상품 관리', items: [{ title: '전체 상품', href: `${base}/creator/products`, icon: Package }] },
          {
            label: '내 셀렉트샵',
            items: [
              { title: '샵 정보', href: `${base}/creator/shop`, icon: Palette },
              { title: '컬렉션 관리', href: `${base}/creator/collections`, icon: FolderHeart },
              { title: '뷰티 루틴', href: `${base}/creator/routines`, icon: Sparkles },
              { title: '배너 관리', href: `${base}/creator/banners`, icon: ImageIcon },
            ],
          },
          {
            label: '캠페인',
            items: [
              { title: '공구 캠페인', href: `${base}/creator/campaigns`, icon: Megaphone },
              { title: '내 캠페인', href: `${base}/creator/campaigns/my`, icon: Store },
            ],
          },
          { items: [{ title: '주문 현황', href: `${base}/creator/orders`, icon: ShoppingCart }] },
          {
            items: [
              { title: '판매 현황', href: `${base}/creator/sales`, icon: TrendingUp },
              { title: '정산 관리', href: `${base}/creator/settlements`, icon: DollarSign },
              { title: '알림', href: `${base}/creator/notifications`, icon: Bell },
              { title: '설정', href: `${base}/creator/settings`, icon: Settings },
            ],
          },
        ];
      default:
        return [];
    }
  };

  const sections = getSections();

  const navContent = (
    <nav className="flex flex-col gap-0.5 px-3 py-4">
      {sections.map((section, si) => (
        <div key={si}>
          {section.label && (
            <p className="px-3 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              {section.label}
            </p>
          )}
          {section.items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <item.icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-primary' : '')} />
                {item.title}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed bottom-4 right-4 z-50 lg:hidden bg-foreground text-background p-3 rounded-full shadow-lg transition-transform active:scale-95"
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
      )}
      <aside className={cn(
        'fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] w-60 border-r border-border bg-sidebar transition-transform duration-200 ease-out lg:hidden overflow-y-auto',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {navContent}
      </aside>
      <aside className="fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] w-60 border-r border-border bg-sidebar hidden lg:block overflow-y-auto">
        {navContent}
      </aside>
    </>
  );
}
