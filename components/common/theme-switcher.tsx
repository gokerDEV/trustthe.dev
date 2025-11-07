'use client';

import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { ChangeEvent, Suspense, useEffect, useRef, useState } from 'react';

// Lazy load ThemeCustomizerButton
const ThemeCustomizerButton = dynamic(() => import('./theme-customizer'), {
  ssr: false,
  loading: () => (
    <button
      aria-label='Loading theme cutomization'
      className='bg-background hover:bg-muted relative ml-2 inline-flex h-8 w-8 items-center justify-center rounded-md border p-1 lg:hidden'
    >
      <Loader2 className='h-4 w-4 animate-spin' />
    </button>
  ),
});

export default function ThemeSwitcher() {
  const ref = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const theme =
      localStorage.getItem('theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light');

    const isDarkMode = theme === 'dark';
    document.documentElement.classList.toggle('dark', isDarkMode);
    // Use setTimeout to avoid synchronous setState in effect
    setTimeout(() => {
      setIsDark(isDarkMode);
      setMounted(true);
    }, 0);
  }, []);

  const handleTheme = (e: ChangeEvent<HTMLInputElement>) => {
    const isDarkMode = e.currentTarget.checked;
    setIsDark(isDarkMode);
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');

    // Dispatch theme change event
    window.dispatchEvent(
      new CustomEvent('themeChange', {
        detail: { theme: isDarkMode ? 'dark' : 'light' },
      })
    );
  };

  if (!mounted) return null;

  return (
    <div className='flex items-center justify-center space-x-2'>
      <Suspense fallback={null}>
        <ThemeCustomizerButton />
      </Suspense>
      <input
        name='theme-switcher'
        aria-label='Theme switcher'
        ref={ref}
        type='checkbox'
        checked={isDark}
        onChange={handleTheme}
        className='dark:bg-muted/90 dark:hover:bg-muted dark:focus:bg-muted relative flex h-7 w-[3.2rem] shrink-0 cursor-pointer appearance-none items-center rounded-full !border-none bg-amber-100/90 shadow-xs !ring-0 !ring-offset-0 transition-all duration-200 ease-in-out !outline-none before:ml-0.5 before:inline-block before:h-6 before:w-6 before:translate-x-0 before:transform before:rounded-full before:bg-amber-50 before:bg-[url("data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIj8+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCI+Cgk8cGF0aCBmaWxsPSIjZmNkMzRkIiBkPSJNNS45IDUuMWMwIC4zLjEuNi4zLjlsMS40IDEuNC45LS44LTIuMi0yLjJjLS4zLjEtLjQuNC0uNC43em0uNSA1LjNIMy4yYzAgLjMuMS42LjQuOS4zLjMuNS40LjguNGgydi0xLjN6bTYuMi01VjIuMmMtLjMgMC0uNi4xLS45LjQtLjMuMy0uNC41LS40Ljh2MmgxLjN6TTYuMiAxNy4xYy4zIDAgLjYtLjEuOC0uM2wxLjQtMS40LS44LS44LTIuMiAyLjJjLjIuMi41LjMuOC4zek0xNy44IDQuOWMtLjMgMC0uNi4xLS44LjNsLTEuNCAxLjQuOC45IDIuMi0yLjNjLS4yLS4yLS41LS4zLS44LS4zem0tNS4yIDExLjdoLTEuMnYzLjJjLjMgMCAuNi0uMS45LS40LjMtLjMuNC0uNS40LS44bC0uMS0yem03LTYuMmgtMnYxLjJoMy4yYzAtLjMtLjEtLjYtLjQtLjktLjMtLjMtLjUtLjMtLjgtLjN6TTE3LjggMTZsLTEuNC0xLjQtLjguOCAyLjIgMi4yYy4yLS4yLjMtLjUuMy0uOCAwLS4zLS4xLS42LS4zLS44eiIvPgoJPGNpcmNsZSBmaWxsPSIjZmNkMzRkIiBjeD0iMTIiIGN5PSIxMSIgcj0iNCIgdHJhbnNmb3JtPSJtYXRyaXgoLTEgMCAwIDEgMjQgMCkiLz4KPC9zdmc+Cg==")] before:bg-center before:bg-no-repeat before:shadow before:ring-0 before:transition before:duration-200 before:ease-in-out checked:bg-zinc-600 checked:bg-none checked:before:translate-x-full checked:before:bg-zinc-900 checked:before:bg-[url("data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCI+DQogIDxwYXRoIGZpbGw9IiNmZWYzYzciIGQ9Ik0xNy4zOSAxNS4xNEE3LjMzIDcuMzMgMCAwIDEgMTEuNzUgMS42Yy4yMy0uMTEuNTYtLjIzLjc5LS4zNGE4LjE5IDguMTkgMCAwIDAtNS40MS40NSA5IDkgMCAxIDAgNyAxNi41OCA4LjQyIDguNDIgMCAwIDAgNC4yOS0zLjg0IDUuMyA1LjMgMCAwIDEtMS4wMy42OXoiLz4NCjwvc3ZnPg0K")] focus:border-none focus:ring-0 focus:outline-none'
      />
    </div>
  );
}
