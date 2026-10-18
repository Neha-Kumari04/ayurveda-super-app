import type { Paginated } from '@/types';

/**
 * Normalises a paginated response into a shape-safe envelope.
 *
 * The mock backend's chaos harness (and, in production, flaky/partial server
 * responses) can return valid JSON that is missing the `items` collection.
 * Without this guard, callers doing `pages.flatMap((p) => p.items)` end up with
 * `[undefined]` entries and crash on `item.id`. This guarantees `items` is
 * always an array of non-null values and flags the payload as `partial`.
 */
export function toPaginated<T>(
  raw: unknown,
  fallback: { page?: number; pageSize?: number } = {},
): Paginated<T> {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Partial<Paginated<T>>;
  const rawItems = (source as { items?: unknown }).items;
  const validItems = Array.isArray(rawItems) ? rawItems : null;

  const items = validItems
    ? validItems.filter((item): item is T => item !== null && item !== undefined)
    : [];

  const page = typeof source.page === 'number' ? source.page : fallback.page ?? 1;
  const pageSize =
    typeof source.pageSize === 'number' ? source.pageSize : fallback.pageSize ?? items.length;
  const total = typeof source.total === 'number' ? source.total : items.length;
  const hasMore =
    typeof source.hasMore === 'boolean' ? source.hasMore : page * Math.max(pageSize, 1) < total;

  return {
    items,
    page,
    pageSize,
    total,
    hasMore,
    fromCache: source.fromCache,
    partial: source.partial ?? (validItems === null ? true : undefined),
  };
}
