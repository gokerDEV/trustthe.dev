import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const TAG_FILTER = ['category', 'profile'];
export function Tags({
  tags,
  className,
  host = '',
}: {
  tags?: string[];
  className?: string;
  host?: string;
}) {
  return (
    <>
      {tags && tags?.length > 0 && (
        <div
          className={cn(
            'tags flex flex-wrap gap-2 [&_a]:no-underline',
            className
          )}
        >
          {tags
            .filter((i, index, self) => self.indexOf(i) === index)
            .filter((i) => !!i && !TAG_FILTER.includes(i.toLowerCase()))
            .map((i) => (
              <Badge key={i} variant='outline' asChild>
                <Link
                  href={`${host}/tags/${i.toLowerCase().replace(/[ \/]/g, '-')}`}
                  aria-label={`View all posts tagged with ${i}`}
                >
                  {i}
                </Link>
              </Badge>
            ))}
        </div>
      )}
    </>
  );
}
