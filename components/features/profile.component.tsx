import type { PostDto } from '@/api/client/schemas';
import { Markdown } from '@/components/common/markdown.component';
import { PROFILES } from '@/config/constants';
import { getImages } from '@/lib/image.utils';
import { parseMarkdown } from '@/lib/markdown';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { PersonJsonLd } from './json-ld.component';

import '@/styles/fontello/css/fontello.css';

export default async function Profile({ post }: { post: PostDto }) {
  if (!post?.slug) notFound();

  const { cover } = getImages(post);
  const markdown = parseMarkdown(post?.content || '');

  return (
    <>
      <article
        itemScope
        itemType='https://schema.org/ProfilePage'
        className='grid grid-cols-1 gap-8 lg:grid-cols-3'
      >
        <figure className='flex items-start justify-center'>
          <div className='border-foreground/10 aspect-square w-full max-w-[300px] rounded-full border-4 shadow-sm'>
            <Image
              className='h-full w-full rounded-full object-cover object-center'
              src={cover.src}
              alt={`Profile picture of ${post.title}`}
              width={300}
              height={300}
              loading='lazy'
              decoding='async'
            />
          </div>
        </figure>

        <div className='lg:col-span-2'>
          <header>
            <h1
              className='mb-4 text-3xl font-bold text-gray-900 dark:text-gray-100'
              itemProp='name'
            >
              {post.title}
            </h1>
          </header>
          <section className='text-neutral-800 dark:text-neutral-200 [&_article>p]:py-1.5'>
            <Markdown content={markdown} />
          </section>
          <div className='mt-10 flex flex-wrap items-center justify-center rounded-xl bg-gray-200 py-2 text-3xl md:text-2xl dark:bg-white/5'>
            {Object.entries(PROFILES).map(([k, v]) => (
              <a
                key={`link-key-${k}`}
                href={`${v}`}
                aria-labelledby={`goker on ${k}`}
                title={`goker on ${k}`}
                className='m-1 flex h-12 w-12 cursor-pointer items-center justify-center p-1 leading-10 transition-all hover:text-4xl hover:text-black/90 dark:hover:text-white/90'
              >
                <i className={`icon-${k}`} />
              </a>
            ))}
          </div>
        </div>
        <PersonJsonLd data={post} />
      </article>
    </>
  );
}
