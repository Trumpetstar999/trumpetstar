import { useEffect, useRef, useState } from 'react';
import { Beam, Dot, Formatter, Renderer, Stave, StaveNote, Voice } from 'vexflow';
import { Play, Square, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/useLanguage';
import { STAGE_COPY } from '@/i18n/stage-copy';
import {
  BAR_CAPACITY, BLOCKS, BLOCK_ORDER, SCALE, barFill, emptyBars, events, placeBlock, removeBlock, resizeBars, setPitch, soundingHz,
  type Bars, type Block, type BlockKind,
} from '@/lib/rhythm';

function cssColor(name: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v ? `hsl(${v})` : '#222';
}

function BarStaff({ bar, index, selected }: { bar: Block[]; index: number; selected: number | null }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = host.current; if (!el) return;
    el.innerHTML = '';
    const w = 260;
    const r = new Renderer(el, Renderer.Backends.SVG); r.resize(w, 130);
    const c = r.getContext();
    const ink = cssColor('--ts-ink'), mark = cssColor('--ts-red');
    c.setFillStyle(ink); c.setStrokeStyle(ink);
    const stave = new Stave(0, 10, w - 4);
    if (index === 0) stave.addClef('treble').addTimeSignature('4/4');
    stave.setStyle({ strokeStyle: ink, fillStyle: ink });
    stave.setContext(c).draw();
    const notes: StaveNote[] = []; const beams: Beam[] = [];
    bar.forEach((bl, bi) => {
      let head = 0; const group: StaveNote[] = [];
      BLOCKS[bl.kind].parts.forEach((p) => {
        const key = p.rest ? 'b/4' : SCALE[bl.pitches[head++]].key;
        const n = new StaveNote({ keys: [key], duration: p.dur, auto_stem: !p.rest });
        if (p.dot) Dot.buildAndAttach([n], { all: true });
        if (bi === selected) n.setStyle({ fillStyle: mark, strokeStyle: mark });
        notes.push(n); if (p.dur === '8') group.push(n);
      });
      if (group.length === 2 && bl.kind === 'eighths') beams.push(new Beam(group));
    });
    if (notes.length) {
      const voice = new Voice({ num_beats: 4, beat_value: 4 }).setMode(Voice.Mode.SOFT).addTickables(notes);
      new Formatter().joinVoices([voice]).format([voice], w - (index === 0 ? 90 : 30));
      voice.draw(c, stave); beams.forEach((b) => b.setContext(c).draw());
    }
    el.querySelector('svg')?.setAttribute('aria-hidden', 'true');
  }, [bar, index, selected]);
  return <div ref={host} className="w-full overflow-hidden [&_svg]:max-w-full [&_svg]:h-auto" />;
}

let ctx: AudioContext | null = null;

