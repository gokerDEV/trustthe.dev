'use client';

import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';

// Dinamik yükleme – SSR olmadan sadece client
const LazyGallery = dynamic(
  () => import('@/components/features/media-gallery.component'),
  {
    ssr: false,
    loading: () => (
      <div className='flex items-center justify-center'>
        <Loader2 className='h-4 w-4 animate-spin' />
      </div>
    ),
  }
);

export function LazyMediaGallery({
  images,
  title,
}: {
  images: { id: string; src: string; altText?: string }[];
  title: string;
}) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const [show, setShow] = useState(false);

  useEffect(() => {
    if (inView) {
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => {
        setShow(true);
      }, 0);
    }
  }, [inView]);

  return (
    <div ref={ref}>
      {show ? <LazyGallery images={images} title={title} /> : null}
    </div>
  );
}
