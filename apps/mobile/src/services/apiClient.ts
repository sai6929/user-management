import type { AxiosInstance } from 'axios';
import { randomUUID } from 'expo-crypto';
import { createApiClient } from '@user-management/api';
import { requireApiBaseUrl } from '@user-management/shared';
import { env } from '@/config/env';
import { logger } from './logger';
import { tokenStore } from './tokenStore';

const correlationId = randomUUID();
let client: AxiosInstance | null = null;

/**
 * Lazily created so the shell runs before a backend URL is configured.
 * Mobile uses bearer tokens (no cookies), so CSRF protection is not needed and
 * `withCredentials` stays false. The future auth feature adds
 * `refreshAccessToken` (reading tokenStore.getRefreshToken) and `onSessionExpired`.
 */
export const getApiClient = (): AxiosInstance => {
  client ??= createApiClient({
    baseURL: requireApiBaseUrl(env),
    timeoutMs: env.apiTimeoutMs,
    logger,
    generateId: randomUUID,
    correlationId,
    withCredentials: false,
    auth: { getAccessToken: tokenStore.getAccessToken },
  });
  return client;
};
