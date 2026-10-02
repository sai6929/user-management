export const APP_NAME = 'User Management Application';

/** Header names used by the API client. Keep in sync with the backend contract. */
export const HTTP_HEADERS = {
  AUTHORIZATION: 'Authorization',
  CONTENT_TYPE: 'Content-Type',
  ACCEPT: 'Accept',
  REQUEST_ID: 'X-Request-ID',
  CORRELATION_ID: 'X-Correlation-ID',
  CSRF_TOKEN: 'X-CSRF-Token',
} as const;

export const API_DEFAULTS = {
  TIMEOUT_MS: 15_000,
  MAX_TIMEOUT_MS: 120_000,
} as const;

export const QUERY_DEFAULTS = {
  STALE_TIME_MS: 30_000,
  GC_TIME_MS: 5 * 60_000,
  MAX_RETRIES: 2,
} as const;
