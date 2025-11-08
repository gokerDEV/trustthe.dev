'use client';

import type { AuthorDto, PostDto, PostFileDto } from '@/kodkafa/client/schemas';
import { getImages } from '@/lib/image.utils';
import { useQuery } from '@tanstack/react-query';
import { AuthorView } from './author-view.component';

/**
 * Client-side Author component wrapper
 * Used when Author needs to be rendered in client components
 * Fetches author post client-side with React Query caching and deduplication
 * Uses AuthorView for presentation (reusable HTML/styling)
 * For SEO-optimized author display, use the server-side Author component
 */
export function AuthorClient({
  author,
  createdAt,
  updatedAt,
}: {
  author: AuthorDto;
  createdAt: string;
  updatedAt: string;
}) {
  const authorSlug = author.username;

  const { data: authorPost, isLoading } = useQuery<PostDto | null>({
    queryKey: ['author-post', authorSlug],
    queryFn: async () => {
      if (!authorSlug) {
        return null;
      }

      try {
        const response = await fetch(
          `/api/posts/${encodeURIComponent(authorSlug)}`
        );
        if (response.ok) {
          const data = (await response.json()) as PostDto;
          return data;
        }
        return null;
      } catch (error) {
        // Silently fail - will fall back to author name
        if (process.env.NODE_ENV === 'development') {
          console.warn('Failed to fetch author post:', error);
        }
        return null;
      }
    },
    enabled: !!authorSlug,
    staleTime: 3600000, // 1 hour - same as server-side cache
    gcTime: 7200000, // 2 hours (formerly cacheTime)
  });

  // Use author post if found, otherwise use author name
  const displayTitle = authorPost?.title || author.name;
  const authorHref = authorPost ? `/${authorPost.slug}` : '#';
  const { cover } = getImages(authorPost ?? null);

  // Get first name for avatar fallback
  const firstName = author.name.split(' ')[0];
  const initials = firstName.charAt(0).toUpperCase();

  // Show loading state with basic author info (using AuthorView for consistency)
  if (isLoading) {
    return (
      <AuthorView
        authorName={author.name}
        displayTitle={author.name}
        authorHref={null}
        cover={{ src: '', altText: '' } as PostFileDto}
        initials={initials}
        createdAt={createdAt}
        updatedAt={updatedAt}
      />
    );
  }

  return (
    <AuthorView
      authorName={author.name}
      displayTitle={displayTitle}
      authorHref={authorHref}
      cover={cover}
      initials={initials}
      createdAt={createdAt}
      updatedAt={updatedAt}
    />
  );
}
