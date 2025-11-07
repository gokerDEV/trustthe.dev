import { ChevronRight, HomeIcon } from 'lucide-react';
import Link from 'next/link';
import { ReactNode } from 'react';

type Props = {
  className?: string;
  paths?: { to?: string; children?: string | ReactNode }[] | null;
};

export default function Breadcrumb({ className = '', paths = [] }: Props) {
  return (
    <ol
      className={`mb-2 flex items-center whitespace-nowrap ${className}`}
      aria-label={'Breadcrumb'}
    >
      <li className='inline-flex items-center'>
        <Link
          href='/'
          className='children-gray-500 hover:children-blue-600 focus:children-blue-600 dark:children-neutral-500 dark:hover:children-blue-500 dark:focus:children-blue-500 flex items-center focus:outline-none'
        >
          <HomeIcon className='h-4 w-4' />
        </Link>
      </li>
      {paths?.map((i, k) => (
        <li key={k} className={'children-gray-500 flex items-center'}>
          <ChevronRight className='h-4 w-4' />
          {k < paths?.length - 1 ? (
            <Link
              href={i.to || '#'}
              className='children-gray-500 hover:children-blue-600 focus:children-blue-600 dark:children-neutral-500 dark:hover:children-blue-500 dark:focus:children-blue-500 flex items-center focus:outline-none'
            >
              {i.children}
            </Link>
          ) : (
            <h2 className='children-gray-900 dark:children-white font-semibold'>
              {i.children}
            </h2>
          )}
        </li>
      ))}
    </ol>
  );
}
