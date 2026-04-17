'use client';

import { useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/lib/hooks/use-user';
import { Loader2 } from 'lucide-react';

/**
 * Shop-scoped orders page.
 * - Logged-in buyers: redirect to /buyer/orders
 * - Guests: redirect to /orders (guest lookup)
 */
export default function ShopOrdersPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = params.locale as string;
  const username = params.username as string;
  const { user, buyer, isLoading } = useUser();

  useEffect(() => {
    if (isLoading) return;

    const orderNumber = searchParams.get('orderNumber');

    if (user && buyer) {
      router.replace(`/${locale}/buyer/orders`);
    } else if (orderNumber) {
      router.replace(`/${locale}/orders?orderNumber=${orderNumber}&guest=1`);
    } else {
      router.replace(`/${locale}/orders?guest=1`);
    }
  }, [isLoading, user, buyer, locale, username, router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
    </div>
  );
}