export function RhythmBuilder() {
  const { language } = useLanguage();
  const c = STAGE_COPY[language] ?? STAGE_COPY.de;
  const [count, setCount] = useState<2 | 4>(2);
  const [bars, setBars] = useState<Bars>(emptyBars(2));
  const [activeBar, setActiveBar] = useState(0);
  const [sel, setSel] = useState<{ bar: number; block: number } | null>(null);
  const [bpm, setBpm] = useState(80);
  const [playing, setPlaying] = useState(false);
  const stopRef = useRef<() => void>();

  useEffect(() => () => stopRef.current?.(), []);

  const switchCount = (n: 2 | 4) => { setCount(n); setBars((b) => resizeBars(b, n)); setActiveBar((a) => Math.min(a, n - 1)); setSel(null); };
  const add = (kind: BlockKind, bar = activeBar) => {
    const next = placeBlock(bars, kind, bar);
    if (!next) { toast.error(c.noRoom); return; }
    setBars(next);
  };

  const play = () => {
    stopRef.current?.();
    ctx = ctx ?? new AudioContext(); if (ctx.state === 'suspended') ctx.resume();
    const a = ctx; const e8 = 30 / bpm; const t0 = a.currentTime + 0.1;
    const nodes: OscillatorNode[] = [];
    const tone = (t: number, f: number, d: number, vol: number, type: OscillatorType) => {
      const o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.setValueAtTime(vol, t + Math.max(0.02, d - 0.05)); g.gain.linearRampToValueAtTime(0, t + d);
      o.connect(g).connect(a.destination); o.start(t); o.stop(t + d + 0.02); nodes.push(o);
    };
    const beats = count * 4;
    for (let i = 0; i < beats; i++) tone(t0 + i * 2 * e8, i % 4 === 0 ? 1600 : 1100, 0.04, 0.25, 'square');
    events(bars).forEach((ev) => { if (ev.pitch !== null) tone(t0 + ev.start * e8, soundingHz(ev.pitch), ev.len * e8 * 0.92, 0.22, 'triangle'); });
    setPlaying(true);
    const timer = window.setTimeout(() => setPlaying(false), (beats * 2 * e8 + 0.2) * 1000);
    stopRef.current = () => { nodes.forEach((n) => { try { n.stop(); } catch { /* already stopped */ } }); clearTimeout(timer); setPlaying(false); };
  };

  const selected = sel ? bars[sel.bar]?.[sel.block] : undefined;

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4 text-ts-ink">
      <div className="flex flex-wrap items-center gap-3">
        <div role="radiogroup" className="inline-flex rounded-full bg-ts-card p-1 shadow-sm">
          {([2, 4] as const).map((n) => (
            <button key={n} role="radio" aria-checked={count === n} onClick={() => switchCount(n)}
              className={`rounded-full px-4 py-2 text-sm font-bold transition ${count === n ? 'bg-ts-deep text-primary-foreground' : 'text-ts-ink'}`}>
              {n === 2 ? c.bars2 : c.bars4}
            </button>
          ))}
        </div>
        <button onClick={() => { setBars(emptyBars(count)); setSel(null); }} className="ml-auto inline-flex items-center gap-1 rounded-full bg-ts-card px-4 py-2 text-sm font-semibold shadow-sm">
          <Trash2 className="h-4 w-4" />{c.clear}
        </button>
      </div>

      <section className="rounded-[18px] bg-ts-card p-3 shadow-sm">
        <h2 className="mb-1 text-sm font-bold">{c.blocks}</h2>
        <p className="mb-3 text-sm text-ts-muted">{c.hint}</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {BLOCK_ORDER.map((k) => (
            <button key={k} draggable onDragStart={(e) => e.dataTransfer.setData('text/plain', k)} onClick={() => add(k)}
              className="rounded-xl border border-border bg-background px-3 py-3 text-sm font-semibold hover:border-ts-deep">
              {c[k]}
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        {bars.map((bar, i) => {
          const full = barFill(bar) >= BAR_CAPACITY;
          return (
            <div key={i} onClick={() => setActiveBar(i)} onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const k = e.dataTransfer.getData('text/plain') as BlockKind; if (BLOCKS[k]) { setActiveBar(i); add(k, i); } }}
              aria-label={`${c.selectBar} ${i + 1}`}
              className={`cursor-pointer rounded-[18px] border-2 bg-ts-card p-2 shadow-sm ${activeBar === i ? 'border-ts-deep' : 'border-transparent'}`}>
              <div className="flex items-center justify-between px-1 text-xs font-bold">
                <span>{c.bar} {i + 1}</span>
                <span className={full ? 'text-ts-green' : 'text-ts-muted'}>{barFill(bar) / 2}/4 {full ? `· ${c.full}` : ''}</span>
              </div>
              <BarStaff bar={bar} index={i} selected={sel?.bar === i ? sel.block : null} />
              <div className="flex flex-wrap gap-1">
                {bar.map((bl, j) => (
                  <button key={j} onClick={(e) => { e.stopPropagation(); setSel({ bar: i, block: j }); }}
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${sel?.bar === i && sel.block === j ? 'bg-ts-red text-primary-foreground' : 'bg-muted text-ts-ink'}`}>
                    {c[bl.kind]}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {sel && selected && (
        <section className="rounded-[18px] bg-ts-card p-3 shadow-sm space-y-2">
          {selected.pitches.map((p, h) => (
            <div key={h} className="flex flex-wrap items-center gap-1">
              <span className="w-16 text-sm font-bold">{c.note} {h + 1}</span>
              {SCALE.map((s, si) => (
                <button key={s.name} aria-pressed={p === si} onClick={() => setBars(setPitch(bars, sel.bar, sel.block, h, si))}
                  className={`min-w-10 rounded-lg px-2 py-2 text-sm font-bold ${p === si ? 'bg-ts-deep text-primary-foreground' : 'bg-muted text-ts-ink'}`}>
                  {s.name}
                </button>
              ))}
            </div>
          ))}
          <button onClick={() => { setBars(removeBlock(bars, sel.bar, sel.block)); setSel(null); }} className="inline-flex items-center gap-1 text-sm font-semibold text-ts-red">
            <Trash2 className="h-4 w-4" />{c.remove}
          </button>
        </section>
      )}

      <section className="flex flex-wrap items-center gap-4 rounded-[18px] bg-ts-card p-3 shadow-sm">
        <button onClick={() => (playing ? stopRef.current?.() : play())}
          className="inline-flex items-center gap-2 rounded-full bg-ts-gold px-5 py-3 font-bold text-ts-ink shadow">
          {playing ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}{playing ? c.stop : c.play}
        </button>
        <label className="flex flex-1 min-w-48 items-center gap-3 text-sm font-semibold">
          {c.tempo}
          <input type="range" min={40} max={200} value={bpm} onChange={(e) => setBpm(Number(e.target.value))} className="flex-1 accent-[hsl(var(--ts-deep))]" />
          <span className="w-16 tabular-nums">{bpm} BPM</span>
        </label>
      </section>
    </div>
  );
}
