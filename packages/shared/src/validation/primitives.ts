import { z } from 'zod';

/**
 * Reusable building blocks for future form and API schemas.
 * Client-side validation is a UX aid only; the server must validate again.
 */

/** Trims and rejects control characters, which have no place in user-entered text. */
export const safeTextSchema = z
  .string()
  .trim()
  .refine((value) => !/\p{Cc}/u.test(value), 'Contains invalid characters');

export const emailSchema = z.email().trim().toLowerCase().max(254);

/** Accepts only http(s) URLs, blocking `javascript:` / `data:` style payloads. */
export const httpUrlSchema = z.url({ protocol: /^https?$/ });

/** Shape of an error body the backend may return. All fields are optional and untrusted. */
export const apiErrorBodySchema = z
  .object({
    code: z.string().optional(),
    message: z.string().optional(),
    requestId: z.string().optional(),
    fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
  })
  .loose();

export type ApiErrorBody = z.infer<typeof apiErrorBodySchema>;
