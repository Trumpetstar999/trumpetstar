import { useState, useRef, useCallback, useEffect } from 'react';

interface PitchData {
  frequency: number;
  note: string;
  octave: number;
  cents: number;
  noteIndex: number;
}

interface UsePitchDetectionResult {
  isListening: boolean;
  pitchData: PitchData | null;
  smoothedCents: number;
  error: string | null;
  startListening: () => Promise<void>;
  stopListening: () => void;
}

// Note names for Bb Trumpet (concert pitch)
const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];

// Autocorrelation-based pitch detection
function autoCorrelate(buffer: Float32Array, sampleRate: number): number {
  const SIZE = buffer.length;
  const MAX_SAMPLES = Math.floor(SIZE / 2);
  let bestOffset = -1;
  let bestCorrelation = 0;
  let rms = 0;
  let foundGoodCorrelation = false;

  for (let i = 0; i < SIZE; i++) {
    const val = buffer[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / SIZE);

  if (rms < 0.01) return -1;

  let lastCorrelation = 1;
  for (let offset = 0; offset < MAX_SAMPLES; offset++) {
    let correlation = 0;
    for (let i = 0; i < MAX_SAMPLES; i++) {
      correlation += Math.abs(buffer[i] - buffer[i + offset]);
    }
    correlation = 1 - correlation / MAX_SAMPLES;

    if (correlation > 0.9 && correlation > lastCorrelation) {
      foundGoodCorrelation = true;
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestOffset = offset;
      }
    } else if (foundGoodCorrelation) {
      const shift = (lastCorrelation - correlation) / 
        (2 * (lastCorrelation - 2 * bestCorrelation + correlation));
      return sampleRate / (bestOffset + shift);
    }
    lastCorrelation = correlation;
  }

  if (bestCorrelation > 0.01) {
    return sampleRate / bestOffset;
  }
  return -1;
}

function frequencyToNote(frequency: number, referenceA4: number): PitchData {
  const semitones = 12 * Math.log2(frequency / referenceA4);
  const roundedSemitones = Math.round(semitones);
  const cents = Math.round((semitones - roundedSemitones) * 100);
  const noteIndex = ((roundedSemitones % 12) + 12 + 9) % 12;
  const octave = Math.floor((roundedSemitones + 9) / 12) + 4;
  
  return { frequency, note: NOTE_NAMES[noteIndex], octave, cents, noteIndex };
}

// Smoothing class for stable needle movement
class ExponentialSmoothing {
  private value: number = 0;
  private alpha: number;
  
  constructor(alpha: number = 0.15) {
    this.alpha = alpha;
  }
  
  update(newValue: number): number {
    this.value = this.alpha * newValue + (1 - this.alpha) * this.value;
    return this.value;
  }
  
  reset() {
    this.value = 0;
  }
}

export function usePitchDetection(referenceA4: number = 440): UsePitchDetectionResult {
  const [isListening, setIsListening] = useState(false);
  const [pitchData, setPitchData] = useState<PitchData | null>(null);
  const [smoothedCents, setSmoothedCents] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const bufferRef = useRef<Float32Array<ArrayBuffer> | null>(null);
  const smootherRef = useRef<ExponentialSmoothing>(new ExponentialSmoothing(0.12));
  const lastNoteRef = useRef<string | null>(null);
  const startedRef = useRef(false);

  const analyze = useCallback(() => {
    if (!analyserRef.current || !bufferRef.current || !audioContextRef.current) return;

    analyserRef.current.getFloatTimeDomainData(bufferRef.current);
    const frequency = autoCorrelate(bufferRef.current, audioContextRef.current.sampleRate);

    if (frequency > 0 && frequency < 2000) {
      const data = frequencyToNote(frequency, referenceA4);
      
      if (lastNoteRef.current !== data.note) {
        smootherRef.current.reset();
        lastNoteRef.current = data.note;
      }
      
      const smoothed = smootherRef.current.update(data.cents);
      setSmoothedCents(Math.round(smoothed));
      setPitchData(data);
    }

    rafIdRef.current = requestAnimationFrame(analyze);
  }, [referenceA4]);

  // -----------------------------------------------------------------------
  // Start listening – PROVEN iOS Safari unlock sequence
  // -----------------------------------------------------------------------
  const startListening = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;

    try {
      setError(null);
      smootherRef.current.reset();
      
      // STEP 1: Create AudioContext with webkit fallback
      const ACtor = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
      const ctx = new ACtor();

      // STEP 2: Play silent buffer to unlock iOS audio
      const silentBuf = ctx.createBuffer(1, 1, ctx.sampleRate);
      const silentSrc = ctx.createBufferSource();
      silentSrc.buffer = silentBuf;
      silentSrc.connect(ctx.destination);
      silentSrc.start(0);

      // STEP 3: Resume and WAIT
      if (ctx.state !== 'running') {
        await ctx.resume();
      }

      // Handle iOS re-suspending the context
      ctx.onstatechange = () => {
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
      };

      audioContextRef.current = ctx;

      // STEP 4: ONLY NOW request microphone
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: { 
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false
          } 
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      mediaStreamRef.current = stream;

      // STEP 5: Verify the track is live
      const track = stream.getAudioTracks()[0];
      if (!track || track.readyState !== 'live') {
        throw new Error('Microphone track is not live');
      }

      // STEP 6: source → analyser ONLY (no destination connection)
      const source = ctx.createMediaStreamSource(stream);
      sourceNodeRef.current = source;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 4096;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;
      
      bufferRef.current = new Float32Array(analyser.fftSize) as Float32Array<ArrayBuffer>;
      
      setIsListening(true);
      analyze();
    } catch (err) {
      setError('Mikrofonzugriff nicht möglich. Bitte erlaube den Zugriff auf dein Mikrofon.');
      console.error('Pitch detection error:', err);
      startedRef.current = false;
    }
  }, [analyze]);

  const stopListening = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    bufferRef.current = null;
    smootherRef.current.reset();
    startedRef.current = false;
    setIsListening(false);
    setPitchData(null);
    setSmoothedCents(0);
  }, []);

  useEffect(() => {
    return () => { stopListening(); };
  }, [stopListening]);

  // Visibility change: suspend/resume AudioContext
  useEffect(() => {
    const handleVisibility = () => {
      const ctx = audioContextRef.current;
      if (!ctx) return;
      if (document.hidden) {
        ctx.suspend().catch(() => {});
      } else if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  return { isListening, pitchData, smoothedCents, error, startListening, stopListening };
}
