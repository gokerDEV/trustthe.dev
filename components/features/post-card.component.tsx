import type { PostDto } from '@/api/client/schemas';
import { AuthorClient } from '@/components/features/author-client.component';
import { Author } from '@/components/features/author.component';
import { Categories } from '@/components/features/categories.component';
import { Tags } from '@/components/features/tags.component';
import { Card, CardContent } from '@/components/ui/card';
import { getImages } from '@/lib/image.utils';
import { asUrl } from '@/lib/seo/url-slug.utils';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';

type Props = Partial<PostDto> & {
  className?: string;
  coverRatio?: string;
  prefix?: string;
  description?: string;
  loading?: 'lazy' | 'eager';
  useClientAuthor?: boolean;
};

export const PostCard = ({
  domain,
  title,
  slug,
  categories,
  tags,
  files,
  author,
  createdAt = '',
  updatedAt = '',
  className = '',
  coverRatio = '16/9',
  prefix = '',
  description = '',
  loading = 'lazy',
  useClientAuthor = false,
}: Props) => {
  const { cover } = getImages({ files });
  const host =
    (String(process.env.DOMAIN) !== domain ? 'https://' + domain : '') || '';
  const href = `${host}/${asUrl(slug, prefix)}`;

  const { width, height } = {
    '18/6': { width: 900, height: 300 },
    '16/9': { width: 800, height: 450 },
    '4/3': { width: 800, height: 600 },
  }[coverRatio] || { width: 900, height: 300 };
  return (
    <Card className='break-inside-avoid'>
      <article
        className={`group ${className} flex h-full flex-col items-stretch rounded-lg bg-white dark:bg-white/5`}
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
            width={width}
            height={height}
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
              className='mt-2 line-clamp-2 text-lg leading-tight font-semibold text-gray-900 dark:text-gray-200'
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
          {author ? (
            useClientAuthor ? (
              <AuthorClient
                author={author}
                createdAt={createdAt}
                updatedAt={updatedAt}
              />
            ) : (
              <Author
                author={author}
                createdAt={createdAt}
                updatedAt={updatedAt}
              />
            )
          ) : null}
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
};
