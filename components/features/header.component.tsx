import NavLink from '@/components/common/navlink.component';
import ThemeSwitcher from '@/components/common/theme-switcher';
import { LazyMobileMenu } from '@/components/features/lazy-mobile-menu.component';
import Logo from '@/components/features/logo.component';
import { NavigationProvider } from '@/contexts/navigation.context';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type Props = {
  className?: string;
  navigation: {
    text: string;
    to: string;
    icon?: string;
  }[];
};

export default function Header({ className = '', navigation }: Props) {
  return (
    <header
      className={cn(
        'sticky top-0 z-50 flex w-full shrink-0 flex-wrap lg:flex-nowrap lg:justify-center',
        'border-b-primary/8 dark:border-b-primary/2 border-b',
        'text-sm',
        'py-1 md:py-2 lg:py-4',
        'bg-primary/8 backdrop-blur-md backdrop-saturate-150',
        className
      )}
    >
      <NavigationProvider>
        <nav
          className='relative h-full w-full items-center justify-between md:flex'
          aria-label='Global navigation'
        >
          <div className='relative z-40 flex items-center justify-between px-4 py-2 md:py-0'>
            <Link className='flex' href='/' aria-label='Home'>
              <Logo className='fill-primary h-10 w-auto' />
            </Link>
            <div className='flex items-center gap-2 md:hidden'>
              <ThemeSwitcher />
              <LazyMobileMenu navigation={navigation} />
            </div>
          </div>
          <div className='hidden w-full items-center justify-between gap-4 px-4 md:flex'>
            <div className='flex items-center gap-4'>
              {navigation.map(({ text, to, icon }, index) => (
                <NavLink key={index} href={to}>
                  {icon && <i className={icon} />}
                  {text}
                </NavLink>
              ))}
            </div>
            <ThemeSwitcher />
          </div>
        </nav>
      </NavigationProvider>
    </header>
  );
}
