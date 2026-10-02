import { describe, expect, it } from 'vitest';
import { ConfigurationError } from '../errors';
import { parseClientEnv, requireApiBaseUrl, type RawClientEnv } from './clientEnv';

const raw = (overrides: Partial<RawClientEnv> = {}): RawClientEnv => ({
  appEnv: 'development',
  apiBaseUrl: undefined,
  apiTimeoutMs: undefined,
  logLevel: undefined,
  ...overrides,
});

describe('parseClientEnv', () => {
  it('applies safe defaults in development', () => {
    expect(parseClientEnv(raw({ apiBaseUrl: '' }))).toEqual({
      appEnv: 'development',
      apiBaseUrl: undefined,
      apiTimeoutMs: 15_000,
      logLevel: 'debug',
      isProduction: false,
    });
  });

  it('requires an https API URL in production', () => {
    expect(() => parseClientEnv(raw({ appEnv: 'production' }))).toThrow(ConfigurationError);
    expect(() =>
      parseClientEnv(raw({ appEnv: 'production', apiBaseUrl: 'http://api.example.com' })),
    ).toThrow(ConfigurationError);
  });

  it('defaults to warn logging and rejects debug logging in production', () => {
    const base = { appEnv: 'production', apiBaseUrl: 'https://api.example.com' } as const;
    expect(parseClientEnv(raw(base)).logLevel).toBe('warn');
    expect(() => parseClientEnv(raw({ ...base, logLevel: 'debug' }))).toThrow(ConfigurationError);
  });

  it('rejects non-http URLs and invalid timeouts', () => {
    // eslint-disable-next-line no-script-url -- asserting the validator rejects it
    expect(() => parseClientEnv(raw({ apiBaseUrl: 'javascript:alert(1)' }))).toThrow();
    expect(() => parseClientEnv(raw({ apiTimeoutMs: '-1' }))).toThrow();
  });

  it('requireApiBaseUrl throws when the URL is missing', () => {
    expect(() => requireApiBaseUrl(parseClientEnv(raw()))).toThrow(ConfigurationError);
  });
});
