import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';

import { useIsOnline } from '@/core/sync/networkMonitor';
import { enqueue } from '@/core/sync/syncQueue';
import { useDebounced } from '@/utils/debounce';

import { healthApi } from './api';

import type { HealthRecord, RecordFilters, RecordSearchParams, RecordType, TimelineGroupBy } from './types';

const PAGE_SIZE = 30;

export function useHealthTimeline() {
  const [state, setState] = useState<{
    query: string;
    filters: RecordFilters;
    groupBy: TimelineGroupBy;
  }>({ query: '', filters: {}, groupBy: 'month' });

  const debouncedQuery = useDebounced(state.query, 300);

  const params = useMemo<RecordSearchParams>(
    () => ({ ...state.filters, q: debouncedQuery || undefined }),
    [state.filters, debouncedQuery],
  );

  const query = useInfiniteQuery({
    queryKey: ['records', params],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => healthApi.listRecords({ ...params, page: pageParam, pageSize: PAGE_SIZE }),
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    placeholderData: (previousData) => previousData,
  });

  const records = useMemo(() => query.data?.pages.flatMap((page) => page.items) ?? [], [query.data]);

  const setQuery = useCallback((q: string) => setState((s) => ({ ...s, query: q })), []);
  const setGroupBy = useCallback((groupBy: TimelineGroupBy) => setState((s) => ({ ...s, groupBy })), []);
  const setFilters = useCallback((filters: RecordFilters) => setState((s) => ({ ...s, filters })), []);
  const resetFilters = useCallback(() => setState((s) => ({ ...s, filters: {} })), []);
  const toggleInArrayFilter = useCallback(<K extends 'types' | 'tags' | 'providers'>(key: K, value: string) => {
    setState((s) => {
      const current = (s.filters[key] as string[] | undefined) ?? [];
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      return { ...s, filters: { ...s.filters, [key]: next.length ? (next as never) : undefined } };
    });
  }, []);

  return {
    records,
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
    groupBy: state.groupBy,
    setQuery,
    setGroupBy,
    setFilters,
    resetFilters,
    toggleInArrayFilter,
  };
}

export function useRecord(id: string) {
  return useQuery({
    queryKey: ['record', id],
    queryFn: () => healthApi.getRecord(id),
    enabled: Boolean(id),
  });
}

export interface CreateRecordInput {
  type: RecordType;
  title: string;
  description: string;
  date: string;
  provider: string;
  tags: string[];
}

/** Creates records online, or queues them for automatic sync when offline. */
export function useCreateRecord() {
  const queryClient = useQueryClient();
  const isOnline = useIsOnline();

  return useMutation<HealthRecord, unknown, CreateRecordInput>({
    mutationFn: async (input) => {
      if (!isOnline) {
        await enqueue({
          kind: 'record.create',
          payload: { ...input, localId: `local_${Date.now()}` },
        });
        return {
          id: `local_${Date.now()}`,
          ...input,
          attachments: [],
          meta: {},
          searchText: `${input.title} ${input.description}`.toLowerCase(),
          syncStatus: 'pending',
          localId: `local_${Date.now()}`,
        };
      }
      return healthApi.createRecord(input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['records'] });
    },
  });
}
