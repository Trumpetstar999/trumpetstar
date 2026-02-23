import { useState, useEffect } from 'react';

const MINI_MODE_BREAKPOINT = 900;

export function useMiniMode() {
  const [isMiniMode, setIsMiniMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < MINI_MODE_BREAKPOINT;
  });

  useEffect(() => {
    const checkWidth = () => {
      setIsMiniMode(window.innerWidth < MINI_MODE_BREAKPOINT);
    };

    const mql = window.matchMedia(`(max-width: ${MINI_MODE_BREAKPOINT - 1}px)`);
    mql.addEventListener('change', checkWidth);
    
    // Also listen for resize (covers rotation)
    window.addEventListener('resize', checkWidth);
    
    return () => {
      mql.removeEventListener('change', checkWidth);
      window.removeEventListener('resize', checkWidth);
    };
  }, []);

  return isMiniMode;
}
