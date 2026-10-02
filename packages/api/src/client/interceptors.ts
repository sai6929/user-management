import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { HTTP_HEADERS } from '@user-management/shared';
import { normalizeApiError } from './apiError';
import type { ApiClientOptions } from './types';

const UNSAFE_METHODS = new Set(['post', 'put', 'patch', 'delete']);

interface RetriableConfig extends InternalAxiosRequestConfig {
  _authRetried?: boolean;
}

/** Adds tracing, auth and CSRF headers to every outgoing request. */
export const attachRequestInterceptor = (
  instance: AxiosInstance,
  { generateId, correlationId, auth, csrf }: ApiClientOptions,
): void => {
  instance.interceptors.request.use(async (config) => {
    config.headers.set(HTTP_HEADERS.REQUEST_ID, generateId());
    if (correlationId) config.headers.set(HTTP_HEADERS.CORRELATION_ID, correlationId);

    const token = auth ? await auth.getAccessToken() : null;
    if (token) config.headers.set(HTTP_HEADERS.AUTHORIZATION, `Bearer ${token}`);

    if (csrf && UNSAFE_METHODS.has(config.method?.toLowerCase() ?? '')) {
      const csrfToken = csrf.getToken();
      if (csrfToken) config.headers.set(csrf.headerName ?? HTTP_HEADERS.CSRF_TOKEN, csrfToken);
    }
    return config;
  });
};

/**
 * On 401: refreshes the access token once (shared across concurrent requests),
 * replays the original request, and signals session expiry if that fails.
 * Every rejection leaving the client is a normalized AppError.
 */
export const attachResponseInterceptor = (
  instance: AxiosInstance,
  { auth, logger }: ApiClientOptions,
): void => {
  let refreshInFlight: Promise<string | null> | null = null;

  const refreshOnce = (refresh: () => Promise<string | null>): Promise<string | null> => {
    refreshInFlight ??= refresh()
      .catch((error: unknown) => {
        logger.warn('Token refresh failed', { error });
        return null;
      })
      .finally(() => {
        refreshInFlight = null;
      });
    return refreshInFlight;
  };

  instance.interceptors.response.use(undefined, async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;

    if (error.response?.status === 401 && original && auth) {
      const refresh = auth.refreshAccessToken?.bind(auth);
      if (refresh && !original._authRetried) {
        original._authRetried = true;
        const newToken = await refreshOnce(refresh);
        if (newToken) {
          original.headers.set(HTTP_HEADERS.AUTHORIZATION, `Bearer ${newToken}`);
          return instance.request(original);
        }
      }
      auth.onSessionExpired?.();
    }

    const appError = normalizeApiError(error);
    logger.error('API request failed', {
      code: appError.code,
      message: appError.message,
      requestId: appError.requestId,
    });
    return Promise.reject(appError);
  });
};
