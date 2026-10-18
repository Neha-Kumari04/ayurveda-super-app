import { storage } from './storage';

export interface CacheEntry<T> {
  data: T;
  storedAt: number;
  ttlMs: number;
}

const DEFAULT_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * TTL-based cache persisted through AsyncStorage. Used as the offline
 * fallback for GET requests and by the sync layer.
 */
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const entry = await storage.getItem<CacheEntry<T>>(`cache:${key}`);
    if (!entry) return null;
    if (Date.now() - entry.storedAt > entry.ttlMs) {
      void storage.removeItem(`cache:${key}`);
      return null;
    }
    return entry.data;
  },

  /** Returns stale data even if the TTL expired — used as offline fallback. */
  async getStale<T>(key: string): Promise<T | null> {
    const entry = await storage.getItem<CacheEntry<T>>(`cache:${key}`);
    return entry ? entry.data : null;
  },

  async set<T>(key: string, data: T, ttlMs: number = DEFAULT_TTL): Promise<void> {
    const entry: CacheEntry<T> = { data, storedAt: Date.now(), ttlMs };
    await storage.setItem(`cache:${key}`, entry);
  },

  async clear(prefix?: string): Promise<void> {
    // AsyncStorage has no prefix scan; the app only uses a handful of
    // well-known cache keys so we clear the query cache via React Query too.
    if (!prefix) await storage.removeItem('cache:*');
    else await storage.removeItem(`cache:${prefix}`);
  },
};
