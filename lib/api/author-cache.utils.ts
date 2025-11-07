import type { PostDto } from '@/api/client/schemas';
import { postsControllerFindOneBySlug } from '@/api/client/posts/posts';
import { getApiDomain } from '@/lib/api/domain';
import { safeParsePostBySlug } from '@/lib/api/validation.utils';
import { cache } from 'react';
import { unstable_cache } from 'next/cache';

/**
 * Cached author post fetcher
 * Uses React cache() to deduplicate requests during the same render pass
 * Uses Next.js unstable_cache for persistent caching across requests
 */
const getAuthorPostUncached = async (slug: string): Promise<PostDto | null> => {
  const domain = getApiDomain();
  const response = await postsControllerFindOneBySlug(domain, slug);

  if (response.status !== 200) {
    return null;
  }

  const data = safeParsePostBySlug(response.data, `author post ${slug}`);
  return data;
};

/**
 * Cached author post fetcher with 1 hour revalidation
 * Deduplicates requests within the same render pass and caches across requests
 * Each author slug gets its own cache entry
 */
export const getAuthorPost = cache(
  async (slug: string): Promise<PostDto | null> => {
    return unstable_cache(
      async () => getAuthorPostUncached(slug),
      [`author-post-${slug}`],
      {
        revalidate: 3600, // 1 hour
        tags: ['author-posts', `author-post-${slug}`],
      }
    )();
  }
);
