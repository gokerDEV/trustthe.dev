import type { PostDto } from '@/api/client/schemas';
import { postsControllerFindOneBySlugResponse } from '@/api/client/schemas/posts/posts.zod';
import type { z } from 'zod';

/**
 * Utility function to safely parse and validate API responses with fallback to raw data
 * Prevents duplicate validation logic across components
 */
export function safeParsePostResponse<T extends z.ZodType<PostDto>>(
  responseData: unknown,
  schema: T,
  context: string
): PostDto {
  const validationResult = schema.safeParse(responseData);

  if (!validationResult.success) {
    // Backend schema mismatch - log and use raw data as fallback
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `Zod validation failed for ${context}:`,
        validationResult.error.errors
      );
      console.warn('Raw API response:', JSON.stringify(responseData, null, 2));
    }

    // Fallback: use raw data with type assertion
    return responseData as PostDto;
  }

  return validationResult.data;
}

/**
 * Helper specifically for postsControllerFindOneBySlugResponse
 */
export function safeParsePostBySlug(
  responseData: unknown,
  context: string
): PostDto {
  return safeParsePostResponse(
    responseData,
    postsControllerFindOneBySlugResponse,
    context
  );
}
