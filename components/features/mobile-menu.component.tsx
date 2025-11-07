'use client';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { MenuIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

type Props = {
  navigation: {
    text: string;
    to: string;
    icon?: string;
  }[];
};

export default function MobileMenu({ navigation }: Props) {
  const [open, setOpen] = useState(false);

  const handleClose = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className='bg-background/80 hover:bg-muted relative ml-2 inline-flex h-8 w-8 items-center justify-center rounded-md border p-1 lg:hidden'
          aria-label='Open menu'
        >
          <MenuIcon className='h-4 w-4' />
        </Button>
      </SheetTrigger>
      <SheetContent
        side='left'
        className={cn(
          'w-[300px] sm:w-[400px]',
          'transition-transform duration-300 ease-in-out', // smooth open/close
          'bg-background/70 dark:bg-background/50 border-r shadow-lg backdrop-blur-sm'
        )}
      >
        <SheetTitle className='px-4 py-3 text-sm font-extralight tracking-wide text-gray-500 uppercase'>
          Menu
        </SheetTitle>

        <nav aria-label='Mobile navigation' className='px-2'>
          <ul className='flex flex-col gap-1'>
            {navigation.map(({ text, to, icon }, index) => (
              <li key={index}>
                <Link
                  href={to}
                  onClick={handleClose}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium',
                    'hover:bg-accent hover:text-accent-foreground bg-muted/80 transition-colors'
                  )}
                  aria-label={`Navigate to ${text}`}
                >
                  {icon && <i className={icon} aria-hidden='true' />}
                  <span>{text}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
