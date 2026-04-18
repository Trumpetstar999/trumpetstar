import { useState, useEffect } from 'react';

const MINI_MODE_BREAKPOINT = 768;

/**
 * Detects "mini mode" (phone-class device).
 *
 * Rules:
 * 1. Desktops/laptops (fine pointer = mouse/trackpad) are NEVER mini-mode,
 *    regardless of window size — resizing a Mac browser window must not flip
 *    the app into the mobile layout.
 * 2. Touch devices use the smallest viewport dimension so a phone in landscape
 *    (short side ~390-430px) stays in mobile mode and the route tree is not
 *    unmounted mid-session (e.g. fullscreen video rotation).
 */
function computeMiniMode(): boolean {
  if (typeof window === 'undefined') return false;

  // Desktop pointer (mouse/trackpad) → always desktop UI
  const hasFinePointer = window.matchMedia?.('(pointer: fine)').matches ?? false;
  if (hasFinePointer) return false;

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
