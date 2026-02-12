import { useState, useRef, useCallback, useEffect } from 'react';

// ---------------------------------------------------------------------------
// iOS / iPadOS detection
// ---------------------------------------------------------------------------
export function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
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

const IOS = isIOSDevice();

// ---------------------------------------------------------------------------
// Adaptive constants per platform
// ---------------------------------------------------------------------------
const FFT_SIZE = IOS ? 8192 : 4096;
const CONFIDENCE_FACTOR = IOS ? 0.6 : 1.0;
const CORRELATION_THRESHOLD = IOS ? 0.75 : 0.9;
const RMS_SILENCE = IOS ? 0.002 : 0.005;
const STABILITY_MS = IOS ? 120 : 100;
const SILENT_WARN_FRAMES = 60;
const SILENT_REINIT_FRAMES = 120;

/** On iOS we collect ~200ms of samples before running autocorrelation */
const IOS_FRAME_MS = 200;
const IOS_SCRIPT_BUFFER = 4096;

// ---------------------------------------------------------------------------
// Autocorrelation pitch detection
// ---------------------------------------------------------------------------
function autoCorrelate(
  buffer: Float32Array<any>,
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

  if (rms < RMS_SILENCE) return { frequency: -1, rms };

  const MIN_OFFSET = Math.floor(sampleRate / 2000);
  let lastCorrelation = 1;
  for (let offset = MIN_OFFSET; offset < MAX_SAMPLES; offset++) {
    let correlation = 0;
    for (let i = 0; i < MAX_SAMPLES; i++) {
      correlation += Math.abs(buffer[i] - buffer[i + offset]);
    }
    correlation = 1 - correlation / MAX_SAMPLES;

    if (correlation > CORRELATION_THRESHOLD && correlation > lastCorrelation) {
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
  const scriptNodeRef = useRef<ScriptProcessorNode | null>(null);

  // iOS ring-buffer for frame collection
  const ringBufferRef = useRef<Float32Array | null>(null);
  const ringWriteRef = useRef<number>(0);
  const ringTargetRef = useRef<number>(0); // samples needed for one analysis frame

  // Stability tracking
  const stableNoteRef = useRef<number | null>(null);
  const stableStartRef = useRef<number>(0);

  // Silent-frame tracking
  const silentFramesRef = useRef<number>(0);
  const reinitCountRef = useRef<number>(0);

  const effectiveThreshold = confidenceThreshold * CONFIDENCE_FACTOR;

  // -----------------------------------------------------------------------
  // Shared pitch processing logic
  // -----------------------------------------------------------------------
  const processPitch = useCallback((frequency: number, rms: number, sampleRate: number) => {
    // Silent detection
    if (rms < 0.001) {
      silentFramesRef.current++;
      setIsMicActive(false);
      if (silentFramesRef.current === SILENT_WARN_FRAMES) {
        setError('🎤 Bitte näher ins Mikrofon spielen');
      }
      return;
    }

    silentFramesRef.current = 0;
    setIsMicActive(true);
    setError(prev => prev === '🎤 Bitte näher ins Mikrofon spielen' ? null : prev);

    if (frequency > 50 && frequency < 2000 && rms >= effectiveThreshold) {
      const { midi: concertMidi, cents } = frequencyToMidi(frequency, calibrationCents);
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
  }, [calibrationCents, effectiveThreshold]);

  // -----------------------------------------------------------------------
  // Desktop: AnalyserNode + rAF loop
  // -----------------------------------------------------------------------
  const analyzeDesktop = useCallback(() => {
    if (!analyserRef.current || !bufferRef.current || !audioContextRef.current) return;

    analyserRef.current.getFloatTimeDomainData(bufferRef.current);
    const { frequency, rms } = autoCorrelate(bufferRef.current as Float32Array<ArrayBufferLike>, audioContextRef.current.sampleRate);
    processPitch(frequency, rms, audioContextRef.current.sampleRate);

    rafIdRef.current = requestAnimationFrame(analyzeDesktop);
  }, [processPitch]);

  // -----------------------------------------------------------------------
  // Start listening
  // -----------------------------------------------------------------------
  const startListening = useCallback(async () => {
    try {
      setError(null);
      stableNoteRef.current = null;
      silentFramesRef.current = 0;
      reinitCountRef.current = 0;

      // --- getUserMedia ---
      const audioConstraints: MediaTrackConstraints = IOS
        ? {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            channelCount: 1,
            sampleRate: { ideal: 48000 } as any,
          }
        : { echoCancellation: false, noiseSuppression: false, autoGainControl: false };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      mediaStreamRef.current = stream;

      // --- AudioContext ---
      const ACtor = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
      const ctxOptions: AudioContextOptions = IOS
        ? { latencyHint: 'playback', sampleRate: 48000 }
        : {};
      const ctx = new ACtor(ctxOptions);
      await ctx.resume();

      const gain = ctx.createGain();
      gain.gain.value = 1.0;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(gain);

      audioContextRef.current = ctx;
      gainNodeRef.current = gain;

      if (IOS) {
        // ---- iOS: ScriptProcessorNode path ----
        const scriptNode = ctx.createScriptProcessor(IOS_SCRIPT_BUFFER, 1, 1);
        const samplesPerFrame = Math.ceil((ctx.sampleRate * IOS_FRAME_MS) / 1000);
        const ringSize = samplesPerFrame * 2; // double-buffer
        ringBufferRef.current = new Float32Array(ringSize);
        ringWriteRef.current = 0;
        ringTargetRef.current = samplesPerFrame;

        scriptNode.onaudioprocess = (event: AudioProcessingEvent) => {
          const input = event.inputBuffer.getChannelData(0);
          const ring = ringBufferRef.current!;
          const len = input.length;

          // Copy incoming samples into ring buffer
          for (let i = 0; i < len; i++) {
            ring[ringWriteRef.current] = input[i];
            ringWriteRef.current++;

            if (ringWriteRef.current >= ringTargetRef.current) {
              // We have enough samples – run analysis
              const frame = new Float32Array(ring.buffer.slice(0, ringWriteRef.current * 4));
              const { frequency, rms } = autoCorrelate(frame, ctx.sampleRate);
              processPitch(frequency, rms, ctx.sampleRate);
              ringWriteRef.current = 0;
            }
          }

          // Output silence
          const output = event.outputBuffer.getChannelData(0);
          for (let i = 0; i < output.length; i++) output[i] = 0;
        };

        gain.connect(scriptNode);
        scriptNode.connect(ctx.destination); // must connect to destination on iOS
        scriptNodeRef.current = scriptNode;

        console.log('[PitchDetection] iOS ScriptProcessor started', {
          sampleRate: ctx.sampleRate, bufferSize: IOS_SCRIPT_BUFFER,
          frameSamples: samplesPerFrame, frameMs: IOS_FRAME_MS,
          stabilityMs: STABILITY_MS, correlationThreshold: CORRELATION_THRESHOLD,
        });
      } else {
        // ---- Desktop: AnalyserNode + rAF path ----
        const analyser = ctx.createAnalyser();
        analyser.fftSize = FFT_SIZE;
        analyser.smoothingTimeConstant = 0;
        gain.connect(analyser);
        analyserRef.current = analyser;
        bufferRef.current = new Float32Array(analyser.fftSize);

        console.log('[PitchDetection] Desktop AnalyserNode started', {
          sampleRate: ctx.sampleRate, fftSize: FFT_SIZE,
          stabilityMs: STABILITY_MS, correlationThreshold: CORRELATION_THRESHOLD,
        });

        analyzeDesktop();
      }

      setIsListening(true);
    } catch {
      setError('Mikrofonzugriff nicht möglich. Bitte erlaube den Zugriff.');
    }
  }, [analyzeDesktop, processPitch]);

  // -----------------------------------------------------------------------
  // Stop listening
  // -----------------------------------------------------------------------
  const stopListening = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    if (scriptNodeRef.current) {
      scriptNodeRef.current.disconnect();
      scriptNodeRef.current = null;
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
    ringBufferRef.current = null;
    ringWriteRef.current = 0;
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
