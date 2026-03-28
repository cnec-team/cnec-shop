import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Brand, Creator } from '@/types/database';

interface AuthState {
  user: User | null;
  brand: Brand | null;
  creator: Creator | null;
  buyer: Record<string, any> | null; // kept for compat
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setBrand: (brand: Brand | null) => void;
  setCreator: (creator: Creator | null) => void;
  setBuyer: (buyer: Record<string, any> | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      brand: null,
      creator: null,
      buyer: null,
      isLoading: true,
      setUser: (user) => set({ user }),
      setBrand: (brand) => set({ brand }),
      setCreator: (creator) => set({ creator }),
      setBuyer: (buyer) => set({ buyer }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => set({ user: null, brand: null, creator: null, buyer: null }),
    }),
    {
      name: 'cnec-auth',
      partialize: (state) => ({
        user: state.user,
        brand: state.brand,
        creator: state.creator,
      }),
    }
  )
);

// Cart Store
interface CartItem {
  productId: string;
  campaignId?: string;
  quantity: number;
  creatorId: string;
  unitPrice: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const items = get().items;
        const existingIndex = items.findIndex(
          (i) => i.productId === item.productId && i.creatorId === item.creatorId
        );
        if (existingIndex > -1) {
          const newItems = [...items];
          newItems[existingIndex].quantity += item.quantity;
          set({ items: newItems });
        } else {
          set({ items: [...items, item] });
        }
      },
      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.productId !== productId) });
      },
      updateQuantity: (productId, quantity) => {
        const items = get().items.map((i) =>
          i.productId === productId ? { ...i, quantity } : i
        );
        set({ items });
      },
      clearCart: () => set({ items: [] }),
      getTotal: () => get().items.reduce((sum, i) => sum + Number(i.unitPrice) * i.quantity, 0),
    }),
    {
      name: 'cnec-cart',
    }
  )
);
