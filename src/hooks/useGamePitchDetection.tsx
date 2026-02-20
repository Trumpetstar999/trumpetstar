import { useState, useRef, useCallback, useEffect } from 'react';

// ---------------------------------------------------------------------------
// FIX 2: Improved iOS / iPadOS detection
// ---------------------------------------------------------------------------
export function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) return true;
  // iPadOS 13+ reports as Macintosh — check touch support
  if (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1) return true;
  // Additional check: Safari on iPadOS may not have 'chrome' in userAgent
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
  // FIX 5: Additional debug fields
  iosPath: string;           // 'Worklet' | 'ScriptProcessor' | 'AnalyserFallback' | 'N/A'
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
// FIX 4: Lower RMS silence threshold for iOS
const RMS_SILENCE = IOS ? 0.0005 : 0.005;
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
  const scriptNodeRef = useRef<ScriptProcessorNode | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const startedRef = useRef(false);

  // iOS ring-buffer for ScriptProcessor frame collection
  const ringBufferRef = useRef<Float32Array | null>(null);
  const ringWriteRef = useRef<number>(0);
  const ringTargetRef = useRef<number>(0);

  // Stability tracking
  const stableNoteRef = useRef<number | null>(null);
  const stableStartRef = useRef<number>(0);

  // Debug counters
  const frameCountRef = useRef<number>(0);
  const scriptFireCountRef = useRef<number>(0);
  const lastRmsRef = useRef<number>(0);
  const lastFreqRef = useRef<number>(0);
  const maxAmplitudeRef = useRef<number>(0);
  const iosPathRef = useRef<string>('N/A');
  const watchdogTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const effectiveThreshold = confidenceThreshold * CONFIDENCE_FACTOR;

  const calibrationCentsRef = useRef(calibrationCents);
  calibrationCentsRef.current = calibrationCents;
  const effectiveThresholdRef = useRef(effectiveThreshold);
  effectiveThresholdRef.current = effectiveThreshold;

  // -----------------------------------------------------------------------
  // Shared pitch processing logic
  // -----------------------------------------------------------------------
  const processPitchRef = useRef<(frequency: number, rms: number, sampleRate: number) => void>(() => {});

  processPitchRef.current = (frequency: number, rms: number, sampleRate: number) => {
    frameCountRef.current++;
    lastRmsRef.current = rms;
    lastFreqRef.current = frequency > 0 ? frequency : 0;

    // Update debug info every 10 frames
    if (frameCountRef.current % 10 === 0) {
      const ctx = audioContextRef.current;
      const track = mediaStreamRef.current?.getAudioTracks()[0];
      setDebugInfo({
        audioContextState: ctx?.state ?? 'closed',
        sampleRate: ctx?.sampleRate ?? 0,
        trackState: track?.readyState ?? 'none',
        trackMuted: track?.muted ?? false,
        rms: lastRmsRef.current,
        frequency: lastFreqRef.current,
        frameCount: frameCountRef.current,
        iosPath: iosPathRef.current,
        scriptFireCount: scriptFireCountRef.current,
        maxAmplitude: maxAmplitudeRef.current,
      });
    }

    // Debug: log first 10 frames
    if (frameCountRef.current <= 10) {
      console.log(`[PitchDetect] frame=${frameCountRef.current} rms=${rms.toFixed(4)} freq=${frequency.toFixed(1)} platform=${IOS ? 'iOS' : 'desktop'} path=${iosPathRef.current}`);
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
  // Desktop / Fallback: AnalyserNode + rAF loop
  // -----------------------------------------------------------------------
  const analyzeWithAnalyser = useCallback(() => {
    if (!analyserRef.current || !bufferRef.current || !audioContextRef.current) return;

    analyserRef.current.getFloatTimeDomainData(bufferRef.current!);

    const { frequency, rms } = autoCorrelate(bufferRef.current!, audioContextRef.current.sampleRate);
    processPitchRef.current(frequency, rms, audioContextRef.current.sampleRate);

    rafIdRef.current = requestAnimationFrame(analyzeWithAnalyser);
  }, []);

  // -----------------------------------------------------------------------
  // Helper: set up AnalyserNode path (used for desktop and iOS fallback)
  // -----------------------------------------------------------------------
  const setupAnalyserPath = useCallback((ctx: AudioContext, source: MediaStreamAudioSourceNode, label: string) => {
    const analyser = ctx.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    analyser.smoothingTimeConstant = 0;
    source.connect(analyser);
    analyserRef.current = analyser;
    bufferRef.current = new Float32Array(analyser.fftSize);

    iosPathRef.current = label;
    console.log(`[PitchDetect] ${label} AnalyserNode started`, {
      sampleRate: ctx.sampleRate,
      fftSize: FFT_SIZE,
    });

    // Start the rAF loop
    analyzeWithAnalyser();
  }, [analyzeWithAnalyser]);

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
      scriptFireCountRef.current = 0;
      maxAmplitudeRef.current = 0;
      iosPathRef.current = 'N/A';

      console.log('[PitchDetect] Starting...', { IOS, ua: navigator.userAgent.substring(0, 80) });

      // STEP 1: Create AudioContext
      const ACtor = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
      const ctx = new ACtor();
      console.log('[PitchDetect] AudioContext created, state:', ctx.state, 'sampleRate:', ctx.sampleRate);

      // STEP 2: Play silent buffer to unlock iOS audio hardware
      const silentBuf = ctx.createBuffer(1, 1, ctx.sampleRate);
      const silentSrc = ctx.createBufferSource();
      silentSrc.buffer = silentBuf;
      silentSrc.connect(ctx.destination);
      silentSrc.start(0);
      console.log('[PitchDetect] Silent buffer played');

      // STEP 3: Resume AudioContext
      if (ctx.state !== 'running') {
        await ctx.resume();
        console.log('[PitchDetect] AudioContext resumed, state:', ctx.state);
      }

      ctx.onstatechange = () => {
        console.log('[PitchDetect] AudioContext state changed:', ctx.state);
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
      };

      audioContextRef.current = ctx;

      // STEP 4: Request microphone
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

      // STEP 5: Verify audio track
      const track = stream.getAudioTracks()[0];
      if (!track || track.readyState !== 'live') {
        throw new Error('Microphone track is not live');
      }
      console.log('[PitchDetect] Track settings:', JSON.stringify(track.getSettings()));

      // STEP 6: Create source
      const source = ctx.createMediaStreamSource(stream);
      sourceNodeRef.current = source;

      if (IOS) {
        // ---- iOS: Try AudioWorklet first, fall back to ScriptProcessor ----
        let iosStarted = false;

        // FIX 1: AudioWorklet attempt
        try {
          if (ctx.audioWorklet) {
            const workletCode = `
class PitchProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = [];
    this.targetSamples = Math.ceil(sampleRate * 0.2);
  }
  process(inputs) {
    const input = inputs[0][0];
    if (!input) return true;
    let maxAmp = 0;
    for (let i = 0; i < input.length; i++) {
      this.buffer.push(input[i]);
      const abs = Math.abs(input[i]);
      if (abs > maxAmp) maxAmp = abs;
    }
    if (this.buffer.length >= this.targetSamples) {
      this.port.postMessage({ samples: new Float32Array(this.buffer), maxAmp });
      this.buffer = [];
    }
    return true;
  }
}
registerProcessor('pitch-processor', PitchProcessor);
`;
            const blob = new Blob([workletCode], { type: 'application/javascript' });
            const workletUrl = URL.createObjectURL(blob);
            await ctx.audioWorklet.addModule(workletUrl);
            URL.revokeObjectURL(workletUrl);

            const workletNode = new AudioWorkletNode(ctx, 'pitch-processor');
            source.connect(workletNode);
            workletNode.connect(ctx.destination); // must connect to destination on iOS

            workletNode.port.onmessage = (e: MessageEvent) => {
              const { samples, maxAmp } = e.data;
              if (maxAmp > maxAmplitudeRef.current) maxAmplitudeRef.current = maxAmp;
              scriptFireCountRef.current++;
              const { frequency, rms } = autoCorrelate(samples, ctx.sampleRate);
              processPitchRef.current(frequency, rms, ctx.sampleRate);
            };

            workletNodeRef.current = workletNode;
            iosPathRef.current = 'Worklet';
            iosStarted = true;

            console.log('[PitchDetect] iOS AudioWorklet started', {
              sampleRate: ctx.sampleRate,
            });
          }
        } catch (workletErr) {
          console.warn('[PitchDetect] AudioWorklet failed, falling back to ScriptProcessor', workletErr);
        }

        // ScriptProcessor fallback
        if (!iosStarted) {
          const scriptNode = ctx.createScriptProcessor(IOS_SCRIPT_BUFFER, 1, 1);
          const samplesPerFrame = Math.ceil((ctx.sampleRate * IOS_FRAME_MS) / 1000);

          const ring = new Float32Array(samplesPerFrame + IOS_SCRIPT_BUFFER);
          ringBufferRef.current = ring;
          ringWriteRef.current = 0;
          ringTargetRef.current = samplesPerFrame;

          scriptNode.onaudioprocess = (event: AudioProcessingEvent) => {
            const input = event.inputBuffer.getChannelData(0);
            const len = input.length;
            scriptFireCountRef.current++;

            if (scriptFireCountRef.current <= 5) {
              let maxVal = 0;
              for (let i = 0; i < len; i++) {
                const abs = Math.abs(input[i]);
                if (abs > maxVal) maxVal = abs;
              }
              if (maxVal > maxAmplitudeRef.current) maxAmplitudeRef.current = maxVal;
              console.log(`[PitchDetect:iOS] scriptFire=${scriptFireCountRef.current} inputLen=${len} maxAbs=${maxVal.toFixed(6)}`);
            }

            for (let i = 0; i < len; i++) {
              const abs = Math.abs(input[i]);
              if (abs > maxAmplitudeRef.current) maxAmplitudeRef.current = abs;

              ring[ringWriteRef.current] = input[i];
              ringWriteRef.current++;

              if (ringWriteRef.current >= samplesPerFrame) {
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

          source.connect(scriptNode);
          scriptNode.connect(ctx.destination);
          scriptNodeRef.current = scriptNode;
          iosPathRef.current = 'ScriptProcessor';

          console.log('[PitchDetect] iOS ScriptProcessor started', {
            sampleRate: ctx.sampleRate,
            bufferSize: IOS_SCRIPT_BUFFER,
            frameSamples: samplesPerFrame,
          });
        }

        // FIX 3: Watchdog — fall back to AnalyserNode if no frames after 3s
        watchdogTimerRef.current = setTimeout(() => {
          if (frameCountRef.current === 0 && audioContextRef.current?.state === 'running') {
            console.warn('[PitchDetect] iOS path produced no frames after 3s — falling back to AnalyserNode');

            // Disconnect current iOS nodes
            if (workletNodeRef.current) {
              try { workletNodeRef.current.disconnect(); } catch (_) {}
              workletNodeRef.current = null;
            }
            if (scriptNodeRef.current) {
              try { scriptNodeRef.current.disconnect(); } catch (_) {}
              scriptNodeRef.current = null;
            }

            // Re-connect source to AnalyserNode path
            const src = sourceNodeRef.current;
            const context = audioContextRef.current;
            if (src && context) {
              setupAnalyserPath(context, src, 'AnalyserFallback');
            }
          }
        }, 3000);

      } else {
        // ---- Desktop: source → analyser ONLY ----
        iosPathRef.current = 'N/A';
        setupAnalyserPath(ctx, source, 'N/A');
      }

      // STEP 7: Verify data is flowing (desktop)
      if (!IOS && analyserRef.current) {
        const testBuf = new Float32Array(analyserRef.current.fftSize);
        analyserRef.current.getFloatTimeDomainData(testBuf);
        const hasSignal = testBuf.some(v => v !== 0);
        console.log('[PitchDetect] Signal check:', hasSignal, 'Sample rate:', ctx.sampleRate);
      }

      setIsListening(true);
    } catch (err: any) {
      console.error('[PitchDetect] Error:', err);
      setError('Mikrofonzugriff nicht möglich. Bitte erlaube den Zugriff.');
      startedRef.current = false;
    }
  }, [analyzeWithAnalyser, setupAnalyserPath]);

  // -----------------------------------------------------------------------
  // Stop listening
  // -----------------------------------------------------------------------
  const stopListening = useCallback(() => {
    if (watchdogTimerRef.current) {
      clearTimeout(watchdogTimerRef.current);
      watchdogTimerRef.current = null;
    }
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    if (workletNodeRef.current) {
      try { workletNodeRef.current.disconnect(); } catch (_) {}
      workletNodeRef.current = null;
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
    bufferRef.current = null;
    ringBufferRef.current = null;
    ringWriteRef.current = 0;
    stableNoteRef.current = null;
    startedRef.current = false;
    setIsListening(false);
    setIsMicActive(false);
    setPitchData(null);
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

  return { isListening, isMicActive, pitchData, error, debugInfo, startListening, stopListening };
}
