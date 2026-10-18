import { create } from 'zustand';

import { api, onSessionExpired, setAuthTokenProvider } from '@/core/api/client';
import { logger } from '@/core/logger/logger';
import { secureStorage } from '@/core/storage/storage';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  tokenExpiresAt: number | null;
  status: 'loading' | 'signedOut' | 'signedIn';
  sessionExpired: boolean;

  bootstrap: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  handleSessionExpired: () => void;
}

const TOKEN_KEY = 'auth:token';
const USER_KEY = 'auth:user';
const EXPIRY_KEY = 'auth:expiry';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  tokenExpiresAt: null,
  status: 'loading',
  sessionExpired: false,

  bootstrap: async () => {
    // The API layer reads the token through this provider on every request.
    setAuthTokenProvider(() => useAuthStore.getState().token);

    const [token, userJson, expiryRaw] = await Promise.all([
      secureStorage.getItem(TOKEN_KEY),
      secureStorage.getItem(USER_KEY),
      secureStorage.getItem(EXPIRY_KEY),
    ]);

    if (!token) {
      set({ status: 'signedOut' });
      return;
    }

    const expiresAt = expiryRaw ? Number(expiryRaw) : 0;
    if (expiresAt && expiresAt < Date.now()) {
      await secureStorage.removeItem(TOKEN_KEY);
      set({ status: 'signedOut', sessionExpired: true });
      return;
    }

    let user: User | null = null;
    try {
      user = userJson ? (JSON.parse(userJson) as User) : null;
    } catch {
      user = null;
    }

    set({ token, user, tokenExpiresAt: expiresAt, status: user ? 'signedIn' : 'signedOut' });
  },

  signIn: async (email, password) => {
    const result = await api.post<{ token: string; expiresAt: number; user: User }>('/auth/login', {
      email,
      password,
    });
    await Promise.all([
      secureStorage.setItem(TOKEN_KEY, result.token),
      secureStorage.setItem(USER_KEY, JSON.stringify(result.user)),
      secureStorage.setItem(EXPIRY_KEY, String(result.expiresAt)),
    ]);
    set({
      token: result.token,
      user: result.user,
      tokenExpiresAt: result.expiresAt,
      status: 'signedIn',
      sessionExpired: false,
    });
    logger.info('Signed in', { userId: result.user.id });
  },

  signOut: async () => {
    await Promise.all([
      secureStorage.removeItem(TOKEN_KEY),
      secureStorage.removeItem(USER_KEY),
      secureStorage.removeItem(EXPIRY_KEY),
    ]);
    set({ token: null, user: null, tokenExpiresAt: null, status: 'signedOut' });
  },

  handleSessionExpired: () => {
    logger.warn('Session expired — signing out');
    void get().signOut();
    set({ sessionExpired: true });
  },
}));

// Wire the API client's 401 handler once at module load.
onSessionExpired(() => useAuthStore.getState().handleSessionExpired());

export function isTokenExpiringSoon(state: AuthState, thresholdMs = 5 * 60 * 1000): boolean {
  if (!state.tokenExpiresAt) return false;
  return state.tokenExpiresAt - Date.now() < thresholdMs;
}
