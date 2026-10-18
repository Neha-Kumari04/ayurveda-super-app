import { api } from '@/core/api/client';
import { toPaginated } from '@/core/api/paginate';
import Ionicons from '@expo/vector-icons/Ionicons';

import type { ComponentProps } from 'react';
import type { HealthRecord, RecordSearchParams } from './types';
import type { Paginated, QueryParams } from '@/types';

export function toRecordQueryParams(params: RecordSearchParams & { page?: number; pageSize?: number }): QueryParams {
  const query: QueryParams = { page: params.page, pageSize: params.pageSize };
  if (params.q) query.q = params.q;
  if (params.types?.length) query.types = params.types;
  if (params.tags?.length) query.tags = params.tags;
  if (params.providers?.length) query.providers = params.providers;
  if (params.fromDate) query.fromDate = params.fromDate;
  if (params.toDate) query.toDate = params.toDate;
  return query;
}

export const healthApi = {
  async listRecords(params: RecordSearchParams & { page?: number; pageSize?: number }): Promise<Paginated<HealthRecord>> {
    const raw = await api.get<unknown>('/records', toRecordQueryParams(params), { cacheTtlMs: 5 * 60 * 1000 });
    return toPaginated<HealthRecord>(raw, { page: params.page, pageSize: params.pageSize });
  },

  getRecord(id: string): Promise<HealthRecord> {
    return api.get<HealthRecord>(`/records/${id}`, undefined, { cacheTtlMs: 30 * 60 * 1000 });
  },

  createRecord(body: {
    type: string;
    title: string;
    description: string;
    date: string;
    provider: string;
    tags: string[];
  }): Promise<HealthRecord> {
    return api.post<HealthRecord>('/records', body, { cacheTtlMs: 0 });
  },
};

export const RECORD_TYPE_TONE: Record<HealthRecord['type'], 'info' | 'success' | 'warning' | 'danger' | 'neutral'> = {
  lab_report: 'info',
  prescription: 'success',
  consultation: 'neutral',
  vaccination: 'info',
  allergy: 'danger',
};

export const RECORD_TYPE_ICON: Record<HealthRecord['type'], ComponentProps<typeof Ionicons>['name']> = {
  lab_report: 'flask',
  prescription: 'medkit',
  consultation: 'pulse',
  vaccination: 'bandage',
  allergy: 'warning',
};
