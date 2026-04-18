import { useEffect, useRef } from 'react';
import trumpetstarLogo from '@/assets/trumpetstar-logo.webp';
import { cn } from '@/lib/utils';

interface TrumpetstarLoaderProps {
  /** Show tagline below the loader */
  showTagline?: boolean;
  /** Custom tagline override */
  tagline?: React.ReactNode;
  /** Fullscreen background gradient (default true) */
  fullscreen?: boolean;
  /** Custom className for the outer wrapper */
  className?: string;
  /** Logo size in px (default 168) */
  logoSize?: number;
}

/**
 * Animated brand loader with whirling rings, ticks, orbiting dots
 * and a breathing logo plate. CSS-only — no canvas/topology fetching.
 *
 * Use as the global "boot" loading indicator (auth check, route guards,
 * heavy page hydration). Honors prefers-reduced-motion.
 */
export function TrumpetstarLoader({
  showTagline = true,
  tagline,
  fullscreen = true,
  className,
  logoSize = 168,
}: TrumpetstarLoaderProps) {
  const ticksRef = useRef<HTMLDivElement | null>(null);

  // Build the rotating tick marks once
  useEffect(() => {
    const el = ticksRef.current;
    if (!el || el.childElementCount > 0) return;
    const N = 60;
    for (let i = 0; i < N; i++) {
      const s = document.createElement('span');
      const angle = (360 / N) * i;
      s.style.transform = `translate(-50%,0) rotate(${angle}deg)`;
      s.style.height = i % 5 === 0 ? '14px' : '6px';
      s.style.opacity = i % 5 === 0 ? '0.9' : '0.35';
      el.appendChild(s);
    }
  }, []);

  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        'ts-loader-stage',
        fullscreen && 'ts-loader-fullscreen',
        className,
      )}
    >
      <div className="ts-loader-stack">
        <div className="ts-loader" aria-hidden="true">
          {/* Whirl layers */}
          <div className="ts-whirl">
            <div className="ts-whirl-sweep ts-slow" />
            <div className="ts-whirl-sweep" />

            <div className="ts-ring ts-r3" />
            <div className="ts-ring ts-r2" />
            <div className="ts-ring ts-r1">
              <svg viewBox="-50 -50 100 100" preserveAspectRatio="xMidYMid meet">
                <circle
                  className="ts-arc"
                  cx="0"
                  cy="0"
                  r="48"
                  strokeWidth="0.6"
                  strokeDasharray="60 240"
                  strokeOpacity="0.9"
                />
                <circle
                  className="ts-arc"
                  cx="0"
                  cy="0"
                  r="48"
                  strokeWidth="0.6"
                  strokeDasharray="20 280"
                  strokeDashoffset="-120"
                  strokeOpacity="0.5"
                />
              </svg>
            </div>

            <div className="ts-ring ts-r4">
              <svg viewBox="-50 -50 100 100" preserveAspectRatio="xMidYMid meet">
                <circle
                  className="ts-arc"
                  cx="0"
                  cy="0"
                  r="48"
                  strokeWidth="0.8"
                  strokeDasharray="4 12"
                  strokeOpacity="0.9"
                />
              </svg>
            </div>

            <div className="ts-orbit">
              <span className="ts-dot" style={{ transform: 'rotate(10deg) translate(calc(33vmin * 0.55)) translate(-50%,-50%)' }} />
              <span className="ts-dot ts-sm" style={{ transform: 'rotate(95deg) translate(calc(33vmin * 0.55)) translate(-50%,-50%)' }} />
              <span className="ts-dot ts-sm" style={{ transform: 'rotate(190deg) translate(calc(33vmin * 0.55)) translate(-50%,-50%)' }} />
              <span className="ts-dot ts-sm" style={{ transform: 'rotate(270deg) translate(calc(33vmin * 0.55)) translate(-50%,-50%)' }} />
            </div>

            <div className="ts-ticks" ref={ticksRef} />
          </div>

          {/* Centered logo */}
          <div
            className="ts-logo-plate"
            style={{ width: logoSize, height: logoSize }}
          >
            <img
              src={trumpetstarLogo}
              alt=""
              draggable={false}
              style={{ width: logoSize, height: logoSize }}
            />
          </div>
        </div>

        {showTagline && (
          <p className="ts-tagline" aria-live="polite">
            {tagline ?? (
              <>
                <span>Let's&nbsp;Trumpet</span>
                <span className="ts-accent">the&nbsp;World</span>
                <span>together.</span>
              </>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
