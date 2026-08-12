import { useEffect, useRef, useState, type RefObject } from "react";
import { detectPitch } from "@/lib/pitch";
import { freqToNote } from "@/lib/notes";

export interface PitchInfo {
  freq: number;
  note: string | null;
  cents: number;
  stable: number; // 0..1
}

export function usePitchDetection(
  analyserRef: RefObject<AnalyserNode | null>,
  ctxRef: RefObject<AudioContext | null>,
  active: boolean,
  transposeSemitones = 0,
): PitchInfo {
  const [info, setInfo] = useState<PitchInfo>({ freq: -1, note: null, cents: 0, stable: 0 });
  const bufRef = useRef<Float32Array | null>(null);
  const lastNoteRef = useRef<string | null>(null);
  const stableSinceRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const tick = () => {
      const an = analyserRef.current;
      const ctx = ctxRef.current;
      if (an && ctx) {
        if (!bufRef.current || bufRef.current.length !== an.fftSize) bufRef.current = new Float32Array(an.fftSize);
        const buf = bufRef.current;
        an.getFloatTimeDomainData(buf as unknown as Float32Array<ArrayBuffer>);
        const f = detectPitch(buf, ctx.sampleRate);
        if (f > 60 && f < 2000) {
          const { name, cents } = freqToNote(f, transposeSemitones);
          const now = performance.now();
          if (lastNoteRef.current === name) {
            const dur = now - stableSinceRef.current;
            const stable = Math.min(1, dur / 150);
            setInfo({ freq: f, note: name, cents, stable });
          } else {
            lastNoteRef.current = name;
            stableSinceRef.current = now;
            setInfo({ freq: f, note: name, cents, stable: 0 });
          }
        } else {
          lastNoteRef.current = null;
          setInfo({ freq: -1, note: null, cents: 0, stable: 0 });
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, analyserRef, ctxRef, transposeSemitones]);

  return info;
}
