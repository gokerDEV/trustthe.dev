import { PostCard } from '@/components/features/post-card.component';
import { PINNED_POSTS } from '@/config/constants';
import { postsControllerFindOneBySlug } from '@/kodkafa/ssr/posts/posts';
import type { PostDto } from '@/kodkafa/schemas';
import { postsControllerFindOneBySlugResponse } from '@/kodkafa/zod/kodkafaApi.zod';
import { Logger } from '@/lib/logger';

export async function PinnedPosts() {
  const list: PostDto[] = [];

  await Promise.all(
    PINNED_POSTS.map(async ({ slug, domain }) => {
      try {
        const response = await postsControllerFindOneBySlug(domain, slug);
        if (response.status === 200) {
          const validationResult =
            postsControllerFindOneBySlugResponse.safeParse(response.data);

          if (validationResult.success) {
            list.push(validationResult.data);
          } else {
            // Graceful fallback: use raw data if validation fails
            const fallbackPost = response.data as PostDto;
            if (fallbackPost) {
              list.push(fallbackPost);
            }
          }
        }
      } catch (error) {
        Logger.error(`Failed to fetch pinned post ${slug}`, {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          domain,
          slug,
        });
      }
    })
  );

  const coverRatio = 'auto';

  return (
    <>
      <section className='mt-4 columns-1 gap-8 space-y-8 md:columns-2 lg:columns-3'>
        {list.map((i: PostDto) => (
          <PostCard
            key={`post-${i.slug}`}
            {...i}
            description={i?.description}
            coverRatio={coverRatio}
          />
        ))}
      </section>
    </>
  );
}
