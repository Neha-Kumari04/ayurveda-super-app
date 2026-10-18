import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

import { logger } from '../logger/logger';

const PREFIX = '@ayurveda:';

/**
 * Type-safe wrapper around AsyncStorage with JSON serialisation,
 * namespacing and graceful failure handling (a corrupt entry never
 * crashes the app — it is logged and treated as a cache miss).
 */
export const storage = {
  async getItem<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(PREFIX + key);
      return raw === null ? null : (JSON.parse(raw) as T);
    } catch (error) {
      logger.warn('storage.getItem failed', { key, error });
      return null;
    }
  },

  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch (error) {
      logger.warn('storage.setItem failed', { key, error });
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(PREFIX + key);
    } catch (error) {
      logger.warn('storage.removeItem failed', { key, error });
    }
  },

  async multiGet<T>(keys: string[]): Promise<Record<string, T | null>> {
    const pairs = await AsyncStorage.multiGet(keys.map((k) => PREFIX + k));
    const result: Record<string, T | null> = {};
    for (const [fullKey, raw] of pairs) {
      const key = fullKey.replace(PREFIX, '');
      try {
        result[key] = raw === null ? null : (JSON.parse(raw) as T);
      } catch {
        result[key] = null;
      }
    }
    return result;
  },
};

/**
 * Secure storage for credentials / session tokens.
 * Uses Keychain (iOS) & EncryptedSharedPreferences (Android).
 *
 * SecureStore keys must be alphanumeric plus ".", "-", "_" — the app's
 * `:`-style keys are sanitised before hitting the keychain.
 */
const SECURE_PREFIX = 'ayurveda';

function secureKey(key: string): string {
  return `${SECURE_PREFIX}-${key}`.replace(/[^A-Za-z0-9._-]/g, '-');
}

export const secureStorage = {
  isAvailable: SecureStore.canUseBiometricAuthentication !== undefined,

  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(secureKey(key));
    } catch (error) {
      logger.warn('secureStorage.getItem failed', { key, error });
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(secureKey(key), value);
    } catch (error) {
      logger.warn('secureStorage.setItem failed', { key, error });
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(secureKey(key));
    } catch (error) {
      logger.warn('secureStorage.removeItem failed', { key, error });
    }
  },
};
