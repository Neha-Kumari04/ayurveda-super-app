import { env } from '../config/env';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: unknown;
}

export interface CrashReporter {
  captureException(error: Error, context?: LogContext): void;
  captureMessage(message: string, context?: LogContext): void;
}

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

/**
 * Pluggable crash-reporting abstraction. Swap Sentry / Bugsnag / Datadog
 * implementations in production without touching call sites.
 */
class NoopCrashReporter implements CrashReporter {
  captureException(error: Error, context?: LogContext): void {
    if (__DEV__) console.warn('[crash]', error.message, context);
  }
  captureMessage(message: string, context?: LogContext): void {
    if (__DEV__) console.warn('[crash]', message, context);
  }
}

let crashReporter: CrashReporter = new NoopCrashReporter();
/** True while the crash reporter is running — prevents logger ↔ reporter loops. */
let isReporting = false;

export function setCrashReporter(reporter: CrashReporter): void {
  crashReporter = reporter;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  timestamp: string;
}

const ringBuffer: LogEntry[] = [];
const RING_BUFFER_MAX = 200;

function emit(level: LogLevel, message: string, context?: LogContext): void {
  // 'silent' (or unknown levels) block everything below error.
  const minLevel = env.logLevel === 'silent' ? Number.POSITIVE_INFINITY : (LEVEL_ORDER[env.logLevel as LogLevel] ?? LEVEL_ORDER.info);
  if (LEVEL_ORDER[level] < minLevel) return;

  const entry: LogEntry = { level, message, context, timestamp: new Date().toISOString() };

  ringBuffer.push(entry);
  if (ringBuffer.length > RING_BUFFER_MAX) ringBuffer.shift();

  if (__DEV__) {
    const method = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    method(`[${level}] ${message}`, context ?? '');
  }

  if (level === 'error' && context?.error instanceof Error && !isReporting) {
    // Re-entrancy guard: a CrashReporter that logs through this same logger
    // (e.g. the console reporter) would otherwise recurse until the JS stack
    // overflows ("Maximum call stack size exceeded").
    isReporting = true;
    try {
      crashReporter.captureException(context.error, context);
    } catch (reporterError) {
      if (__DEV__) console.warn('[crash] reporter failed', reporterError);
    } finally {
      isReporting = false;
    }
  }
}

export const logger = {
  debug: (message: string, context?: LogContext) => emit('debug', message, context),
  info: (message: string, context?: LogContext) => emit('info', message, context),
  warn: (message: string, context?: LogContext) => emit('warn', message, context),
  error: (message: string, context?: LogContext) => emit('error', message, context),
  /** Recent log entries — useful for a debug screen or bug reports. */
  getRecentLogs: (): readonly LogEntry[] => [...ringBuffer],
};
