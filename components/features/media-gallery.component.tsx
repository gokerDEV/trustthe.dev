'use client';

import Image from 'next/image';
import { useState } from 'react';
import { MediaViewer } from './media-viewer.component'; // dialog component

type Media = {
  id: string;
  src: string;
  altText?: string;
};

export default function Component({
  images,
  title,
}: {
  images: Media[];
  title: string;
}) {
  const [selected, setSelected] = useState<null | Media>(null);

  return (
    <>
      <div className='grid grid-cols-1 gap-4 py-5 pl-0 sm:grid-cols-2 lg:grid-cols-3'>
        {images.map(
          (i, k) =>
            k > 0 && (
              <button
                key={i.id}
                className='aspect-[3/2] w-full cursor-pointer overflow-hidden rounded-md shadow-sm'
                onClick={() => setSelected(i)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setSelected(i);
                  }
                }}
              >
                <Image
                  className='h-full w-full object-cover'
                  src={i.src}
                  alt={i.altText || title}
                  width={360}
                  height={240}
                  quality={75}
                  loading='lazy'
                  decoding='async'
                  sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
                />
              </button>
            )
        )}
      </div>

      {selected && (
        <MediaViewer
          open={!!selected}
          media={{ src: selected.src, alt: selected.altText || title }}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
