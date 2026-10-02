import { describe, expect, it, vi } from 'vitest';
import { createLogger, type LogEntry } from './logger';
import { REDACTED } from './redact';

const setup = (level: Parameters<typeof createLogger>[0]['level']) => {
  const sink = vi.fn<(entry: LogEntry) => void>();
  return { sink, logger: createLogger({ level, sink }) };
};

describe('logger', () => {
  it('drops entries below the configured level', () => {
    const { sink, logger } = setup('warn');
    logger.debug('debug');
    logger.info('info');
    logger.warn('warn');
    logger.error('error');
    expect(sink.mock.calls.map(([entry]) => entry.level)).toEqual(['warn', 'error']);
  });

  it('emits nothing when silent', () => {
    const { sink, logger } = setup('silent');
    logger.error('error');
    expect(sink).not.toHaveBeenCalled();
  });

  it('redacts sensitive keys at any depth', () => {
    const { sink, logger } = setup('debug');
    logger.info('login', {
      email: 'a@b.c',
      password: 'hunter2',
      nested: {
        accessToken: 'x',
        refresh_token: 'y',
        Cookie: 'z',
        headers: { Authorization: 'q' },
      },
    });
    expect(sink.mock.calls[0]?.[0].context).toEqual({
      email: 'a@b.c',
      password: REDACTED,
      nested: {
        accessToken: REDACTED,
        refresh_token: REDACTED,
        Cookie: REDACTED,
        headers: { Authorization: REDACTED },
      },
    });
  });

  it('scrubs bearer tokens and JWTs from free text', () => {
    const { sink, logger } = setup('debug');
    logger.warn('sent Bearer abc.def-123 and eyJhbGciOi.eyJzdWIiOi.c2lnbmF0dXJl');
    expect(sink.mock.calls[0]?.[0].message).toBe(`sent Bearer ${REDACTED} and ${REDACTED}`);
  });

  it('handles circular references', () => {
    const { sink, logger } = setup('debug');
    const value: Record<string, unknown> = { name: 'loop' };
    value.self = value;
    logger.info('cycle', value);
    expect(sink.mock.calls[0]?.[0].context).toEqual({ name: 'loop', self: '[Circular]' });
  });
});
