import Breadcrumb from '@/components/common/breadcrumb.component';
import { PostCard } from '@/components/features/post-card.component';
import { PostPaginationWrapper } from '@/components/features/post-pagination-wrapper.component';
import { postsAnalyticsControllerGetTagCloudByDomain } from '@/kodkafa/client/posts-analytics/posts-analytics';
import { postsQueryControllerFindAll } from '@/kodkafa/client/posts-query/posts-query';
import type { PostDto } from '@/kodkafa/client/schemas';
import { getApiDomain } from '@/lib/api/domain';
import { metadataGenerator } from '@/lib/seo/metadata.generator';
import { getPageDescription, getPageTitle } from '@/lib/seo/metadata.utils';
import { tagPrefix } from '@/lib/seo/url-slug.utils';

export const revalidate = 3600;
export const dynamicParams = true;

const INITIAL_STATIC_POSTS_LIMIT = 60;
const PAGINATION_LIMIT = 72;

export async function generateStaticParams() {
  try {
    const domain = getApiDomain();
    const response = await postsAnalyticsControllerGetTagCloudByDomain(domain);

    if (response.status !== 200 || !response.data) {
      return [];
    }

    const paths = response.data.map((tag) => ({
      params: {
        tags: tag.name.toLowerCase().replace(/[ \/]/g, '-'),
      },
    }));

    return paths;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error generating static params for tags:', error);
    }
    // Return empty array on error - pages will be generated on-demand
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tags: string }>;
}) {
  try {
    const { tags: _tags } = await params;
    const tags = _tags.replaceAll('-', ' ');

    return metadataGenerator(undefined, {
      title: getPageTitle(tags),
      description: getPageDescription(`Posts tagged with ${tags}`),
      ogType: 'website',
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error generating metadata for tags:', error);
    }
    // Return fallback metadata on error
    return metadataGenerator(undefined, {
      title: 'Tags',
      description: 'Posts by tags',
      ogType: 'website',
    });
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ tags: string }>;
}) {
  try {
    const { tags: _tags } = await params;
    const tags = _tags.replaceAll('-', ' ');

    const domain = getApiDomain();
    // Fetch initial static posts for SEO and initial render
    const response = await postsQueryControllerFindAll({
      domain,
      tags,
      type: 'post',
      status: 'published',
      limit: INITIAL_STATIC_POSTS_LIMIT,
    });

    const data =
      response.status === 200 && response.data?.items
        ? {
            items: response.data.items,
            meta: response.data.meta,
          }
        : { items: [], meta: undefined };

    if (data.items.length === 0) {
      return (
        <div className='mt-4 text-center'>
          <p>No posts found for tag: {tags}</p>
        </div>
      );
    }

    return (
      <div className='w-full max-w-full p-4 lg:p-8'>
        <Breadcrumb
          className='text-sm uppercase'
          paths={[
            { to: '/', children: 'TAGS' },
            {
              children: tags
                .split(',')
                .map((i: string) => i.trim()?.replace('-', ' '))
                .join(','),
            },
          ]}
        />
        <div data-pagination-wrapper className='relative'>
          {/* Static HTML for SEO - will be replaced by client-side JavaScript after user interaction */}
          <section
            data-static-posts
            className='3xl:columns-5 mt-4 columns-1 gap-8 space-y-8 sm:columns-2 lg:columns-3 xl:columns-4'
            aria-label={`Posts tagged with ${tags}`}
          >
            {data.items.map((postItem: PostDto, index: number) => (
              <article key={`static-post-${postItem.slug}`} className='mb-8'>
                <PostCard
                  {...postItem}
                  prefix={tagPrefix(postItem.tags, postItem.categories)}
                  loading={index < 6 ? 'eager' : 'lazy'}
                />
              </article>
            ))}
          </section>

          {/* Client-side pagination component - zero requests until user interaction */}
          <PostPaginationWrapper
            tags={tags}
            prefix={tags}
            domain={domain}
            paginationLimit={PAGINATION_LIMIT}
            useTagPrefix={true}
          />
        </div>
      </div>
    );
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error loading tags page:', error);
    }
    // Let error.tsx handle unexpected errors by rethrowing
    throw error;
  }
}
