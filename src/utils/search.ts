/**
 * Search helpers optimised for large in-memory datasets (10k–20k records).
 *
 * The strategy:
 *  1. Precompute a lowercase haystack string per entity once at generation time.
 *  2. Split the query into terms; every term must appear in the haystack.
 *  3. Optional ranked fields (name/title) score higher than secondary fields.
 */

export interface Searchable {
  searchText: string;
}

export interface RankedSearchable extends Searchable {
  primaryText: string;
}

export function normalizeQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Every whitespace-separated term must be contained in the haystack. */
export function matchesQuery(haystack: string, normalizedQuery: string): boolean {
  if (!normalizedQuery) return true;
  const terms = normalizedQuery.split(' ');
  for (let i = 0; i < terms.length; i++) {
    if (!haystack.includes(terms[i])) return false;
  }
  return true;
}

/**
 * Ranks a match: 2 = term found in the primary field, 1 = secondary only.
 * Used with Array.prototype.sort to surface exact-name matches first.
 */
export function scoreMatch(item: RankedSearchable, normalizedQuery: string): number {
  if (!normalizedQuery) return 0;
  const terms = normalizedQuery.split(' ');
  let score = 0;
  for (const term of terms) {
    if (item.primaryText.includes(term)) score += 2;
    else if (item.searchText.includes(term)) score += 1;
  }
  return score;
}

/** Case-insensitive substring match on a single field. */
export function includesIgnoreCase(value: string, query: string): boolean {
  return value.toLowerCase().includes(query.trim().toLowerCase());
}

/** Builds the searchText haystack from arbitrary fields (nested arrays flattened). */
export function buildSearchText(...fields: Array<string | string[] | number | boolean | Array<string | number | boolean> | undefined | null>): string {
  return fields
    .flatMap((f) => (Array.isArray(f) ? f : [f]))
    .filter((f) => f !== undefined && f !== null && f !== '')
    .map(String)
    .join(' ')
    .toLowerCase();
}
