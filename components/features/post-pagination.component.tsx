'use client';

import type { PostDto } from '@/api/client/schemas';
import { Button } from '@/components/ui/button';
import { coverRatios } from '@/config/navigation';
import { asPrefix, tagPrefix } from '@/lib/seo/url-slug.utils';
import { useInfiniteQuery } from '@tanstack/react-query';
import { VirtuosoMasonry } from '@virtuoso.dev/masonry';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PostCardClient } from './post-card-client.component';

interface PostPaginationProps {
  categoryId?: string;
  tags?: string;
  domain: string;
  prefix: string;
  paginationLimit: number;
  useTagPrefix?: boolean;
}

interface PostsQueryResponse {
  items?: PostDto[];
  meta?: {
    nextCursor?: string;
    hasNextPage?: boolean;
  };
}

function calculateColumnCount(width: number): number {
  if (width >= 1920) return 5;
  if (width >= 1280) return 4;
  if (width >= 1024) return 3;
  if (width >= 640) return 2;
  return 1;
}

interface PostCardItemContentProps {
  data: PostDto;
  index: number;
}

function createPostCardItemContent(_prefix: string, useTagPrefix: boolean) {
  return function PostCardItemContent({
    data: post,
  }: PostCardItemContentProps) {
    const coverRatio = coverRatios(post.slug || '');
    const prefix = useTagPrefix
      ? tagPrefix(post.tags, post.categories)
      : asPrefix(_prefix);

    return (
      <div className='mb-8'>
        <PostCardClient {...post} coverRatio={coverRatio} prefix={prefix} />
      </div>
    );
  };
}

function PaginationLoadingIndicator() {
  return (
    <div
      className='mt-8 flex justify-center'
      role='status'
      aria-label='Loading more posts'
    >
      <div className='bg-muted text-muted-foreground inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-medium opacity-50'>
        Loading more posts...
      </div>
    </div>
  );
}

function PaginationErrorIndicator() {
  return (
    <div className='mt-8 flex justify-center' role='alert'>
      <div className='bg-destructive text-destructive-foreground inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-medium'>
        Failed to load posts. Please try again later.
      </div>
    </div>
  );
}

export function PostPagination({
  categoryId,
  tags,
  domain,
  paginationLimit,
  useTagPrefix = false,
  prefix,
}: PostPaginationProps) {
  const infiniteScrollTargetRef = useRef<HTMLDivElement>(null);
  const hasReplacedStaticPostsRef = useRef(false);
  const [columnCount, setColumnCount] = useState(3);
  const [isQueryEnabled, setIsQueryEnabled] = useState(false);

  const queryKey = categoryId
    ? ['post-pagination', 'category', categoryId, domain, paginationLimit]
    : ['post-pagination', 'tags', tags, domain, paginationLimit];

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteQuery<PostsQueryResponse>({
      queryKey,
      queryFn: async ({ pageParam }) => {
        const params = new URLSearchParams({
          domain,
          'filter[type]': 'post',
          'filter[status]': 'published',
          limit: paginationLimit.toString(),
        });

        if (categoryId) {
          params.set('filter[categories]', categoryId);
        }

        if (tags) {
          params.set('filter[tags]', tags);
        }

        if (pageParam) {
          params.set('after', pageParam as string);
        }

        const response = await fetch(`/api/posts/query?${params.toString()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch posts');
        }

        return (await response.json()) as PostsQueryResponse;
      },
      initialPageParam: undefined,
      getNextPageParam: (lastPage) => {
        return lastPage.meta?.hasNextPage
          ? lastPage.meta?.nextCursor
          : undefined;
      },
      enabled: isQueryEnabled,
    });

  const allPosts = useMemo(
    () => data?.pages.flatMap((page) => page.items || []) ?? [],
    [data]
  );

  const PostCardItemContentComponent = useMemo(
    () => createPostCardItemContent(prefix, useTagPrefix),
    [prefix, useTagPrefix]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateColumnCount = () => {
      setColumnCount(calculateColumnCount(window.innerWidth));
    };
    updateColumnCount();
    window.addEventListener('resize', updateColumnCount);
    return () => {
      window.removeEventListener('resize', updateColumnCount);
    };
  }, []);

  useEffect(() => {
    if (
      !hasReplacedStaticPostsRef.current &&
      isQueryEnabled &&
      status === 'success'
    ) {
      const scrollY = window.scrollY;
      const staticPostsSection = document.querySelector(
        '[data-static-posts]'
      ) as HTMLElement | null;
      const wrapper = document.querySelector(
        '[data-pagination-wrapper]'
      ) as HTMLElement | null;

      if (staticPostsSection && wrapper) {
        const originalWrapperHeight = wrapper.offsetHeight;

        wrapper.style.minHeight = `${originalWrapperHeight}px`;

        staticPostsSection.style.position = 'absolute';
        staticPostsSection.style.transition = 'opacity .8s ease-out';
        staticPostsSection.style.opacity = '0';
        staticPostsSection.style.pointerEvents = 'none';

        hasReplacedStaticPostsRef.current = true;

        setTimeout(() => {
          window.scrollTo(0, scrollY);
        }, 0);
        setTimeout(() => {
          staticPostsSection.style.display = 'none';
        }, 1000);
      }
    }
  }, [status, isQueryEnabled]);

  useEffect(() => {
    if (
      !infiniteScrollTargetRef.current ||
      !hasNextPage ||
      isFetchingNextPage ||
      !isQueryEnabled
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      {
        rootMargin: '200px',
      }
    );

    observer.observe(infiniteScrollTargetRef.current);

    return () => {
      observer.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, isQueryEnabled]);

  const handleInitialLoad = useCallback(() => {
    setIsQueryEnabled(true);
  }, []);

  if (!isQueryEnabled) {
    return (
      <div data-load-more className='mt-8 flex justify-center'>
        <Button
          onClick={handleInitialLoad}
          variant='outline'
          size='lg'
          aria-label='Load more posts'
        >
          Load More
        </Button>
      </div>
    );
  }

  if (status === 'pending') {
    return <PaginationLoadingIndicator />;
  }

  if (status === 'error') {
    return <PaginationErrorIndicator />;
  }

  if (allPosts.length === 0) {
    return (
      <div className='mt-8 flex justify-center' role='status'>
        <div className='bg-muted text-muted-foreground inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-medium'>
          No posts found.
        </div>
      </div>
    );
  }

  return (
    <>
      <VirtuosoMasonry
        data={allPosts}
        columnCount={columnCount}
        ItemContent={PostCardItemContentComponent}
        className='gap-8'
        initialItemCount={allPosts.length > 50 ? 50 : allPosts.length}
      />

      {hasNextPage && (
        <div
          ref={infiniteScrollTargetRef}
          className='h-20'
          aria-hidden='true'
        />
      )}

      {isFetchingNextPage && <PaginationLoadingIndicator />}
    </>
  );
}
