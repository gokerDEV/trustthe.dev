import { postsQueryControllerFindAll } from '@/api/client/posts-query/posts-query';
import { postsControllerFindOneBySlug } from '@/api/client/posts/posts';
import type { PostDto } from '@/api/client/schemas';
import { postsQueryControllerFindAllResponse } from '@/api/client/schemas/posts-query/posts-query.zod';
import { postsControllerFindOneBySlugResponse } from '@/api/client/schemas/posts/posts.zod';
import { Container } from '@/components/common/container.component';
import { EmptyState } from '@/components/common/empty-state.component';
import GokerIshPrompt from '@/components/features/goker-ish-propt.component';
import LogoAnimation from '@/components/features/logo-animation.component';
import { PinnedPosts } from '@/components/features/pinned-posts.component';
import { getApiDomain } from '@/lib/api/domain';
import { validateApiResponse } from '@/lib/api/validation.utils';
import { getImages } from '@/lib/image.utils';
import { Logger } from '@/lib/logger';
import { metadataGenerator } from '@/lib/seo/metadata.generator';
import { asUrl } from '@/lib/seo/url-slug.utils';
import { cn } from '@/lib/utils';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const revalidate = 2592000;

export async function generateMetadata(): Promise<Metadata> {
  const slug = 'main';
  const domain = getApiDomain();
  const response = await postsControllerFindOneBySlug(domain, slug);

  if (response.status !== 200) {
    return metadataGenerator(undefined, {
      title: 'Goker Art',
      description: 'Art and creativity platform',
      ogType: 'website',
    });
  }

  const validationResult = validateApiResponse(
    response.data,
    postsControllerFindOneBySlugResponse,
    'generateMetadata[homepage]'
  );

  const post = validationResult.success
    ? validationResult.data
    : (response.data as Parameters<typeof metadataGenerator>[0] | undefined);

  if (!post) {
    return metadataGenerator(undefined, {
      title: 'Goker Art',
      description: 'Art and creativity platform',
      ogType: 'website',
    });
  }

  return metadataGenerator(post, { ogType: 'website' });
}

const Page = async () => {
  let post: PostDto | null = null;
  let cover: { src: string } | null = null;
  let isEmptyState = false;

  const domain = getApiDomain();

  // Fetch data directly from API with filters (no client-side filtering)
  const response = await postsQueryControllerFindAll({
    domain,
    type: 'post',
    status: 'published',
    limit: 1,
    sort: '-createdAt',
  });

  // Only return 404 if API actually returns 404
  if (response.status === 404) {
    Logger.apiError(
      'postsQueryControllerFindAll',
      response.status,
      response.data,
      {
        domain,
        type: 'post',
        status: 'published',
        limit: 1,
        sort: '-createdAt',
      }
    );
    notFound();
  }

  // For other non-200 statuses, log but don't show 404 (show error state instead)
  if (response.status !== 200) {
    Logger.apiError(
      'postsQueryControllerFindAll',
      response.status,
      response.data,
      {
        domain,
        type: 'post',
        status: 'published',
        limit: 1,
        sort: '-createdAt',
      }
    );
    // Don't call notFound() for non-404 errors - let the UI handle it
  }

  // Zod validation (enterprise requirement per next-client.mdc)
  const validationResult = validateApiResponse(
    response.data,
    postsQueryControllerFindAllResponse,
    'Page[homepage]'
  );

  let posts: PostDto[] = [];

  if (!validationResult.success) {
    // Fallback: use raw data
    const rawData = response.data as { items?: PostDto[] };
    posts = rawData.items || [];
  } else {
    const validated = validationResult.data;
    posts = validated.items || [];
  }

  // If status is 200 but no posts found, show empty state instead of 404
  if (response.status === 200 && !posts.length) {
    Logger.info('No posts found (200 OK, empty array)', {
      status: response.status,
      postsArrayLength: posts.length,
      validationSuccess: validationResult.success,
    });
    isEmptyState = true;
  } else if (posts.length > 0) {
    // If we have posts, proceed normally
    post = posts[0];
    cover = getImages(post).cover;
  }

  // Show empty state if no posts found but API returned 200
  if (isEmptyState) {
    return (
      <EmptyState
        title='No posts published yet'
        description="No published content is available at the moment. Content will appear here once it's been added."
      />
    );
  }

  // Only call notFound if we expected a post but don't have one
  if (!post || !cover) {
    Logger.error('Post or cover is missing', { post: !!post, cover: !!cover });
    notFound();
  }

  return (
    <Container className='mt-0! pt-0!'>
      <div className='flex h-screen w-full flex-col items-center gap-4 sm:justify-center'>
        <div className='flex w-full max-w-[660px] p-4'>
          <div className='-mx-2 mt-9 md:mt-2.5'>
            <LogoAnimation className='fill-primary float-left mr-4 block h-12 w-12 md:h-32 md:w-32' />
          </div>
          <div className='flex w-full flex-col items-start justify-end'>
            <div className='flex flex-row items-end justify-between gap-2'>
              <h1 className='pb-2 pl-4 text-lg font-bold'>
                Try &quot;goker-ish&quot; GPT
              </h1>
              {/* <TagCloud tags={tags || []} limit={5} skipSizing={true} className="w-1/2 gap-1.5 text-xs mb-1.5 " /> */}
            </div>
            <GokerIshPrompt />
          </div>
        </div>
        <article className='flex flex-col items-center justify-center'>
          <span className='text-muted-foreground flex w-full pb-1 text-xs font-semibold uppercase sm:max-w-full lg:max-w-[800px]'>
            Last post:
          </span>
          <section className='border-primary/8 bg-primary/6 mb-8 flex flex-col overflow-hidden rounded-lg border shadow sm:max-w-full md:flex-row lg:max-w-[800px]'>
            <div className='relative w-full md:h-full md:max-w-1/2'>
              <Link href={`/${asUrl(post.slug)}`}>
                <Image
                  className='w-full object-contain transition-transform duration-300 ease-in-out group-hover:scale-105'
                  src={cover.src}
                  alt={`Cover image for "${post.title}"`}
                  width={750}
                  height={250}
                  quality={75}
                  decoding='async'
                  sizes='(max-width: 768px) 100vw, 50vw'
                  priority
                />
              </Link>
            </div>

            <div
              className={cn(
                'flex w-full flex-col justify-center p-4 sm:p-6 md:w-1/2'
              )}
            >
              <Link href={`/${asUrl(post.slug)}`}>
                <h2 className='text-xl font-extrabold tracking-tight'>
                  {post.title}
                </h2>
              </Link>
              <Link href={`/${asUrl(post.slug)}`}>
                <div className='prose dark:prose-invert max-w-none [&_h2]:my-1 [&_h2]:text-sm [&_h2]:font-bold [&_hr]:mt-2 [&_p]:my-1! [&_p]:text-sm [&_p]:leading-tight'>
                  {post.description}
                </div>
              </Link>
            </div>
          </section>
        </article>
      </div>
      <PinnedPosts />
    </Container>
  );
};

export default Page;
