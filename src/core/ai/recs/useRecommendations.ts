import { useMemo } from 'react';

import { getDoctors } from '@/data/generators/doctors';
import { getProducts } from '@/data/generators/products';

import { useInteractionStore } from './interactions';
import { personalisedForYou, similarItems, topRated } from './engine';

import type { InteractionProfile } from './engine';
import type { InteractionStateFields } from './interactions';
import type { Product } from '@/modules/shop/types';
import type { Doctor } from '@/modules/consultation/types';

// ---------------------------------------------------------------------------
// Module-level memoised selector — guarantees a referentially-stable snapshot.
// (Same pattern as `selectCartProductIds` in the cart store: compare the
// previous inputs; only build a new profile object when they actually change.
// Zustand v5 + React 19 will infinite-loop on unstable getSnapshot results.)
// ---------------------------------------------------------------------------

const EMPTY_PROFILE: InteractionProfile = {
  categoryHits: {},
  tagHits: {},
  specialtyHits: {},
  viewedProducts: [],
  cartAdds: [],
  wishlist: [],
  searches: [],
};

let prevFields: InteractionStateFields | null = null;
let cachedProfile: InteractionProfile = EMPTY_PROFILE;

function selectInteractionProfile(s: InteractionStateFields): InteractionProfile {
  if (
    prevFields !== null &&
    prevFields.categoryHits === s.categoryHits &&
    prevFields.tagHits === s.tagHits &&
    prevFields.specialtyHits === s.specialtyHits &&
    prevFields.viewedProducts === s.viewedProducts &&
    prevFields.cartAdds === s.cartAdds &&
    prevFields.wishlist === s.wishlist &&
    prevFields.searches === s.searches
  ) {
    return cachedProfile;
  }
  prevFields = {
    categoryHits: s.categoryHits,
    tagHits: s.tagHits,
    specialtyHits: s.specialtyHits,
    viewedProducts: s.viewedProducts,
    cartAdds: s.cartAdds,
    wishlist: s.wishlist,
    searches: s.searches,
  };
  cachedProfile = {
    categoryHits: s.categoryHits,
    tagHits: s.tagHits,
    specialtyHits: s.specialtyHits,
    viewedProducts: s.viewedProducts,
    cartAdds: s.cartAdds,
    wishlist: s.wishlist,
    searches: s.searches,
  };
  return cachedProfile;
}

// ---------------------------------------------------------------------------
// Product recommendations
// ---------------------------------------------------------------------------

export interface ProductRecommendations {
  /** Personalised "For You" rail. */
  forYou: Product[];
  /** High-rated rail. */
  topRated: Product[];
  /** Items similar to a given product (pass productId). */
  similarTo: (productId: string, limit?: number) => Product[];
}

export function useProductRecommendations(): ProductRecommendations {
  // Single subscription to the stable, memoised profile object.
  const profile = useInteractionStore(selectInteractionProfile);
  const products = useMemo(() => getProducts(), []);

  const forYou = useMemo(() => personalisedForYou(products, profile, 10), [products, profile]);
  const top = useMemo(() => topRated(products, 10), [products]);

  const similarTo = useMemo(() => {
    return (productId: string, limit = 6): Product[] => {
      const source = products.find((p) => p.id === productId);
      if (!source) return [];
      return similarItems(source, products, limit);
    };
  }, [products]);

  return useMemo(() => ({ forYou, topRated: top, similarTo }), [forYou, top, similarTo]);
}

// ---------------------------------------------------------------------------
// Doctor recommendations
// ---------------------------------------------------------------------------

export interface DoctorRecommendations {
  topRated: Doctor[];
  similarTo: (doctorId: string, limit?: number) => Doctor[];
}

export function useDoctorRecommendations(): DoctorRecommendations {
  const doctors = useMemo(() => getDoctors(), []);

  const top = useMemo(() => topRated(doctors, 8), [doctors]);

  const similarTo = useMemo(() => {
    return (doctorId: string, limit = 4): Doctor[] => {
      const source = doctors.find((d) => d.id === doctorId);
      if (!source) return [];
      // Doctor similarity: specialty + rating + experience proximity.
      const candidates = doctors.filter((d) => d.id !== doctorId);
      return candidates
        .map((d) => {
          const specialtyMatch = d.specialty === source.specialty ? 0.6 : 0;
          const ratingProx = 1 - Math.abs(d.rating - source.rating) / 5;
          const expProx = 1 - Math.min(Math.abs(d.experienceYears - source.experienceYears), 20) / 20;
          return { doctor: d, score: specialtyMatch + ratingProx * 0.25 + expProx * 0.15 };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((r) => r.doctor);
    };
  }, [doctors]);

  return useMemo(() => ({ topRated: top, similarTo }), [top, similarTo]);
}
