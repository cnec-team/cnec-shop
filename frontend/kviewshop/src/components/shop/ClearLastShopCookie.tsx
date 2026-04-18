'use client';

import { useEffect } from 'react';

export function ClearLastShopCookie() {
  useEffect(() => {
    document.cookie = 'last_shop_id=; Max-Age=0; path=/';
  }, []);
  return null;
}
