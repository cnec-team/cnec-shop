'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingBag, Heart, User } from 'lucide-react';

interface ShopBottomNavProps {
  locale: string;
  username: string;
}

export function ShopBottomNav({ locale, username }: ShopBottomNavProps) {
  const pathname = usePathname();

  // Hide on checkout and order-complete pages (they have their own CTAs)
  if (
    pathname.includes('/checkout') ||
    pathname.includes('/order-complete')
  ) {
    return null;
  }

  const navItems = [
    {
      href: `/${locale}/${username}`,
      icon: Home,
      label: '홈',
      isActive: pathname === `/${locale}/${username}` || pathname === `/${locale}/${username}/`,
    },
    {
      href: `/${locale}/${username}/checkout`,
      icon: ShoppingBag,
      label: '카트',
      isActive: pathname.includes(`/${username}/checkout`),
    },
    {
      href: `/${locale}/${username}/me/wishlist`,
      icon: Heart,
      label: '찜',
      isActive: pathname.includes(`/${username}/me/wishlist`),
    },
    {
      href: `/${locale}/${username}/me`,
      icon: User,
      label: '마이',
      isActive: pathname.endsWith(`/${username}/me`) || (pathname.includes(`/${username}/me`) && !pathname.includes('/wishlist')),
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E5E5EA] md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="grid grid-cols-4 h-[56px] max-w-[480px] mx-auto">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex flex-col items-center justify-center gap-0.5"
          >
            <item.icon
              className={`h-5 w-5 ${item.isActive ? 'text-[#1A1A1A]' : 'text-[#8E8E93]'}`}
            />
            <span
              className={`text-[10px] ${item.isActive ? 'text-[#1A1A1A] font-medium' : 'text-[#8E8E93]'}`}
            >
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
