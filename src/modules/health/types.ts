import type { Syncable } from '@/types';

export type RecordType = 'lab_report' | 'prescription' | 'consultation' | 'vaccination' | 'allergy';

export type AttachmentKind = 'image' | 'pdf' | 'none';

export interface Attachment {
  id: string;
  name: string;
  kind: AttachmentKind;
  url: string;
  sizeKb: number;
}

export interface HealthRecord extends Syncable {
  id: string;
  type: RecordType;
  title: string;
  description: string;
  date: string;
  provider: string;
  tags: string[];
  attachments: Attachment[];
  /** Type-specific payload kept loose on purpose — records evolve independently. */
  meta: Record<string, string | number | boolean | string[]>;
  searchText: string;
}

export type TimelineGroupBy = 'month' | 'year' | 'none';

export interface RecordFilters {
  types?: RecordType[];
  tags?: string[];
  providers?: string[];
  fromDate?: string;
  toDate?: string;
}

export interface RecordSearchParams extends RecordFilters {
  q?: string;
}
