import { useState, useEffect } from 'react';

const MINI_MODE_BREAKPOINT = 768;

/**
 * Detects "mini mode" (phone-class device) using the *smallest* viewport dimension.
 * This is rotation-stable: a phone in landscape still reports its short side (~390-430px)
 * as < 768, so we don't flip to desktop mode mid-session (which would unmount the
 * mobile route tree — e.g. a fullscreen video player rotating into landscape).
 */
function computeMiniMode(): boolean {
  if (typeof window === 'undefined') return false;
  const shortSide = Math.min(window.innerWidth, window.innerHeight);
  return shortSide < MINI_MODE_BREAKPOINT;
}

export function useMiniMode() {
  const [isMiniMode, setIsMiniMode] = useState<boolean>(computeMiniMode);

  useEffect(() => {
    const checkSize = () => setIsMiniMode(computeMiniMode());

    window.addEventListener('resize', checkSize);
    window.addEventListener('orientationchange', checkSize);

    return () => {
      window.removeEventListener('resize', checkSize);
      window.removeEventListener('orientationchange', checkSize);
    };
  }, []);

  return isMiniMode;
}
