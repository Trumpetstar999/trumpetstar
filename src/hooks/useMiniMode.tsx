import { useState, useEffect } from 'react';

const PHONE_SHORT_SIDE_MAX = 600;
const PHONE_LONG_SIDE_MAX = 950;

/**
 * Detects "mini mode" (phone-class device ONLY — never tablets).
 *
 * Rules:
 * 1. Desktops/laptops (fine pointer = mouse/trackpad) → never mini-mode.
 * 2. Tablets (iPad incl. Mini) → never mini-mode. iPad Mini long side = 1133,
 *    full iPad ≥ 1180. Phones max out around 932 (iPhone Pro Max), so a
 *    combined short<600 AND long<950 check cleanly isolates phones.
 * 3. Uses screen.width/height instead of innerWidth/innerHeight so the result
 *    is stable across orientation changes, browser chrome resizes, iPad
 *    split-view, and on-screen keyboards — preventing the mobile/desktop
 *    flicker the user reported on iPad.
 */
function computeMiniMode(): boolean {
  if (typeof window === 'undefined') return false;

  const hasFinePointer = window.matchMedia?.('(pointer: fine)').matches ?? false;
  if (hasFinePointer) return false;

  const w = window.screen?.width ?? window.innerWidth;
  const h = window.screen?.height ?? window.innerHeight;
  const shortSide = Math.min(w, h);
  const longSide = Math.max(w, h);

  return shortSide < PHONE_SHORT_SIDE_MAX && longSide < PHONE_LONG_SIDE_MAX;
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
