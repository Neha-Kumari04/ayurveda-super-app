import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';

import { useIsOnline } from '@/core/sync/networkMonitor';
import { enqueue } from '@/core/sync/syncQueue';
import { useDebounced } from '@/utils/debounce';

import { consultationApi } from './api';
import { bookingErrorMessage, validateBookingRequest } from './utils';

import type { DoctorFilters, DoctorSearchParams, SortOption, Booking, TimeSlot } from './types';

const PAGE_SIZE = 20;

export interface DoctorListState {
  query: string;
  filters: DoctorFilters;
  sort: SortOption;
}

export function useDoctorList() {
  const [state, setState] = useState<DoctorListState>({
    query: '',
    filters: {},
    sort: 'rating',
  });
  const debouncedQuery = useDebounced(state.query, 300);

  const params = useMemo<DoctorSearchParams>(
    () => ({ ...state.filters, q: debouncedQuery || undefined, sort: state.sort }),
    [state.filters, debouncedQuery, state.sort],
  );

  const query = useInfiniteQuery({
    queryKey: ['doctors', params],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      consultationApi.listDoctors({ ...params, page: pageParam, pageSize: PAGE_SIZE }),
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    placeholderData: (previousData) => previousData,
  });

  const doctors = useMemo(() => query.data?.pages.flatMap((page) => page?.items ?? []) ?? [], [query.data]);

  const setQuery = useCallback((q: string) => setState((s) => ({ ...s, query: q })), []);
  const setSort = useCallback((sort: SortOption) => setState((s) => ({ ...s, sort })), []);
  const setFilters = useCallback((filters: DoctorFilters) => setState((s) => ({ ...s, filters })), []);
  const resetFilters = useCallback(() => setState((s) => ({ ...s, filters: {} })), []);
  const toggleSpecialty = useCallback((specialty: string) => {
    setState((s) => {
      const current = s.filters.specialties ?? [];
      const specialties = current.includes(specialty as never)
        ? current.filter((c) => c !== specialty)
        : [...current, specialty as never];
      return { ...s, filters: { ...s.filters, specialties: specialties.length ? specialties : undefined } };
    });
  }, []);

  return {
    doctors,
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
    toggleSpecialty,
  };
}

export function useDoctor(id: string) {
  return useQuery({
    queryKey: ['doctor', id],
    queryFn: () => consultationApi.getDoctor(id),
    enabled: Boolean(id),
  });
}

export function useDoctorSlots(doctorId: string, date: Date) {
  const dateKey = date.toDateString();
  return useQuery({
    queryKey: ['slots', doctorId, dateKey],
    queryFn: () => consultationApi.getSlots(doctorId, date),
    enabled: Boolean(doctorId),
    staleTime: 30 * 1000,
  });
}

export interface BookSlotInput {
  doctorId: string;
  slot: TimeSlot;
  reason?: string;
  doctorName?: string;
  specialty?: string;
  fee?: number;
}

/**
 * Booking mutation with client-side conflict validation, optimistic offline
 * queueing and server-authoritative error mapping (slot conflicts, expiry,
 * double bookings).
 */
export function useBookSlot(existingBookings: Booking[]) {
  const queryClient = useQueryClient();
  const isOnline = useIsOnline();

  return useMutation<Booking, unknown, BookSlotInput>({
    mutationFn: async (input) => {
      const validation = validateBookingRequest({ slot: input.slot, existingBookings });
      if (!validation.ok) {
        throw new Error(validation.message);
      }
      if (!isOnline) {
        // Offline booking: queue it and return a synthetic pending booking.
        await enqueue({
          kind: 'booking.create',
          payload: {
            doctorId: input.doctorId,
            slotId: input.slot.id,
            start: input.slot.start,
            end: input.slot.end,
            reason: input.reason,
            localId: `local_${input.slot.id}`,
          },
        });
        return {
          id: `local_${input.slot.id}`,
          doctorId: input.doctorId,
          doctorName: input.doctorName ?? '',
          specialty: input.specialty ?? '',
          start: input.slot.start,
          end: input.slot.end,
          fee: input.fee ?? 0,
          status: 'pending',
          createdAt: new Date().toISOString(),
          syncStatus: 'pending',
          localId: `local_${input.slot.id}`,
        };
      }
      return consultationApi.createBooking({
        doctorId: input.doctorId,
        slotId: input.slot.id,
        start: input.slot.start,
        end: input.slot.end,
        reason: input.reason,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
      void queryClient.invalidateQueries({ queryKey: ['slots'] });
    },
  });
}

export function useBookings(status?: string) {
  return useQuery({
    queryKey: ['bookings', status ?? 'all'],
    queryFn: () => consultationApi.listBookings(status),
    staleTime: 30 * 1000,
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();
  const isOnline = useIsOnline();

  return useMutation<Booking | null, unknown, string>({
    mutationFn: async (bookingId) => {
      if (!isOnline) {
        await enqueue({ kind: 'booking.cancel', payload: { bookingId } });
        return null;
      }
      return consultationApi.cancelBooking(bookingId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bookings'] });
      void queryClient.invalidateQueries({ queryKey: ['slots'] });
    },
  });
}

export { bookingErrorMessage };
