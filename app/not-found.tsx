import { Container } from '@/components/common/container.component';
import GokerIshPrompt from '@/components/features/goker-ish-propt.component';
import LogoAnimation from '@/components/features/logo-animation.component';

export const revalidate = 2592000;

export async function generateMetadata() {
  return {
    robots: 'noindex',
  };
}

const Page = async () => {
  return (
    <Container>
      <div className='flex h-full w-full flex-col items-center gap-4 sm:justify-center'>
        <h1 className='text-lg font-semibold uppercase'> - 404 Not Found - </h1>
        <p
          className='text-muted-foreground text-sm font-light'
          style={{ maxWidth: 660 }}
        >
          Upps, the page you are looking for does not exist. Try to ask
          &quot;goker-ish&quot;
        </p>
        <div className='flex w-full max-w-[660px] p-4'>
          <div className='-mx-4 mt-8 flex space-x-2 sm:mt-2.5'>
            <LogoAnimation className='fill-foreground float-left mr-4 block h-12 w-12 md:h-32 md:w-32' />
          </div>
          <div className='flex w-full flex-col items-start justify-end'>
            <div className='flex flex-row items-end justify-between gap-2'>
              <h2 className='pb-2 pl-4 text-lg font-bold'>
                Try &quot;goker-ish&quot; GPT
              </h2>
            </div>
            <GokerIshPrompt prompt={`hei ish, I'm looking for `} />
          </div>
        </div>
      </div>
    </Container>
  );
};

export default Page;
