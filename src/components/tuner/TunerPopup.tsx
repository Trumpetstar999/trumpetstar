import { useState, useEffect, useRef } from 'react';
import { ArrowDown, ArrowUp, Check, Mic, MicOff, X, Minus, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { usePitchDetection } from '@/hooks/usePitchDetection';
import { useLanguage } from '@/hooks/useLanguage';
import { TUNER_COPY } from '@/i18n/tuner';
import { tuningDirection, writtenTunerNote } from '@/lib/tuner-note';
import { TunerStaff } from './TunerStaff';

interface TunerPopupProps { isOpen: boolean; onClose: () => void; inline?: boolean; }

export function TunerPopup({ isOpen, onClose, inline = false }: TunerPopupProps) {
  const { language } = useLanguage();
  const copy = TUNER_COPY[language];
  const [referenceA4, setReferenceA4] = useState(440);
  const [trumpet, setTrumpet] = useState(true);
  const [starting, setStarting] = useState(false);
  const { isListening, pitchData, smoothedCents, error, startListening, stopListening } = usePitchDetection(referenceA4);
  const handledRef = useRef(false);
  useEffect(() => { if (!isOpen) stopListening(); }, [isOpen, stopListening]);
  const toggle = async () => {
    if (handledRef.current) return;
    if (isListening) { stopListening(); return; }
    handledRef.current = true;
    setStarting(true);
    try { await startListening(); } finally { handledRef.current = false; setStarting(false); }
  };
  const active = isListening && !!pitchData;
  const note = active ? writtenTunerNote(pitchData.noteIndex, pitchData.octave, trumpet, language) : null;
  const direction = tuningDirection(smoothedCents);
  const StatusIcon = direction === 'tuned' ? Check : direction === 'low' ? ArrowDown : ArrowUp;
  const color = !active ? 'text-muted-foreground' : direction === 'tuned' ? 'text-tuner-tuned' : 'text-destructive';
  const status = active ? copy[direction] : isListening ? copy.waiting : copy.ready;

  const content = <>
        {!inline && <header className="ts-gradient flex items-center justify-between px-5 py-4">
          <div>
            <DialogTitle className="text-xl font-bold text-ts-on">{copy.title}</DialogTitle>
            <DialogDescription id="tuner-instrument" className="mt-1 text-sm text-ts-on">{trumpet ? copy.instrument : copy.concert}</DialogDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label={copy.close} title={copy.close} className="text-ts-on hover:bg-ts-on/20 hover:text-ts-on"><X /></Button>
        </header>}
        <div className="min-w-0 px-5 pt-4 pb-5 sm:px-7">
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            {[true, false].map(mode => <Button key={String(mode)} size="sm" variant={trumpet === mode ? 'secondary' : 'ghost'} aria-pressed={trumpet === mode} onClick={() => setTrumpet(mode)} className={trumpet === mode ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}>{mode ? copy.instrument : copy.concert}</Button>)}
          </div>
          <div className="mt-4 text-center">
            <div className="h-16 flex items-baseline justify-center gap-1 text-primary">
              <span className="text-6xl font-bold">{note?.name ?? '—'}</span>
              {note && <span className="text-xl font-semibold">{note.octave}</span>}
            </div>
            <TunerStaff note={note} label={copy.staff} />
            <div className={`flex min-h-8 justify-center items-center gap-2 text-lg font-bold ${color}`} role="status">
              {active && <StatusIcon className="h-5 w-5" />}{status}
            </div>
            <div className="mt-3 w-full" role="meter" aria-label={status} aria-valuemin={-50} aria-valuemax={50} aria-valuenow={active ? smoothedCents : 0}>
              <svg viewBox="0 0 400 60" className="w-full h-[60px]" aria-hidden="true">
                <rect x="10" y="20" width="380" height="8" rx="4" className="fill-muted" />
                <rect x="181" y="17" width="38" height="14" rx="4" className="fill-tuner-tuned/20" />
                {Array.from({ length: 21 }, (_, i) => <line key={i} x1={10 + i * 19} x2={10 + i * 19} y1={i % 5 === 0 ? 12 : 17} y2="32" className={i === 10 ? 'stroke-tuner-tuned' : 'stroke-muted-foreground/50'} strokeWidth={i === 10 ? 2 : 1} />)}
                {active && <path d="M -6 -7 L 6 -7 L 0 0 Z" transform={`translate(${200 + Math.max(-50, Math.min(50, smoothedCents)) * 3.8}, 17)`} className={direction === 'tuned' ? 'fill-tuner-tuned' : 'fill-destructive'} />}
                {[-50, -25, 0, 25, 50].map((v, i) => <text key={v} x={10 + i * 95} y="53" textAnchor={i === 0 ? 'start' : i === 4 ? 'end' : 'middle'} className="fill-muted-foreground" fontSize="12">{v > 0 ? `+${v}` : v}</text>)}
              </svg>
            </div>
            <div className="flex items-center justify-center gap-4 text-sm tabular-nums text-muted-foreground h-7">
              <span>{active ? `${smoothedCents > 0 ? '+' : ''}${smoothedCents}` : '—'} ct</span>
              <span className="h-3 border-l border-border" />
              <span>{active ? pitchData.frequency.toFixed(1) : '—'} Hz</span>
            </div>
          </div>
          {error && <p role="alert" className="my-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{copy.microphoneError}</p>}
          <Button onClick={toggle} disabled={starting} variant={isListening ? 'outline' : 'default'} className={`mt-4 w-full h-12 text-base font-bold ${!isListening ? 'bg-gold text-gold-foreground hover:bg-gold/90' : ''}`}>
            {isListening ? <MicOff /> : <Mic />}{isListening ? copy.stop : copy.start}
          </Button>
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-muted-foreground">{copy.reference}</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" disabled={referenceA4 <= 430} aria-label={copy.decrease} title={copy.decrease} onClick={() => setReferenceA4(v => Math.max(430, v - 1))}><Minus /></Button>
              <span className="w-[70px] text-center font-semibold tabular-nums text-sm">{referenceA4} Hz</span>
              <Button variant="outline" size="icon" disabled={referenceA4 >= 450} aria-label={copy.increase} title={copy.increase} onClick={() => setReferenceA4(v => Math.min(450, v + 1))}><Plus /></Button>
            </div>
          </div>
        </div>
      </>;

  if (inline) return <section aria-label={copy.title} className="ts-tuner mx-auto w-full max-w-[480px] py-4 sm:py-6">{content}</section>;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent aria-describedby="tuner-instrument" className="ts-light-module ts-tuner w-[calc(100vw-24px)] max-w-[480px] max-h-[calc(100dvh-24px)] overflow-y-auto rounded-lg border-0 p-0 gap-0 [&>button]:hidden">
        {content}
      </DialogContent>
    </Dialog>
  );
}
