// src/lib/logger.ts
// Centralized logging utility for security and debugging
//
// In production: only logs warnings and errors (no debug/info)
// In development: logs everything
//
// Usage:
//   import { logger } from '@/lib/logger';
//   logger.debug('Debug info', { data });
//   logger.info('Info message');
//   logger.warn('Warning', { context });
//   logger.error('Error occurred', error);

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

const isDev = process.env.NODE_ENV !== 'production';
const isTest = process.env.NODE_ENV === 'test';

// Sensitive keys to redact from logs
const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'secret',
  'key',
  'authorization',
  'cookie',
  'session',
  'credential',
  'api_key',
  'apikey',
  'access_token',
  'refresh_token',
]);

/**
 * Redact sensitive values from objects before logging
 */
function redactSensitive(obj: unknown, depth = 0): unknown {
  if (depth > 5) return '[MAX_DEPTH]';
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => redactSensitive(item, depth + 1));
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey) || lowerKey.includes('password') || lowerKey.includes('secret')) {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      result[key] = redactSensitive(value, depth + 1);
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Format a log message with optional context
 */
function formatMessage(level: LogLevel, message: string, context?: LogContext | Error): string {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

  if (!context) {
    return `${prefix} ${message}`;
  }

  if (context instanceof Error) {
    return `${prefix} ${message}: ${context.message}`;
  }

  const safeContext = redactSensitive(context);
  return `${prefix} ${message} ${JSON.stringify(safeContext)}`;
}

/**
 * Logger instance with level-based methods
 */
export const logger = {
  /**
   * Debug level - only in development
   */
  debug(message: string, context?: LogContext): void {
    if (isDev && !isTest) {
      console.debug(formatMessage('debug', message, context));
    }
  },

  /**
   * Info level - only in development
   */
  info(message: string, context?: LogContext): void {
    if (isDev && !isTest) {
      console.info(formatMessage('info', message, context));
    }
  },

  /**
   * Warning level - always logged (but silently in tests)
   */
  warn(message: string, context?: LogContext | Error): void {
    if (!isTest) {
      console.warn(formatMessage('warn', message, context));
    }
  },

  /**
   * Error level - always logged (but silently in tests)
   */
  error(message: string, context?: LogContext | Error): void {
    if (!isTest) {
      console.error(formatMessage('error', message, context));
    }
  },
};

export default logger;
