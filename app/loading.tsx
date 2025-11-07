import { Container } from '@/components/common/container.component';
import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <Container className='mt-0! pt-0!'>
      <div className='flex h-screen w-full flex-col items-center justify-center gap-4'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' aria-hidden='true' />
        <p className='text-muted-foreground text-sm' role='status' aria-live='polite'>
          Loading...
        </p>
      </div>
    </Container>
  );
}

