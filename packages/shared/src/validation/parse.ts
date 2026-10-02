import type { z } from 'zod';
import { ValidationError, type FieldErrors } from '../errors';

/** Converts zod issues into `{ "path.to.field": ["message"] }`. */
export const toFieldErrors = (error: z.ZodError): FieldErrors => {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.map(String).join('.') : '_root';
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return fieldErrors;
};

/**
 * Validates untrusted input (form data, API responses, env vars) and throws a
 * ValidationError instead of a raw ZodError so callers handle a single error model.
 */
export const parseOrThrow = <TSchema extends z.ZodType>(
  schema: TSchema,
  input: unknown,
  context = 'input',
): z.output<TSchema> => {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new ValidationError(`Invalid ${context}`, toFieldErrors(result.error), {
      cause: result.error,
    });
  }
  return result.data;
};
