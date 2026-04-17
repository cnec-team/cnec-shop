import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GuestWishlistItem {
  shopId: string;
  productId: string;
}

interface GuestWishlistState {
  items: GuestWishlistItem[];
  toggle: (item: GuestWishlistItem) => boolean; // returns wishlisted state
  isWishlisted: (shopId: string, productId: string) => boolean;
  clear: () => void;
}

export const useGuestWishlistStore = create<GuestWishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (item) => {
        const items = get().items;
        const idx = items.findIndex(
          (i) => i.shopId === item.shopId && i.productId === item.productId
        );
        if (idx >= 0) {
          set({ items: items.filter((_, i) => i !== idx) });
          return false;
        }
        // 최대 50개
        const newItems = [item, ...items].slice(0, 50);
        set({ items: newItems });
        return true;
      },
      isWishlisted: (shopId, productId) => {
        return get().items.some(
          (i) => i.shopId === shopId && i.productId === productId
        );
      },
      clear: () => set({ items: [] }),
    }),
    {
      name: 'cnec-guest-wishlist',
    }
  )
);
