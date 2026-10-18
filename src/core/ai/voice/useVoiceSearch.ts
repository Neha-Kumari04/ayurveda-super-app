import { useCallback, useEffect, useRef, useState } from 'react';

import { useSettingsStore } from '@/store/settingsStore';
import { logger } from '@/core/logger/logger';

import { getSharedRecognizer } from './recognizer';

import type { VoiceRecognitionState } from './types';

function localeTag(appLocale: 'en' | 'hi'): string {
  return appLocale === 'hi' ? 'hi-IN' : 'en-US';
}

export interface UseVoiceSearchReturn {
  state: VoiceRecognitionState;
  isListening: boolean;
  isProcessing: boolean;
  /** Live partial transcript while the user is speaking. */
  interimText: string;
  error: string | null;
  /** Start listening; calls `onResult` with the final transcribed text. */
  start: (onResult: (text: string) => void) => void;
  /** Cancel the current session. */
  cancel: () => void;
}

export function useVoiceSearch(): UseVoiceSearchReturn {
  const [state, setState] = useState<VoiceRecognitionState>('idle');
  const [interimText, setInterimText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);
  const appLocale = useSettingsStore((s) => s.locale);

  // Reset interim text when the session ends.
  useEffect(() => {
    if (state === 'idle') setInterimText('');
  }, [state]);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    getSharedRecognizer().cancel();
    setInterimText('');
    setState('idle');
  }, []);

  const start = useCallback(
    async (onResult: (text: string) => void) => {
      if (state === 'listening' || state === 'processing') return;
      const recognizer = getSharedRecognizer();

      // Ensure permissions before starting.
      const granted = await recognizer.requestPermissions();
      if (!granted) {
        setError('Microphone & speech permissions are required for voice search.');
        setState('error');
        return;
      }

      cancelledRef.current = false;
      setError(null);
      setInterimText('');
      setState('listening');

      recognizer
        .start({
          locale: localeTag(appLocale),
          onPartial: (text) => {
            if (!cancelledRef.current) setInterimText(text);
          },
        })
        .then((result) => {
          if (cancelledRef.current) return;
          setState('processing');
          setInterimText('');
          // Brief pause so the UI shows a "thinking" state before searching.
          setTimeout(() => {
            if (cancelledRef.current) return;
            onResult(result.text);
            setState('idle');
          }, 200);
        })
        .catch((err: Error) => {
          if (cancelledRef.current || err.message === 'cancelled' || err.message === 'aborted') {
            setState('idle');
            return;
          }
          logger.warn('Voice recognition failed', { error: err });
          if (err.message === 'no-speech') {
            setError("I didn't catch that — please try again.");
          } else if (err.message === 'not-allowed') {
            setError('Speech recognition permission denied. Enable it in Settings.');
          } else if (err.message === 'network') {
            setError('Speech recognition needs a network connection.');
          } else {
            setError(err.message || 'Voice recognition failed');
          }
          setState('error');
        });
    },
    [state, appLocale],
  );

  return {
    state,
    isListening: state === 'listening',
    isProcessing: state === 'processing',
    interimText,
    error,
    start,
    cancel,
  };
}
