import { useEffect, useRef } from 'react';
import { Accidental, Formatter, Renderer, Stave, StaveNote } from 'vexflow';
import type { writtenTunerNote } from '@/lib/tuner-note';

export function TunerStaff({ note, label }: { note: ReturnType<typeof writtenTunerNote> | null; label: string }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    el.replaceChildren();
    const renderer = new Renderer(el, Renderer.Backends.SVG);
    renderer.resize(360, 200);
    const context = renderer.getContext();
    const ink = getComputedStyle(el).color;
    context.setFillStyle(ink).setStrokeStyle(ink);
    const stave = new Stave(10, 65, 340).addClef('treble');
    stave.setStyle({ fillStyle: ink, strokeStyle: ink });
    stave.setContext(context).draw();
    if (note) {
      const n = new StaveNote({ keys: [note.key], duration: 'w' });
      if (note.accidental) n.addModifier(new Accidental(note.accidental));
      n.setStyle({ fillStyle: ink, strokeStyle: ink });
      Formatter.FormatAndDraw(context, stave, [n]);
    }
    const svg = el.querySelector('svg');
    svg?.setAttribute('viewBox', '0 0 360 200');
    svg?.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg?.setAttribute('aria-hidden', 'true');
  }, [note?.key, note?.accidental]);
  return <div ref={host} className="tuner-staff mx-auto w-full max-w-[360px] text-foreground" role="img" aria-label={`${label}: ${note ? `${note.name}${note.octave}` : '—'}`} />;
}