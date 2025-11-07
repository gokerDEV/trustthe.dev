'use client';

import dynamic from 'next/dynamic';

/**
 * Lazy-loaded wrapper for PostPagination component.
 * Prevents client-side JavaScript from loading until user interaction.
 * No SSR to ensure zero client-side requests on initial page load.
 */
const PostPagination = dynamic(
  () =>
    import('./post-pagination.component').then((mod) => ({
      default: mod.PostPagination,
    })),
  {
    ssr: false,
    loading: () => null, // No loader - static posts are already visible
  }
);

interface PostPaginationWrapperProps {
  categoryId?: string;
  tags?: string;
  domain: string;
  prefix: string;
  paginationLimit: number;
  useTagPrefix?: boolean;
}

/**
 * Server Component wrapper for client-side pagination.
 * Ensures zero client-side JavaScript execution until user interaction.
 */
export function PostPaginationWrapper({
  categoryId,
  tags,
  domain,
  prefix,
  paginationLimit,
  useTagPrefix = false,
}: PostPaginationWrapperProps) {
  return (
    <PostPagination
      categoryId={categoryId}
      tags={tags}
      domain={domain}
      prefix={prefix}
      paginationLimit={paginationLimit}
      useTagPrefix={useTagPrefix}
    />
  );
}
