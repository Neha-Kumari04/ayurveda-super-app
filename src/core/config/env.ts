/**
 * Centralised environment configuration.
 *
 * Only variables prefixed with `EXPO_PUBLIC_` are inlined by Expo at build time.
 * Access them exclusively through this module so the rest of the app never
 * touches `process.env` directly — this makes env changes testable and auditable.
 */

const toBool = (value: string | undefined, fallback: boolean): boolean =>
  value === undefined ? fallback : value === 'true' || value === '1';

const toInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/**
 * Under Jest the chaos harness (random failures/latency) is disabled so the
 * suite is deterministic; tests that need failure behaviour drive it directly.
 */
const isTest = process.env.NODE_ENV === 'test';

export const env = {
  /** Base URL used when USE_MOCK_API is false. */
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'https://api.ayurveda-super-app.dev/v1',

  /**
   * When true all requests are served by the in-app mock server
   * (deterministic generated data + simulated latency/failures).
   */
  useMockApi: toBool(process.env.EXPO_PUBLIC_USE_MOCK_API, true),

  /** Minimum log level that will be emitted. */
  logLevel: (process.env.EXPO_PUBLIC_LOG_LEVEL ?? 'info') as 'debug' | 'info' | 'warn' | 'error' | 'silent',

  /** Per-request timeout in milliseconds. */
  apiTimeoutMs: toInt(process.env.EXPO_PUBLIC_API_TIMEOUT_MS, 8000),

  /** Number of automatic retries for retryable failures (timeouts / 5xx). */
  apiRetryCount: toInt(process.env.EXPO_PUBLIC_API_RETRY_COUNT, 2),

  /** Probability (0..1) that the mock server injects a failure. */
  mockFailureRate: isTest
    ? 0
    : Number.parseFloat(process.env.EXPO_PUBLIC_MOCK_FAILURE_RATE ?? '0.05'),

  /** Simulated network latency in milliseconds for the mock server. */
  mockLatencyMs: isTest ? 0 : toInt(process.env.EXPO_PUBLIC_MOCK_LATENCY_MS, 400),

  /** How long an issued session token stays valid. */
  sessionTtlMs: toInt(process.env.EXPO_PUBLIC_SESSION_TTL_MS, 24 * 60 * 60 * 1000),

  /** Remote-config driven feature flags with local fallbacks. */
  features: {
    sync: toBool(process.env.EXPO_PUBLIC_FEATURE_SYNC, true),
    biometric: toBool(process.env.EXPO_PUBLIC_FEATURE_BIOMETRIC, true),
    videoConsult: toBool(process.env.EXPO_PUBLIC_FEATURE_VIDEO_CONSULT, true),
  },
} as const;

export type Env = typeof env;
