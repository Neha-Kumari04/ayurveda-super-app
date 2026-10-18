import { logger } from '../logger/logger';
import { storage } from '../storage/storage';
import { getNetworkStatus, subscribeNetworkStatus } from './networkMonitor';

export type SyncOperation =
  | { kind: 'booking.create'; payload: { doctorId: string; slotId: string; start: string; end: string; reason?: string; localId: string } }
  | { kind: 'booking.cancel'; payload: { bookingId: string } }
  | { kind: 'record.create'; payload: { type: string; title: string; description: string; date: string; provider: string; tags: string[]; localId: string } };

export interface QueuedMutation {
  id: string;
  operation: SyncOperation;
  createdAt: string;
  attempts: number;
  lastError?: string;
}

type FlushFn = (operation: SyncOperation) => Promise<unknown>;

const STORAGE_KEY = 'sync:queue';
const MAX_ATTEMPTS = 5;

let queue: QueuedMutation[] = [];
let flushing = false;
let flushFn: FlushFn | null = null;
const listeners = new Set<(queue: QueuedMutation[]) => void>();

function notify(): void {
  for (const listener of listeners) listener([...queue]);
}

async function persist(): Promise<void> {
  await storage.setItem(STORAGE_KEY, queue);
}

/** Restores the persisted queue — call once at app startup. */
export async function initSyncQueue(flush: FlushFn): Promise<void> {
  flushFn = flush;
  queue = (await storage.getItem<QueuedMutation[]>(STORAGE_KEY)) ?? [];
  subscribeNetworkStatus((status) => {
    if (status.isConnected && status.isInternetReachable) {
      void flushQueue();
    }
  });
  // Attempt an initial flush for anything left over from a previous session.
  if (getNetworkStatus().isConnected) void flushQueue();
}

export function subscribeSyncQueue(listener: (queue: QueuedMutation[]) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSyncQueue(): readonly QueuedMutation[] {
  return queue;
}

export function getPendingCount(kind?: SyncOperation['kind']): number {
  return kind ? queue.filter((m) => m.operation.kind === kind).length : queue.length;
}

/**
 * Enqueues a mutation for later execution. Used whenever the device is
 * offline (or a request fails with a network error) so user actions are
 * never lost.
 */
export async function enqueue(operation: SyncOperation): Promise<QueuedMutation> {
  const mutation: QueuedMutation = {
    id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    operation,
    createdAt: new Date().toISOString(),
    attempts: 0,
  };
  queue = [mutation, ...queue];
  await persist();
  notify();
  logger.info('Mutation queued for sync', { kind: operation.kind, queueSize: queue.length });
  return mutation;
}

/**
 * Executes all queued mutations in order. Each mutation retries up to
 * MAX_ATTEMPTS times before being dropped with an error log.
 */
export async function flushQueue(): Promise<void> {
  if (flushing || !flushFn || queue.length === 0) return;
  if (!getNetworkStatus().isConnected) return;

  flushing = true;
  const remaining: QueuedMutation[] = [];

  try {
    // Process oldest-first so dependent operations stay ordered.
    for (const mutation of [...queue].reverse()) {
      try {
        await flushFn(mutation.operation);
        logger.info('Queued mutation synced', { kind: mutation.operation.kind });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'sync failed';
        mutation.attempts += 1;
        mutation.lastError = message;
        if (mutation.attempts < MAX_ATTEMPTS) {
          remaining.unshift(mutation);
        } else {
          logger.error('Dropping mutation after max attempts', { kind: mutation.operation.kind, error });
        }
      }
    }
  } finally {
    queue = remaining;
    await persist();
    notify();
    flushing = false;
  }
}

/** Test hook — resets internal state. */
export function __resetSyncQueue(): void {
  queue = [];
  flushing = false;
  listeners.clear();
}
