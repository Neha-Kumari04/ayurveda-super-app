/**
 * AI recommendation engine — pure functions, no side-effects.
 *
 * Three strategies:
 *  1. **Popularity** — high rating + review volume ("Top Rated").
 *  2. **Personalised** — content-based affinity using interaction history
 *     ("For You").
 *  3. **Similar** — item-to-item cosine similarity on attribute vectors
 *     ("You might also like").
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RatedItem {
  id: string;
  rating: number;
  reviewCount: number;
}

export interface CategorisedItem extends RatedItem {
  category: string;
  tags: string[];
  price?: number;
  brand?: string;
}

export interface SpecialisedItem extends RatedItem {
  specialty: string;
}

export interface InteractionProfile {
  categoryHits: Record<string, number>;
  tagHits: Record<string, number>;
  specialtyHits: Record<string, number>;
  viewedProducts: string[];
  cartAdds: string[];
  wishlist: string[];
  searches: string[];
}

// ---------------------------------------------------------------------------
// 1. Popularity score
// ---------------------------------------------------------------------------

/**
 * 0 – 1 score combining rating and review volume.
 * Rating weighted 60 %, review volume (log-scaled) 40 %.
 */
export function popularityScore(item: RatedItem): number {
  const ratingNorm = clamp01(item.rating / 5);
  const reviewNorm = clamp01(Math.log1p(item.reviewCount) / Math.log1p(10_000));
  return ratingNorm * 0.6 + reviewNorm * 0.4;
}

/** Returns the top-N items by popularity (with optional category filter). */
export function topRated<T extends RatedItem>(items: T[], limit: number, category?: string): T[] {
  const pool = category
    ? items.filter((i) => 'category' in i && i.category === category)
    : items;
  return [...pool]
    .sort((a, b) => popularityScore(b) - popularityScore(a))
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// 2. Personalised recommendations (content-based)
// ---------------------------------------------------------------------------

/**
 * Affinity of a single item to the user's historical preferences.
 * Returns 0 – 1.
 */
export function affinityScore(item: CategorisedItem, profile: InteractionProfile): number {
  // Category affinity — normalised hit count.
  const catHits = profile.categoryHits[item.category] ?? 0;
  const maxCatHits = maxValue(profile.categoryHits);
  const catScore = maxCatHits > 0 ? catHits / maxCatHits : 0;

  // Tag affinity — weighted by how many of the item's tags the user likes.
  const tagHitsArr = item.tags.map((t) => profile.tagHits[t] ?? 0);
  const totalTagHits = tagHitsArr.reduce((a, b) => a + b, 0);
  const maxTagHits = maxValue(profile.tagHits);
  const tagScore = maxTagHits > 0 && item.tags.length > 0
    ? totalTagHits / (maxTagHits * item.tags.length)
    : 0;

  // Brand affinity.
  const brandBoost = item.brand ? (profile.searches.includes(item.brand.toLowerCase()) ? 0.3 : 0) : 0;

  // Search-term relevance — does the item name appear in recent searches?
  const searchBoost = searchRelevance(item, profile.searches);

  // Penalise already-seen items slightly to encourage exploration.
  const seenPenalty = profile.viewedProducts.includes(item.id) ? 0.15 : 0;

  const raw =
    catScore * 0.35 +
    tagScore * 0.3 +
    brandBoost * 0.15 +
    searchBoost * 0.2 -
    seenPenalty;

  return clamp01(raw);
}

/** Ranked personalised list (cold-start falls back to popularity). */
export function personalisedForYou<T extends CategorisedItem>(
  items: T[],
  profile: InteractionProfile,
  limit: number,
): T[] {
  const hasSignal =
    Object.keys(profile.categoryHits).length > 0 ||
    Object.keys(profile.tagHits).length > 0 ||
    profile.searches.length > 0;

  if (!hasSignal) {
    // Cold start — no history: show top-rated instead.
    return topRated(items, limit);
  }

  return [...items]
    .sort((a, b) => {
      const scoreA = affinityScore(a, profile) * 0.65 + popularityScore(a) * 0.35;
      const scoreB = affinityScore(b, profile) * 0.65 + popularityScore(b) * 0.35;
      return scoreB - scoreA;
    })
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// 3. Similar items (item-to-item cosine similarity)
// ---------------------------------------------------------------------------

/**
 * Cosine similarity between two items on a 5-dimensional feature vector:
 *   [category-match, tag-Jaccard, price-proximity, rating-proximity, brand-match]
 */
export function similarityScore(a: CategorisedItem, b: CategorisedItem): number {
  const categoryMatch = a.category === b.category ? 1 : 0;
  const tagJaccard = jaccard(new Set(a.tags), new Set(b.tags));
  const priceProximity = a.price != null && b.price != null
    ? 1 - clamp01(Math.abs(a.price - b.price) / Math.max(a.price, b.price, 1))
    : 0.5;
  const ratingProximity = 1 - clamp01(Math.abs(a.rating - b.rating) / 5);
  const brandMatch = a.brand && b.brand ? (a.brand === b.brand ? 1 : 0) : 0.5;

  // Feature vector and its weights.
  const vecA = [categoryMatch, tagJaccard, priceProximity, ratingProximity, brandMatch];
  // For similarity we treat `a` as the query vector (all 1s for its own features
  // conceptually) — here we just compute a weighted dot product normalised.
  const weights = [0.3, 0.25, 0.2, 0.15, 0.1];

  let dot = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * weights[i];
    normB += weights[i];
  }
  return normB > 0 ? dot / normB : 0;
}

/** Top-N most similar items to `source`, excluding itself. */
export function similarItems<T extends CategorisedItem>(
  source: T,
  candidates: T[],
  limit: number,
): T[] {
  return candidates
    .filter((c) => c.id !== source.id)
    .map((c) => ({ item: c, score: similarityScore(source, c) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.item);
}

// ---------------------------------------------------------------------------
// 4. Trending (recency-weighted popularity)
// ---------------------------------------------------------------------------

/**
 * Trending = popularity boosted by interaction signals from the profile.
 * Items the user has wishlisted / carted / viewed score higher.
 */
export function trending<T extends CategorisedItem>(
  items: T[],
  profile: InteractionProfile,
  limit: number,
): T[] {
  const engaged = new Set([...profile.wishlist, ...profile.cartAdds, ...profile.viewedProducts.slice(0, 15)]);

  return [...items]
    .map((item) => {
      let score = popularityScore(item);
      if (engaged.has(item.id)) score += 0.1;
      return { item, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.item);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function maxValue(record: Record<string, number>): number {
  let max = 0;
  for (const v of Object.values(record)) if (v > max) max = v;
  return max;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  const intersection = [...a].filter((x) => b.has(x)).length;
  const union = a.size + b.size - intersection;
  return union > 0 ? intersection / union : 0;
}

function searchRelevance(item: CategorisedItem, searches: string[]): number {
  if (searches.length === 0) return 0;
  const haystack = `${item.category} ${item.brand ?? ''} ${item.tags.join(' ')}`.toLowerCase();
  for (const term of searches.slice(0, 8)) {
    if (term.length < 3) continue;
    if (haystack.includes(term)) return 0.5;
    // Loose word-overlap fallback.
    const words = term.split(/\s+/);
    if (words.some((w) => w.length > 3 && haystack.includes(w))) return 0.3;
  }
  return 0;
}
