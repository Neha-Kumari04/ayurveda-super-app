import {
  personalisedForYou,
  similarityScore,
  similarItems,
  topRated,
  trending,
} from '@/core/ai/recs/engine';

import type { CategorisedItem, InteractionProfile } from '@/core/ai/recs/engine';

function makeItem(overrides: Partial<CategorisedItem> = {}): CategorisedItem {
  return {
    id: 'p1',
    price: 299,
    rating: 4.5,
    reviewCount: 100,
    category: 'Supplements',
    tags: ['immunity', 'stress'],
    ...overrides,
  };
}

function emptyProfile(): InteractionProfile {
  return {
    categoryHits: {},
    tagHits: {},
    specialtyHits: {},
    viewedProducts: [],
    cartAdds: [],
    wishlist: [],
    searches: [],
  };
}

describe('recommendation engine', () => {
  describe('topRated', () => {
    it('sorts by rating descending and applies limit', () => {
      const items = [
        makeItem({ id: 'a', rating: 3.9 }),
        makeItem({ id: 'b', rating: 4.8 }),
        makeItem({ id: 'c', rating: 4.2 }),
      ];
      const result = topRated(items, 2);
      expect(result.map((i) => i.id)).toEqual(['b', 'c']);
    });

    it('breaks rating ties by review count', () => {
      const items = [
        makeItem({ id: 'low', rating: 4.5, reviewCount: 10 }),
        makeItem({ id: 'high', rating: 4.5, reviewCount: 999 }),
      ];
      const result = topRated(items, 2);
      expect(result[0].id).toBe('high');
    });

    it('filters by category when provided', () => {
      const items = [
        makeItem({ id: 'a', category: 'Oils', rating: 5 }),
        makeItem({ id: 'b', category: 'Supplements', rating: 4.9 }),
      ];
      const result = topRated(items, 5, 'Supplements');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('b');
    });
  });

  describe('personalisedForYou', () => {
    it('falls back to topRated on cold start (no profile)', () => {
      const items = [
        makeItem({ id: 'a', rating: 3.0 }),
        makeItem({ id: 'b', rating: 4.9 }),
      ];
      const result = personalisedForYou(items, emptyProfile(), 10);
      expect(result[0].id).toBe('b');
    });

    it('boosts items in frequently browsed categories', () => {
      const profile: InteractionProfile = {
        ...emptyProfile(),
        categoryHits: { Oils: 5 },
      };
      const items = [
        makeItem({ id: 'supp', category: 'Supplements', rating: 4.9 }),
        makeItem({ id: 'oil', category: 'Oils', rating: 4.0 }),
      ];
      const result = personalisedForYou(items, profile, 10);
      expect(result[0].id).toBe('oil');
    });

    it('boosts items sharing tags with viewed/carted products', () => {
      const profile: InteractionProfile = {
        ...emptyProfile(),
        tagHits: { 'joint-pain': 4 },
      };
      const items = [
        makeItem({ id: 'joint', tags: ['joint-pain'], rating: 4.0 }),
        makeItem({ id: 'other', tags: ['glow'], rating: 4.5 }),
      ];
      const result = personalisedForYou(items, profile, 10);
      expect(result[0].id).toBe('joint');
    });
  });

  describe('similarityScore / similarItems', () => {
    it('identical items score highest', () => {
      const a = makeItem();
      expect(similarityScore(a, a)).toBeGreaterThan(0.9);
    });

    it('different categories score lower than same-category', () => {
      const a = makeItem();
      const same = makeItem({ id: 'p2', tags: ['immunity'] });
      const diff = makeItem({ id: 'p3', category: 'Soaps', tags: ['bath'] });
      expect(similarityScore(a, same)).toBeGreaterThan(similarityScore(a, diff));
    });

    it('similarItems excludes the source item', () => {
      const source = makeItem({ id: 'src' });
      const others = [
        makeItem({ id: 'x' }),
        makeItem({ id: 'y', category: 'Oils', tags: [] }),
      ];
      const result = similarItems(source, [source, ...others], 10);
      expect(result.find((i) => i.id === 'src')).toBeUndefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('respects the limit', () => {
      const source = makeItem({ id: 'src' });
      const many = Array.from({ length: 20 }, (_, i) => makeItem({ id: `p${i}` }));
      expect(similarItems(source, [source, ...many], 5)).toHaveLength(5);
    });
  });

  describe('trending', () => {
    it('returns limited set sorted by review-weighted rating', () => {
      const items = [
        makeItem({ id: 'a', rating: 4.0, reviewCount: 5 }),
        makeItem({ id: 'b', rating: 4.9, reviewCount: 500 }),
      ];
      const result = trending(items, emptyProfile(), 10);
      expect(result[0].id).toBe('b');
    });

    it('slightly boosts engaged items', () => {
      const profile: InteractionProfile = {
        ...emptyProfile(),
        wishlist: ['a'],
      };
      const items = [
        makeItem({ id: 'a', rating: 4.5, reviewCount: 100 }),
        makeItem({ id: 'b', rating: 4.5, reviewCount: 100 }),
      ];
      const result = trending(items, profile, 10);
      expect(result[0].id).toBe('a');
    });
  });
});
