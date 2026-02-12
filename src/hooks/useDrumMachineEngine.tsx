import { useRef, useCallback, useState } from 'react';

interface DrumBeat {
  id: string;
  title: string;
  file_url: string;
  native_bpm: number | null;
}

export function useDrumMachineEngine() {
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const bufferCacheRef = useRef<Map<string, AudioBuffer>>(new Map());
  const currentBeatIdRef = useRef<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const getCtx = useCallback(async () => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext({ latencyHint: 'playback' });
    }
    if (ctxRef.current.state !== 'running') {
      await ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const loadBuffer = useCallback(async (fileUrl: string): Promise<AudioBuffer> => {
    const cached = bufferCacheRef.current.get(fileUrl);
    if (cached) return cached;

    const ctx = await getCtx();
    const response = await fetch(fileUrl);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    bufferCacheRef.current.set(fileUrl, audioBuffer);
    return audioBuffer;
  }, [getCtx]);

  const startSource = useCallback((buffer: AudioBuffer, bpm: number, nativeBpm: number | null, volume: number) => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.1);
    gain.connect(ctx.destination);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    
    if (nativeBpm && nativeBpm > 0) {
      source.playbackRate.value = bpm / nativeBpm;
    }
    
    source.connect(gain);
    source.start(0);

    sourceRef.current = source;
    gainRef.current = gain;
  }, []);

  const start = useCallback(async (beat: DrumBeat, bpm: number, volume: number) => {
    setIsLoading(true);
    try {
      await getCtx();
      const buffer = await loadBuffer(beat.file_url);
      
      // Stop any existing source
      if (sourceRef.current) {
        try {
          const oldGain = gainRef.current;
          const oldSource = sourceRef.current;
          if (oldGain && ctxRef.current) {
            oldGain.gain.linearRampToValueAtTime(0, ctxRef.current.currentTime + 0.1);
          }
          setTimeout(() => {
            try { oldSource.stop(); } catch {}
          }, 150);
        } catch {}
      }

      startSource(buffer, bpm, beat.native_bpm, volume);
      currentBeatIdRef.current = beat.id;
      setIsRunning(true);
    } catch (error) {
      console.error('Failed to start drum machine:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getCtx, loadBuffer, startSource]);

  const stop = useCallback(() => {
    const ctx = ctxRef.current;
    if (sourceRef.current && gainRef.current && ctx) {
      gainRef.current.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);
      const src = sourceRef.current;
      setTimeout(() => {
        try { src.stop(); } catch {}
      }, 150);
    }
    sourceRef.current = null;
    gainRef.current = null;
    setIsRunning(false);
  }, []);

  const changeBeat = useCallback(async (beat: DrumBeat, bpm: number, volume: number) => {
    if (!isRunning) return;

    setIsLoading(true);
    try {
      const ctx = await getCtx();
      const buffer = await loadBuffer(beat.file_url);

      // Crossfade
      const oldGain = gainRef.current;
      const oldSource = sourceRef.current;

      const newGain = ctx.createGain();
      newGain.gain.setValueAtTime(0, ctx.currentTime);
      newGain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.2);
      newGain.connect(ctx.destination);

      const newSource = ctx.createBufferSource();
      newSource.buffer = buffer;
      newSource.loop = true;
      if (beat.native_bpm && beat.native_bpm > 0) {
        newSource.playbackRate.value = bpm / beat.native_bpm;
      }
      newSource.connect(newGain);
      newSource.start(0);

      // Fade out old
      if (oldGain && ctx) {
        oldGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
      }
      setTimeout(() => {
        try { oldSource?.stop(); } catch {}
      }, 250);

      sourceRef.current = newSource;
      gainRef.current = newGain;
      currentBeatIdRef.current = beat.id;
    } catch (error) {
      console.error('Failed to change beat:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isRunning, getCtx, loadBuffer]);

  const updateBpm = useCallback((bpm: number, nativeBpm: number | null) => {
    if (sourceRef.current && ctxRef.current && nativeBpm && nativeBpm > 0) {
      const newRate = bpm / nativeBpm;
      sourceRef.current.playbackRate.linearRampToValueAtTime(newRate, ctxRef.current.currentTime + 0.05);
    }
  }, []);

  const updateVolume = useCallback((volume: number) => {
    if (gainRef.current && ctxRef.current) {
      gainRef.current.gain.linearRampToValueAtTime(volume, ctxRef.current.currentTime + 0.05);
    }
  }, []);

  const cleanup = useCallback(() => {
    stop();
    if (ctxRef.current) {
      ctxRef.current.close();
      ctxRef.current = null;
    }
    bufferCacheRef.current.clear();
  }, [stop]);

  return { start, stop, changeBeat, updateBpm, updateVolume, cleanup, isRunning, isLoading };
}
