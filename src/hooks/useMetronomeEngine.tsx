import { useRef, useCallback, useState } from 'react';

export type SoundStyle = 'click' | 'woodblock' | 'beep' | 'rim';
export type Subdivision = 'off' | '8th' | 'triplet';

interface MetronomeEngineOptions {
  bpm: number;
  timeSignatureTop: number;
  timeSignatureBottom: number;
  volume: number;
  soundStyle: SoundStyle;
  accentBeat1: boolean;
  subdivision: Subdivision;
}

function createClickBuffer(ctx: AudioContext, frequency: number, duration: number, type: OscillatorType = 'sine'): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const envelope = Math.exp(-t * 40);
    let sample = 0;
    
    switch (type) {
      case 'sine':
        sample = Math.sin(2 * Math.PI * frequency * t);
        break;
      case 'square':
        sample = Math.sign(Math.sin(2 * Math.PI * frequency * t)) * 0.5;
        break;
      case 'triangle':
        sample = (2 / Math.PI) * Math.asin(Math.sin(2 * Math.PI * frequency * t));
        break;
      default:
        sample = Math.sin(2 * Math.PI * frequency * t);
    }
    
    data[i] = sample * envelope;
  }
  return buffer;
}

function createNoiseClickBuffer(ctx: AudioContext, duration: number, bandpass: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  
  // Simple filtered noise for click/rim sounds
  let prev = 0;
  const alpha = bandpass / (bandpass + sampleRate);
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const envelope = Math.exp(-t * 60);
    const noise = (Math.random() * 2 - 1);
    prev = prev + alpha * (noise - prev);
    data[i] = prev * envelope * 3;
  }
  return buffer;
}

function getSoundBuffers(ctx: AudioContext, style: SoundStyle) {
  switch (style) {
    case 'click':
      return {
        normal: createNoiseClickBuffer(ctx, 0.03, 4000),
        accent: createNoiseClickBuffer(ctx, 0.04, 6000),
      };
    case 'woodblock':
      return {
        normal: createClickBuffer(ctx, 800, 0.05, 'triangle'),
        accent: createClickBuffer(ctx, 1200, 0.06, 'triangle'),
      };
    case 'beep':
      return {
        normal: createClickBuffer(ctx, 880, 0.06, 'sine'),
        accent: createClickBuffer(ctx, 1320, 0.07, 'sine'),
      };
    case 'rim':
      return {
        normal: createNoiseClickBuffer(ctx, 0.02, 8000),
        accent: createNoiseClickBuffer(ctx, 0.03, 10000),
      };
  }
}

export function useMetronomeEngine() {
  const ctxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentNoteRef = useRef(0);
  const nextNoteTimeRef = useRef(0);
  const buffersRef = useRef<{ normal: AudioBuffer; accent: AudioBuffer } | null>(null);
  const optionsRef = useRef<MetronomeEngineOptions | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);

  const SCHEDULE_AHEAD_TIME = 0.1;
  const LOOKAHEAD_MS = 25;

  const scheduleNote = useCallback((beatNumber: number, time: number) => {
    const ctx = ctxRef.current;
    const buffers = buffersRef.current;
    const opts = optionsRef.current;
    if (!ctx || !buffers || !opts) return;

    const isAccent = opts.accentBeat1 && beatNumber === 0;
    const buffer = isAccent ? buffers.accent : buffers.normal;
    const gain = ctx.createGain();
    gain.gain.value = opts.volume * (isAccent ? 1.0 : 0.7);
    gain.connect(ctx.destination);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(gain);
    source.start(time);
  }, []);

  const scheduler = useCallback(() => {
    const ctx = ctxRef.current;
    const opts = optionsRef.current;
    if (!ctx || !opts) return;

    const subdivisionMultiplier = opts.subdivision === '8th' ? 2 : opts.subdivision === 'triplet' ? 3 : 1;
    const beatsPerMeasure = opts.timeSignatureTop * subdivisionMultiplier;
    const secondsPerSubBeat = (60.0 / opts.bpm) / subdivisionMultiplier;

    while (nextNoteTimeRef.current < ctx.currentTime + SCHEDULE_AHEAD_TIME) {
      const mainBeat = Math.floor(currentNoteRef.current / subdivisionMultiplier);
      const isMainBeat = currentNoteRef.current % subdivisionMultiplier === 0;
      
      if (isMainBeat) {
        scheduleNote(mainBeat, nextNoteTimeRef.current);
        // Update UI beat on main thread
        const beat = mainBeat;
        setTimeout(() => setCurrentBeat(beat), 0);
      } else {
        // Subdivision click (quieter)
        const ctx2 = ctxRef.current;
        const buffers = buffersRef.current;
        if (ctx2 && buffers) {
          const gain = ctx2.createGain();
          gain.gain.value = (optionsRef.current?.volume ?? 0.8) * 0.35;
          gain.connect(ctx2.destination);
          const source = ctx2.createBufferSource();
          source.buffer = buffers.normal;
          source.connect(gain);
          source.start(nextNoteTimeRef.current);
        }
      }

      nextNoteTimeRef.current += secondsPerSubBeat;
      currentNoteRef.current = (currentNoteRef.current + 1) % beatsPerMeasure;
    }
  }, [scheduleNote]);

  const start = useCallback(async (options: MetronomeEngineOptions) => {
    optionsRef.current = options;

    if (!ctxRef.current) {
      ctxRef.current = new AudioContext({ latencyHint: 'playback' });
    }
    const ctx = ctxRef.current;
    
    if (ctx.state !== 'running') {
      await ctx.resume();
    }

    buffersRef.current = getSoundBuffers(ctx, options.soundStyle);
    currentNoteRef.current = 0;
    nextNoteTimeRef.current = ctx.currentTime;

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(scheduler, LOOKAHEAD_MS);
    setIsRunning(true);
  }, [scheduler]);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRunning(false);
    setCurrentBeat(0);
  }, []);

  const updateOptions = useCallback((options: MetronomeEngineOptions) => {
    optionsRef.current = options;
    if (ctxRef.current) {
      buffersRef.current = getSoundBuffers(ctxRef.current, options.soundStyle);
    }
  }, []);

  const cleanup = useCallback(() => {
    stop();
    if (ctxRef.current) {
      ctxRef.current.close();
      ctxRef.current = null;
    }
  }, [stop]);

  return { start, stop, updateOptions, cleanup, isRunning, currentBeat };
}
