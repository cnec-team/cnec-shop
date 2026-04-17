'use client';

import { useEffect, useRef } from 'react';
import { useUser } from '@/lib/hooks/use-user';
import { syncGuestCartToUser } from '@/lib/actions/cart';
import { syncGuestWishlistToUser } from '@/lib/actions/wishlist';

export function GuestSyncEffect() {
  const { buyer, isLoading } = useUser();
  const syncedRef = useRef(false);

  useEffect(() => {
    if (isLoading || !buyer || syncedRef.current) return;
    syncedRef.current = true;

    const buyerId = (buyer as Record<string, unknown>).id as string;
    if (!buyerId) return;

    // 1. 서버: 비회원 카트 → 회원 카트 이전
    syncGuestCartToUser(buyerId).catch((e) =>
      console.error('Guest cart sync failed:', e)
    );

    // 2. 클라이언트: guest-wishlist localStorage → 서버 sync
    try {
      const raw = localStorage.getItem('cnec-guest-wishlist');
      if (raw) {
        const parsed = JSON.parse(raw);
        const items: { shopId: string; productId: string }[] = parsed?.state?.items ?? [];
        if (items.length > 0) {
          syncGuestWishlistToUser(buyerId, items)
            .then(() => {
              localStorage.removeItem('cnec-guest-wishlist');
            })
            .catch((e) => console.error('Guest wishlist sync failed:', e));
        }
      }
    } catch {
      // localStorage 파싱 실패 무시
    }

    // 3. 기존 Zustand 카트 (cnec-cart) localStorage 제거
    try {
      const oldCart = localStorage.getItem('cnec-cart');
      if (oldCart) {
        // 레거시 카트는 서버로 이전하지 않음 (새 서버 카트가 우선)
        // 로그인 후에는 서버 카트만 사용하므로 로컬 카트 제거
        localStorage.removeItem('cnec-cart');
      }
    } catch {
      // 무시
    }
  }, [buyer, isLoading]);

  return null;
}
