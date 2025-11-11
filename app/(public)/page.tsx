import { Container } from '@/components/common/container.component';
import { EmptyState } from '@/components/common/empty-state.component';
import { postsQueryControllerFindAll } from '@/kodkafa/ssr/posts-query/posts-query';
import { postsControllerFindOneBySlug } from '@/kodkafa/ssr/posts/posts';
import type {
  PostDto,
  PostsQueryControllerFindAll200,
} from '@/kodkafa/schemas';
import { postsQueryControllerFindAllResponse } from '@/kodkafa/zod/kodkafaApi.zod';
import { postsControllerFindOneBySlugResponse } from '@/kodkafa/zod/kodkafaApi.zod';
import { getApiDomain } from '@/lib/api/domain';
import { fetchAndValidate } from '@/lib/api/fetch-and-validate';
import { getImages } from '@/lib/image.utils';
import { metadataGenerator } from '@/lib/seo/metadata.generator';
import { asUrl } from '@/lib/seo/url-slug.utils';
import { cn } from '@/lib/utils';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const revalidate = 2592000;
const SLUG = 'main';

export async function generateMetadata(): Promise<Metadata> {
  const domain = getApiDomain();
  const post = await fetchAndValidate<PostDto>({
    fetcher: () => postsControllerFindOneBySlug(domain, SLUG),
    schema: postsControllerFindOneBySlugResponse,
    context: 'generateMetadata[homepage]',
    defaultData: {} as PostDto,
    timeoutMs: 20_000, // 20 saniye timeout
  });
  return metadataGenerator(post, { ogType: 'website' });
}

const Page = async () => {
  const domain = getApiDomain();
  const posts = await fetchAndValidate<PostsQueryControllerFindAll200>({
    fetcher: () =>
      postsQueryControllerFindAll({
        domain,
        type: 'post',
        status: 'published',
        limit: 1,
        sort: '-updatedAt',
      }),
    schema: postsQueryControllerFindAllResponse,
    context: 'Page[homepage]',
    defaultData: {} as PostsQueryControllerFindAll200,
    timeoutMs: 20_000, // 20 saniye timeout
  });

  const post = posts.items?.[0];

  if (!post) {
    return (
      <EmptyState
        title='No posts published yet'
        description="No published content is available at the moment. Content will appear here once it's been added."
      />
    );
  }

  const { cover } = getImages(post);

  return (
    <Container className='flex grow flex-col items-center justify-center'>
      <div className='flex h-full w-full flex-col items-center gap-4 sm:justify-center'>
        {/* <div className="flex w-full max-w-[660px] p-4">
          <div className="-mx-2 mt-9 md:mt-2.5">
            <LogoAnimation className="fill-primary float-left mr-4 block h-12 w-12 md:h-32 md:w-32" />
          </div>
          <div className="flex w-full flex-col items-start justify-end">
            <div className="flex flex-row items-end justify-between gap-2">
              <h1 className="pb-2 pl-4 text-lg font-bold">
                Try &quot;goker-ish&quot; GPT
              </h1>
            </div>
            <GokerIshPrompt />
          </div>
        </div> */}
        <article>
          <span className='text-muted-foreground pb-1 text-xs font-semibold uppercase'>
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
    </Container>
  );
};

export default Page;
