'use client';

import { AuthorClient } from '@/components/features/author-client.component';
import type { PostDto } from '@/kodkafa/schemas';
import { getImages } from '@/lib/image.utils';
import { asUrl } from '@/lib/seo/url-slug.utils';
import { PostCardView } from './post-card-view.component';

/**
 * Client-side PostCard component wrapper
 * Used when PostCard needs to be rendered in client components
 * Uses AuthorClient for client-side author fetching
 * Uses PostCardView for presentation (reusable HTML/styling)
 * For SEO-optimized post display, use the server-side PostCard component
 */
export function PostCardClient({
  domain,
  title,
  slug,
  categories,
  tags,
  files,
  author,
  createdAt = '',
  updatedAt = '',
  className = '',
  coverRatio = '16/9',
  prefix = '',
  description = '',
  loading = 'lazy',
}: Partial<PostDto> & {
  className?: string;
  coverRatio?: string;
  prefix?: string;
  description?: string;
  loading?: 'lazy' | 'eager';
}) {
  const { cover } = getImages({ files });
  // In client components, compare post domain with current window hostname
  // If different, use absolute URL; otherwise use relative URL
  const currentHostname =
    typeof window !== 'undefined' ? window.location.hostname : '';
  const host = domain && domain !== currentHostname ? `https://${domain}` : '';
  const href = `${host}/${asUrl(slug, prefix)}`;

  const { width, height } = {
    '18/6': { width: 900, height: 300 },
    '16/9': { width: 800, height: 450 },
    '4/3': { width: 800, height: 600 },
  }[coverRatio] || { width: 900, height: 300 };

  const authorComponent =
    author && domain ? (
      <AuthorClient
        author={author}
        createdAt={createdAt}
        updatedAt={updatedAt}
        domain={domain}
      />
    ) : null;

  return (
    <PostCardView
      title={title || ''}
      href={href}
      cover={cover}
      coverWidth={width}
      coverHeight={height}
      coverRatio={coverRatio}
      description={description}
      loading={loading}
      className={className}
      authorComponent={authorComponent}
      tags={tags}
      categories={categories}
      host={host}
      createdAt={createdAt}
      updatedAt={updatedAt}
    />
  );
}
