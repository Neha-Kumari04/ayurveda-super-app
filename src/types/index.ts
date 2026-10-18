/** Envelope returned by the API layer for paginated collections. */
export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  /** True when the payload came from the offline cache rather than the network. */
  fromCache?: boolean;
  /** Partial payloads let the UI render what arrived and flag the rest. */
  partial?: boolean;
}

export interface QueryParams {
  page?: number;
  pageSize?: number;
  q?: string;
  [key: string]: string | number | boolean | undefined | string[];
}

export type SyncStatus = 'synced' | 'pending' | 'failed';

/** Marker attached to entities created while offline. */
export interface Syncable {
  syncStatus?: SyncStatus;
  localId?: string;
}
