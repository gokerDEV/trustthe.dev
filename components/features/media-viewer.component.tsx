'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { XIcon } from 'lucide-react';
import Image from 'next/image';
export function MediaViewer({
  open,
  onClose,
  media,
}: {
  open: boolean;
  onClose: () => void;
  media: { src: string; alt?: string };
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className='fixed inset-0 z-50 bg-black/60' />
        <Dialog.Content className='fixed top-1/2 left-1/2 z-50 w-full max-w-6xl -translate-x-1/2 -translate-y-1/2 p-4 outline-none'>
          <div className='bg-background rounded-md p-4 shadow-lg sm:p-6'>
            <Dialog.Title className='mr-10 mb-2 text-lg leading-tight font-bold'>
              {media.alt || ''}
            </Dialog.Title>
            <Image
              src={media.src}
              alt={media.alt || 'Media'}
              width={1600}
              height={1600}
              className='h-auto w-full'
            />
            <Dialog.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 m-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
              <XIcon />
              <span className='sr-only'>Close</span>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
