'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/lib/hooks/use-user';
import { Loader2, Home, ShoppingBag, Heart, Star, Bell, Settings, LogOut, User, Gift, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const buyerNavItems = [
  { href: '/buyer/dashboard', label: '홈', icon: Home },
  { href: '/buyer/orders', label: '주문내역', icon: ShoppingBag },
  { href: '/buyer/subscriptions', label: '구독', icon: Heart },
  { href: '/buyer/reviews', label: '리뷰', icon: Star },
  { href: '/buyer/points', label: '포인트', icon: Gift },
  { href: '/buyer/become-creator', label: '크리에이터 되기', icon: TrendingUp },
  { href: '/buyer/settings', label: '설정', icon: Settings },
];

export default function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, buyer, isLoading, signOut } = useUser();
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const locale = params.locale as string;
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (isLoading || redirectedRef.current) return;

    if (!user) {
      redirectedRef.current = true;
      router.push(`/${locale}/buyer/login`);
    } else if (user.role !== 'buyer') {
      redirectedRef.current = true;
      if (user.role === 'creator') router.push(`/${locale}/creator/dashboard`);
      else if (user.role === 'brand_admin') router.push(`/${locale}/brand/dashboard`);
      else if (user.role === 'super_admin') router.push(`/${locale}/admin/dashboard`);
    }
  }, [user, isLoading, router, locale]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.role !== 'buyer') {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    router.push(`/${locale}/buyer/login`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link href={`/${locale}`} className="font-headline text-2xl font-bold text-gold-gradient">
            CNEC Shop
          </Link>

          <div className="flex items-center gap-4">
            {/* Points Badge */}
            {buyer && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                <Gift className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{(buyer.pointsBalance ?? 0).toLocaleString()} P</span>
              </div>
            )}

            {/* Notifications */}
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>

            {/* User Menu */}
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={buyer?.profileImage || ''} />
                <AvatarFallback className="bg-primary/20 text-primary">
                  {buyer?.nickname?.charAt(0)?.toUpperCase() || 'B'}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:block text-sm font-medium">{buyer?.nickname || user.name}</span>
            </div>

            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:flex w-64 flex-col border-r border-border/50 min-h-[calc(100vh-4rem)]">
          <nav className="flex-1 p-4 space-y-1">
            {buyerNavItems.map((item) => {
              const isActive = pathname.includes(item.href);
              return (
                <Link
                  key={item.href}
                  href={`/${locale}${item.href}`}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border/50 bg-background/95 backdrop-blur">
        <div className="flex justify-around py-2">
          {buyerNavItems.slice(0, 5).map((item) => {
            const isActive = pathname.includes(item.href);
            return (
              <Link
                key={item.href}
                href={`/${locale}${item.href}`}
                className={`flex flex-col items-center gap-1 px-3 py-1 ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
