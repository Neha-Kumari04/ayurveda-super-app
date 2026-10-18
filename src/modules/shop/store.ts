import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { storage } from '@/core/storage/storage';

import type { CartItem } from './types';

interface CartState {
  items: Record<string, CartItem>;
  wishlist: string[];
  couponCode: string | null;

  addItem: (productId: string, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  setCoupon: (code: string | null) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: {},
      wishlist: [],
      couponCode: null,

      addItem: (productId, quantity = 1) =>
        set((state) => {
          const existing = state.items[productId];
          const nextQuantity = Math.min((existing?.quantity ?? 0) + quantity, 10);
          return {
            items: {
              ...state.items,
              [productId]: { productId, quantity: nextQuantity, addedAt: existing?.addedAt ?? Date.now() },
            },
          };
        }),

      updateQuantity: (productId, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            const { [productId]: _removed, ...rest } = state.items;
            return { items: rest };
          }
          const existing = state.items[productId];
          if (!existing) return state;
          return {
            items: { ...state.items, [productId]: { ...existing, quantity: Math.min(quantity, 10) } },
          };
        }),

      removeItem: (productId) =>
        set((state) => {
          const { [productId]: _removed, ...rest } = state.items;
          return { items: rest };
        }),

      clearCart: () => set({ items: {}, couponCode: null }),

      toggleWishlist: (productId) =>
        set((state) => ({
          wishlist: state.wishlist.includes(productId)
            ? state.wishlist.filter((id) => id !== productId)
            : [productId, ...state.wishlist],
        })),

      isInWishlist: (productId) => get().wishlist.includes(productId),

      setCoupon: (couponCode) => set({ couponCode }),
    }),
    {
      name: 'shop:cart',
      storage: createJSONStorage(() => storage),
      // Persisted fields — the action functions are not serialised.
      partialize: (state) => ({ items: state.items, wishlist: state.wishlist, couponCode: state.couponCode }),
    },
  ),
);

export function selectCartCount(state: CartState): number {
  return Object.values(state.items).reduce((sum, item) => sum + item.quantity, 0);
}

// Cached so the selector returns a referentially-stable array across
// snapshots — required by React 19's useSyncExternalStore (zustand v5).
let lastItemsRef: Record<string, CartItem> | null = null;
let lastProductIds: string[] = [];

export function selectCartProductIds(state: CartState): string[] {
  if (state.items !== lastItemsRef) {
    lastItemsRef = state.items;
    lastProductIds = Object.keys(state.items);
  }
  return lastProductIds;
}
