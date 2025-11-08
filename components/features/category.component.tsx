import { postsQueryControllerFindAll } from '@/api/client/posts-query/posts-query';
import type {
  PageMetaDto,
  PostDto,
  PostsQueryControllerFindAll200,
} from '@/api/client/schemas';
import { Markdown } from '@/components/common/markdown.component';
import { PostCard } from '@/components/features/post-card.component';
import { PostPaginationWrapper } from '@/components/features/post-pagination-wrapper.component';
import { coverRatios } from '@/config/navigation';
import { getApiDomain } from '@/lib/api/domain';
import { parseMarkdown } from '@/lib/markdown';
import { asPrefix } from '@/lib/seo/url-slug.utils';
import { cn } from '@/lib/utils';
import { notFound } from 'next/navigation';

import { postsQueryControllerFindAllResponse } from '@/api/client/schemas/posts-query/posts-query.zod';
import { fetchAndValidate } from '@/lib/api/safe-fetch.utils';
import { CollectionPageJsonLd } from './json-ld.component';

/**
 * Initial static posts limit for SEO and initial render performance.
 * Reduced count ensures fast initial page load while maintaining SEO value.
 *
 * Pagination limit for client-side data fetching.
 * Should be more than initial limit to provide smooth content transition.
 */

const INITIAL_STATIC_POSTS_LIMIT = 60;
const PAGINATION_LIMIT = 72;

export async function Category({
  post,
  onlyUnCategoried = false,
}: {
  post: PostDto;
  onlyUnCategoried?: boolean;
}) {
  if (!post?.slug) notFound();

  const markdown = parseMarkdown(post?.content || '');

  const domain = getApiDomain();
  const data = await fetchAndValidate<PostsQueryControllerFindAll200>({
    fetcher: () =>
      postsQueryControllerFindAll({
        domain,
        categories: onlyUnCategoried ? 'null' : post.id,
        type: 'post',
        status: 'published',
        limit: INITIAL_STATIC_POSTS_LIMIT,
      }),
    schema: postsQueryControllerFindAllResponse,
    context: `Category posts for ${post.slug} - ${post.id}`,
    defaultData: { items: [] as PostDto[], meta: {} as PageMetaDto },
  });

  const coverRatio = coverRatios(post.slug);
  const prefix = onlyUnCategoried ? '' : asPrefix(post.slug);

  return (
    <>
      <section className='border-foreground/5 mb-8 flex flex-col overflow-hidden rounded-lg border bg-white shadow md:flex-row dark:bg-white/5'>
        <div className={cn('flex w-full flex-col justify-center p-4 sm:p-6')}>
          <h1 className='text-xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100'>
            {post.title}
          </h1>
          <div className='prose dark:prose-invert max-w-none [&_h2]:my-1 [&_h2]:text-sm [&_h2]:font-bold [&_hr]:mt-2 [&_p]:my-1! [&_p]:text-sm [&_p]:leading-tight'>
            <Markdown content={markdown} />
          </div>
        </div>
      </section>

      <div data-pagination-wrapper className='relative'>
        {/* Static HTML for SEO - will be replaced by client-side JavaScript after user interaction */}
        <section
          data-static-posts
          className='3xl:grid-cols-5 grid grid-cols-1 gap-x-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          aria-label={`Posts in category ${post.title}`}
        >
          {data.items?.map((postItem: PostDto, index: number) => (
            <article key={`static-post-${postItem.slug}`} className='mb-8'>
              <PostCard
                {...postItem}
                coverRatio={coverRatio}
                prefix={prefix}
                loading={index < 6 ? 'eager' : 'lazy'}
              />
            </article>
          ))}
        </section>

        {/* Client-side pagination component - zero requests until user interaction */}
        {data.meta?.hasNextPage && (
          <PostPaginationWrapper
            categoryId={post.id}
            domain={domain}
            prefix={prefix}
            paginationLimit={PAGINATION_LIMIT}
          />
        )}
      </div>
      <CollectionPageJsonLd data={post} />
    </>
  );
}
