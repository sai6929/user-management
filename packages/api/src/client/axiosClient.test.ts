import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
import { describe, expect, it, vi } from 'vitest';
import {
  AuthenticationError,
  AuthorizationError,
  NetworkError,
  ValidationError,
  createLogger,
} from '@user-management/shared';
import { createApiClient } from './axiosClient';
import type { ApiClientOptions } from './types';

type Responder = (config: InternalAxiosRequestConfig) => { status: number; data?: unknown };

/** In-memory adapter: lets tests drive the client without any network or server. */
const createAdapter = (respond: Responder) => {
  const requests: InternalAxiosRequestConfig[] = [];
  const adapter: AxiosAdapter = (config) => {
    requests.push(config);
    const { status, data } = respond(config);
    const response = { status, data, statusText: '', headers: {}, config };
    if (status >= 200 && status < 300) return Promise.resolve(response);
    return Promise.reject(
      Object.assign(new Error(`Request failed with status ${status}`), {
        isAxiosError: true,
        config,
        response,
      }),
    );
  };
  return { adapter, requests };
};

const setup = (respond: Responder, overrides: Partial<ApiClientOptions> = {}) => {
  const { adapter, requests } = createAdapter(respond);
  const client = createApiClient({
    baseURL: 'https://api.test',
    timeoutMs: 1000,
    logger: createLogger({ level: 'silent' }),
    generateId: () => 'req-1',
    correlationId: 'corr-1',
    ...overrides,
  });
  client.defaults.adapter = adapter;
  return { client, requests };
};

describe('createApiClient', () => {
  it('adds tracing and auth headers', async () => {
    const { client, requests } = setup(() => ({ status: 200 }), {
      auth: { getAccessToken: () => 'token-1' },
    });
    await client.get('/ping');
    const headers = requests[0]?.headers;
    expect(headers?.get('X-Request-ID')).toBe('req-1');
    expect(headers?.get('X-Correlation-ID')).toBe('corr-1');
    expect(headers?.get('Authorization')).toBe('Bearer token-1');
  });

  it('omits Authorization when there is no token', async () => {
    const { client, requests } = setup(() => ({ status: 200 }), {
      auth: { getAccessToken: () => null },
    });
    await client.get('/ping');
    expect(requests[0]?.headers.has('Authorization')).toBe(false);
  });

  it('sends the CSRF header only on unsafe methods', async () => {
    const { client, requests } = setup(() => ({ status: 200 }), {
      csrf: { getToken: () => 'csrf-1' },
    });
    await client.get('/a');
    await client.post('/b', {});
    expect(requests[0]?.headers.has('X-CSRF-Token')).toBe(false);
    expect(requests[1]?.headers.get('X-CSRF-Token')).toBe('csrf-1');
  });

  it.each([
    [400, ValidationError],
    [401, AuthenticationError],
    [403, AuthorizationError],
  ])('maps HTTP %i to %o', async (status, ErrorClass) => {
    const { client } = setup(() => ({ status }));
    await expect(client.get('/x')).rejects.toBeInstanceOf(ErrorClass);
  });

  it('maps a missing response to NetworkError', async () => {
    const client = createApiClient({
      baseURL: 'https://api.test',
      timeoutMs: 1000,
      logger: createLogger({ level: 'silent' }),
      generateId: () => 'id',
    });
    client.defaults.adapter = (config) =>
      Promise.reject(Object.assign(new Error('Network Error'), { isAxiosError: true, config }));
    await expect(client.get('/x')).rejects.toBeInstanceOf(NetworkError);
  });

  it('refreshes once for concurrent 401s and replays the requests', async () => {
    let token = 'expired';
    const refreshAccessToken = vi.fn(() => {
      token = 'fresh';
      return Promise.resolve('fresh');
    });
    const { client } = setup(
      (config) =>
        config.headers.get('Authorization') === 'Bearer fresh'
          ? { status: 200, data: 'ok' }
          : { status: 401 },
      { auth: { getAccessToken: () => token, refreshAccessToken } },
    );

    const results = await Promise.all([client.get<string>('/a'), client.get<string>('/b')]);
    expect(results.map((r) => r.data)).toEqual(['ok', 'ok']);
    expect(refreshAccessToken).toHaveBeenCalledOnce();
  });

  it('signals session expiry when refresh fails', async () => {
    const onSessionExpired = vi.fn();
    const { client } = setup(() => ({ status: 401 }), {
      auth: {
        getAccessToken: () => 'expired',
        refreshAccessToken: () => Promise.resolve(null),
        onSessionExpired,
      },
    });
    await expect(client.get('/a')).rejects.toBeInstanceOf(AuthenticationError);
    expect(onSessionExpired).toHaveBeenCalledOnce();
  });
});
