import { postsQueryControllerFindAll } from '@/api/client/posts-query/posts-query';
import { postsControllerFindOneBySlug } from '@/api/client/posts/posts';
import type { PostDto } from '@/api/client/schemas';
import { postsQueryControllerFindAllResponse } from '@/api/client/schemas/posts-query/posts-query.zod';
import { postsControllerFindOneBySlugResponse } from '@/api/client/schemas/posts/posts.zod';
import Breadcrumb from '@/components/common/breadcrumb.component';
import { Category } from '@/components/features/category.component';
import { Post } from '@/components/features/post.component';
import Profile from '@/components/features/profile.component';
import { getApiDomain } from '@/lib/api/domain';
import { metadataGenerator } from '@/lib/seo/metadata.generator';
import { asSlug } from '@/lib/seo/url-slug.utils';
import { notFound } from 'next/navigation';

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
    const validationResult = postsQueryControllerFindAllResponse.safeParse(
      response.data
    );

    if (!validationResult.success) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          'Zod validation failed for postsQueryControllerFindAll:',
          validationResult.error.errors
        );
      }
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
    if (process.env.NODE_ENV === 'development') {
      console.error('Error generating static params:', error);
    }
    // Return empty array on error - pages will be generated on-demand
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  try {
    const { slug } = await params;
    const domain = getApiDomain();
    const response = await postsControllerFindOneBySlug(domain, slug);

    if (response.status !== 200) {
      return {
        title: 'Post not found',
        description: 'The requested post could not be found.',
      };
    }

    const validationResult = postsControllerFindOneBySlugResponse.safeParse(
      response.data
    );

    if (!validationResult.success) {
      // Fallback metadata if validation fails
      const post = response.data as PostDto;
      // Auto-detect OG type: 'article' for posts, 'website' for others
      const ogType = post.type === 'post' ? 'article' : 'website';
      return metadataGenerator(post, { ogType });
    }

    // Auto-detect OG type: 'article' for posts, 'website' for others
    const ogType = validationResult.data.type === 'post' ? 'article' : 'website';
    return metadataGenerator(validationResult.data, { ogType });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error generating metadata:', error);
    }
    // Return fallback metadata on error
    return {
      title: 'Post not found',
      description: 'The requested post could not be found.',
    };
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  try {
    const { slug } = await params;
    const domain = getApiDomain();
    const response = await postsControllerFindOneBySlug(domain, asSlug(slug));

    if (response.status !== 200) {
      if (process.env.NODE_ENV === 'development') {
        console.error('API Error Response:', {
          status: response.status,
          data: response.data,
          request: {
            domain,
            slug: asSlug(slug),
          },
        });
      }
      return notFound();
    }

    // Use safeParse to handle validation errors gracefully
    const validationResult = postsControllerFindOneBySlugResponse.safeParse(
      response.data
    );

    if (!validationResult.success) {
      // Log validation errors in development
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          'Zod validation failed for post:',
          validationResult.error.errors
        );
        console.warn('Raw API response:', JSON.stringify(response.data, null, 2));
      }

      const post = response.data as PostDto;

      const type = post.tags?.includes('profile')
        ? 'profile'
        : post.type || 'post';

      return (
        <div className='w-full max-w-full p-4 lg:p-8'>
          <Breadcrumb
            className='text-xs uppercase'
            paths={[{ children: post.slug }]}
          />
          {type === 'category' && <Category post={post} />}
          {type === 'post' && <Post post={post} />}
        </div>
      );
    }

    const post = validationResult.data;
    const type = post.tags?.includes('profile') ? 'profile' : post.type || 'post';

    return (
      <div className='w-full max-w-full p-4 lg:p-8 pt-4!'>
        <Breadcrumb
          className='text-xs uppercase'
          paths={[{ children: post.slug }]}
        />
        {type === 'category' && <Category post={post} />}
        {type === 'post' && <Post post={post} />}
        {type === 'profile' && <Profile post={post} />}
      </div>
    );
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error loading post page:', error);
    }
    // Let error.tsx handle unexpected errors by rethrowing
    // This ensures proper error boundary handling
    throw error;
  }
}
