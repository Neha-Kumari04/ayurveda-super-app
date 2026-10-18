import { api } from '@/core/api/client';
import { toPaginated } from '@/core/api/paginate';

import type { Doctor, DoctorSearchParams, Booking, TimeSlot, SortOption } from './types';
import type { Paginated, QueryParams } from '@/types';

/** Serialises filter arrays into repeated query params understood by the mock server. */
export function toDoctorQueryParams(params: DoctorSearchParams & { page?: number; pageSize?: number }): QueryParams {
  const query: QueryParams = { page: params.page, pageSize: params.pageSize };
  if (params.q) query.q = params.q;
  if (params.sort) query.sort = params.sort;
  if (params.specialties?.length) query.specialties = params.specialties;
  if (params.cities?.length) query.cities = params.cities;
  if (params.genders?.length) query.genders = params.genders;
  if (params.minRating) query.minRating = params.minRating;
  if (params.maxFee) query.maxFee = params.maxFee;
  if (params.minExperience) query.minExperience = params.minExperience;
  if (params.availableOnly) query.availableOnly = true;
  return query;
}

export const consultationApi = {
  async listDoctors(params: DoctorSearchParams & { page?: number; pageSize?: number }): Promise<Paginated<Doctor>> {
    const raw = await api.get<unknown>('/doctors', toDoctorQueryParams(params), { cacheTtlMs: 5 * 60 * 1000 });
    return toPaginated<Doctor>(raw, { page: params.page, pageSize: params.pageSize });
  },

  getDoctor(id: string): Promise<Doctor> {
    return api.get<Doctor>(`/doctors/${id}`, undefined, { cacheTtlMs: 30 * 60 * 1000 });
  },

  getSlots(doctorId: string, date: Date): Promise<{ doctorId: string; date: string; slots: TimeSlot[]; partial?: boolean }> {
    return api.get(`doctors/${doctorId}/slots`, { date: date.toISOString() }, { cacheTtlMs: 30 * 1000 });
  },

  createBooking(body: { doctorId: string; slotId: string; start: string; end: string; reason?: string }): Promise<Booking> {
    return api.post<Booking>('/bookings', body, { cacheTtlMs: 0 });
  },

  listBookings(status?: string): Promise<{ items: Booking[]; total: number }> {
    return api.get('/bookings', status ? { status } : undefined, { cacheTtlMs: 60 * 1000 });
  },

  cancelBooking(id: string): Promise<Booking> {
    return api.delete<Booking>(`/bookings/${id}`, { cacheTtlMs: 0 });
  },
};

export const DOCTOR_SORT_OPTIONS: Array<{ value: SortOption; labelKey: string }> = [
  { value: 'rating', labelKey: 'consult.sortRating' },
  { value: 'fee_low', labelKey: 'consult.sortFeeLow' },
  { value: 'fee_high', labelKey: 'consult.sortFeeHigh' },
  { value: 'experience', labelKey: 'consult.sortExperience' },
  { value: 'next_available', labelKey: 'consult.sortNext' },
];
