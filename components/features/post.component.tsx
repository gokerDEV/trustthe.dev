import DaysAgo from '@/components/common/days-ago.component';
import { Markdown } from '@/components/common/markdown.component';
import { Author } from '@/components/features/author.component';
import { Categories } from '@/components/features/categories.component';
import { LazyMediaGallery } from '@/components/features/lazy-media-gallery.component';
import { ShareButtons } from '@/components/features/share-buttons.component';
import { Tags } from '@/components/features/tags.component';
import type { PostDto } from '@/kodkafa/client/schemas';
import { getDescription, getImages } from '@/lib/image.utils';
import { parseMarkdown } from '@/lib/markdown';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import readingTime from 'reading-time';
import { ArticleJsonLd } from './json-ld.component';

export async function Post({ post }: { post: PostDto }) {
  if (!post?.slug) notFound();

  const isEchoneo = post.categories?.map((i) => i.slug).includes('echoneo');

  const { cover, images } = getImages(post);
  const markdown = parseMarkdown(post?.content || '');
  const stats = readingTime(String(markdown?.toString()));
  const publishedAt =
    post.updatedAt > post.createdAt ? post.updatedAt : post.createdAt;
  const description = getDescription(post?.content || '');

  const coverRatio = isEchoneo ? '4/3' : '16/9';
  const { width, height } = {
    '18/6': { width: 1800, height: 600 },
    '16/9': { width: 1600, height: 900 },
    '4/3': { width: 1600, height: 1200 },
  }[coverRatio] || { width: 1800, height: 600 };

  const isPlaceholder = cover.src.includes('goker-bg');

  return (
    <>
      <article itemScope itemType='https://schema.org/Article' className='pb-8'>
        <header>
          <h1 className='mb-2 text-3xl font-bold text-gray-900 md:text-4xl dark:text-gray-100'>
            {post.title}
          </h1>
          <p className='mb-6 flex flex-wrap items-center gap-2 text-sm text-gray-500'>
            <DaysAgo date={publishedAt} />
            <span aria-hidden='true'>&middot;</span>
            <span>{stats.text}</span>
          </p>
          {!isPlaceholder && (
            <div className='relative'>
              <div
                className={cn(
                  'mb-8 w-full overflow-hidden rounded-lg border border-white/10',
                  `aspect-[${coverRatio}]`
                )}
              >
                <Image
                  className='h-full w-full object-cover'
                  src={cover.src}
                  alt={post.title}
                  width={width}
                  height={height}
                  decoding='async'
                  priority
                />
              </div>
            </div>
          )}
        </header>

        <div className='flex w-full items-center justify-between'>
          <ShareButtons
            url={`https://${process.env.DOMAIN}/${post.slug}`}
            title={post.title}
            description={description}
            image={cover.src}
            className='flex-wrap'
          />
        </div>

        <Markdown content={markdown} />

        {!!images?.length && images?.length > 1 && (
          <LazyMediaGallery images={images} title={post.title} />
        )}

        <footer className='mt-10 border-t border-white/10 pt-6'>
          <div className='flex flex-col gap-6'>
            <div className='flex flex-col gap-4'>
              {post.author ? (
                <Author
                  author={post.author}
                  createdAt={post.createdAt}
                  updatedAt={post.updatedAt}
                />
              ) : null}
              <Tags tags={post.tags} className='mt-4' />
              <Categories categories={post.categories} className='mt-4' />
            </div>
          </div>
        </footer>
        <ArticleJsonLd data={post} />
      </article>
    </>
  );
}
