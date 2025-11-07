'use client';

import { usePathname } from 'next/navigation';
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

interface NavigationContextType {
  loadingHref: string | null;
  setLoadingHrefOptimistic: (href: string) => void;
}

const NavigationContext = createContext<NavigationContextType>({
  loadingHref: null,
  setLoadingHrefOptimistic: () => {},
});

export const NavigationProvider = ({ children }: { children: ReactNode }) => {
  const [loadingHref, setLoadingHref] = useState<string | null>(null);
  const pathname = usePathname();
  useEffect(() => {
    // Use setTimeout to avoid synchronous setState in effect
    setTimeout(() => {
      setLoadingHref(null);
    }, 0);
  }, [pathname]);
  const setLoadingHrefOptimistic = (href: string) => {
    if (href !== pathname) {
      setLoadingHref(href);
    }
  };

  return (
    <NavigationContext.Provider
      value={{ loadingHref, setLoadingHrefOptimistic }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigationLoading = () => useContext(NavigationContext);
