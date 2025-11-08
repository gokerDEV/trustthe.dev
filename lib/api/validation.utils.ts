import { Logger } from '@/lib/logger';
import type { z } from 'zod';

/**
 * Validation error result with typed data or error information
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: z.ZodError; rawData: unknown };

/**
 * Enterprise-level validation utility for API responses
 * Handles validation errors gracefully with proper logging
 */
export function validateApiResponse<T>(
  responseData: unknown,
  schema: z.ZodType<T>,
  context: string
): ValidationResult<T> {
  const validationResult = schema.safeParse(responseData);

  if (!validationResult.success) {
    Logger.validationError(
      context,
      validationResult.error.errors,
      responseData
    );
    return {
      success: false,
      error: validationResult.error,
      rawData: responseData,
    };
  }

  return {
    success: true,
    data: validationResult.data,
  };
}
