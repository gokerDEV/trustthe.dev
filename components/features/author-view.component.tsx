import DaysAgo from '@/components/common/days-ago.component';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';

interface CoverImage {
  src: string;
  altText?: string;
}

interface AuthorViewProps {
  authorName: string;
  displayTitle: string;
  authorHref: string;
  cover: CoverImage | null;
  initials: string;
  publishedAt: string;
  hasAuthorPost: boolean;
}

/**
 * Pure presentational component for Author display
 * Contains only HTML structure and styling - no data fetching or business logic
 * Reusable by both server-side (Author) and client-side (AuthorClient) components
 */
export function AuthorView({
  authorName,
  displayTitle,
  authorHref,
  cover,
  initials,
  publishedAt,
  hasAuthorPost,
}: AuthorViewProps) {
  return (
    <div
      className='author mt-6 flex w-full items-center gap-3'
      data-author={displayTitle}
      data-author-original-name={authorName}
      data-role='creator'
      aria-label={`Author block: Created by ${displayTitle}`}
    >
      {hasAuthorPost ? (
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
          {hasAuthorPost ? (
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
        <div className='text-muted-foreground text-sm'>
          <DaysAgo date={publishedAt} />
        </div>
      </div>
    </div>
  );
}
