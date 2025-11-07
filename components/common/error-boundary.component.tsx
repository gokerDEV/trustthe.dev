import { ApiErrorHandler } from '@/lib/api/error-handler.utils';
import {
  validateApiResponse,
  type ValidationResult,
} from '@/lib/api/validation.utils';
import { notFound } from 'next/navigation';
import type { z } from 'zod';

/**
 * Error boundary wrapper for server components
 * Handles validation and API errors gracefully
 */
export class ServerErrorBoundary {
  /**
   * Handles API response with validation in one call
   * Validates status, validates data, and returns validated data or fallback
   * @param status - HTTP status code
   * @param data - Response data
   * @param schema - Zod schema for validation
   * @param context - Error context
   * @returns Validated data or fallback
   */
  static handleApiResponseWithValidation<T>(
    status: number,
    data: unknown,
    schema: z.ZodType<T>,
    context: { operation: string; domain?: string; slug?: string }
  ): T {
    ApiErrorHandler.validateResponseStatus(status, data, context);

    if (!data) {
      notFound();
    }

    const validationResult = validateApiResponse(
      data,
      schema,
      context.operation
    );

    return this.handleValidation(validationResult);
  }

  /**
   * Generic validation handler with graceful fallback
   * @param validationResult - Validation result
   * @returns Validated data or fallback
   */
  static handleValidation<T>(validationResult: ValidationResult<T>): T {
    if (validationResult.success) {
      return validationResult.data;
    }

    // Graceful fallback: use raw data if validation fails
    // This allows the page to render even with schema mismatches
    const fallbackData = validationResult.rawData as T;

    if (!fallbackData) {
      notFound();
    }

    return fallbackData;
  }
}
