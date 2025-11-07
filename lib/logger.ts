/**
 * Enterprise logging utility
 * Centralizes logging logic and provides structured logging
 */

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

interface LogContext {
  [key: string]: unknown;
}

/**
 * Logger class for enterprise-level logging
 * Handles development vs production logging appropriately
 */
export class Logger {
  /**
   * Logs error messages
   * Only logs in development to avoid console pollution in production
   */
  static error(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[ERROR] ${message}`, context ? { context } : '');
    }
  }

  /**
   * Logs warning messages
   * Only logs in development to avoid console pollution in production
   */
  static warn(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[WARN] ${message}`, context ? { context } : '');
    }
  }

  /**
   * Logs info messages
   * Only logs in development to avoid console pollution in production
   */
  static info(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === 'development') {
      console.info(`[INFO] ${message}`, context ? { context } : '');
    }
  }

  /**
   * Logs debug messages
   * Only logs in development to avoid console pollution in production
   */
  static debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, context ? { context } : '');
    }
  }

  /**
   * Logs validation errors with structured context
   */
  static validationError(
    context: string,
    errors: unknown,
    rawData?: unknown
  ): void {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[VALIDATION ERROR] ${context}`, {
        errors,
        rawData: rawData ? JSON.stringify(rawData, null, 2) : undefined,
      });
    }
  }

  /**
   * Logs API errors with structured context
   */
  static apiError(
    operation: string,
    status: number,
    errorData?: unknown,
    requestContext?: LogContext
  ): void {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[API ERROR] ${operation}`, {
        status,
        errorData,
        request: requestContext,
      });
    }
  }
}
