import { PostContent } from '@/components/features/post-content.component';
import { postsQueryControllerFindAll } from '@/kodkafa/ssr/posts-query/posts-query';
import { postsControllerFindOneBySlug } from '@/kodkafa/ssr/posts/posts';
import {
  PageMetaDto,
  PostDto,
  PostsQueryControllerFindAll200,
} from '@/kodkafa/schemas';
import { postsQueryControllerFindAllResponse } from '@/kodkafa/zod/kodkafaApi.zod';
import { postsControllerFindOneBySlugResponse } from '@/kodkafa/zod/kodkafaApi.zod';
import { getApiDomain } from '@/lib/api/domain';
import { fetchAndValidate } from '@/lib/api/fetch-and-validate';
import { metadataGenerator } from '@/lib/seo/metadata.generator';
import { asSlug } from '@/lib/seo/url-slug.utils';
import { notFound } from 'next/navigation';

export const revalidate = 2592000;
export const dynamicParams = true;

export async function generateStaticParams() {
  const domain = getApiDomain();
  const data = await fetchAndValidate<PostsQueryControllerFindAll200>({
    fetcher: () =>
      postsQueryControllerFindAll({
        domain,
        type: 'post',
        status: 'published',
        limit: 28,
        sort: '-updatedAt',
      }),
    schema: postsQueryControllerFindAllResponse,
    context: 'Posts for sitemap',
    defaultData: { items: [] as PostDto[], meta: {} as PageMetaDto },
  });

  return (
    data.items?.map((post) => {
      const [slug, postNum] = post.slug.split('-');
      return {
        slug: slug,
        post: postNum,
      };
    }) ?? []
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const domain = getApiDomain();

  const post = await fetchAndValidate<PostDto>({
    fetcher: () => postsControllerFindOneBySlug(domain, asSlug(slug)),
    schema: postsControllerFindOneBySlugResponse,
    context: 'Post for metadata',
    defaultData: { title: '404 - Post not found' } as PostDto,
  });

  const ogType = post.type === 'post' ? 'article' : 'website';
  return metadataGenerator(post, { ogType });
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const domain = getApiDomain();

  const post = await fetchAndValidate<PostDto>({
    fetcher: () => postsControllerFindOneBySlug(domain, asSlug(slug)),
    schema: postsControllerFindOneBySlugResponse,
    context: 'Post for page',
    defaultData: {} as PostDto,
  });

  if (!post.title) notFound();

  return <PostContent post={post} />;
}
