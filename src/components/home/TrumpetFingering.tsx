import { useEffect, useRef } from 'react';
import '@/trompete/engine/render/griff.js';
import '@/trompete/trumpet.css';

export function TrumpetFingering({ valves, label }: { valves: number[]; label: string }) {
  const svg = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (!svg.current) return;
    const root = window as unknown as { Griff: { zeichne(svg: SVGSVGElement, tone: { griff: { ventile: number[] } }): void } };
    root.Griff.zeichne(svg.current, { griff: { ventile: [1, 2, 3].map(v => valves.includes(v) ? 1 : 0) } });
  }, [valves]);
  return <svg ref={svg} className="tp-trumpet mx-auto w-full max-w-md" role="img" aria-label={label} />;
}