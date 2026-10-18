import * as LocalAuthentication from 'expo-local-authentication';
import { useCallback, useEffect, useState } from 'react';

import { logger } from '@/core/logger/logger';

export interface BiometricState {
  isAvailable: boolean;
  isEnrolled: boolean;
  authenticate: (reason?: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

/**
 * Biometric authentication gate. Availability is re-checked on mount because
 * users can enrol biometrics while the app is running.
 */
export function useBiometric(forceEnabled = true): BiometricState {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);

  const refresh = useCallback(async () => {
    if (!forceEnabled) {
      setIsAvailable(false);
      setIsEnrolled(false);
      return;
    }
    try {
      const [hasHardware, enrolled] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
      ]);
      setIsAvailable(hasHardware);
      setIsEnrolled(enrolled);
    } catch (error) {
      logger.warn('Biometric availability check failed', { error });
      setIsAvailable(false);
      setIsEnrolled(false);
    }
  }, [forceEnabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const authenticate = useCallback(
    async (reason = 'Unlock Ayurveda Super App') => {
      if (!isAvailable || !isEnrolled) return true;
      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: reason,
          cancelLabel: 'Cancel',
          disableDeviceFallback: false,
        });
        return result.success;
      } catch (error) {
        logger.warn('Biometric auth failed', { error });
        return false;
      }
    },
    [isAvailable, isEnrolled],
  );

  return { isAvailable, isEnrolled, authenticate, refresh };
}
