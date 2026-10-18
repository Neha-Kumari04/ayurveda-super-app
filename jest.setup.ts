import '@testing-library/react-native/matchers';

// Official mock — the real provider renders a native component whose children
// don't materialise under Jest.
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

// In-memory AsyncStorage (v2 API incl. multiGet) so persistence is testable.
jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (key: string) => store.get(key) ?? null),
      setItem: jest.fn(async (key: string, value: string) => {
        store.set(key, value);
      }),
      removeItem: jest.fn(async (key: string) => {
        store.delete(key);
      }),
      multiGet: jest.fn(async (keys: string[]) => keys.map((key) => [key, store.get(key) ?? null] as [string, string | null])),
      multiSet: jest.fn(async (pairs: Array<[string, string]>) => {
        pairs.forEach(([key, value]) => store.set(key, value));
      }),
      multiRemove: jest.fn(async (keys: string[]) => {
        keys.forEach((key) => store.delete(key));
      }),
      getAllKeys: jest.fn(async () => [...store.keys()]),
      clear: jest.fn(async () => store.clear()),
    },
  };
});

// Mock expo modules that access native APIs at import time.
jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'en', languageTag: 'en-US' }],
}));

jest.mock('expo-network', () => ({
  getNetworkStateAsync: jest.fn(async () => ({ isConnected: true, isInternetReachable: true, type: 'WIFI' })),
  addNetworkStateListener: jest.fn(() => ({ remove: jest.fn() })),
  useNetworkState: () => ({ isConnected: true, isInternetReachable: true, type: 'WIFI' }),
  getIpAddressAsync: jest.fn(async () => '127.0.0.1'),
  isAirplaneModeEnabledAsync: jest.fn(async () => false),
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
  canUseBiometricAuthentication: jest.fn(async () => false),
}));

jest.mock('expo-local-authentication', () => ({
  authenticateAsync: jest.fn(async () => ({ success: true })),
  hasHardwareAsync: jest.fn(async () => false),
  isEnrolledAsync: jest.fn(async () => false),
  SecurityLevel: { BIOMETRIC: 1, SECURE_HARDWARE: 2, NONE: 0 },
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(async () => undefined),
  notificationAsync: jest.fn(async () => undefined),
  selectionAsync: jest.fn(async () => undefined),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

// Silence noisy console logs from the logger in tests.
jest.spyOn(console, 'info').mockImplementation(() => {});
jest.spyOn(console, 'debug').mockImplementation(() => {});
