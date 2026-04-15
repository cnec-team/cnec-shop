'use client';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { Home, PenTool, Heart, User } from 'lucide-react';

const NAV_ITEMS = [
  { href: '', icon: Home, label: '홈' },
  { href: '/creators', icon: PenTool, label: '콘텐츠' },
  { href: '/buyer/subscriptions', icon: Heart, label: '관심' },
  { href: '/buyer/dashboard', icon: User, label: '마이' },
];

export function BottomNav() {
  const pathname = usePathname();
  const params = useParams();
  const locale = params.locale as string;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E5E5EA] md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="grid grid-cols-4 h-[56px]">
        {NAV_ITEMS.map(item => {
          const fullHref = `/${locale}${item.href}`;
          const isActive = item.href === ''
            ? pathname === `/${locale}` || pathname === `/${locale}/`
            : pathname.startsWith(fullHref);
          return (
            <Link
              key={item.label}
              href={fullHref || `/${locale}`}
              className="flex flex-col items-center justify-center gap-0.5"
            >
              <item.icon className={`h-5 w-5 ${isActive ? 'text-[#1A1A1A]' : 'text-[#8E8E93]'}`} />
              <span className={`text-[10px] ${isActive ? 'text-[#1A1A1A] font-medium' : 'text-[#8E8E93]'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
