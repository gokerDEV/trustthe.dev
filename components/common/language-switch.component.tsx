'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

interface LanguageSwitchProps {
  className?: string;
}

export function LanguageSwitch({ className = '' }: LanguageSwitchProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentLang = searchParams.get('lang') === 'tr' ? 'tr' : 'en';

  const createLangUrl = (lang: 'en' | 'tr') => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('lang', lang);
    return `${pathname}?${params.toString()}`;
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      <Button
        asChild
        variant={currentLang === 'en' ? 'default' : 'outline'}
        size='sm'
      >
        <Link href={createLangUrl('en')}>EN</Link>
      </Button>
      <Button
        asChild
        variant={currentLang === 'tr' ? 'default' : 'outline'}
        size='sm'
      >
        <Link href={createLangUrl('tr')}>TR</Link>
      </Button>
    </div>
  );
}
