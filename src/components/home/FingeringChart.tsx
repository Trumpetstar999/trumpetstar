import { useEffect, useRef, useState } from 'react';
import { Accidental, Formatter, Renderer, Stave, StaveNote, Voice } from 'vexflow';
import { Volume2 } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { FINGERING_COPY } from '@/i18n/fingering';
import { DESCENDING_FINGERINGS, FINGERINGS, soundingFrequency, type FingeringNote } from '@/lib/fingering';
import { TrumpetSound } from '@/lib/trumpetSound';
import { TrumpetFingering } from './TrumpetFingering';

const SLOT = 46;
const LEFT = 60;

function cssColor(name: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v ? `hsl(${v})` : '#000';
}

function FingeringRow({ notes: fingerings, selected, onChoose, label }: {
  notes: FingeringNote[]; selected: FingeringNote | null; onChoose: (note: FingeringNote) => void; label: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [xs, setXs] = useState<number[]>([]);
  const width = LEFT + fingerings.length * SLOT + 20;

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
    stave.setStyle({ strokeStyle: ink, fillStyle: ink });
    (stave as unknown as { setDefaultLedgerLineStyle?: (s: object) => void }).setDefaultLedgerLineStyle?.({ strokeStyle: ink, lineWidth: 1.4 });
    stave.setContext(c).draw();
    const notes = fingerings.map((n) => {
      const sn = new StaveNote({ keys: [n.key], duration: 'q', auto_stem: true });
      if (n.sharp) sn.addModifier(new Accidental('#'));
      if (n.flat) sn.addModifier(new Accidental('b'));
      if (n === selected) sn.setStyle({ fillStyle: mark, strokeStyle: mark });
      return sn;
    });
    const voice = new Voice({ num_beats: notes.length, beat_value: 4 }).addTickables(notes);
    new Formatter().joinVoices([voice]).format([voice], width - LEFT - 30);
    voice.draw(c, stave);
    const next = notes.map((n) => n.getAbsoluteX() + 6);
    setXs((prev) => (prev.length === next.length && prev.every((x, i) => Math.abs(x - next[i]) < 0.5) ? prev : next));
    el.querySelector('svg')?.setAttribute('aria-hidden', 'true');
  }, [selected, width, fingerings]);

  return (
    <section aria-label={label} className="space-y-2">
      <h2 className="text-sm font-bold text-ts-ink">{label}</h2>
      <div className="rounded-lg bg-ts-card shadow-sm overflow-x-auto">
        <div className="relative" style={{ width }}>
          <div ref={host} />
          <div className="absolute inset-0">
            {fingerings.map((n, i) => (
              <Button variant="ghost" key={n.name} onClick={() => onChoose(n)} aria-label={n.name} aria-pressed={n === selected}
                className="absolute top-0 h-full flex items-end justify-center p-0 pb-1 text-[11px] font-semibold text-ts-muted hover:bg-transparent hover:text-ts-red" style={{ width: SLOT - 4, left: (xs[i] ?? LEFT + i * SLOT) - (SLOT - 4) / 2 }}>
                <span className={n === selected ? 'text-ts-red font-extrabold' : ''}>{n.name}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function FingeringChart() {
  const { t, language } = useLanguage();
  const copy = FINGERING_COPY[language];
  const [note, setNote] = useState<FingeringNote | null>(null);
  const sound = useRef<TrumpetSound | null>(null);
  const [audioError, setAudioError] = useState(false);
  useEffect(() => () => { sound.current?.dispose(); sound.current = null; }, []);
  const playTone = (freq: number) => {
    setAudioError(false);
    sound.current ??= new TrumpetSound();
    void sound.current.play(freq).catch(() => setAudioError(true));
  };
  const choose = (next: FingeringNote) => { setNote(next); playTone(soundingFrequency(next.midi)); };

  return (
    <div className="p-4 space-y-5">
      <FingeringRow notes={FINGERINGS} selected={note} onChoose={choose} label={copy.ascending} />
      <FingeringRow notes={DESCENDING_FINGERINGS} selected={note} onChoose={choose} label={copy.descending} />

      <div className="rounded-[20px] bg-ts-card shadow-sm p-5 text-center">
        {!note ? (
          <p className="text-ts-muted">{t('home.griffHint')}</p>
        ) : (
          <>
            <p className="text-3xl font-extrabold text-ts-red">{note.name}</p>
            <TrumpetFingering valves={note.valves} label={note.valves.length ? t('home.griffPress', { valves: note.valves.join(' + ') }) : t('home.griffOpen')} />
            <p className="font-bold text-ts-ink">{note.valves.length ? t('home.griffPress', { valves: note.valves.join(' + ') }) : t('home.griffOpen')}</p>
            <Button onClick={() => playTone(soundingFrequency(note.midi))} className="mt-3 inline-flex items-center gap-2 rounded-full bg-ts-gold text-ts-ink hover:bg-ts-gold/90 font-extrabold px-4 py-2">
              <Volume2 className="w-4 h-4" />{t('home.playTone')}
            </Button>
          </>
        )}
        {audioError && <p role="alert" className="mt-2 text-destructive">{({ de: 'Ton konnte nicht geladen werden. Bitte erneut versuchen.', en: 'Sound could not load. Please try again.', es: 'No se pudo cargar el sonido. Inténtalo de nuevo.', sl: 'Zvoka ni bilo mogoče naložiti. Poskusite znova.' })[language]}</p>}
      </div>
    </div>
  );
}
