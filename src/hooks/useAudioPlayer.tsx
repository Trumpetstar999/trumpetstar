import { useState, useRef, useCallback, useEffect } from 'react';
import { PitchShifter } from 'soundtouchjs';
import { TRANSPOSITION_OPTIONS } from '@/components/audio/TranspositionSelector';

interface Track {
  id: string;
  display_name: string;
  storage_url: string;
  duration_seconds?: number;
}

interface LoopState {
  enabled: boolean;
  start: number;
  end: number;
}

export function useAudioPlayer() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const pitchShifterRef = useRef<PitchShifter | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const isContextResumedRef = useRef<boolean>(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [tempo, setTempo] = useState(100);
  const [transpositionId, setTranspositionId] = useState('concert');
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [loop, setLoop] = useState<LoopState>({ enabled: false, start: 0, end: 0 });
  const [isLoading, setIsLoading] = useState(false);

  const pausedTimeRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);

  const getSemitones = useCallback((id: string): number => {
    const option = TRANSPOSITION_OPTIONS.find((opt) => opt.id === id);
    return option ? option.semitones : 0;
  }, []);

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);
    }
    return audioContextRef.current;
  }, []);

  const resumeAudioContext = useCallback((): Promise<boolean> => {
    const ctx = initAudioContext();
    if (ctx.state === 'suspended') {
      const resumePromise = ctx.resume();
      isContextResumedRef.current = true;
      return resumePromise.then(() => true).catch((error) => {
        console.error('Failed to resume AudioContext:', error);
        return false;
      });
    }
    isContextResumedRef.current = true;
    return Promise.resolve(true);
  }, [initAudioContext]);

  const updateTime = useCallback(() => {
    if (!pitchShifterRef.current || !isPlaying) return;
    const shifter = pitchShifterRef.current;
    const time = shifter.timePlayed;
    setCurrentTime(time);
    if (loop.enabled && loop.end > loop.start && time >= loop.end) {
      shifter.percentagePlayed = loop.start / duration;
    }
    rafIdRef.current = requestAnimationFrame(updateTime);
  }, [isPlaying, loop.enabled, loop.start, loop.end, duration]);

  useEffect(() => {
    if (isPlaying) {
      rafIdRef.current = requestAnimationFrame(updateTime);
    }
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [isPlaying, updateTime]);

  useEffect(() => {
    if (pitchShifterRef.current) {
      pitchShifterRef.current.tempo = tempo / 100;
    }
  }, [tempo]);

  useEffect(() => {
    if (pitchShifterRef.current) {
      const semitones = getSemitones(transpositionId);
      pitchShifterRef.current.pitchSemitones = semitones;
    }
  }, [transpositionId, getSemitones]);

  const loadTrack = useCallback(async (track: Track) => {
    setIsLoading(true);
    if (pitchShifterRef.current) {
      pitchShifterRef.current.disconnect();
      pitchShifterRef.current = null;
    }
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    const ctx = initAudioContext();
    try {
      const response = await fetch(track.storage_url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      audioBufferRef.current = audioBuffer;
      setDuration(audioBuffer.duration);
      setLoop(prev => ({ ...prev, end: audioBuffer.duration }));
      setCurrentTrack(track);
      setCurrentTime(0);
      setIsPlaying(false);
      pausedTimeRef.current = 0;
      pitchShifterRef.current = null;
    } catch (error) {
      console.error('Error loading track:', error);
    } finally {
      setIsLoading(false);
    }
  }, [initAudioContext]);

  const play = useCallback(() => {
    if (!audioBufferRef.current) return;
    const resumePromise = resumeAudioContext();
    resumePromise.then((resumed) => {
      if (!resumed) return;
      const ctx = audioContextRef.current!;
      if (pausedTimeRef.current >= duration) {
        pausedTimeRef.current = 0;
      }
      if (pitchShifterRef.current) {
        pitchShifterRef.current.disconnect();
      }
      const shifter = new PitchShifter(ctx, audioBufferRef.current!, 16384);
      shifter.tempo = tempo / 100;
      shifter.pitchSemitones = getSemitones(transpositionId);
      shifter.percentagePlayed = pausedTimeRef.current / duration;
      if (gainNodeRef.current) {
        shifter.connect(gainNodeRef.current);
      }
      pitchShifterRef.current = shifter;
      setIsPlaying(true);
    });
  }, [resumeAudioContext, duration, tempo, transpositionId, getSemitones]);

  const pause = useCallback(() => {
    if (!pitchShifterRef.current) return;
    pausedTimeRef.current = pitchShifterRef.current.timePlayed;
    pitchShifterRef.current.disconnect();
    pitchShifterRef.current = null;
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const stop = useCallback(() => {
    if (pitchShifterRef.current) {
      pitchShifterRef.current.disconnect();
      pitchShifterRef.current = null;
    }
    pausedTimeRef.current = 0;
    setCurrentTime(0);
    setIsPlaying(false);
    setLoop(prev => ({ ...prev, enabled: false }));
  }, []);

  const seek = useCallback((time: number) => {
    if (!pitchShifterRef.current || duration === 0) return;
    const clampedTime = Math.max(0, Math.min(time, duration));
    pitchShifterRef.current.percentagePlayed = clampedTime / duration;
    pausedTimeRef.current = clampedTime;
    setCurrentTime(clampedTime);
  }, [duration]);

  const setLoopStart = useCallback((time: number) => {
    setLoop(prev => ({ ...prev, start: Math.min(time, prev.end - 0.1) }));
  }, []);

  const setLoopEnd = useCallback((time: number) => {
    setLoop(prev => ({ ...prev, end: Math.max(time, prev.start + 0.1) }));
  }, []);

  const setLoopStartToCurrent = useCallback(() => {
    setLoopStart(currentTime);
  }, [currentTime, setLoopStart]);

  const setLoopEndToCurrent = useCallback(() => {
    setLoopEnd(currentTime);
  }, [currentTime, setLoopEnd]);

  const toggleLoopEnabled = useCallback(() => {
    setLoop(prev => ({ ...prev, enabled: !prev.enabled }));
  }, []);

  useEffect(() => {
    return () => {
      if (pitchShifterRef.current) {
        pitchShifterRef.current.disconnect();
      }
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    isPlaying, currentTime, duration, tempo, setTempo,
    transpositionId, setTranspositionId, currentTrack, loop,
    isLoading, loadTrack, play, pause, togglePlay, stop, seek,
    setLoopStart, setLoopEnd, setLoopStartToCurrent, setLoopEndToCurrent,
    toggleLoopEnabled,
  };
}
