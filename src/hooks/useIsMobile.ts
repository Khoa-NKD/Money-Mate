import { useState, useEffect } from 'react';

/**
 * Hook kiểm tra màn hình hiện tại có nhỏ hơn breakpoint (mặc định 640px) hay không
 */
export function useIsMobile(breakpoint = 640): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < breakpoint;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const update = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
    };

    update(mql);

    mql.addEventListener('change', update);
    return () => {
      mql.removeEventListener('change', update);
    };
  }, [breakpoint]);

  return isMobile;
}
