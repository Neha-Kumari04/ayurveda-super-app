import * as Network from 'expo-network';
import { useSyncExternalStore } from 'react';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean;
}

const listeners = new Set<(status: NetworkStatus) => void>();
let current: NetworkStatus = { isConnected: true, isInternetReachable: true };
let started = false;
let subscription: { remove: () => void } | null = null;

function emit(status: NetworkStatus): void {
  if (status.isConnected === current.isConnected && status.isInternetReachable === current.isInternetReachable) {
    return;
  }
  current = status;
  for (const listener of listeners) listener(status);
}

function toStatus(state: Network.NetworkState): NetworkStatus {
  return {
    isConnected: state.isConnected ?? false,
    isInternetReachable: state.isInternetReachable ?? state.isConnected ?? false,
  };
}

/**
 * Network monitor built on expo-network's native state listener.
 * A single global subscription — cheap enough for the whole app, and avoids
 * pulling in @react-native-community/netinfo.
 */
export function startNetworkMonitoring(): () => void {
  if (started) return () => undefined;
  started = true;

  void Network.getNetworkStateAsync()
    .then((state) => emit(toStatus(state)))
    .catch(() => undefined);

  subscription = Network.addNetworkStateListener((event) => {
    emit(toStatus(event));
  });

  return () => {
    subscription?.remove();
    subscription = null;
    started = false;
  };
}

export function getNetworkStatus(): NetworkStatus {
  return current;
}

export function subscribeNetworkStatus(listener: (status: NetworkStatus) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useNetworkStatus(): NetworkStatus {
  return useSyncExternalStore(subscribeNetworkStatus, getNetworkStatus, () => current);
}

export function useIsOnline(): boolean {
  const status = useNetworkStatus();
  return status.isConnected && status.isInternetReachable;
}
