import { isAxiosError } from 'axios';
import {
  ApiError,
  AuthenticationError,
  AuthorizationError,
  NetworkError,
  ValidationError,
  apiErrorBodySchema,
  isAppError,
  toAppError,
  type AppError,
} from '@user-management/shared';

/**
 * Maps any failure from the HTTP layer onto the shared error model.
 * Backend messages are kept on `message` for logs only; the UI uses `userMessage`.
 */
export const normalizeApiError = (error: unknown): AppError => {
  if (isAppError(error)) return error;
  if (!isAxiosError(error)) return toAppError(error);

  const { response, config } = error;
  const target = `${config?.method?.toUpperCase() ?? 'REQUEST'} ${config?.url ?? ''}`.trim();

  if (!response) {
    return new NetworkError(`${target} failed: ${error.code ?? 'no response'}`, { cause: error });
  }

  const parsed = apiErrorBodySchema.safeParse(response.data);
  const body = parsed.success ? parsed.data : {};
  const headerRequestId: unknown = response.headers['x-request-id'];
  const options = {
    cause: error,
    requestId:
      body.requestId ?? (typeof headerRequestId === 'string' ? headerRequestId : undefined),
  };
  const message = `${target} -> ${response.status}${body.code ? ` (${body.code})` : ''}`;

  switch (response.status) {
    case 400:
    case 422:
      return new ValidationError(message, body.fieldErrors ?? {}, options);
    case 401:
      return new AuthenticationError(message, options);
    case 403:
      return new AuthorizationError(message, options);
    default:
      return new ApiError(message, response.status, options);
  }
};
