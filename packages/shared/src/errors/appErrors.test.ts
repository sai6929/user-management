import { describe, expect, it } from 'vitest';
import { ApiError, UnknownError, getUserMessage, toAppError } from './appErrors';

describe('error model', () => {
  it('never exposes technical messages to users', () => {
    const error = new ApiError('SQL syntax error near users table', 500);
    expect(getUserMessage(error)).not.toContain('SQL');
  });

  it('wraps unknown thrown values', () => {
    expect(toAppError('boom')).toBeInstanceOf(UnknownError);
    expect(toAppError(new TypeError('x')).cause).toBeInstanceOf(TypeError);
  });

  it('sets the subclass name', () => {
    expect(new ApiError('x', 500).name).toBe('ApiError');
  });
});
