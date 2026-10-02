/**
 * Centralized error model.
 *
 * `message` is for developers/logs and may contain technical detail.
 * `userMessage` is the only text that may be shown in the UI; it is always a
 * generic, safe string so backend internals never leak to users.
 */

export type ErrorCode =
  | 'API_ERROR'
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'NETWORK_ERROR'
  | 'CONFIGURATION_ERROR'
  | 'UNKNOWN_ERROR';

interface AppErrorOptions {
  readonly cause?: unknown;
  readonly requestId?: string;
}

export abstract class AppError extends Error {
  abstract readonly code: ErrorCode;
  abstract readonly userMessage: string;
  readonly requestId: string | undefined;

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message, { cause: options.cause });
    this.name = new.target.name;
    this.requestId = options.requestId;
  }
}

export class ApiError extends AppError {
  readonly code = 'API_ERROR';
  readonly userMessage = 'Something went wrong. Please try again later.';
  readonly status: number;

  constructor(message: string, status: number, options?: AppErrorOptions) {
    super(message, options);
    this.status = status;
  }
}

export type FieldErrors = Readonly<Record<string, readonly string[]>>;

export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR';
  readonly userMessage = 'Please check the highlighted fields and try again.';
  readonly fieldErrors: FieldErrors;

  constructor(message: string, fieldErrors: FieldErrors = {}, options?: AppErrorOptions) {
    super(message, options);
    this.fieldErrors = fieldErrors;
  }
}

export class AuthenticationError extends AppError {
  readonly code = 'AUTHENTICATION_ERROR';
  readonly userMessage = 'Your session has expired. Please sign in again.';

  constructor(message = 'Authentication required', options?: AppErrorOptions) {
    super(message, options);
  }
}

export class AuthorizationError extends AppError {
  readonly code = 'AUTHORIZATION_ERROR';
  readonly userMessage = 'You do not have permission to perform this action.';

  constructor(message = 'Forbidden', options?: AppErrorOptions) {
    super(message, options);
  }
}

export class NetworkError extends AppError {
  readonly code = 'NETWORK_ERROR';
  readonly userMessage = 'Unable to reach the server. Check your connection and try again.';

  constructor(message = 'Network request failed', options?: AppErrorOptions) {
    super(message, options);
  }
}

export class ConfigurationError extends AppError {
  readonly code = 'CONFIGURATION_ERROR';
  readonly userMessage = 'The application is misconfigured. Please contact support.';
}

export class UnknownError extends AppError {
  readonly code = 'UNKNOWN_ERROR';
  readonly userMessage = 'An unexpected error occurred.';

  constructor(message = 'Unknown error', options?: AppErrorOptions) {
    super(message, options);
  }
}

export const isAppError = (error: unknown): error is AppError => error instanceof AppError;

/** Wraps anything thrown into an AppError so callers only handle one shape. */
export const toAppError = (error: unknown): AppError => {
  if (isAppError(error)) return error;
  if (error instanceof Error) return new UnknownError(error.message, { cause: error });
  return new UnknownError('Non-error value thrown', { cause: error });
};

/** The only error text the UI should ever render. */
export const getUserMessage = (error: unknown): string => toAppError(error).userMessage;
