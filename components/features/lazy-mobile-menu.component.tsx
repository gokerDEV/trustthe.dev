'use client';

import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';

const LazyMenu = dynamic(() => import('./mobile-menu.component'), {
  ssr: false,
  loading: () => (
    <button
      aria-label='Loading Menu'
      className='bg-background hover:bg-muted relative ml-2 inline-flex h-8 w-8 items-center justify-center rounded-md border p-1 shadow lg:hidden'
    >
      <Loader2 className='h-4 w-4 animate-spin' />
    </button>
  ),
});

export function LazyMobileMenu({
  navigation,
}: {
  navigation: {
    text: string;
    to: string;
    icon?: string;
  }[];
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
    <div ref={ref}>{show ? <LazyMenu navigation={navigation} /> : null}</div>
  );
}
