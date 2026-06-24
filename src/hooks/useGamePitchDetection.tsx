import { useState, useRef, useCallback, useEffect } from 'react';

// ---------------------------------------------------------------------------
// iOS / iPadOS detection
// ---------------------------------------------------------------------------
export function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) return true;
  if (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1) return true;
  if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface GamePitchData {
  concertFrequency: number;
  concertNote: string;
  concertOctave: number;
  writtenNote: string;
  writtenOctave: number;
  writtenMidi: number;
  cents: number;
  confidence: number;
}

export interface GamePitchDebugInfo {
  audioContextState: string;
  sampleRate: number;
  trackState: string;
  trackMuted: boolean;
  rms: number;
  frequency: number;
  frameCount: number;
  iosPath: string;
  scriptFireCount: number;
  maxAmplitude: number;
}

interface UseGamePitchDetectionResult {
  isListening: boolean;
  isMicActive: boolean;
  pitchData: GamePitchData | null;
  error: string | null;
  debugInfo: GamePitchDebugInfo;
  startListening: () => Promise<void>;
  stopListening: () => void;
}

// ---------------------------------------------------------------------------
// Constants (ported from Tone-Force)
// ---------------------------------------------------------------------------
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const IOS = isIOSDevice();
const FFT_SIZE = 2048;
const RMS_SILENCE = 0.003;
const STABILITY_MS = 120;

// ---------------------------------------------------------------------------
// ACF2+ pitch detector (ported 1:1 from Tone-Force src/lib/pitch.ts)
// Returns { frequency: Hz or -1, rms }
// ---------------------------------------------------------------------------
function detectPitchACF2Plus(
  buf: Float32Array,
  sampleRate: number,
): { frequency: number; rms: number } {
  const SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < RMS_SILENCE) return { frequency: -1, rms };

  let r1 = 0;
  let r2 = SIZE - 1;
  const threshold = 0.2;
  for (let i = 0; i < SIZE / 2; i++) if (Math.abs(buf[i]) < threshold) { r1 = i; break; }
  for (let i = 1; i < SIZE / 2; i++) if (Math.abs(buf[SIZE - i]) < threshold) { r2 = SIZE - i; break; }

  const trimmed = buf.slice(r1, r2);
  const N = trimmed.length;
  if (N <= 0) return { frequency: -1, rms };
  const c = new Float32Array(N).fill(0);
  for (let i = 0; i < N; i++) for (let j = 0; j < N - i; j++) c[i] = c[i] + trimmed[j] * trimmed[j + i];

  let d = 0;
  while (d < N - 1 && c[d] > c[d + 1]) d++;
  let maxval = -1;
  let maxpos = -1;
  for (let i = d; i < N; i++) {
    if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
  }
  let T0 = maxpos;
  if (T0 <= 0) return { frequency: -1, rms };
  if (c[0] > 0 && maxval / c[0] < 0.3) return { frequency: -1, rms };
  const x1 = c[T0 - 1] ?? 0;
  const x2 = c[T0];
  const x3 = c[T0 + 1] ?? 0;
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a) T0 = T0 - b / (2 * a);
  return { frequency: sampleRate / T0, rms };
}

