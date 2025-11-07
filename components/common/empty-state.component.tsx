import { Container } from '@/components/common/container.component';
import GokerIshPrompt from '@/components/features/goker-ish-propt.component';
import LogoAnimation from '@/components/features/logo-animation.component';
import { PinnedPosts } from '@/components/features/pinned-posts.component';

interface EmptyStateProps {
  title: string;
  description: string;
  footerText?: string;
}

export function EmptyState({
  title,
  description,
  footerText = 'You can consult "goker-ish" GPT for any questions.',
}: EmptyStateProps) {
  return (
    <Container className='mt-0! pt-0!'>
      <div className='flex h-screen w-full flex-col items-center gap-4 sm:justify-center'>
        <div className='flex w-full max-w-[660px] p-4'>
          <div className='-mx-2 mt-9 md:mt-2.5'>
            <LogoAnimation className='fill-primary float-left mr-4 block h-12 w-12 md:h-32 md:w-32' />
          </div>
          <div className='flex w-full flex-col items-start justify-end'>
            <div className='flex flex-row items-end justify-between gap-2'>
              <h1 className='pb-2 pl-4 text-lg font-bold'>
                Try &quot;goker-ish&quot; GPT
              </h1>
            </div>
            <GokerIshPrompt />
          </div>
        </div>
        <article className='flex flex-col items-center justify-center'>
          <div className='text-muted-foreground border-primary/8 bg-primary/6 mb-8 flex flex-col items-center justify-center rounded-lg border p-8 text-center sm:max-w-full lg:max-w-[800px]'>
            <h2 className='mb-4 text-2xl font-bold'>{title}</h2>
            <p className='text-muted-foreground mb-4 text-base'>
              {description}
            </p>
            <p className='text-muted-foreground text-sm'>{footerText}</p>
          </div>
        </article>
      </div>
      <PinnedPosts />
    </Container>
  );
}
