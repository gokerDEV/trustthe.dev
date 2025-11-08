import DaysAgo from '@/components/common/days-ago.component';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';

interface AuthorViewProps {
  authorName: string;
  displayTitle: string;
  authorHref: string | null;
  cover: {
    src: string;
    altText?: string;
  };
  initials: string;
  createdAt: string;
  updatedAt: string;
}

export function AuthorView({
  authorName,
  displayTitle,
  authorHref,
  cover,
  initials,
  createdAt,
  updatedAt,
}: AuthorViewProps) {
  return (
    <div
      className='author mt-6 flex w-full items-center gap-3'
      data-author={displayTitle}
      data-author-original-name={authorName}
      data-role='creator'
      aria-label={`Author block: Created by ${displayTitle}`}
    >
      {authorHref ? (
        <Link href={authorHref} aria-label={`Visit profile of ${displayTitle}`}>
          <Avatar className='h-10 w-10'>
            <AvatarImage
              src={cover?.src}
              alt={cover?.altText || displayTitle}
            />
            <AvatarFallback className='text-xl font-semibold'>
              {initials}
            </AvatarFallback>
          </Avatar>
        </Link>
      ) : (
        <Avatar className='h-10 w-10'>
          <AvatarFallback className='text-xl font-semibold'>
            {initials}
          </AvatarFallback>
        </Avatar>
      )}
      <div className='grow'>
        <p className='text-sm font-medium text-gray-900 dark:text-gray-200'>
          {authorHref ? (
            <Link href={authorHref} className='hover:underline'>
              Created by{' '}
              <strong className='tracking-wide'>{displayTitle}</strong>
            </Link>
          ) : (
            <>
              Created by{' '}
              <strong className='tracking-wide'>{displayTitle}</strong>
            </>
          )}
        </p>
        <div className='text-muted-foreground flex items-center gap-2 text-sm'>
          <DaysAgo date={createdAt} />
          {createdAt !== updatedAt && (
            <>
              <span className='-ml-1'>·</span>
              <span className='italic'>
                (Updated <DaysAgo date={updatedAt} />)
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
