import { parseClientEnv } from '@user-management/shared';

/**
 * Validated, typed configuration. Read env vars ONLY through this module.
 * A production build without a valid https API URL fails here at startup.
 */
export const env = parseClientEnv({
  appEnv: import.meta.env.VITE_APP_ENV ?? (import.meta.env.PROD ? 'production' : 'development'),
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  apiTimeoutMs: import.meta.env.VITE_API_TIMEOUT_MS,
  logLevel: import.meta.env.VITE_LOG_LEVEL,
});
