import type { PostDto } from '@/api/client/schemas';
import { postsControllerFindOneBySlug } from '@/api/client/posts/posts';
import { PostCard } from '@/components/features/post-card.component';
import { PINNED_POSTS } from '@/config/constants';
import { safeParsePostBySlug } from '@/lib/api/validation.utils';

export async function PinnedPosts() {
  const list: PostDto[] = [];

  await Promise.all(
    PINNED_POSTS.map(async ({ slug, domain }) => {
      try {
        const response = await postsControllerFindOneBySlug(domain, slug);
        if (response.status === 200) {
          const post = safeParsePostBySlug(
            response.data,
            `pinned post ${slug}`
          );
          list.push(post);
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error(`Failed to fetch pinned post ${slug}:`, {
            error,
            errorMessage:
              error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : undefined,
          });
        } else {
          console.error(`Failed to fetch pinned post ${slug}:`, error);
        }
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
