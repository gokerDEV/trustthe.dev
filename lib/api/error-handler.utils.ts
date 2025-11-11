import type { ErrorResponseDto } from '@/kodkafa/schemas/errorResponseDto';
import { Logger } from '@/lib/logger';
import { notFound } from 'next/navigation';

/**
 * API response status codes
 */
export enum ApiStatus {
  OK = 200,
  NOT_FOUND = 404,
  INTERNAL_ERROR = 500,
}

/**
 * Error context for better error tracking
 */
export interface ErrorContext {
  operation: string;
  domain?: string;
  slug?: string;
  [key: string]: unknown;
}

/**
 * Enterprise error handler for API responses
 * Handles errors according to Next.js App Router best practices
 */
export class ApiErrorHandler {
  /**
   * Handles API response errors and throws appropriate Next.js errors
   * @param status - HTTP status code
   * @param errorData - Error response data from API
   * @param context - Error context for logging
   */
  static handleResponseError(
    status: number,
    errorData: unknown,
    context: ErrorContext
  ): never {
    Logger.apiError(context.operation, status, errorData, context);

    if (status === ApiStatus.NOT_FOUND) {
      notFound();
    }

    // For other errors, throw to be caught by error.tsx
    const error = new Error(
      `API request failed: ${context.operation} returned status ${status}`
    );

    // Attach context to error for error.tsx
    Object.assign(error, {
      context,
      status,
      errorData,
    });

    throw error;
  }

  /**
   * Validates API response status and handles errors
   * @param status - HTTP status code
   * @param errorData - Error response data
   * @param context - Error context
   * @returns true if status is OK, otherwise throws
   */
  static validateResponseStatus(
    status: number,
    errorData: unknown,
    context: ErrorContext
  ): boolean {
    if (status === ApiStatus.OK) {
      return true;
    }

    this.handleResponseError(status, errorData, context);
  }

  /**
   * Checks if response is an error response DTO
   */
  static isErrorResponseDto(data: unknown): data is ErrorResponseDto {
    return (
      typeof data === 'object' &&
      data !== null &&
      'statusCode' in data &&
      'message' in data &&
      'errorCode' in data
    );
  }
}
