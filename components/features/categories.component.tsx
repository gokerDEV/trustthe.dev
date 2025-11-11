import { Badge } from '@/components/ui/badge';
import { CategoryDto } from '@/kodkafa/schemas';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function Categories({
  categories,
  className,
  host = '',
}: {
  categories?: readonly CategoryDto[];
  className?: string;
  host?: string;
}) {
  return (
    <>
      {categories && categories?.length > 0 && (
        <div
          className={cn(
            'categories mt-2 flex flex-wrap gap-2 text-xs capitalize [&_a]:no-underline',
            className
          )}
        >
          {categories.map((i) => (
            <Badge key={i.id} asChild>
              <Link
                href={`${host}/${i.slug}`}
                aria-label={`View all posts in ${i.title}`}
              >
                {i.title}
              </Link>
            </Badge>
          ))}
        </div>
      )}
    </>
  );
}