function frequencyToMidi(
  freq: number,
  calibrationCents: number = 0,
): { midi: number; cents: number } {
  const a4 = 440 * Math.pow(2, calibrationCents / 1200);
  const semitones = 12 * Math.log2(freq / a4) + 69;
  const midi = Math.round(semitones);
  const cents = Math.round((semitones - midi) * 100);
  return { midi, cents };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useGamePitchDetection(
  calibrationCents: number = 0,
  confidenceThreshold: number = 0.01,
): UseGamePitchDetectionResult {
  const [isListening, setIsListening] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [pitchData, setPitchData] = useState<GamePitchData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [debugInfo, setDebugInfo] = useState<GamePitchDebugInfo>({
    audioContextState: 'closed',
    sampleRate: 0,
    trackState: 'none',
    trackMuted: false,
    rms: 0,
    frequency: 0,
    frameCount: 0,
    iosPath: 'N/A',
    scriptFireCount: 0,
    maxAmplitude: 0,
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const bufferRef = useRef<Float32Array<ArrayBuffer> | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const startedRef = useRef(false);

  // Stability tracking
  const stableNoteRef = useRef<number | null>(null);
  const stableStartRef = useRef<number>(0);

  // Debug counters
  const frameCountRef = useRef<number>(0);

  const calibrationCentsRef = useRef(calibrationCents);
  calibrationCentsRef.current = calibrationCents;
  const effectiveThresholdRef = useRef(confidenceThreshold);
  effectiveThresholdRef.current = confidenceThreshold;

  // -----------------------------------------------------------------------
  // Shared pitch processing
  // -----------------------------------------------------------------------
  const processPitchRef = useRef<(frequency: number, rms: number) => void>(() => {});

  processPitchRef.current = (frequency: number, rms: number) => {
    frameCountRef.current++;

    if (frameCountRef.current % 10 === 0) {
      const ctx = audioContextRef.current;
      const track = mediaStreamRef.current?.getAudioTracks()[0];
      setDebugInfo({
        audioContextState: ctx?.state ?? 'closed',
        sampleRate: ctx?.sampleRate ?? 0,
        trackState: track?.readyState ?? 'none',
        trackMuted: track?.muted ?? false,
        rms,
        frequency: frequency > 0 ? frequency : 0,
        frameCount: frameCountRef.current,
        iosPath: 'AnalyserNode',
        scriptFireCount: 0,
        maxAmplitude: 0,
      });
    }

    if (frameCountRef.current <= 10) {
      console.log(`[PitchDetect] frame=${frameCountRef.current} rms=${rms.toFixed(4)} freq=${frequency.toFixed(1)} platform=${IOS ? 'iOS' : 'desktop'}`);
    }

    if (rms < 0.001) {
      setIsMicActive(false);
      return;
    }

    setIsMicActive(true);
    setError(prev => prev === '🎤 Bitte näher ins Mikrofon spielen' ? null : prev);

    if (frequency > 50 && frequency < 2000 && rms >= effectiveThresholdRef.current) {
      const { midi: concertMidi, cents } = frequencyToMidi(frequency, calibrationCentsRef.current);
      const writtenMidi = concertMidi + 2;

      const now = performance.now();
      if (stableNoteRef.current !== writtenMidi) {
        stableNoteRef.current = writtenMidi;
        stableStartRef.current = now;
      } else if (now - stableStartRef.current >= STABILITY_MS) {
        const concertNoteIndex = ((concertMidi % 12) + 12) % 12;
        const concertOctave = Math.floor(concertMidi / 12) - 1;
        const writtenNoteIndex = ((writtenMidi % 12) + 12) % 12;
        const writtenOctave = Math.floor(writtenMidi / 12) - 1;

        setPitchData({
          concertFrequency: frequency,
          concertNote: NOTE_NAMES[concertNoteIndex],
          concertOctave,
          writtenNote: NOTE_NAMES[writtenNoteIndex],
          writtenOctave,
          writtenMidi,
          cents,
          confidence: rms,
        });
      }
    }
  };

  // -----------------------------------------------------------------------
  // rAF analysis loop
  // -----------------------------------------------------------------------
  const analyze = useCallback(() => {
    const an = analyserRef.current;
    const ctx = audioContextRef.current;
    const buf = bufferRef.current;
    if (an && ctx && buf) {
      an.getFloatTimeDomainData(buf);
      const { frequency, rms } = detectPitchACF2Plus(buf, ctx.sampleRate);
      processPitchRef.current(frequency, rms);
    }
    rafIdRef.current = requestAnimationFrame(analyze);
  }, []);

  // -----------------------------------------------------------------------
  // Start listening
  // -----------------------------------------------------------------------
  const startListening = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;

    try {
      setError(null);
      stableNoteRef.current = null;
      frameCountRef.current = 0;

      console.log('[PitchDetect] Starting...', { IOS, ua: navigator.userAgent.substring(0, 80) });

      const ACtor = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext) as typeof AudioContext;
      const ctx = new ACtor();
      if (ctx.state === 'suspended') {
        try { await ctx.resume(); } catch { /* ignore */ }
      }
      audioContextRef.current = ctx;

      ctx.onstatechange = () => {
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      };

      // getUserMedia – Tone-Force constraints (AGC on iOS, mono, 48 kHz preference)
      const audioConstraints: MediaTrackConstraints = {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: IOS,
        channelCount: 1,
        sampleRate: 48000,
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
      } catch (e) {
        console.warn('[PitchDetect] getUserMedia with constraints failed, trying basic', e);
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      mediaStreamRef.current = stream;

      const track = stream.getAudioTracks()[0];
      if (!track || track.readyState !== 'live') {
        throw new Error('Microphone track is not live');
      }
      console.log('[PitchDetect] Track settings:', JSON.stringify(track.getSettings()));

      const source = ctx.createMediaStreamSource(stream);
      sourceNodeRef.current = source;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = FFT_SIZE;
      analyser.smoothingTimeConstant = 0;
      source.connect(analyser);
      analyserRef.current = analyser;
      bufferRef.current = new Float32Array(analyser.fftSize);

      console.log('[PitchDetect] AnalyserNode started', {
        sampleRate: ctx.sampleRate,
        fftSize: FFT_SIZE,
      });

      analyze();
      setIsListening(true);
    } catch (err: unknown) {
      console.error('[PitchDetect] Error:', err);
      setError('Mikrofonzugriff nicht möglich. Bitte erlaube den Zugriff.');
      startedRef.current = false;
    }
  }, [analyze]);

  // -----------------------------------------------------------------------
  // Stop listening
  // -----------------------------------------------------------------------
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
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    bufferRef.current = null;
    stableNoteRef.current = null;
    startedRef.current = false;
    setIsListening(false);
    setIsMicActive(false);
    setPitchData(null);
  }, []);

  useEffect(() => {
    return () => { stopListening(); };
  }, [stopListening]);

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

  return { isListening, isMicActive, pitchData, error, debugInfo, startListening, stopListening };
}
