import { BASE_URL } from '@/config/constants';
import { postsAnalyticsControllerGetPostStatistics } from '@/kodkafa/ssr/posts-analytics/posts-analytics';
import { postsQueryControllerFindSitemap } from '@/kodkafa/ssr/posts-query/posts-query';
import { postsQueryControllerFindSitemapResponse } from '@/kodkafa/zod/kodkafaApi.zod';
import { getApiDomain } from '@/lib/api/domain';
import { asUrl } from '@/lib/seo/url-slug.utils';
import type { MetadataRoute } from 'next';

const POSTS_PER_SITEMAP = 50000; // Google's limit
const API_LIMIT = 10000; // Sitemap API max limit

// Revalidate sitemap every 24 hours (86400 seconds)
// export const revalidate = 86400;

/**
 * Generate sitemap IDs
 * ID 0: Static pages
 * IDs 1+: Posts sitemaps (paginated)
 */
export async function generateSitemaps(): Promise<Array<{ id: number }>> {
  try {
    // Fetch post statistics to get total published count
    // Next.js extended fetch API supports 'next' and 'cache' parameters
    // These are passed through ssrMutator to the fetch call
    const response = await postsAnalyticsControllerGetPostStatistics({
      next: { revalidate: 360000 },
      cache: 'force-cache',
    } as RequestInit & {
      next?: { revalidate?: number };
      cache?: RequestCache;
    });

    if (response.status !== 200) {
      // Return only static pages sitemap if stats fetch fails
      return [{ id: 0 }];
    }

    const stats = response.data;
    const totalPublished = stats.published || 0;

    // Calculate number of post sitemap pages needed
    const pageCount = Math.ceil(totalPublished / POSTS_PER_SITEMAP);

    // Generate sitemap IDs: 0 for static, 1..N for posts
    const sitemaps: Array<{ id: number }> = [{ id: 0 }];

    for (let i = 1; i <= pageCount; i++) {
      sitemaps.push({ id: i });
    }

    return sitemaps;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error generating sitemaps:', error);
    }
    // Fallback: return only static pages sitemap
    return [{ id: 0 }];
  }
}

/**
 * Generate sitemap content based on ID
 */
export default async function sitemap(props: {
  id: Promise<number>;
}): Promise<MetadataRoute.Sitemap> {
  const id = await props.id;

  // ID 0: Static pages
  if (id === 0) {
    return [
      {
        url: BASE_URL,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
      {
        url: `${BASE_URL}/goker`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 1,
      },
    ];
  }

  // IDs 1+: Posts sitemaps
  const domain = getApiDomain();
  const accumulatedPosts: Array<{
    slug: string;
    updatedAt: string;
  }> = [];

  let after: string | undefined = undefined;
  let hasMore = true;
  const postsToSkip = (id - 1) * POSTS_PER_SITEMAP;
  let totalFetched = 0;

  // Skip posts from previous pages first
  while (totalFetched < postsToSkip && hasMore) {
    try {
      const response = await postsQueryControllerFindSitemap({
        domain,
        status: 'published',
        limit: API_LIMIT,
        after,
        sort: '-updatedAt',
      });

      if (response.status !== 200) {
        break;
      }

      const validationResult =
        postsQueryControllerFindSitemapResponse.safeParse(response.data);

      if (!validationResult.success) {
        const rawData = response.data as {
          items?: Array<{ slug?: string; updatedAt?: string }>;
          meta?: { hasNextPage?: boolean; nextCursor?: string };
        };
        const posts = rawData.items || [];
        const meta = rawData.meta;

        totalFetched += posts.length;
        hasMore = meta?.hasNextPage === true && totalFetched < postsToSkip;
        after = meta?.nextCursor;
      } else {
        const validated = validationResult.data;
        const posts = validated.items || [];
        const meta = validated.meta;

        totalFetched += posts.length;
        hasMore = meta?.hasNextPage === true && totalFetched < postsToSkip;
        after = meta?.nextCursor;
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error skipping posts for sitemap:', error);
      }
      break;
    }
  }

  // Now fetch posts for this page (up to 50k)
  hasMore = true;
  while (accumulatedPosts.length < POSTS_PER_SITEMAP && hasMore) {
    try {
      const response = await postsQueryControllerFindSitemap({
        domain,
        status: 'published',
        limit: API_LIMIT,
        after,
        sort: '-updatedAt',
      });

      if (response.status !== 200) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to fetch posts for sitemap:', {
            status: response.status,
            id,
          });
        }
        break;
      }

      // Validate response with Zod
      const validationResult =
        postsQueryControllerFindSitemapResponse.safeParse(response.data);

      if (!validationResult.success) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            'Zod validation failed for sitemap posts:',
            validationResult.error.errors
          );
        }
        // Fallback: use raw data
        const rawData = response.data as {
          items?: Array<{ slug?: string; updatedAt?: string }>;
          meta?: { hasNextPage?: boolean; nextCursor?: string };
        };
        const posts = rawData.items || [];
        const meta = rawData.meta;

        accumulatedPosts.push(
          ...posts
            .filter((post) => !!post.slug && !!post.updatedAt)
            .map((post) => ({
              slug: post.slug!,
              updatedAt: post.updatedAt!,
            }))
        );

        hasMore =
          meta?.hasNextPage === true &&
          accumulatedPosts.length < POSTS_PER_SITEMAP;
        after = meta?.nextCursor;
      } else {
        const validated = validationResult.data;
        const posts = validated.items || [];
        const meta = validated.meta;

        accumulatedPosts.push(
          ...posts
            .filter((post) => !!post.slug && !!post.updatedAt)
            .map((post) => ({
              slug: post.slug,
              updatedAt: post.updatedAt,
            }))
        );

        hasMore =
          meta?.hasNextPage === true &&
          accumulatedPosts.length < POSTS_PER_SITEMAP;
        after = meta?.nextCursor;
      }

      // If we've accumulated enough for this page, break
      if (accumulatedPosts.length >= POSTS_PER_SITEMAP) {
        break;
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching posts for sitemap:', error);
      }
      break;
    }
  }

  // Convert posts to sitemap entries
  return accumulatedPosts.map((post) => ({
    url: `${BASE_URL}/${asUrl(post.slug)}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));
}
