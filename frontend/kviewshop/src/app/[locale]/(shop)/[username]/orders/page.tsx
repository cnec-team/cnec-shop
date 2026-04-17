'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/lib/hooks/use-user';
import { Loader2 } from 'lucide-react';

/**
 * Shop-scoped orders page — redirects to appropriate sub-page.
 * - Logged-in buyers: /{username}/me/orders
 * - Guests: /{username}/orders/lookup
 */
export default function ShopOrdersPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const username = params.username as string;
  const { user, buyer, isLoading } = useUser();

  useEffect(() => {
    if (isLoading) return;

    if (user && buyer) {
      router.replace(`/${locale}/${username}/me/orders`);
    } else {
      router.replace(`/${locale}/${username}/orders/lookup`);
    }
  }, [isLoading, user, buyer, locale, username, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
    </div>
  );
}
