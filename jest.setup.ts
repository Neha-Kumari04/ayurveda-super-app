import '@testing-library/react-native/matchers';
jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  const createChainable = () => {
    const chain: any = {
      duration: () => chain,
      delay: () => chain,
      springify: () => chain,
      damping: () => chain,
      mass: () => chain,
      stiffness: () => chain,
      overshootClamping: () => chain,
    };
    return chain;
  };

  return {
    __esModule: true,
    default: {
      View,
      createAnimatedComponent: (component: any) => component,
    },
    useSharedValue: (initialValue: any) => ({ value: initialValue }),
    useAnimatedStyle: (updater: () => any) => updater() || {},
    withSpring: (toValue: any) => toValue,
    withTiming: (toValue: any) => toValue,
    withRepeat: (animation: any) => animation,
    Easing: {
      out: (fn: any) => fn,
      ease: (t: any) => t,
    },
    FadeInDown: createChainable(),
    FadeInUp: createChainable(),
    FadeIn: createChainable(),
    FadeOut: createChainable(),
  };
});

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

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(async () => undefined),
  hideAsync: jest.fn(async () => undefined),
  setOptions: jest.fn(),
}));

jest.mock('expo-camera', () => {
  const React = require('react');
  const { View } = require('react-native');
  const granted = {
    granted: true,
    status: 'granted',
    canAskAgain: true,
    expires: 'never',
  };
  return {
    __esModule: true,
    CameraView: (props: Record<string, unknown>) => React.createElement(View, props),
    useCameraPermissions: () => [granted, jest.fn(async () => granted), jest.fn(async () => granted)],
  };
});

// Vector icons load fonts through expo-font/expo-asset at runtime — stub them
// in tests so we render a plain (invisible) element instead.
jest.mock('@expo/vector-icons/Ionicons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { __esModule: true, default: (props: Record<string, unknown>) => React.createElement(View, props) };
});
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  const Icon = (props: Record<string, unknown>) => React.createElement(View, props);
  return { __esModule: true, default: Icon, Ionicons: Icon };
});

// Silence noisy console logs from the logger in tests.
jest.spyOn(console, 'info').mockImplementation(() => {});
jest.spyOn(console, 'debug').mockImplementation(() => {});
