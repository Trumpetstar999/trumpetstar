import { useEffect, useRef, useState } from 'react';
import { Accidental, Formatter, Renderer, Stave, StaveNote, Voice } from 'vexflow';
import { Volume2 } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { FINGERINGS, soundingFrequency } from '@/lib/fingering';

const SLOT = 46;
const LEFT = 60;

function cssColor(name: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v ? `hsl(${v})` : '#000';
}

let ctx: AudioContext | null = null;
function playTone(freq: number) {
  try {
    ctx = ctx ?? new AudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'triangle'; o.frequency.value = freq;
    const t = ctx.currentTime;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.25, t + 0.03); g.gain.exponentialRampToValueAtTime(0.001, t + 1.1);
    o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + 1.15);
  } catch { /* audio unavailable */ }
}

export function FingeringChart() {
  const { t } = useLanguage();
  const host = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const width = LEFT + FINGERINGS.length * SLOT + 20;

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    el.innerHTML = '';
    const renderer = new Renderer(el, Renderer.Backends.SVG);
    renderer.resize(width, 190);
    const c = renderer.getContext();
    const ink = cssColor('--ts-ink'), mark = cssColor('--ts-red');
    c.setFillStyle(ink); c.setStrokeStyle(ink);
    const stave = new Stave(0, 40, width - 10).addClef('treble');
    stave.setContext(c).draw();
    const notes = FINGERINGS.map((n, i) => {
      const sn = new StaveNote({ keys: [n.key], duration: 'q', auto_stem: true });
      if (n.sharp) sn.addModifier(new Accidental('#'));
      if (i === selected) sn.setStyle({ fillStyle: mark, strokeStyle: mark });
      return sn;
    });
    const voice = new Voice({ num_beats: notes.length, beat_value: 4 }).addTickables(notes);
    new Formatter().joinVoices([voice]).format([voice], width - LEFT - 30);
    voice.draw(c, stave);
    el.querySelector('svg')?.setAttribute('aria-hidden', 'true');
  }, [selected, width]);

  const note = selected != null ? FINGERINGS[selected] : null;
  const choose = (i: number) => { setSelected(i); playTone(soundingFrequency(FINGERINGS[i].midi)); };

  return (
    <div className="p-4 space-y-5">
      <div className="rounded-[20px] bg-ts-card shadow-sm overflow-x-auto">
        <div className="relative" style={{ width }}>
          <div ref={host} />
          <div className="absolute inset-0 flex" style={{ paddingLeft: LEFT }}>
            {FINGERINGS.map((n, i) => (
              <button key={n.name} onClick={() => choose(i)} aria-label={n.name} aria-pressed={i === selected}
                className="h-full flex items-end justify-center pb-1 text-[11px] font-semibold text-ts-muted" style={{ width: SLOT }}>
                <span className={i === selected ? 'text-ts-red font-extrabold' : ''}>{n.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-[20px] bg-ts-card shadow-sm p-5 text-center">
        {!note ? (
          <p className="text-ts-muted">{t('home.griffHint')}</p>
        ) : (
          <>
            <p className="text-3xl font-extrabold text-ts-red">{note.name}</p>
            <div className="flex justify-center gap-5 my-5" role="img" aria-label={note.valves.length ? t('home.griffPress', { valves: note.valves.join(' + ') }) : t('home.griffOpen')}>
              {[1, 2, 3].map((v) => {
                const down = note.valves.includes(v);
                return (
                  <div key={v} className="flex flex-col items-center gap-1">
                    <div className="h-24 w-12 flex flex-col items-center justify-start">
                      <span className={`w-7 rounded-t-md transition-all ${down ? 'h-4 mt-6 bg-ts-red' : 'h-10 bg-ts-muted/50'}`} />
                      <span className={`w-12 h-12 rounded-full border-4 transition-colors ${down ? 'bg-ts-red border-ts-red' : 'bg-ts-surface border-ts-muted/40'}`} />
                    </div>
                    <span className="text-xs text-ts-muted">{t('home.valve', { n: v })}</span>
                  </div>
                );
              })}
            </div>
            <p className="font-bold text-ts-ink">{note.valves.length ? t('home.griffPress', { valves: note.valves.join(' + ') }) : t('home.griffOpen')}</p>
            <button onClick={() => playTone(soundingFrequency(note.midi))} className="mt-3 inline-flex items-center gap-2 rounded-full bg-ts-gold text-ts-ink font-extrabold px-4 py-2">
              <Volume2 className="w-4 h-4" />{t('home.playTone')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
