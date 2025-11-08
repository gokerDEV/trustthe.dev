import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface PromptNavigationProps {
  prevHref?: string;
  nextHref?: string;
  className?: string;
}

export function PromptNavigation({
  prevHref,
  nextHref,
  className,
}: PromptNavigationProps) {
  return (
    <nav className={cn('grid h-full w-full grid-cols-5', className)}>
      {prevHref ? (
        <Link
          href={prevHref}
          className='group flex items-center'
          aria-label='Previous prompt'
        >
          <ChevronLeft className='opacity-50 transition-opacity group-hover:opacity-100 md:h-16 md:w-16 md:opacity-0' />
          <span className='md:hidden'>Previous</span>
        </Link>
      ) : (
        <div className='w-20' /> // Spacer for alignment
      )}
      <div className='col-span-3' />
      {nextHref ? (
        <Link
          href={nextHref}
          className='group flex items-center justify-end'
          aria-label='Next prompt'
        >
          <span className='md:hidden'>Next</span>
          <ChevronRight className='opacity-50 transition-opacity group-hover:opacity-100 md:h-16 md:w-16 md:opacity-0' />
        </Link>
      ) : (
        <div className='w-20' /> // Spacer for alignment
      )}
    </nav>
  );
}
