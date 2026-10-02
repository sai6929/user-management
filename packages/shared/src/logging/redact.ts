export const REDACTED = '[REDACTED]';

const SENSITIVE_KEY_PATTERN =
  /pass(word)?|secret|token|authorization|cookie|session|credential|api[-_]?key|private[-_]?key|otp|pin|ssn|card/i;

const BEARER_PATTERN = /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi;
const JWT_PATTERN = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g;
const MAX_DEPTH = 6;

export const isSensitiveKey = (key: string): boolean => SENSITIVE_KEY_PATTERN.test(key);

/** Removes bearer tokens and JWTs embedded in free text. */
export const redactString = (value: string): string =>
  value.replace(BEARER_PATTERN, `Bearer ${REDACTED}`).replace(JWT_PATTERN, REDACTED);

/**
 * Returns a deep copy of `value` that is safe to log: sensitive keys are masked,
 * embedded tokens are scrubbed, and cycles/deep nesting are cut off.
 */
export const redact = (value: unknown, depth = 0, seen = new WeakSet()): unknown => {
  if (typeof value === 'string') return redactString(value);
  if (value === null || typeof value !== 'object') return value;
  if (depth >= MAX_DEPTH) return '[Truncated]';
  if (seen.has(value)) return '[Circular]';
  seen.add(value);

  if (value instanceof Error) {
    return { name: value.name, message: redactString(value.message) };
  }
  if (Array.isArray(value)) {
    return value.map((item: unknown) => redact(item, depth + 1, seen));
  }

  const result: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    result[key] = isSensitiveKey(key) ? REDACTED : redact(entry, depth + 1, seen);
  }
  return result;
};
