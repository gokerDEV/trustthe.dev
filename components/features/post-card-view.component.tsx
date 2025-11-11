import { Categories } from '@/components/features/categories.component';
import { Tags } from '@/components/features/tags.component';
import { Card, CardContent } from '@/components/ui/card';
import type { CategoryDto } from '@/kodkafa/schemas';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

interface CoverImage {
  src: string;
  altText?: string;
}

interface PostCardViewProps {
  title: string;
  href: string;
  cover: CoverImage;
  coverWidth: number;
  coverHeight: number;
  coverRatio: string;
  description?: string;
  loading?: 'lazy' | 'eager';
  className?: string;
  authorComponent?: ReactNode;
  tags?: string[];
  categories?: readonly CategoryDto[];
  host: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Pure presentational component for PostCard display
 * Contains only HTML structure and styling - no data fetching or business logic
 * Reusable by both server-side (PostCard) and client-side (PostCardClient) components
 */
export function PostCardView({
  title,
  href,
  cover,
  coverWidth,
  coverHeight,
  coverRatio,
  description,
  loading = 'lazy',
  className = '',
  authorComponent,
  tags,
  categories,
  host,
  createdAt,
  updatedAt,
}: PostCardViewProps) {
  return (
    <Card className='break-inside-avoid'>
      <article
        className={cn(
          'group flex h-full flex-col items-stretch rounded-lg bg-white dark:bg-white/5',
          className
        )}
        itemScope
        itemType='https://schema.org/BlogPosting'
      >
        <Link
          className={cn(
            'relative block shrink-0 overflow-hidden rounded-t-lg',
            `aspect-[${coverRatio}]`
          )}
          href={href}
          aria-label={`Read more about ${title}`}
        >
          <Image
            className='start-0 top-0 rounded-t-lg object-cover transition-transform duration-300 ease-in-out group-hover:scale-105'
            src={cover.src}
            alt={`Cover image for "${title}"`}
            width={coverWidth}
            height={coverHeight}
            quality={75}
            loading={loading}
            decoding='async'
            sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
            itemProp='image'
          />
        </Link>
        <CardContent className='rounded-b-lg pt-2 [&_.categories]:justify-end'>
          <header>
            <h3
              className='font-display mt-2 line-clamp-2 text-lg leading-tight font-bold text-gray-900 dark:text-gray-200'
              itemProp='headline'
            >
              <Link
                href={href}
                className='block hover:underline'
                itemProp='url'
              >
                {title}
              </Link>
            </h3>
          </header>
          {description && (
            <p className='mt-4 text-sm'>
              <Link href={href}>{description} →</Link>
            </p>
          )}
          {authorComponent}
          <Tags tags={tags} className='mt-2 gap-1' host={host} />
          <Categories
            categories={categories}
            className='mt-2 gap-1'
            host={host}
          />
          <meta itemProp='datePublished' content={createdAt} />
          <meta itemProp='dateModified' content={updatedAt} />
        </CardContent>
      </article>
    </Card>
  );
}
