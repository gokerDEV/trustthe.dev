import { postsControllerFindOneBySlug } from '@/kodkafa/client/posts/posts';
import type { AuthorDto, PostDto } from '@/kodkafa/client/schemas';
import { postsControllerFindOneBySlugResponse } from '@/kodkafa/client/schemas/posts/posts.zod';
import { getApiDomain } from '@/lib/api/domain';
import { fetchAndValidate } from '@/lib/api/safe-fetch.utils';
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

  const authorPost = authorSlug
    ? await fetchAndValidate<PostDto | null>({
        fetcher: () => postsControllerFindOneBySlug(getApiDomain(), authorSlug),
        schema: postsControllerFindOneBySlugResponse,
        context: `author post ${authorSlug}`,
        defaultData: null,
      })
    : null;

  // Use author post if found, otherwise use author name
  const displayTitle = authorPost?.title || author.name;
  const authorHref = authorPost && `/${authorPost.slug}`;
  const { cover } = getImages(authorPost);

  // Get first name for avatar fallback
  const firstName = author.name.split(' ')[0];
  const initials = firstName.charAt(0).toUpperCase();

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
