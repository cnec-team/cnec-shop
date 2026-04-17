'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, Loader2 } from 'lucide-react';

/**
 * Legacy order-complete page.
 * Redirects to the shop-scoped order-complete page when shopUsername is available.
 * Falls back to a minimal display if no shop context.
 */
export default function OrderCompletePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = params.locale as string;
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Check sessionStorage for shop context
    try {
      const stored = sessionStorage.getItem('cnec-order-complete');
      if (stored) {
        const data = JSON.parse(stored);
        if (data.shopUsername) {
          const orderNumber = searchParams.get('orderNumber') || data.orderNumber;
          // Don't remove from sessionStorage — the new page will read it
          router.replace(
            `/${locale}/${data.shopUsername}/order-complete${orderNumber ? `?orderNumber=${orderNumber}` : ''}`
          );
          return;
        }
      }
    } catch {
      // ignore
    }

    // Check cookie for last_shop_id
    const cookies = document.cookie.split(';').reduce((acc, c) => {
      const [key, val] = c.trim().split('=');
      if (key && val) acc[key] = val;
      return acc;
    }, {} as Record<string, string>);

    const lastShopId = cookies['last_shop_id'];
    if (lastShopId) {
      const orderNumber = searchParams.get('orderNumber');
      router.replace(
        `/${locale}/${lastShopId}/order-complete${orderNumber ? `?orderNumber=${orderNumber}` : ''}`
      );
      return;
    }

    setChecked(true);
  }, [locale, searchParams, router]);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Fallback: no shop context at all
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <h1 className="text-lg font-bold text-gray-900 mb-2">
          주문 정보를 찾을 수 없습니다
        </h1>
        <p className="text-sm text-gray-400 mb-6">
          이미 확인한 주문이거나 잘못된 접근입니다.
        </p>
        <Link
          href={`/${locale}/orders`}
          className="inline-flex items-center justify-center h-11 px-8 bg-gray-900 text-white rounded-xl font-medium text-sm"
        >
          주문 조회하기
        </Link>
      </div>
    </div>
  );
}
