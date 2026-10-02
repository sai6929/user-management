import { parseClientEnv } from '@user-management/shared';

/**
 * Validated, typed configuration. Expo inlines EXPO_PUBLIC_* values at build
 * time, and only when accessed statically as `process.env.EXPO_PUBLIC_X` —
 * don't destructure process.env. These values ship inside the app binary:
 * never put secrets in them.
 */
export const env = parseClientEnv({
  appEnv: process.env.EXPO_PUBLIC_APP_ENV ?? (__DEV__ ? 'development' : 'production'),
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
  apiTimeoutMs: process.env.EXPO_PUBLIC_API_TIMEOUT_MS,
  logLevel: process.env.EXPO_PUBLIC_LOG_LEVEL,
});
