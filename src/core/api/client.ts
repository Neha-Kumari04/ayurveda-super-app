import { env } from '../config/env';
import { logger } from '../logger/logger';
import { cache } from '../storage/cache';
import { ApiError } from './errors';
import { mockRequest } from './mockServer';

import type { QueryParams } from '@/types';

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  params?: QueryParams;
  /** Per-request override of the default timeout. */
  timeoutMs?: number;
  /** Number of retries for retryable failures. */
  retries?: number;
  /** Enables persistent caching for GET requests (offline-first). */
  cacheTtlMs?: number;
  /** Serve stale cache even when fresh cache is missing (offline mode). */
  allowStaleCache?: boolean;
  signal?: AbortSignal;
}

type SessionExpiredHandler = () => void;

const sessionExpiredHandlers = new Set<SessionExpiredHandler>();
let authTokenProvider: (() => string | null) | null = null;

/** Registers a callback fired whenever the API reports an expired session. */
export function onSessionExpired(handler: SessionExpiredHandler): () => void {
  sessionExpiredHandlers.add(handler);
  return () => sessionExpiredHandlers.delete(handler);
}

/** The auth store injects how to read the current token. */
export function setAuthTokenProvider(provider: () => string | null): void {
  authTokenProvider = provider;
}

function notifySessionExpired(): void {
  for (const handler of sessionExpiredHandlers) {
    try {
      handler();
    } catch (error) {
      logger.error('session expired handler threw', { error });
    }
  }
}

function buildUrl(path: string, params?: QueryParams): string {
  if (!params) return path;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const v of value) search.append(key, String(v));
    } else {
      search.append(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
}

function cacheKey(path: string, params?: QueryParams): string {
  return buildUrl(path, params);
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  // Honour caller-provided abort signals too.
  init.signal?.addEventListener('abort', () => controller.abort());

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted) throw ApiError.timeout(timeoutMs);
    throw ApiError.network(error instanceof Error ? error.message : undefined);
  } finally {
    clearTimeout(timer);
  }
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw ApiError.parse(`Response was not valid JSON: ${text.slice(0, 120)}`);
  }
}

async function executeOnce<T>(
  path: string,
  options: Required<Pick<RequestOptions, 'method'>> & RequestOptions,
): Promise<T> {
  const url = env.apiUrl + buildUrl(path, options.params);

  if (env.useMockApi) {
    const headers: Record<string, string> = {};
    const token = authTokenProvider?.();
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await mockRequest(options.method, path, {
      params: options.params,
      body: options.body,
      headers,
    });
    if (response.status >= 400) throw ApiError.http(response.status, response.body);
    // Round-trip through JSON to surface serialisation bugs exactly like a network payload.
    if (typeof response.body === 'string') {
      try {
        return JSON.parse(response.body) as T;
      } catch {
        throw ApiError.parse();
      }
    }
    return response.body as T;
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = authTokenProvider?.();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetchWithTimeout(
    url,
    {
      method: options.method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    },
    options.timeoutMs ?? env.apiTimeoutMs,
  );

  if (response.status === 401) {
    notifySessionExpired();
    throw ApiError.http(401);
  }
  if (response.status >= 400) {
    throw ApiError.http(response.status, await parseBody(response).catch(() => undefined));
  }

  const text = await response.text();
  if (!text) return null as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw ApiError.parse();
  }
}

/**
 * HTTP client with:
 *  - timeouts (AbortController)
 *  - exponential backoff + jitter retries for transient failures
 *  - persistent GET caching with stale fallback for offline reads
 *  - centralised session-expiry notification
 *  - a mock transport used when `USE_MOCK_API=true`
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? 'GET';
  const retries = options.retries ?? env.apiRetryCount;
  const key = cacheKey(path, options.params);

  // Offline read path: serve the freshest cached copy we have.
  if (method === 'GET' && options.cacheTtlMs) {
    const fresh = await cache.get<T>(key);
    if (fresh !== null) return fresh;
  }

  let lastError: ApiError | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await executeOnce<T>(path, { ...options, method });

      if (method === 'GET' && options.cacheTtlMs) {
        await cache.set(key, result, options.cacheTtlMs);
      }
      return result;
    } catch (error) {
      const apiError =
        error instanceof ApiError ? error : new ApiError('unknown', error instanceof Error ? error.message : 'Unknown error');
      lastError = apiError;

      // Session expiry is never retried.
      if (apiError.isSessionExpired) throw apiError;

      if (!apiError.isRetryable || attempt === retries) break;

      const delay = Math.min(2 ** attempt * 300 + Math.random() * 200, 4000);
      logger.warn(`Retry ${attempt + 1}/${retries} for ${method} ${path}`, { reason: apiError.kind, delayMs: Math.round(delay) });
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // Network/timeout failure on a cacheable GET → degrade to stale cache.
  if (method === 'GET' && options.cacheTtlMs && lastError && (lastError.kind === 'network' || lastError.kind === 'timeout')) {
    const stale = await cache.getStale<T>(key);
    if (stale !== null) {
      logger.info('Serving stale cache after network failure', { path });
      return stale;
    }
  }

  throw lastError ?? new ApiError('unknown', 'Request failed');
}

export const api = {
  get: <T>(path: string, params?: QueryParams, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'GET', params, cacheTtlMs: options?.cacheTtlMs ?? 5 * 60 * 1000 }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'DELETE' }),
};
