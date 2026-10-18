export type ApiErrorKind =
  | 'timeout'
  | 'network'
  | 'http'
  | 'parse'
  | 'session_expired'
  | 'not_found'
  | 'conflict'
  | 'unknown';

export class ApiError extends Error {
  constructor(
    public readonly kind: ApiErrorKind,
    message: string,
    public readonly status?: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** Timeouts, network drops and 5xx are safe to retry. */
  get isRetryable(): boolean {
    if (this.kind === 'timeout' || this.kind === 'network') return true;
    return this.kind === 'http' && (this.status ?? 0) >= 500;
  }

  get isSessionExpired(): boolean {
    return this.kind === 'session_expired';
  }

  static timeout(ms: number): ApiError {
    return new ApiError('timeout', `Request timed out after ${ms}ms`);
  }

  static network(message = 'Network request failed'): ApiError {
    return new ApiError('network', message);
  }

  static http(status: number, body?: unknown): ApiError {
    const kind = status === 401 ? 'session_expired' : status === 404 ? 'not_found' : status === 409 ? 'conflict' : 'http';
    return new ApiError(kind, `HTTP ${status}`, status, body);
  }

  static parse(message = 'Invalid response payload'): ApiError {
    return new ApiError('parse', message);
  }
}

/** User-facing message for any failure surfaced by the API layer. */
export function humanizeApiError(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.kind) {
      case 'timeout':
        return 'The request took too long. Please try again.';
      case 'network':
        return "You're offline. Changes will sync when you reconnect.";
      case 'session_expired':
        return 'Your session expired. Please sign in again.';
      case 'conflict':
        return 'This slot was just booked by someone else.';
      case 'not_found':
        return 'We couldn’t find what you were looking for.';
      case 'parse':
        return 'We received an unexpected response. Please try again.';
      default:
        return 'Something went wrong. Please try again.';
    }
  }
  return 'Something went wrong. Please try again.';
}
