import { useEffect, useRef, useState } from 'react';
import { geoOrthographic, geoPath, geoGraticule10 } from 'd3-geo';
import { feature, mesh } from 'topojson-client';
import type { FeatureCollection, MultiLineString } from 'geojson';
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
  /** Visual size of the centered globe in px (default 200) */
  logoSize?: number;
}

// Module-level cache so the world atlas is only fetched & parsed once.
let worldCache: {
  countries: FeatureCollection;
  borders: MultiLineString;
} | null = null;
let worldPromise: Promise<typeof worldCache> | null = null;

async function loadWorld(): Promise<typeof worldCache> {
  if (worldCache) return worldCache;
  if (worldPromise) return worldPromise;
  worldPromise = (async () => {
    const urls = [
      'https://unpkg.com/world-atlas@2.0.2/countries-110m.json',
      'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json',
    ];
    for (const url of urls) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const topo: any = await res.json();
        const countries = feature(topo, topo.objects.countries) as unknown as FeatureCollection;
        const borders = mesh(topo, topo.objects.countries, (a: any, b: any) => a !== b) as MultiLineString;
        worldCache = { countries, borders };
        return worldCache;
      } catch {
        /* try next */
      }
    }
    return null;
  })();
  return worldPromise;
}

/**
 * Animated brand loader: a slowly rotating wireframe-style globe surrounded
 * by whirling rings, ticks and orbiting dots. CSS-only chrome + Canvas globe.
 *
 * Use as the global "boot" loading indicator (auth check, route guards,
 * heavy page hydration). Honors prefers-reduced-motion.
 */
export function TrumpetstarLoader({
  showTagline = true,
  tagline,
  fullscreen = true,
  className,
  logoSize = 200,
}: TrumpetstarLoaderProps) {
  const ticksRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [worldReady, setWorldReady] = useState(!!worldCache);

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

  // Lazy-load world topology
  useEffect(() => {
    let mounted = true;
    loadWorld().then((w) => {
      if (mounted && w) setWorldReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Globe render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const cssSize = logoSize;
    const pxSize = Math.round(cssSize * dpr);
    canvas.width = pxSize;
    canvas.height = pxSize;
    canvas.style.width = `${cssSize}px`;
    canvas.style.height = `${cssSize}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const projection = geoOrthographic()
      .translate([pxSize / 2, pxSize / 2])
      .scale(pxSize * 0.46)
      .clipAngle(90);

    const path = geoPath(projection, ctx);
    const graticule = geoGraticule10();

    let lambda = 0;
    const baseSpinDegPerSec = 12;
    let lastT = performance.now();
    let raf = 0;

    const draw = () => {
      const w = pxSize;
      const cx = w / 2;
      const cy = w / 2;
      const r = projection.scale();

      ctx.clearRect(0, 0, w, w);

      // Sphere fill (subtle dark disc for contrast)
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      const sphereGrad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
      sphereGrad.addColorStop(0, 'rgba(255,255,255,0.10)');
      sphereGrad.addColorStop(0.55, 'rgba(255,255,255,0.03)');
      sphereGrad.addColorStop(1, 'rgba(0,0,0,0.25)');
      ctx.fillStyle = sphereGrad;
      ctx.fill();

      // Graticule
      ctx.beginPath();
      path(graticule);
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Countries
      if (worldCache) {
        ctx.beginPath();
        path(worldCache.countries);
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fill();

        ctx.beginPath();
        path(worldCache.borders);
        ctx.strokeStyle = 'rgba(14,79,174,0.65)';
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }

      // Sphere outer rim
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Specular highlight
      const hl = ctx.createRadialGradient(
        cx - r * 0.45,
        cy - r * 0.5,
        r * 0.05,
        cx - r * 0.2,
        cy - r * 0.2,
        r * 0.9,
      );
      hl.addColorStop(0, 'rgba(255,255,255,0.22)');
      hl.addColorStop(0.4, 'rgba(255,255,255,0.04)');
      hl.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = hl;
      ctx.fill();
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;
      lambda += baseSpinDegPerSec * dt;
      if (lambda > 360) lambda -= 360;
      projection.rotate([lambda, -20, 0]);
      draw();
      raf = requestAnimationFrame(tick);
    };

    if (reduced) {
      projection.rotate([0, -20, 0]);
      draw();
    } else {
      raf = requestAnimationFrame(tick);
    }

    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [logoSize, worldReady]);

  const stageSize = fullscreen ? undefined : { width: logoSize * 2.6, height: logoSize * 2.6 };

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
        <div
          className="ts-loader"
          aria-hidden="true"
          style={stageSize}
        >
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

          {/* Centered rotating globe canvas */}
          <div className="ts-globe-wrap">
            <canvas ref={canvasRef} className="ts-globe" />
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
