'use client';

import type { PostDto } from '@/api/client/schemas';
import { Expand } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useState } from 'react';

const GalleryMode = dynamic(
  () => import('./gallery-mode.component').then((mod) => mod.GalleryMode),
  {
    loading: () => <div className='fixed inset-0 z-50 bg-black/90' />,
  }
);

interface GalleryModeWrapperProps {
  note: PostDto;
}

export function GalleryModeWrapper({ note }: GalleryModeWrapperProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className='absolute top-4 right-4 z-10 rounded-lg bg-black/50 p-2 text-white/80 backdrop-blur-sm transition-colors hover:bg-black/70 hover:text-white'
      >
        <Expand className='h-5 w-5' />
      </button>

      {isOpen && <GalleryMode note={note} onClose={() => setIsOpen(false)} />}
    </>
  );
}
