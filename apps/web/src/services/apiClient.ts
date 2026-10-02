import type { AxiosInstance } from 'axios';
import { createApiClient } from '@user-management/api';
import { requireApiBaseUrl } from '@user-management/shared';
import { env } from '@/config/env';
import { logger } from './logger';
import { tokenStore } from './tokenStore';

const correlationId = crypto.randomUUID();
let client: AxiosInstance | null = null;

/**
 * Lazily created so the shell runs before a backend URL is configured.
 * The future auth feature adds `refreshAccessToken`, `onSessionExpired`
 * (dispatch sessionExpired + queryClient.clear()) and `csrf` here.
 */
export const getApiClient = (): AxiosInstance => {
  client ??= createApiClient({
    baseURL: requireApiBaseUrl(env),
    timeoutMs: env.apiTimeoutMs,
    logger,
    generateId: () => crypto.randomUUID(),
    correlationId,
    withCredentials: true,
    auth: { getAccessToken: tokenStore.getAccessToken },
  });
  return client;
};
