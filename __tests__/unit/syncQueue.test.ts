import { storage } from '@/core/storage/storage';
import {
  enqueue,
  flushQueue,
  getPendingCount,
  getSyncQueue,
  initSyncQueue,
  subscribeSyncQueue,
  __resetSyncQueue,
} from '@/core/sync/syncQueue';
import { subscribeNetworkStatus } from '@/core/sync/networkMonitor';

// The sync queue keeps its own listener on the network monitor; tests drive
// flushing directly through flushQueue().
describe('sync queue', () => {
  beforeEach(async () => {
    __resetSyncQueue();
    // initSyncQueue rehydrates from storage — clear the persisted copy too.
    await storage.removeItem('sync:queue');
  });

  it('enqueues operations in order', async () => {
    await enqueue({ kind: 'booking.cancel', payload: { bookingId: 'b1' } });
    await enqueue({ kind: 'booking.cancel', payload: { bookingId: 'b2' } });
    expect(getPendingCount()).toBe(2);
    expect(getSyncQueue()[0].operation.kind).toBe('booking.cancel');
  });

  it('flushes queued mutations through the flush function', async () => {
    const flushed: string[] = [];
    await initSyncQueue(async (op) => {
      flushed.push(op.kind);
      return null;
    });
    await enqueue({ kind: 'booking.create', payload: { doctorId: 'd', slotId: 's', start: 'x', end: 'y', localId: 'l' } });
    await enqueue({ kind: 'record.create', payload: { type: 'allergy', title: 't', description: '', date: 'd', provider: 'p', tags: [], localId: 'l2' } });

    await flushQueue();

    expect(flushed).toEqual(['booking.create', 'record.create']);
    expect(getPendingCount()).toBe(0);
  });

  it('keeps failed mutations queued for retry', async () => {
    let attempts = 0;
    await initSyncQueue(async () => {
      attempts += 1;
      throw new Error('network down');
    });
    await enqueue({ kind: 'booking.cancel', payload: { bookingId: 'b1' } });

    await flushQueue();

    expect(attempts).toBe(1);
    expect(getPendingCount()).toBe(1);
    expect(getSyncQueue()[0].attempts).toBe(1);
    expect(getSyncQueue()[0].lastError).toContain('network down');
  });

  it('drops mutations after max attempts', async () => {
    await initSyncQueue(async () => {
      throw new Error('permanent failure');
    });
    await enqueue({ kind: 'booking.cancel', payload: { bookingId: 'b1' } });

    // 5 attempts total (initial + 4 retries of flush)
    for (let i = 0; i < 5; i++) {
      await flushQueue();
    }

    expect(getPendingCount()).toBe(0);
  });

  it('subscribeSyncQueue notifies listeners on changes', async () => {
    const seen: number[] = [];
    const unsubscribe = subscribeSyncQueue((queue) => seen.push(queue.length));
    await enqueue({ kind: 'booking.cancel', payload: { bookingId: 'b1' } });
    unsubscribe();
    expect(seen).toContain(1);
  });

  it('re-exported network monitor hook works', () => {
    expect(typeof subscribeNetworkStatus).toBe('function');
  });
});
