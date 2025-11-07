import { postsQueryControllerFindAll } from '@/api/client/posts-query/posts-query';
import { postsControllerFindOneBySlug } from '@/api/client/posts/posts';
import type { PostDto } from '@/api/client/schemas';
import { postsQueryControllerFindAllResponse } from '@/api/client/schemas/posts-query/posts-query.zod';
import { postsControllerFindOneBySlugResponse } from '@/api/client/schemas/posts/posts.zod';
import { Container } from '@/components/common/container.component';
import GokerIshPrompt from '@/components/features/goker-ish-propt.component';
import LogoAnimation from '@/components/features/logo-animation.component';
import { PinnedPosts } from '@/components/features/pinned-posts.component';
import { getApiDomain } from '@/lib/api/domain';
import { getImages } from '@/lib/image.utils';
import { metadataGenerator } from '@/lib/seo/metadata.generator';
import { asUrl } from '@/lib/seo/url-slug.utils';
import { cn } from '@/lib/utils';
import {Metadata} from "next";
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const revalidate = 2592000;

export async function generateMetadata(): Promise<Metadata> {
  try {
    const slug = 'main';
    const domain = getApiDomain();
    const response = await postsControllerFindOneBySlug(domain, slug);

    if (response.status !== 200) {
      return {
        title: 'Goker Art',
        description: 'Art and creativity platform',
      };
    }

    const validationResult = postsControllerFindOneBySlugResponse.safeParse(
      response.data
    );

    if (!validationResult.success) {
      // Fallback metadata if validation fails
      const post = response.data as PostDto;
      return metadataGenerator(post, { ogType: 'website' });
    }

    return metadataGenerator(validationResult.data, { ogType: 'website' });
  } catch (error) {
    console.error('Failed to generate metadata:', error);
    return {
      title: 'Goker Art',
      description: 'Art and creativity platform',
    };
  }
}

const Page = async () => {
  let post: PostDto | null = null;
  let cover: { src: string } | null = null;
  let isEmptyState = false;

  try {
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
      if (process.env.NODE_ENV === 'development') {
        console.error('API Error Response (404):', {
          status: response.status,
          data: response.data,
          request: {
            domain,
            type: 'post',
            status: 'published',
            limit: 1,
            sort: '-createdAt',
          },
        });
      }
      notFound();
    }

    // For other non-200 statuses, log but don't show 404 (show error state instead)
    if (response.status !== 200) {
      if (process.env.NODE_ENV === 'development') {
        console.error('API Error Response:', {
          status: response.status,
          data: response.data,
          request: {
            domain,
            type: 'post',
            status: 'published',
            limit: 1,
            sort: '-createdAt',
          },
        });
      }
      // Don't call notFound() for non-404 errors - let the UI handle it
    }

    // Zod validation (enterprise requirement per next-client.mdc)
    const validationResult = postsQueryControllerFindAllResponse.safeParse(
      response.data
    );

    let posts: PostDto[] = [];

    if (!validationResult.success) {
      // Backend schema mismatch - use raw data with type assertion
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          'Zod validation failed for postsQueryControllerFindAll:',
          validationResult.error.errors
        );
        console.warn(
          'Raw API response:',
          JSON.stringify(response.data, null, 2)
        );
      }

      // Fallback: use raw data
      const rawData = response.data as { items?: PostDto[] };
      posts = rawData.items || [];
    } else {
      const validated = validationResult.data;
      posts = validated.items || [];
    }

    // If status is 200 but no posts found, show empty state instead of 404
    if (response.status === 200 && !posts.length) {
      if (process.env.NODE_ENV === 'development') {
        console.log('No posts found (200 OK, empty array):', {
          status: response.status,
          data: JSON.stringify(response.data, null, 2),
          postsArrayLength: posts.length,
          validationSuccess: validationResult.success,
        });
      }
      isEmptyState = true;
    } else if (posts.length > 0) {
      // If we have posts, proceed normally
      post = posts[0];
      cover = getImages(post).cover;
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to load page data:', {
        error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
      });
    } else {
      console.error('Failed to load page data:', error);
    }
    notFound();
  }

  // Show empty state if no posts found but API returned 200
  if (isEmptyState) {
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
              </div>
              <GokerIshPrompt />
            </div>
          </div>
          <article className='flex flex-col items-center justify-center'>
            <div className='text-muted-foreground border-primary/8 bg-primary/6 mb-8 flex flex-col items-center justify-center rounded-lg border p-8 text-center sm:max-w-full lg:max-w-[800px]'>
              <h2 className='mb-4 text-2xl font-bold'>
                No posts published yet
              </h2>
              <p className='text-muted-foreground mb-4 text-base'>
                No published content is available at the moment. Content will
                appear here once it&apos;s been added.
              </p>
              <p className='text-muted-foreground text-sm'>
                You can consult &quot;goker-ish&quot; GPT for any questions.
              </p>
            </div>
          </article>
        </div>
        <PinnedPosts />
      </Container>
    );
  }

  // Only call notFound if we expected a post but don't have one
  if (!post || !cover) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Post or cover is missing:', { post, cover });
    }
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
                  alt={`Cover for category ${post.title}`}
                  width={750}
                  height={250}
                  quality={75}
                  decoding='async'
                  sizes='(max-width: 768px) 100vw, 50vw'
                  blurDataURL={cover.src}
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
