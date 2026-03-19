'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  ShoppingCart,
  DollarSign,
  Users,
  UserCheck,
  Settings,
  Menu,
  X,
  Megaphone,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Repeat,
  Zap,
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import type { Locale } from '@/lib/i18n/config';

interface BrandSidebarProps {
  locale: Locale;
  brandName?: string | null;
  brandStatus?: string | null;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeVariant?: 'default' | 'destructive' | 'secondary';
}

interface NavSection {
  label: string;
  items: NavItem[];
}

export function BrandSidebar({ locale, brandName, brandStatus }: BrandSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const base = `/${locale}`;

  const sections: NavSection[] = [
    {
      label: '상품 관리',
      items: [
        { title: '전체 상품', href: `${base}/brand/products`, icon: Package },
        { title: '상품 등록', href: `${base}/brand/products/new`, icon: PlusCircle },
      ],
    },
    {
      label: '캠페인',
      items: [
        { title: '공구 캠페인', href: `${base}/brand/campaigns/gonggu`, icon: Megaphone },
        { title: '상시 캠페인', href: `${base}/brand/campaigns/always`, icon: Repeat },
        { title: '캠페인 생성', href: `${base}/brand/campaigns/new`, icon: Zap },
      ],
    },
    {
      label: '주문·배송',
      items: [
        { title: '주문 관리', href: `${base}/brand/orders`, icon: ShoppingCart },
      ],
    },
    {
      label: '크리에이터',
      items: [
        { title: '크리에이터 현황', href: `${base}/brand/creators`, icon: Users },
        { title: '승인 대기', href: `${base}/brand/creators/pending`, icon: UserCheck },
      ],
    },
    {
      label: '정산·분석',
      items: [
        { title: '정산 관리', href: `${base}/brand/settlements`, icon: DollarSign },
        { title: '대시보드', href: `${base}/brand/dashboard`, icon: BarChart3 },
      ],
    },
    {
      label: '지원',
      items: [
        { title: '설정', href: `${base}/brand/settings`, icon: Settings },
        { title: '도움말', href: `${base}/brand/guides`, icon: HelpCircle },
      ],
    },
  ];

  function isActive(href: string) {
    if (href === `${base}/brand/products` && pathname === `${base}/brand/products/new`) return false;
    return pathname === href || pathname.startsWith(href + '/');
  }

  const statusBadge = brandStatus === 'ACTIVE' ? (
    <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-200 text-[10px] px-1.5 py-0">
      활성
    </Badge>
  ) : brandStatus === 'PENDING' ? (
    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
      심사중
    </Badge>
  ) : null;

  const sidebarContent = (isMobile: boolean) => (
    <div className="flex h-full flex-col">
      {/* Brand header */}
      <div className={cn(
        'flex items-center gap-3 border-b border-border/50 px-4 py-4',
        collapsed && !isMobile && 'justify-center px-2'
      )}>
        {(!collapsed || isMobile) ? (
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary text-sm">
              {(brandName ?? 'B').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{brandName ?? '브랜드'}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {statusBadge}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary text-sm">
            {(brandName ?? 'B').charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.label}>
              {(!collapsed || isMobile) && (
                <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  {section.label}
                </p>
              )}
              {collapsed && !isMobile && (
                <div className="mb-1 h-px bg-border/50 mx-2" />
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => isMobile && setMobileOpen(false)}
                      title={collapsed && !isMobile ? item.title : undefined}
                      className={cn(
                        'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150',
                        collapsed && !isMobile && 'justify-center px-2',
                        active
                          ? 'bg-primary/10 text-primary shadow-sm'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <item.icon className={cn('h-4 w-4 shrink-0', active && 'text-primary')} />
                      {(!collapsed || isMobile) && (
                        <>
                          <span className="flex-1 truncate">{item.title}</span>
                          {item.badge !== undefined && (
                            <Badge
                              variant={item.badgeVariant ?? 'secondary'}
                              className="ml-auto text-[10px] px-1.5 py-0 min-w-[20px] justify-center"
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </>
                      )}
                      {/* Tooltip for collapsed state */}
                      {collapsed && !isMobile && (
                        <div className="absolute left-full ml-2 hidden rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md group-hover:block z-50 whitespace-nowrap border">
                          {item.title}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* Collapse toggle (desktop only) */}
      {!isMobile && (
        <div className="border-t border-border/50 p-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex w-full items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile: Sheet drawer */}
      <div className="lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-72 p-0">
            {sidebarContent(true)}
          </SheetContent>
        </Sheet>
      </div>

      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed bottom-4 right-4 z-50 lg:hidden flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95"
        aria-label="메뉴 열기"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-14 z-40 hidden h-[calc(100vh-3.5rem)] border-r border-border/50 bg-sidebar lg:block transition-all duration-200',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        {sidebarContent(false)}
      </aside>
    </>
  );
}
