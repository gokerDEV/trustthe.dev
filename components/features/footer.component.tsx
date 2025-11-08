import Logo from '@/components/features/logo.component';
import { footerLinks } from '@/config/navigation';
import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className='border-t-primary/8 bg-primary/6 text-muted-foreground dark:border-t-primary/4 relative border-t py-4 text-xs'>
      {/* 🔽 Fade layer */}
      <div className='from-background pointer-events-none absolute right-0 bottom-0 left-0 h-6 bg-gradient-to-t to-transparent' />

      <div className='mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 pb-12 sm:flex-row sm:px-6 sm:pb-0 lg:px-8'>
        <div className='flex items-center gap-4'>
          <Link href='/' aria-label='Home'>
            <Logo className='fill-primary -mb-2 h-6 w-auto' />
          </Link>
          <p>© {currentYear} Goker. All rights reserved.</p>
        </div>
        <nav className='flex items-center gap-6' aria-label='Footer navigation'>
          {footerLinks.map(({ text, to }, index) => (
            <a key={index} href={to} rel='noopener noreferrer'>
              {text}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
