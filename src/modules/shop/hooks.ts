import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';

import { getProductById, getProducts } from '@/data/generators/products';
import { useDebounced } from '@/utils/debounce';

import { shopApi } from './api';

import type { Product, ProductFilters, ProductSearchParams, ProductSortOption } from './types';

const PAGE_SIZE = 24;

/**
 * Products listing with debounced search + infinite scroll.
 * Rows are plain objects from the memoised in-memory dataset — no re-generation,
 * no allocations per render beyond the page slice.
 */
export function useProductList() {
  const [state, setState] = useState<{
    query: string;
    filters: ProductFilters;
    sort: ProductSortOption;
  }>({ query: '', filters: {}, sort: 'relevance' });

  const debouncedQuery = useDebounced(state.query, 300);

  const params = useMemo<ProductSearchParams>(
    () => ({ ...state.filters, q: debouncedQuery || undefined, sort: state.sort }),
    [state.filters, debouncedQuery, state.sort],
  );

  const query = useInfiniteQuery({
    queryKey: ['products', params],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => shopApi.listProducts({ ...params, page: pageParam, pageSize: PAGE_SIZE }),
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    placeholderData: (previousData) => previousData,
  });

  const products = useMemo(() => query.data?.pages.flatMap((page) => page?.items ?? []) ?? [], [query.data]);

  const setQuery = useCallback((q: string) => setState((s) => ({ ...s, query: q })), []);
  const setSort = useCallback((sort: ProductSortOption) => setState((s) => ({ ...s, sort })), []);
  const setFilters = useCallback((filters: ProductFilters) => setState((s) => ({ ...s, filters })), []);
  const resetFilters = useCallback(() => setState((s) => ({ ...s, filters: {} })), []);

  const toggleInArrayFilter = useCallback(<K extends 'categories' | 'forms' | 'tags'>(key: K, value: string) => {
    setState((s) => {
      const current = (s.filters[key] as string[] | undefined) ?? [];
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      return { ...s, filters: { ...s.filters, [key]: next.length ? next : undefined } };
    });
  }, []);

  return {
    products,
    total: query.data?.pages[0]?.total ?? 0,
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    isSearching: query.isFetching && !query.isLoading,
    error: query.error,
    hasNextPage: query.hasNextPage ?? false,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
    query: state.query,
    filters: state.filters,
    sort: state.sort,
    setQuery,
    setSort,
    setFilters,
    resetFilters,
    toggleInArrayFilter,
  };
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      // Fast path: in-memory index. Slow path: API (also exercises the cache).
      const local = getProductById(id);
      if (local) return local;
      return shopApi.getProduct(id);
    },
    enabled: Boolean(id),
    staleTime: 30 * 60 * 1000,
  });
}

/** Resolves many products by id without N network calls (uses the local index). */
export function useProductsByIds(ids: string[]): Product[] {
  return useMemo(() => {
    const idSet = new Set(ids);
    return getProducts().filter((p) => idSet.has(p.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(',')]);
}
