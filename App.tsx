import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { createQueryClient } from '@/core/api/queryClient';
import { api } from '@/core/api/client';
import { logger, setCrashReporter, type CrashReporter } from '@/core/logger/logger';
import { startNetworkMonitoring } from '@/core/sync/networkMonitor';
import { flushQueue, initSyncQueue } from '@/core/sync/syncQueue';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ToastProvider } from '@/components/toast/ToastProvider';
import { RootNavigator } from '@/navigation/RootNavigator';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { ThemeProvider } from '@/theme/ThemeProvider';

const queryClient = createQueryClient();

/**
 * CrashReporter that logs through our abstraction. In production, replace with
 * a Sentry/Bugsnag implementation via setCrashReporter() — call sites stay put.
 */
class ConsoleCrashReporter implements CrashReporter {
  captureException(error: Error, context?: Record<string, unknown>): void {
    logger.error('crash:exception', { ...context, error });
  }
  captureMessage(message: string, context?: Record<string, unknown>): void {
    logger.error('crash:message', { ...context, message });
  }
}

/** Executes queued offline mutations against the API layer. */
async function syncOperation(operation: { kind: string; payload: Record<string, unknown> }): Promise<unknown> {
  switch (operation.kind) {
    case 'booking.create':
      return api.post('/bookings', operation.payload, { cacheTtlMs: 0 });
    case 'booking.cancel':
      return api.delete(`/bookings/${String(operation.payload.bookingId)}`, { cacheTtlMs: 0 });
    case 'record.create':
      return api.post('/records', operation.payload, { cacheTtlMs: 0 });
    default:
      logger.warn('Unknown sync operation', { kind: operation.kind });
      return null;
  }
}

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let stopMonitoring: (() => void) | undefined;

    const setup = async () => {
      setCrashReporter(new ConsoleCrashReporter());
      stopMonitoring = startNetworkMonitoring();

      await Promise.all([useAuthStore.getState().bootstrap(), initSyncQueue(syncOperation)]);
      void useSettingsStore.getState().fetchRemoteConfig();
      void flushQueue();

      logger.info('App initialised', {
        mockApi: process.env.EXPO_PUBLIC_USE_MOCK_API !== 'false',
      });

      setReady(true);
    };

    void setup();

    return () => stopMonitoring?.();
  }, []);

  if (!ready) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ThemeProvider>
          {/* Inside ThemeProvider so the fallback UI can use theme tokens. */}
          <ErrorBoundary>
            <ToastProvider>
              <StatusBar style="auto" />
              <RootNavigator />
            </ToastProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
