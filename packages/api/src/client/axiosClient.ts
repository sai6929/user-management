import axios, { type AxiosInstance } from 'axios';
import { HTTP_HEADERS } from '@user-management/shared';
import { attachRequestInterceptor, attachResponseInterceptor } from './interceptors';
import type { ApiClientOptions } from './types';

/**
 * Creates the single HTTP client an app uses. Each app calls this once with its
 * own configuration (base URL, token storage, id generator) so this package
 * stays platform-independent.
 */
export const createApiClient = (options: ApiClientOptions): AxiosInstance => {
  const instance = axios.create({
    baseURL: options.baseURL,
    timeout: options.timeoutMs,
    withCredentials: options.withCredentials ?? false,
    headers: {
      [HTTP_HEADERS.ACCEPT]: 'application/json',
      [HTTP_HEADERS.CONTENT_TYPE]: 'application/json',
    },
  });

  attachRequestInterceptor(instance, options);
  attachResponseInterceptor(instance, options);
  return instance;
};
