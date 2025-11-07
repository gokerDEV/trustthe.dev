'use client';

import { useNavigationLoading } from '@/contexts/navigation.context';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ComponentPropsWithoutRef,
  ReactNode,
  useCallback,
  useMemo,
} from 'react';

type NavLinkProps = Omit<ComponentPropsWithoutRef<typeof Link>, 'onClick'> & {
  children: ReactNode;
  href: string;
  activeClassName?: string;
  loadingClassName?: string;
  className?: string;
};

const NavLink = ({
  children,
  href,
  activeClassName = 'font-semibold text-primary',
  loadingClassName = 'text-primary loading-glow',
  className = 'text-primary/70 hover:text-primary text-sm font-semibold transition-colors',
  ...props
}: NavLinkProps) => {
  const pathname = usePathname();
  const { loadingHref, setLoadingHrefOptimistic } = useNavigationLoading();

  const isActive = pathname === href;
  const isLoading = loadingHref === href;

  const handleClick = useCallback(() => {
    setLoadingHrefOptimistic(href);
  }, [href, setLoadingHrefOptimistic]);

  const linkClassName = useMemo(() => {
    return cn(
      className,
      isLoading && !isActive
        ? loadingClassName
        : isActive
          ? activeClassName
          : ''
    );
  }, [className, isLoading, isActive, loadingClassName, activeClassName]);

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={linkClassName}
      aria-current={isActive ? 'page' : undefined}
      {...props}
    >
      {children}
    </Link>
  );
};

export default NavLink;
