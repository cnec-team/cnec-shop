'use client';

import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Package, Heart, User } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function MyLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const locale = params.locale as string;
  const [lastShop, setLastShop] = useState<string | null>(null);

  useEffect(() => {
    const match = document.cookie.match(/(?:^|;\s*)last_shop_id=([^;]*)/);
    if (match) setLastShop(match[1]);
  }, []);

  const myPath = `/${locale}/my`;
  const homeHref = lastShop ? `/${locale}/${lastShop}` : `/${locale}/no-shop-context`;

  const navItems = [
    { key: 'home', label: '홈', icon: Home, href: homeHref },
    { key: 'orders', label: '주문내역', icon: Package, href: `${myPath}/orders` },
    { key: 'wishlist', label: '찜', icon: Heart, href: `${myPath}/wishlist` },
    { key: 'my', label: '마이', icon: User, href: myPath },
  ];

  const getIsActive = (item: typeof navItems[0]) => {
    if (item.key === 'home') return false;
    if (item.key === 'my') return pathname === myPath;
    return pathname.startsWith(item.href);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16 lg:pb-0">
      <head>
        <meta name="robots" content="noindex, nofollow" />
      </head>
      {children}

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 lg:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="max-w-lg mx-auto flex">
          {navItems.map((item) => {
            const isActive = getIsActive(item);
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors ${
                  isActive ? 'text-gray-900' : 'text-gray-400'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
