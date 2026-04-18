'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

const RESERVED_PATHS = [
  'admin', 'brand', 'creator', 'buyer', 'login', 'signup', 'auth',
  'terms', 'privacy', 'policies', 'help', 'about', 'faq', 'contact',
  'no-shop-context', 'auth-error', 'error', '404', '500', 'not-found',
  'order-complete', 'payment', 'me', 'cart', 'checkout', 'orders', 'order',
  'products', 'creators', 'content', 'sitemap', 'og',
];

interface BackToShopButtonProps {
  locale: string;
}

export function BackToShopButton({ locale }: BackToShopButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    const lastShopId = document.cookie
      .split('; ')
      .find((c) => c.startsWith('last_shop_id='))
      ?.split('=')[1];

    if (lastShopId && !RESERVED_PATHS.includes(lastShopId)) {
      router.push(`/${locale}/${lastShopId}`);
    } else if (window.history.length > 1) {
      router.back();
    } else {
      router.push(`/${locale}/no-shop-context`);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-8"
    >
      <ArrowLeft className="h-4 w-4" />
      돌아가기
    </button>
  );
}
