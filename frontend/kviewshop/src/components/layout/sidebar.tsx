'use client';

import { useState, useEffect } from 'react';
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
  Bell,
  Coins,
  UserPlus,
  Trophy,
  BookOpen,
  HelpCircle,
  Gift,
  ShoppingBag,
  Mail,
  Database,
  Upload,
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
  badge?: number;
}

interface NavSection {
  label?: string;
  items: NavItem[];
}

export function Sidebar({ role, locale }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingProposalCount, setPendingProposalCount] = useState(0);

  useEffect(() => {
    if (role !== 'creator') return;
    fetch('/api/creator/proposals')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.pendingCount) setPendingProposalCount(data.pendingCount); })
      .catch(() => {});
  }, [role]);

  const getSections = (): NavSection[] => {
    const base = `/${locale}`;
    switch (role) {
      case 'super_admin':
        return [{
          items: [
            { title: '대시보드', href: `${base}/admin/dashboard`, icon: LayoutDashboard },
            { title: '승인 관리', href: `${base}/admin/approvals`, icon: UserCheck },
            { title: '브랜드 관리', href: `${base}/admin/brands`, icon: Store },
            { title: '주문 관리', href: `${base}/admin/orders`, icon: ShoppingBag },
            { title: '크리에이터 관리', href: `${base}/admin/creators`, icon: Users },
            { title: '크리에이터 데이터', href: `${base}/admin/creator-data`, icon: Database },
            { title: '데이터 임포트', href: `${base}/admin/creator-data/import`, icon: Upload },
            { title: '캠페인 관리', href: `${base}/admin/campaigns`, icon: Megaphone },
            { title: '샘플 관리', href: `${base}/admin/samples`, icon: Gift },
            { title: '정산 관리', href: `${base}/admin/settlements`, icon: DollarSign },
            { title: '가이드 관리', href: `${base}/admin/guides`, icon: BookOpen },
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
              { title: '캠페인 관리', href: `${base}/brand/campaigns`, icon: Megaphone },
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
              { title: '도움말', href: `${base}/brand/guides`, icon: HelpCircle },
              { title: '설정', href: `${base}/brand/settings`, icon: Settings },
            ],
          },
        ];
      case 'creator':
        return [
          { items: [{ title: '홈', href: `${base}/creator/dashboard`, icon: LayoutDashboard }] },
          {
            label: '캠페인',
            items: [
              { title: '공동구매', href: `${base}/creator/campaigns/gonggu`, icon: Megaphone },
              { title: '상시 판매', href: `${base}/creator/campaigns/pick`, icon: ShoppingBag },
              { title: '받은 제안', href: `${base}/creator/proposals`, icon: Mail, badge: pendingProposalCount },
            ],
          },
          {
            label: '내 샵',
            items: [
              { title: '내가 고른 상품', href: `${base}/creator/shop/products`, icon: Package },
              { title: '상품 둘러보기', href: `${base}/creator/products`, icon: Package },
              { title: '샵 꾸미기', href: `${base}/creator/shop`, icon: Palette },
            ],
          },
          {
            label: '제품 체험',
            items: [
              { title: '체험 가능 상품', href: `${base}/creator/trial`, icon: Gift },
              { title: '내 체험 현황', href: `${base}/creator/trial/my`, icon: Package },
            ],
          },
          {
            items: [
              { title: '판매 현황', href: `${base}/creator/sales`, icon: TrendingUp },
              { title: '주문 현황', href: `${base}/creator/orders`, icon: ShoppingCart },
              { title: '내 정산', href: `${base}/creator/settlements`, icon: DollarSign },
            ],
          },
          {
            label: '활동',
            items: [
              { title: '포인트', href: `${base}/creator/points`, icon: Coins },
              { title: '추천', href: `${base}/creator/referral`, icon: UserPlus },
              { title: '등급', href: `${base}/creator/grade`, icon: Trophy },
              { title: '가이드', href: `${base}/creator/guides`, icon: BookOpen },
            ],
          },
          {
            items: [
              { title: '알림', href: `${base}/creator/notifications`, icon: Bell },
              { title: '설정', href: `${base}/creator/settings`, icon: Settings },
              { title: '제안 받기', href: `${base}/creator/settings/proposals`, icon: Mail },
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
                <span className="flex-1">{item.title}</span>
                {item.badge && item.badge > 0 ? (
                  <span className="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Mobile sidebar toggle - hidden for creator (uses bottom tab nav instead) */}
      {role !== 'creator' && (
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
        </>
      )}
      <aside className="fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] w-60 border-r border-border bg-sidebar hidden lg:block overflow-y-auto">
        {navContent}
      </aside>
    </>
  );
}
