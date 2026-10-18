import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { env } from '@/core/config/env';
import { api } from '@/core/api/client';
import { logger } from '@/core/logger/logger';
import { storage } from '@/core/storage/storage';

export type ThemeMode = 'light' | 'dark' | 'system';
export type Locale = 'en' | 'hi';

interface RemoteConfig {
  flags: Record<string, boolean>;
  minSupportedVersion: string;
  updatedAt: string;
}

interface SettingsState {
  themeMode: ThemeMode;
  locale: Locale;
  isHydrated: boolean;
  remoteConfig: RemoteConfig | null;
  remoteConfigFetchedAt: number | null;

  setThemeMode: (mode: ThemeMode) => void;
  setLocale: (locale: Locale) => void;
  setHydrated: (value: boolean) => void;
  fetchRemoteConfig: () => Promise<void>;
  /** Local env fallback merged with remote flags — remote wins when present. */
  isFeatureEnabled: (flag: string) => boolean;
}

const REMOTE_CONFIG_TTL_MS = 15 * 60 * 1000;

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      themeMode: 'system',
      locale: 'en',
      isHydrated: false,
      remoteConfig: null,
      remoteConfigFetchedAt: null,

      setThemeMode: (themeMode) => set({ themeMode }),
      setLocale: (locale) => set({ locale }),
      setHydrated: (isHydrated) => set({ isHydrated }),

      fetchRemoteConfig: async () => {
        const { remoteConfigFetchedAt } = get();
        if (remoteConfigFetchedAt && Date.now() - remoteConfigFetchedAt < REMOTE_CONFIG_TTL_MS) {
          return;
        }
        try {
          const config = await api.get<RemoteConfig>('/config/remote', undefined, { cacheTtlMs: REMOTE_CONFIG_TTL_MS });
          set({ remoteConfig: config, remoteConfigFetchedAt: Date.now() });
          logger.info('Remote config refreshed', { flags: Object.keys(config.flags ?? {}) });
        } catch (error) {
          // Offline / failure is fine — we keep whatever we already have.
          logger.warn('Remote config fetch failed; using cached flags', { error });
        }
      },

      isFeatureEnabled: (flag) => {
        const { remoteConfig } = get();
        const remote = remoteConfig?.flags?.[flag];
        if (remote !== undefined) return remote;
        // Local env-based fallbacks for launch flags.
        if (flag === 'sync.enabled') return env.features.sync;
        if (flag === 'biometric.enabled') return env.features.biometric;
        return false;
      },
    }),
    {
      name: 'settings',
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({
        themeMode: state.themeMode,
        locale: state.locale,
        remoteConfig: state.remoteConfig,
        remoteConfigFetchedAt: state.remoteConfigFetchedAt,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
