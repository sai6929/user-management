import { redact, redactString } from './redact';

export const LOG_LEVELS = ['debug', 'info', 'warn', 'error', 'silent'] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];
type EmittingLevel = Exclude<LogLevel, 'silent'>;

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 100,
};

export interface LogEntry {
  readonly level: EmittingLevel;
  readonly message: string;
  readonly context?: unknown;
  readonly timestamp: string;
}

/** Destination for log entries. Swap for a remote sink (Sentry, Datadog…) later. */
export type LogSink = (entry: LogEntry) => void;

export interface Logger {
  debug(message: string, context?: unknown): void;
  info(message: string, context?: unknown): void;
  warn(message: string, context?: unknown): void;
  error(message: string, context?: unknown): void;
}

export interface LoggerOptions {
  readonly level: LogLevel;
  readonly sink?: LogSink;
}

type ConsoleLike = Record<EmittingLevel, (...args: unknown[]) => void>;

/**
 * Shared code is compiled without DOM/Node typings, so the console is looked up
 * structurally. The logger is the only module allowed to touch it.
 */
export const consoleSink: LogSink = ({ level, message, context, timestamp }) => {
  const target = (globalThis as { console?: ConsoleLike }).console;
  if (!target) return;
  const line = `[${timestamp}] ${level.toUpperCase()} ${message}`;
  if (context === undefined) target[level](line);
  else target[level](line, context);
};

/**
 * Every message and context object passes through `redact` before reaching a
 * sink, so passwords, tokens, cookies, etc. are never written out — even if a
 * caller passes them by mistake.
 */
export const createLogger = ({ level, sink = consoleSink }: LoggerOptions): Logger => {
  const threshold = LEVEL_WEIGHT[level];

  const emit = (entryLevel: EmittingLevel, message: string, context?: unknown): void => {
    if (LEVEL_WEIGHT[entryLevel] < threshold) return;
    sink({
      level: entryLevel,
      message: redactString(message),
      ...(context === undefined ? {} : { context: redact(context) }),
      timestamp: new Date().toISOString(),
    });
  };

  return {
    debug: (message, context) => {
      emit('debug', message, context);
    },
    info: (message, context) => {
      emit('info', message, context);
    },
    warn: (message, context) => {
      emit('warn', message, context);
    },
    error: (message, context) => {
      emit('error', message, context);
    },
  };
};
