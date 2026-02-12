import { useState, useRef, useCallback, useEffect } from 'react';

// ---------------------------------------------------------------------------
// iOS / iPadOS detection
// ---------------------------------------------------------------------------
export function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  // iPad in desktop mode reports "Macintosh" but has touch support
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  if (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return true;
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

interface UseGamePitchDetectionResult {
  isListening: boolean;
  isMicActive: boolean;
  pitchData: GamePitchData | null;
  error: string | null;
  startListening: () => Promise<void>;
  stopListening: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Autocorrelation-based pitch detection.
 * `sampleRate` is passed explicitly so it works with any rate (44100 / 48000).
 */
function autoCorrelate(
  buffer: Float32Array<ArrayBufferLike>,
  sampleRate: number,
): { frequency: number; rms: number } {
  const SIZE = buffer.length;
  const MAX_SAMPLES = Math.floor(SIZE / 2);
  let bestOffset = -1;
  let bestCorrelation = 0;
  let rms = 0;
  let foundGoodCorrelation = false;

  for (let i = 0; i < SIZE; i++) {
    rms += buffer[i] * buffer[i];
  }
  rms = Math.sqrt(rms / SIZE);

  if (rms < 0.005) return { frequency: -1, rms };

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
      const shift =
        (lastCorrelation - correlation) /
        (2 * (lastCorrelation - 2 * bestCorrelation + correlation));
      return { frequency: sampleRate / (bestOffset + shift), rms };
    }
    lastCorrelation = correlation;
  }

  if (bestCorrelation > 0.01) {
    return { frequency: sampleRate / bestOffset, rms };
  }
  return { frequency: -1, rms };
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
// Adaptive constants per platform
// ---------------------------------------------------------------------------
const IOS = isIOSDevice();
/** iOS needs bigger buffers for stable pitch detection */
const FFT_SIZE = IOS ? 8192 : 4096;
/** On iOS the confidence threshold is multiplied by this factor (softer) */
const CONFIDENCE_FACTOR = IOS ? 0.6 : 1.0;
const STABILITY_MS = 100;
/** After this many silent frames (~1 s at 60 fps) show a warning */
const SILENT_WARN_FRAMES = 60;
/** After this many silent frames (~2 s) reinitialise the AudioContext */
const SILENT_REINIT_FRAMES = 120;

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

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const bufferRef = useRef<Float32Array<ArrayBuffer> | null>(null);

  // Stability tracking – prevent note flicker (hysteresis)
  const stableNoteRef = useRef<number | null>(null);
  const stableStartRef = useRef<number>(0);

  // Silent-frame tracking (Safari failsafe)
  const silentFramesRef = useRef<number>(0);
  const reinitCountRef = useRef<number>(0);

  // Effective threshold: softer on iOS
  const effectiveThreshold = confidenceThreshold * CONFIDENCE_FACTOR;

  // -----------------------------------------------------------------------
  // Internal: reinitialise AudioContext (Safari failsafe)
  // -----------------------------------------------------------------------
  const reinitAudioContext = useCallback(async () => {
    if (!mediaStreamRef.current) return;
    // Tear down old context
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch { /* ignore */ }
    }

    const ACtor = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
    const ctx = new ACtor();
    await ctx.resume(); // mandatory on iOS

    const analyser = ctx.createAnalyser();
    analyser.fftSize = FFT_SIZE;

    const gain = ctx.createGain();
    gain.gain.value = 1.0;

    const source = ctx.createMediaStreamSource(mediaStreamRef.current);
    // Chain: Mic → GainNode → AnalyserNode (GainNode stabilises iOS pipeline)
    source.connect(gain);
    gain.connect(analyser);

    audioContextRef.current = ctx;
    analyserRef.current = analyser;
    gainNodeRef.current = gain;
      bufferRef.current = new Float32Array(analyser.fftSize) as Float32Array<ArrayBuffer>;
    silentFramesRef.current = 0;
  }, []);

  // -----------------------------------------------------------------------
  // Analysis loop
  // -----------------------------------------------------------------------
  const analyze = useCallback(() => {
    if (!analyserRef.current || !bufferRef.current || !audioContextRef.current) return;

    analyserRef.current.getFloatTimeDomainData(bufferRef.current);
    const { frequency, rms } = autoCorrelate(
      bufferRef.current,
      audioContextRef.current.sampleRate, // always use actual rate (44100 / 48000)
    );

    // --- Silent-frame detection (Safari failsafe) ---
    if (rms < 0.001) {
      silentFramesRef.current++;
      setIsMicActive(false);

      if (silentFramesRef.current === SILENT_WARN_FRAMES) {
        setError('🎤 Bitte näher ins Mikrofon spielen');
      }

      if (silentFramesRef.current >= SILENT_REINIT_FRAMES && reinitCountRef.current < 3) {
        reinitCountRef.current++;
        silentFramesRef.current = 0;
        reinitAudioContext();
      }
    } else {
      silentFramesRef.current = 0;
      setIsMicActive(true);
      // Clear the "play closer" warning once signal is back
      setError(prev => prev === '🎤 Bitte näher ins Mikrofon spielen' ? null : prev);
    }

    // --- Pitch detection ---
    if (frequency > 50 && frequency < 2000 && rms >= effectiveThreshold) {
      const { midi: concertMidi, cents } = frequencyToMidi(frequency, calibrationCents);

      // Bb transposition: written = concert + 2 semitones
      const writtenMidi = concertMidi + 2;

      const now = performance.now();
      // Hysteresis: note must be stable for STABILITY_MS before it counts
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

    rafIdRef.current = requestAnimationFrame(analyze);
  }, [calibrationCents, effectiveThreshold, reinitAudioContext]);

  // -----------------------------------------------------------------------
  // Start listening – MUST be called from a user gesture on iOS
  // -----------------------------------------------------------------------
  const startListening = useCallback(async () => {
    try {
      setError(null);
      stableNoteRef.current = null;
      silentFramesRef.current = 0;
      reinitCountRef.current = 0;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      mediaStreamRef.current = stream;

      // Use webkitAudioContext fallback for older Safari
      const ACtor = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
      const ctx = new ACtor();
      // Explicit resume – mandatory on iOS to leave "suspended" state
      await ctx.resume();

      const analyser = ctx.createAnalyser();
      analyser.fftSize = FFT_SIZE;

      // GainNode stabilises the audio pipeline on iOS even at gain=1
      const gain = ctx.createGain();
      gain.gain.value = 1.0;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(gain);
      gain.connect(analyser);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      gainNodeRef.current = gain;
      bufferRef.current = new Float32Array(analyser.fftSize) as Float32Array<ArrayBuffer>;

      setIsListening(true);
      analyze();
    } catch {
      setError('Mikrofonzugriff nicht möglich. Bitte erlaube den Zugriff.');
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
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    gainNodeRef.current = null;
    bufferRef.current = null;
    stableNoteRef.current = null;
    silentFramesRef.current = 0;
    setIsListening(false);
    setIsMicActive(false);
    setPitchData(null);
  }, []);

  useEffect(() => {
    return () => { stopListening(); };
  }, [stopListening]);

  return { isListening, isMicActive, pitchData, error, startListening, stopListening };
}
