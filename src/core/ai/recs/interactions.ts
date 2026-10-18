import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { storage } from '@/core/storage/storage';

/**
 * Tracks every meaningful user interaction so the recommendation engine can
 * personalise results.  Persisted so preferences survive app restarts.
 *
 * All lists are capped — old entries fall off the front.
 */

const VIEW_CAP = 60;
const SEARCH_CAP = 30;
const CART_CAP = 40;

export interface InteractionState {
  /** Recently viewed product IDs (newest first). */
  viewedProducts: string[];
  /** Recently viewed doctor IDs (newest first). */
  viewedDoctors: string[];
  /** Recently searched terms (newest first). */
  searches: string[];
  /** Product IDs added to cart (newest first). */
  cartAdds: string[];
  /** Doctor IDs booked. */
  bookings: string[];
  /** Wishlist product IDs. */
  wishlist: string[];
  /** How many times each product category was viewed. */
  categoryHits: Record<string, number>;
  /** How many times each product tag was viewed. */
  tagHits: Record<string, number>;
  /** How many times each doctor specialty was viewed. */
  specialtyHits: Record<string, number>;

  // --- actions ---
  trackProductView: (id: string, category: string, tags: string[]) => void;
  trackDoctorView: (id: string, specialty: string) => void;
  trackSearch: (term: string) => void;
  trackCartAdd: (id: string) => void;
  trackBooking: (doctorId: string) => void;
  trackWishlist: (id: string) => void;
  clearHistory: () => void;
}

/**
 * The data-only slice of the store (no actions) — used by the
 * recommendation hook's memoised selector to compare state cheaply.
 */
export type InteractionStateFields = Pick<
  InteractionState,
  | 'viewedProducts'
  | 'searches'
  | 'cartAdds'
  | 'wishlist'
  | 'categoryHits'
  | 'tagHits'
  | 'specialtyHits'
>;

function capList(list: string[], cap: number, value: string): string[] {
  // Dedupe + prepend, then trim.
  return [value, ...list.filter((v) => v !== value)].slice(0, cap);
}

function bump(record: Record<string, number>, key: string): Record<string, number> {
  return { ...record, [key]: (record[key] ?? 0) + 1 };
}

export const useInteractionStore = create<InteractionState>()(
  persist(
    (set) => ({
      viewedProducts: [],
      viewedDoctors: [],
      searches: [],
      cartAdds: [],
      bookings: [],
      wishlist: [],
      categoryHits: {},
      tagHits: {},
      specialtyHits: {},

      trackProductView: (id, category, tags) =>
        set((s) => {
          let categoryHits = bump(s.categoryHits, category);
          let tagHits = s.tagHits;
          for (const tag of tags) tagHits = bump(tagHits, tag);
          return {
            viewedProducts: capList(s.viewedProducts, VIEW_CAP, id),
            categoryHits,
            tagHits,
          };
        }),

      trackDoctorView: (id, specialty) =>
        set((s) => ({
          viewedDoctors: capList(s.viewedDoctors, VIEW_CAP, id),
          specialtyHits: bump(s.specialtyHits, specialty),
        })),

      trackSearch: (term) =>
        set((s) => ({
          searches: capList(s.searches, SEARCH_CAP, term.trim().toLowerCase()),
        })),

      trackCartAdd: (id) =>
        set((s) => ({
          cartAdds: capList(s.cartAdds, CART_CAP, id),
        })),

      trackBooking: (doctorId) =>
        set((s) => ({
          bookings: [...new Set([doctorId, ...s.bookings])],
        })),

      trackWishlist: (id) =>
        set((s) => ({
          wishlist: s.wishlist.includes(id)
            ? s.wishlist.filter((v) => v !== id)
            : [id, ...s.wishlist],
        })),

      clearHistory: () =>
        set({
          viewedProducts: [],
          viewedDoctors: [],
          searches: [],
          cartAdds: [],
          bookings: [],
          wishlist: [],
          categoryHits: {},
          tagHits: {},
          specialtyHits: {},
        }),
    }),
    {
      name: 'ai:interactions',
      storage: createJSONStorage(() => storage),
    },
  ),
);
