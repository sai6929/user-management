import { z } from 'zod';
import { API_DEFAULTS } from '../constants';
import { LOG_LEVELS, type LogLevel } from '../logging';
import { parseOrThrow } from '../validation';
import { ConfigurationError, ValidationError } from '../errors';

/**
 * Public, build-time client configuration. Both apps map their own variable
 * names (VITE_*, EXPO_PUBLIC_*) onto this one schema so validation rules are
 * identical across platforms.
 */

const emptyToUndefined = (value: unknown): unknown => (value === '' ? undefined : value);

export const APP_ENVIRONMENTS = ['development', 'test', 'staging', 'production'] as const;
export type AppEnvironment = (typeof APP_ENVIRONMENTS)[number];

export const clientEnvSchema = z
  .object({
    appEnv: z.enum(APP_ENVIRONMENTS),
    apiBaseUrl: z.preprocess(emptyToUndefined, z.url({ protocol: /^https?$/ }).optional()),
    apiTimeoutMs: z.preprocess(
      emptyToUndefined,
      z.coerce
        .number()
        .int()
        .positive()
        .max(API_DEFAULTS.MAX_TIMEOUT_MS)
        .default(API_DEFAULTS.TIMEOUT_MS),
    ),
    logLevel: z.preprocess(emptyToUndefined, z.enum(LOG_LEVELS).optional()),
  })
  .superRefine((env, ctx) => {
    const isDeployed = env.appEnv === 'staging' || env.appEnv === 'production';
    if (!isDeployed) return;
    if (!env.apiBaseUrl) {
      ctx.addIssue({
        code: 'custom',
        path: ['apiBaseUrl'],
        message: 'Required outside development',
      });
    } else if (!env.apiBaseUrl.startsWith('https://')) {
      ctx.addIssue({ code: 'custom', path: ['apiBaseUrl'], message: 'Must use https://' });
    }
    if (env.logLevel === 'debug') {
      ctx.addIssue({ code: 'custom', path: ['logLevel'], message: 'debug is not allowed here' });
    }
  });

export interface ClientEnv {
  readonly appEnv: AppEnvironment;
  /** Undefined only in development/test, before a backend exists. */
  readonly apiBaseUrl: string | undefined;
  readonly apiTimeoutMs: number;
  readonly logLevel: LogLevel;
  readonly isProduction: boolean;
}

export type RawClientEnv = Record<keyof z.input<typeof clientEnvSchema>, unknown>;

/** Validates raw env values once at startup. Fails fast on misconfiguration. */
export const parseClientEnv = (raw: RawClientEnv): ClientEnv => {
  try {
    const env = parseOrThrow(clientEnvSchema, raw, 'client environment');
    const isProduction = env.appEnv === 'production';
    return {
      appEnv: env.appEnv,
      apiBaseUrl: env.apiBaseUrl,
      apiTimeoutMs: env.apiTimeoutMs,
      logLevel: env.logLevel ?? (env.appEnv === 'development' ? 'debug' : 'warn'),
      isProduction,
    };
  } catch (error) {
    // Field names are safe to surface to developers; values are never echoed.
    const fields = error instanceof ValidationError ? Object.keys(error.fieldErrors) : [];
    throw new ConfigurationError(`Invalid environment configuration: ${fields.join(', ')}`, {
      cause: error,
    });
  }
};

/** Use where an API base URL is mandatory (i.e. when the API client is created). */
export const requireApiBaseUrl = (env: ClientEnv): string => {
  if (!env.apiBaseUrl) {
    throw new ConfigurationError('API base URL is not configured');
  }
  return env.apiBaseUrl;
};
