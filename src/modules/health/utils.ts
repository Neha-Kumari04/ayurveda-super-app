import { groupBySortedKeys, monthKey, monthLabel, yearKey } from '@/utils/date';

import type { HealthRecord, TimelineGroupBy } from './types';

export interface TimelineSection {
  title: string;
  key: string;
  data: HealthRecord[];
}

/**
 * Builds FlatList-ready sections grouped by month or year.
 * Records must already be sorted newest-first (the API guarantees this).
 */
export function buildTimelineSections(
  records: readonly HealthRecord[] | undefined | null,
  groupBy: TimelineGroupBy,
  locale?: string,
): TimelineSection[] {
  if (!records || records.length === 0) return [];
  if (groupBy === 'none') {
    return [{ title: '', key: 'all', data: [...records] }];
  }

  const keyFn = (record: HealthRecord): string => {
    if (!record || !record.date) return 'Unknown';
    try {
      return groupBy === 'month' ? monthKey(record.date) : yearKey(record.date);
    } catch {
      return 'Unknown';
    }
  };

  return groupBySortedKeys(records, keyFn).map((group) => ({
    key: group.key || 'all',
    title: groupBy === 'month' ? monthLabel(group.key, locale) : (group.key || 'All Records'),
    data: group.data ?? [],
  }));
}

/** Extracts every tag used across records — powers the filter chip list. */
export function collectTags(records: readonly HealthRecord[] | undefined | null): string[] {
  const set = new Set<string>();
  for (const record of records ?? []) {
    if (record?.tags && Array.isArray(record.tags)) {
      for (const tag of record.tags) {
        if (tag) set.add(tag);
      }
    }
  }
  return [...set].sort();
}

export function collectProviders(records: readonly HealthRecord[] | undefined | null): string[] {
  const set = new Set<string>();
  for (const record of records ?? []) {
    if (record?.provider) set.add(record.provider);
  }
  return [...set].sort();
}

export function countByType(records: readonly HealthRecord[]): Record<HealthRecord['type'], number> {
  const counts: Record<HealthRecord['type'], number> = {
    lab_report: 0,
    prescription: 0,
    consultation: 0,
    vaccination: 0,
    allergy: 0,
  };
  for (const record of records) counts[record.type] += 1;
  return counts;
}

/** Validates a record draft before enqueueing/submitting. */
export function validateRecordDraft(draft: {
  title: string;
  date: string;
  provider: string;
}): { ok: boolean; errors: Partial<Record<'title' | 'date' | 'provider', string>> } {
  const errors: Partial<Record<'title' | 'date' | 'provider', string>> = {};
  if (!draft.title.trim()) errors.title = 'Title is required';
  if (!draft.date) errors.date = 'Date is required';
  else if (Number.isNaN(new Date(draft.date).getTime())) errors.date = 'Invalid date';
  else if (new Date(draft.date).getTime() > Date.now() + 24 * 60 * 60 * 1000) {
    errors.date = 'Date cannot be in the future';
  }
  if (!draft.provider.trim()) errors.provider = 'Provider is required';
  return { ok: Object.keys(errors).length === 0, errors };
}
