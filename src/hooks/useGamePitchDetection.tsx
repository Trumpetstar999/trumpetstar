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

/** On iOS we collect ~200ms of samples before running autocorrelation */
const IOS_FRAME_MS = 200;
const IOS_SCRIPT_BUFFER = 4096;

// ---------------------------------------------------------------------------
// Autocorrelation pitch detection (AMDF-based)
// ---------------------------------------------------------------------------
function autoCorrelate(
  buffer: Float32Array,
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

  // Skip offsets that correspond to frequencies > 2000 Hz
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
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);

  // iOS ring-buffer for frame collection
  const ringBufferRef = useRef<Float32Array | null>(null);
  const ringWriteRef = useRef<number>(0);
  const ringTargetRef = useRef<number>(0);

  // Stability tracking
  const stableNoteRef = useRef<number | null>(null);
  const stableStartRef = useRef<number>(0);

  // Debug frame counter
  const frameCountRef = useRef<number>(0);
  const scriptFireCountRef = useRef<number>(0);

  const effectiveThreshold = confidenceThreshold * CONFIDENCE_FACTOR;

  // Use refs for values needed inside audio callbacks to avoid stale closures
  const calibrationCentsRef = useRef(calibrationCents);
  calibrationCentsRef.current = calibrationCents;
  const effectiveThresholdRef = useRef(effectiveThreshold);
  effectiveThresholdRef.current = effectiveThreshold;

  // -----------------------------------------------------------------------
  // Shared pitch processing logic – uses REFS to avoid stale closures
  // -----------------------------------------------------------------------
  const processPitchRef = useRef<(frequency: number, rms: number, sampleRate: number) => void>(() => {});

  processPitchRef.current = (frequency: number, rms: number, sampleRate: number) => {
    frameCountRef.current++;

    // Debug: log first 10 frames
    if (frameCountRef.current <= 10) {
      console.log(`[PitchDetect] frame=${frameCountRef.current} rms=${rms.toFixed(4)} freq=${frequency.toFixed(1)} platform=${IOS ? 'iOS' : 'desktop'}`);
    }

    // Silent detection
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
  // Desktop: AnalyserNode + rAF loop
  // -----------------------------------------------------------------------
  const analyzeDesktop = useCallback(() => {
    if (!analyserRef.current || !bufferRef.current || !audioContextRef.current) return;

    analyserRef.current.getFloatTimeDomainData(bufferRef.current!);

    // Byte-data fallback for Safari
    const data: Float32Array = bufferRef.current! as any;
    let allZero = true;
    for (let i = 0; i < data.length; i++) {
      if (data[i] !== 0) { allZero = false; break; }
    }
    if (allZero && analyserRef.current) {
      const byteData = new Uint8Array(analyserRef.current.fftSize);
      analyserRef.current.getByteTimeDomainData(byteData);
      for (let i = 0; i < byteData.length; i++) {
        data[i] = (byteData[i] - 128) / 128;
      }
    }

    const { frequency, rms } = autoCorrelate(data, audioContextRef.current.sampleRate);
    processPitchRef.current(frequency, rms, audioContextRef.current.sampleRate);

    rafIdRef.current = requestAnimationFrame(analyzeDesktop);
  }, []);

  // -----------------------------------------------------------------------
  // Start listening
  // -----------------------------------------------------------------------
  const startListening = useCallback(async () => {
    try {
      setError(null);
      stableNoteRef.current = null;
      frameCountRef.current = 0;
      scriptFireCountRef.current = 0;

      console.log('[PitchDetect] Starting...', { IOS, ua: navigator.userAgent.substring(0, 80) });

      // --- getUserMedia ---
      const audioConstraints: MediaTrackConstraints = {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
        console.log('[PitchDetect] getUserMedia OK with constraints');
      } catch (e) {
        console.warn('[PitchDetect] getUserMedia with constraints failed, trying basic', e);
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('[PitchDetect] getUserMedia OK with basic audio');
      }
      mediaStreamRef.current = stream;

      // Log actual track settings
      const trackSettings = stream.getAudioTracks()[0]?.getSettings();
      console.log('[PitchDetect] Track settings:', JSON.stringify(trackSettings));

      // --- AudioContext ---
      const ACtor = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
      const ctxOptions: AudioContextOptions = IOS
        ? { latencyHint: 'playback' as AudioContextLatencyCategory }
        : {};
      const ctx = new ACtor(ctxOptions);

      console.log('[PitchDetect] AudioContext created, state:', ctx.state, 'sampleRate:', ctx.sampleRate);

      // Resume AudioContext (critical for iOS)
      if (ctx.state === 'suspended') {
        await ctx.resume();
        console.log('[PitchDetect] AudioContext resumed, state:', ctx.state);
      }

      // Handle iOS re-suspending the context (e.g. tab switch, screen lock)
      ctx.onstatechange = () => {
        console.log('[PitchDetect] AudioContext state changed:', ctx.state);
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
      };

      const gain = ctx.createGain();
      gain.gain.value = 1.0;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(gain);

      audioContextRef.current = ctx;
      gainNodeRef.current = gain;
      sourceNodeRef.current = source;

      if (IOS) {
        // ---- iOS: ScriptProcessorNode path ----
        const scriptNode = ctx.createScriptProcessor(IOS_SCRIPT_BUFFER, 1, 1);
        const samplesPerFrame = Math.ceil((ctx.sampleRate * IOS_FRAME_MS) / 1000);

        // Allocate ring buffer
        const ring = new Float32Array(samplesPerFrame + IOS_SCRIPT_BUFFER); // extra space
        ringBufferRef.current = ring;
        ringWriteRef.current = 0;
        ringTargetRef.current = samplesPerFrame;

        scriptNode.onaudioprocess = (event: AudioProcessingEvent) => {
          const input = event.inputBuffer.getChannelData(0);
          const len = input.length;

          scriptFireCountRef.current++;

          // Debug: log first 5 script processor fires
          if (scriptFireCountRef.current <= 5) {
            let maxVal = 0;
            for (let i = 0; i < len; i++) {
              const abs = Math.abs(input[i]);
              if (abs > maxVal) maxVal = abs;
            }
            console.log(`[PitchDetect:iOS] scriptFire=${scriptFireCountRef.current} inputLen=${len} maxAbs=${maxVal.toFixed(6)}`);
          }

          // Copy incoming samples into ring buffer
          for (let i = 0; i < len; i++) {
            ring[ringWriteRef.current] = input[i];
            ringWriteRef.current++;

            if (ringWriteRef.current >= samplesPerFrame) {
              // We have enough samples – run analysis
              const frame = ring.slice(0, ringWriteRef.current);
              const { frequency, rms } = autoCorrelate(frame, ctx.sampleRate);
              processPitchRef.current(frequency, rms, ctx.sampleRate);
              ringWriteRef.current = 0;
            }
          }

          // Output silence
          const output = event.outputBuffer.getChannelData(0);
          for (let i = 0; i < output.length; i++) output[i] = 0;
        };

        gain.connect(scriptNode);
        scriptNode.connect(ctx.destination); // MUST connect to destination on iOS
        scriptNodeRef.current = scriptNode;

        console.log('[PitchDetect] iOS ScriptProcessor started', {
          sampleRate: ctx.sampleRate,
          bufferSize: IOS_SCRIPT_BUFFER,
          frameSamples: samplesPerFrame,
          frameMs: IOS_FRAME_MS,
          stabilityMs: STABILITY_MS,
          correlationThreshold: CORRELATION_THRESHOLD,
          rmsSilence: RMS_SILENCE,
        });
      } else {
        // ---- Desktop: AnalyserNode + rAF path ----
        const analyser = ctx.createAnalyser();
        analyser.fftSize = FFT_SIZE;
        analyser.smoothingTimeConstant = 0;
        gain.connect(analyser);
        analyserRef.current = analyser;
        bufferRef.current = new Float32Array(analyser.fftSize);

        console.log('[PitchDetect] Desktop AnalyserNode started', {
          sampleRate: ctx.sampleRate,
          fftSize: FFT_SIZE,
          stabilityMs: STABILITY_MS,
          correlationThreshold: CORRELATION_THRESHOLD,
        });

        analyzeDesktop();
      }

      setIsListening(true);
    } catch (err: any) {
      console.error('[PitchDetect] Error:', err);
      setError('Mikrofonzugriff nicht möglich. Bitte erlaube den Zugriff.');
    }
  }, [analyzeDesktop]);

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
    gainNodeRef.current = null;
    bufferRef.current = null;
    ringBufferRef.current = null;
    ringWriteRef.current = 0;
    stableNoteRef.current = null;
    setIsListening(false);
    setIsMicActive(false);
    setPitchData(null);
  }, []);

  useEffect(() => {
    return () => { stopListening(); };
  }, [stopListening]);

  // Visibility change: suspend/resume AudioContext when tab hidden or iPad locks
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

  return { isListening, isMicActive, pitchData, error, startListening, stopListening };
}
