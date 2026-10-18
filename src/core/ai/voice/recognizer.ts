import { Platform } from 'react-native';

import { logger } from '@/core/logger/logger';

import type { VoiceRecognitionResult, VoiceRecognizer, VoiceStartOptions } from './types';

// ---------------------------------------------------------------------------
// Ayurvedic-domain contextual strings — dramatically improve accuracy for
// product / specialty names the stock model hasn't heard often.
// ---------------------------------------------------------------------------
const CONTEXTUAL_STRINGS = [
  'Ashwagandha', 'Shatavari', 'Triphala', 'Chyawanprash', 'Brahmi',
  'Shilajit', 'Tulsi', 'Neem', 'Amla', 'Haritaki', 'Bibhitaki',
  'Guggul', 'Guduchi', 'Punarnava', 'Kutki', 'Shankhpushpi',
  'Panchakarma', 'Kayachikitsa', 'Shalya Tantra', 'Shalakya Tantra',
  'Prasuti Tantra', 'Kaumarbhritya', 'Agada Tantra', 'Rasayana',
  'Abhyanga', 'Shirodhara', 'Nasya', 'Basti', 'Virechana',
  'Vata', 'Pitta', 'Kapha', 'Dosha', 'Prakriti',
  'Nadi Pariksha', 'Jihva Pariksha',
];

// ---------------------------------------------------------------------------
// Mock recognizer (fallback for Expo Go / Jest — no native module)
// ---------------------------------------------------------------------------

const SAMPLE_QUERIES = [
  'ashwagandha',
  'triphala churna',
  'chyawanprash',
  'brahmi for memory',
  'shilajit resin',
  'tulsi immunity',
  'turmeric capsules',
  'neem face wash',
  'aloe vera juice',
  'spirulina tablets',
  'best ayurvedic doctor near me',
  'panchakarma specialist',
  'skin specialist ayurveda',
  'immunity booster',
  'stress relief',
];

let mockCancelled = false;

const mockRecognizer: VoiceRecognizer = {
  start(options?: VoiceStartOptions): Promise<VoiceRecognitionResult> {
    mockCancelled = false;
    return new Promise((resolve, reject) => {
      const delay = 1200 + Math.random() * 1600;
      const final = SAMPLE_QUERIES[Math.floor(Math.random() * SAMPLE_QUERIES.length)];
      // Simulate interim updates every ~400 ms.
      const words = final.split(' ');
      let spoken = 0;
      const interval = setInterval(() => {
        if (mockCancelled) {
          clearInterval(interval);
          return;
        }
        spoken = Math.min(spoken + 1 + Math.floor(Math.random() * 2), words.length);
        options?.onPartial?.(words.slice(0, spoken).join(' '));
      }, 400);
      setTimeout(() => {
        clearInterval(interval);
        if (mockCancelled) {
          reject(new Error('cancelled'));
          return;
        }
        resolve({ text: final, confidence: 0.78 + Math.random() * 0.21 });
      }, delay);
    });
  },

  cancel(): void {
    mockCancelled = true;
  },

  async isAvailable(): Promise<boolean> {
    return true;
  },

  async requestPermissions(): Promise<boolean> {
    return true;
  },
};

// ---------------------------------------------------------------------------
// Real recognizer (expo-speech-recognition → SFSpeechRecognizer / SpeechRecognizer)
// ---------------------------------------------------------------------------

function loadNativeModule(): typeof import('expo-speech-recognition').ExpoSpeechRecognitionModule | null {
  try {
    // Use requireOptionalNativeModule instead of requiring the package —
    // the package's own index eagerly calls requireNativeModule() at module
    // scope, which throws (and logs an "Uncaught Error" to LogBox) when the
    // native module isn't linked (Expo Go / Jest). This API returns null
    // instead of throwing.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { requireOptionalNativeModule } = require('expo-modules-core');
    const native = requireOptionalNativeModule('ExpoSpeechRecognition');
    return native ?? null;
  } catch {
    return null;
  }
}

function createNativeRecognizer(
  native: NonNullable<ReturnType<typeof loadNativeModule>>,
): VoiceRecognizer {
  let cleanup: (() => void) | null = null;

  return {
    start(options?: VoiceStartOptions): Promise<VoiceRecognitionResult> {
      return new Promise((resolve, reject) => {
        let finalText = '';
        let finalConfidence = 0;
        let settled = false;

        const settle = (fn: () => void) => {
          if (settled) return;
          settled = true;
          cleanup?.();
          fn();
        };

        const subs = [
          native.addListener('result', (event: any) => {
            const first = event?.results?.[0];
            if (!first) return;
            const text: string = first.transcript ?? '';
            const conf: number = first.confidence ?? 0.9;
            if (event.isFinal) {
              finalText = text;
              finalConfidence = conf;
            } else {
              options?.onPartial?.(text);
            }
          }),
          native.addListener('end', () => {
            settle(() => {
              if (finalText.trim().length > 0) {
                resolve({ text: finalText.trim(), confidence: finalConfidence || 0.9 });
              } else {
                reject(new Error('no-speech'));
              }
            });
          }),
          native.addListener('error', (event: any) => {
            settle(() => reject(new Error(event?.error ?? 'unknown')));
          }),
        ];

        cleanup = () => {
          for (const sub of subs) sub.remove();
          cleanup = null;
        };

        try {
          native.start({
            lang: options?.locale ?? 'en-US',
            interimResults: true,
            continuous: false,
            maxAlternatives: 1,
            // Bias the recognizer toward our domain vocabulary.
            contextualStrings: CONTEXTUAL_STRINGS,
            // Better single-word / short-phrase accuracy.
            iosTaskHint: 'search',
            androidIntentOptions: {
              EXTRA_LANGUAGE_MODEL: 'web_search',
            },
          });
        } catch (err) {
          settle(() => reject(err instanceof Error ? err : new Error('start-failed')));
        }
      });
    },

    cancel(): void {
      try {
        native.abort();
      } catch {
        // ignore — module may already be idle
      }
      cleanup?.();
    },

    async isAvailable(): Promise<boolean> {
      try {
        return native.isRecognitionAvailable();
      } catch {
        return false;
      }
    },

    async requestPermissions(): Promise<boolean> {
      try {
        const result = await native.requestPermissionsAsync();
        return result.granted;
      } catch {
        return false;
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Returns the real native recognizer when the module is linked (dev build /
 * production), otherwise falls back to the mock so the UX still works in
 * Expo Go and Jest.
 */
export function createRecognizer(): VoiceRecognizer {
  // Native speech recognition is unavailable on web in this module shape.
  if (Platform.OS === 'web') {
    return mockRecognizer;
  }
  const native = loadNativeModule();
  if (!native) {
    logger.warn('expo-speech-recognition not available — using mock voice recognizer');
    return mockRecognizer;
  }
  try {
    return createNativeRecognizer(native);
  } catch (err) {
    logger.warn('Failed to create native recognizer — falling back to mock', { error: err });
    return mockRecognizer;
  }
}

let sharedRecognizer: VoiceRecognizer | null = null;

/**
 * Process-wide recognizer, created on first use — callers must not construct
 * recognizers during render (it would log the fallback warning every pass).
 */
export function getSharedRecognizer(): VoiceRecognizer {
  sharedRecognizer ??= createRecognizer();
  return sharedRecognizer;
}
