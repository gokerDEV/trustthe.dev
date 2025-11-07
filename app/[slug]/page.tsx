import { postsQueryControllerFindAll } from '@/api/client/posts-query/posts-query';
import { postsControllerFindOneBySlug } from '@/api/client/posts/posts';
import { postsQueryControllerFindAllResponse } from '@/api/client/schemas/posts-query/posts-query.zod';
import { postsControllerFindOneBySlugResponse } from '@/api/client/schemas/posts/posts.zod';
import { ServerErrorBoundary } from '@/components/common/error-boundary.component';
import { PostContent } from '@/components/features/post-content.component';
import { getApiDomain } from '@/lib/api/domain';
import { validateApiResponse } from '@/lib/api/validation.utils';
import { Logger } from '@/lib/logger';
import { metadataGenerator } from '@/lib/seo/metadata.generator';
import { asSlug } from '@/lib/seo/url-slug.utils';

export const revalidate = 2592000;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const domain = getApiDomain();

    // Only fetch a few posts for initial build
    // With dynamicParams = true and revalidate, other pages will be generated on-demand
    const response = await postsQueryControllerFindAll({
      domain,
      type: 'post',
      status: 'published',
      limit: 28, // Just a few for starter
      sort: '-updatedAt',
    });

    if (response.status !== 200) {
      return [];
    }

    // Zod validation (enterprise requirement per next-client.mdc)
    const validationResult = validateApiResponse(
      response.data,
      postsQueryControllerFindAllResponse,
      'generateStaticParams'
    );

    if (!validationResult.success) {
      return [];
    }

    const validated = validationResult.data;
    const posts = validated.items || [];

    const paths = posts.map((post) => {
      const [slug, postNum] = post.slug.split('-');
      return {
        slug: slug,
        post: postNum,
      };
    });

    return paths;
  } catch (error) {
    Logger.error('Error generating static params', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    // Return empty array on error - pages will be generated on-demand
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const domain = getApiDomain();
  const response = await postsControllerFindOneBySlug(domain, slug);

  if (response.status !== 200) {
    return {
      title: 'Post not found',
      description: 'The requested post could not be found.',
    };
  }

  const validationResult = validateApiResponse(
    response.data,
    postsControllerFindOneBySlugResponse,
    'generateMetadata'
  );

  const post = validationResult.success
    ? validationResult.data
    : (response.data as Parameters<typeof metadataGenerator>[0] | undefined);

  if (!post) {
    return {
      title: 'Post not found',
      description: 'The requested post could not be found.',
    };
  }

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
  const response = await postsControllerFindOneBySlug(domain, asSlug(slug));

  const post = ServerErrorBoundary.handleApiResponseWithValidation(
    response.status,
    response.data,
    postsControllerFindOneBySlugResponse,
    {
      operation: 'postsControllerFindOneBySlug',
      domain,
      slug: asSlug(slug),
    }
  );

  return <PostContent post={post} />;
}
