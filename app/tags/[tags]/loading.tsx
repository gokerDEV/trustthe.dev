import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className='w-full max-w-full p-4 lg:p-8'>
      <div className='flex min-h-[400px] items-center justify-center'>
        <div className='flex flex-col items-center gap-4'>
          <Loader2 className='h-8 w-8 animate-spin text-primary' aria-hidden='true' />
          <p className='text-muted-foreground text-sm' role='status' aria-live='polite'>
            Loading posts...
          </p>
        </div>
      </div>
    </div>
  );
}

