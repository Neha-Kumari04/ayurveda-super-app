import { MutationCache, QueryClient } from '@tanstack/react-query';

import { logger } from '../logger/logger';

/**
 * React Query powers server state: deduping, background refetch, retries and
 * cache hydration. Domain-specific retry policy lives here so hooks stay thin.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 10 * 60_000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        retry: (failureCount, error) => {
          // The API layer already retries transient failures; don't stack retries.
          if (error && typeof error === 'object' && 'isRetryable' in error) {
            const retryable = (error as { isRetryable?: boolean }).isRetryable === true;
            return retryable && failureCount < 1;
          }
          return failureCount < 1;
        },
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 5000),
      },
      mutations: {
        retry: false,
      },
    },
    mutationCache: new MutationCache({
      onError: (error) => {
        logger.warn('Mutation failed', { message: error instanceof Error ? error.message : String(error) });
      },
    }),
  });
}
