import type { HTMLAttributes, ReactElement } from 'react';

type Props = HTMLAttributes<HTMLTimeElement> & {
  date: string;
  className?: string;
};

export default function DaysAgo({
  className = '',
  date = '',
  ...props
}: Props): ReactElement {
  // Calculate days difference server-side (SEO-friendly)
  const ms = Date.parse(date);
  const parsedDate = ms && !isNaN(ms) ? new Date(ms) : new Date();

  // Calculate days on server - no client-side JavaScript needed
  // eslint-disable-next-line react-hooks/purity -- Server component, Date.now() is safe here
  const now = Date.now();
  const days = ms && !isNaN(ms) ? ((now - ms) / 86400000) >> 0 : 0;
  const displayText = days ? `${days} days ago` : 'today';

  return (
    <time
      {...props}
      className={`${className}`}
      title={parsedDate.toISOString()}
      dateTime={date}
    >
      {displayText}
    </time>
  );
}
