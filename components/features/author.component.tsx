import type { AuthorDto } from '@/api/client/schemas';
import { getAuthorPost } from '@/lib/api/author-cache.utils';
import { getImages } from '@/lib/image.utils';
import { AuthorView } from './author-view.component';

/**
 * Server-side Author component
 * Fetches author post data server-side with caching
 * Uses AuthorView for presentation (reusable HTML/styling)
 */
export async function Author({
  author,
  createdAt,
  updatedAt,
}: {
  author: AuthorDto;
  createdAt: string;
  updatedAt: string;
}) {
  // Get author username from author object
  const authorSlug = author.username;

  // Fetch author post with caching (deduplicates requests during same render)
  const authorPost = authorSlug ? await getAuthorPost(authorSlug) : null;

  // Use author post if found, otherwise use author name
  const displayTitle = authorPost?.title || author.name;
  const authorHref = authorPost ? `/${authorPost.slug}` : '#';
  const { cover } = authorPost ? getImages(authorPost) : { cover: null };

  // Get first name for avatar fallback
  const firstName = author.name.split(' ')[0];
  const initials = firstName.charAt(0).toUpperCase();

  const publishedAt = updatedAt > createdAt ? updatedAt : createdAt;

  return (
    <AuthorView
      authorName={author.name}
      displayTitle={displayTitle}
      authorHref={authorHref}
      cover={cover}
      initials={initials}
      publishedAt={publishedAt}
      hasAuthorPost={!!authorPost}
    />
  );
}
