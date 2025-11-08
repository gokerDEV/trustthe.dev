'use client';

import { Container } from '@/components/common/container.component';
import GokerIshPrompt from '@/components/features/goker-ish-propt.component';
import LogoAnimation from '@/components/features/logo-animation.component';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [prompt, setPrompt] = useState<string>();
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error(error);
    }
    const url = new URL(window.location.href);
    // Use setTimeout to avoid synchronous setState in effect
    setTimeout(() => {
      setPrompt(`hei ish, report the error about ${url.host} 
Message: ${error.message}
Digest: ${error.digest}
URL: ${window.location.href}
    `);
    }, 0);
  }, [error]);

  return (
    <Container>
      <div className='flex h-full w-full flex-col items-center gap-4 sm:justify-center'>
        <h1 className='text-2xl font-bold'>Something Went Wrong!</h1>
        <p className='text-muted-foreground text-center'>
          We encountered an unexpected error. Don&apos;t worry, you can try
          again or ask &quot;goker-ish&quot; for help.
        </p>

        <Button onClick={() => reset()} variant='outline'>
          Try Again
        </Button>

        <div className='flex w-full max-w-[660px] p-4'>
          <div className='-mx-4 mt-8 flex space-x-2 sm:mt-2.5'>
            <LogoAnimation className='fill-foreground float-left mr-4 block h-12 w-12 md:h-32 md:w-32' />
          </div>
          <div className='flex w-full flex-col items-start justify-end'>
            <div className='flex flex-row items-end justify-between gap-2'>
              <h2 className='pb-2 pl-4 text-lg font-bold'>
                Need help? Ask &quot;goker-ish&quot; GPT
              </h2>
            </div>
            <GokerIshPrompt prompt={prompt} />
          </div>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className='bg-destructive/10 mt-4 max-w-[660px] rounded-md p-4'>
            <div className='text-destructive font-mono text-sm'>
              <p>
                <strong>Error:</strong> {error.message}
              </p>
              {error.digest && (
                <p className='mt-2'>
                  <strong>Digest:</strong> {error.digest}
                </p>
              )}
              {error.name && (
                <p className='mt-2'>
                  <strong>Name:</strong> {error.name}
                </p>
              )}
              {error.stack && (
                <details className='mt-2'>
                  <summary className='cursor-pointer text-xs'>
                    Stack Trace
                  </summary>
                  <pre className='mt-2 max-h-60 overflow-auto text-xs wrap-break-word whitespace-pre-wrap'>
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        )}
      </div>
    </Container>
  );
}
