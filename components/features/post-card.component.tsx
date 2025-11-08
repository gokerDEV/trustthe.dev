import { Author } from '@/components/features/author.component';
import type { PostDto } from '@/kodkafa/client/schemas';
import { getImages } from '@/lib/image.utils';
import { asUrl } from '@/lib/seo/url-slug.utils';
import { PostCardView } from './post-card-view.component';

/**
 * Server-side PostCard component
 * Fetches author post data server-side with caching
 * Uses PostCardView for presentation (reusable HTML/styling)
 */
export async function PostCard({
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
  const host =
    (String(process.env.DOMAIN) !== domain ? 'https://' + domain : '') || '';
  const href = `${host}/${asUrl(slug, prefix)}`;

  const { width, height } = {
    '18/6': { width: 900, height: 300 },
    '16/9': { width: 800, height: 450 },
    '4/3': { width: 800, height: 600 },
  }[coverRatio] || { width: 900, height: 300 };

  const authorComponent = author ? (
    <Author author={author} createdAt={createdAt} updatedAt={updatedAt} />
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
