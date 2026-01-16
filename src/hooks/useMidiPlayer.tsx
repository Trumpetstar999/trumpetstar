import { useState, useCallback, useRef, useEffect } from 'react';
import Soundfont from 'soundfont-player';

interface MidiNote {
  pitch: number; // MIDI pitch (0-127)
  startTime: number; // in seconds
  duration: number; // in seconds
  velocity: number; // 0-127
  measureIndex: number; // which measure this note is in
}

interface MidiPlayerState {
  isLoading: boolean;
  isReady: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  error: string | null;
}

interface MidiPlayerOptions {
  tempo?: number; // percentage (100 = normal)
  volume?: number; // 0-100
  loopEnabled?: boolean;
  loopStart?: number; // bar number
  loopEnd?: number; // bar number
  onBarChange?: (bar: number) => void;
  onTimeUpdate?: (time: number) => void;
}

export function useMidiPlayer(options: MidiPlayerOptions = {}) {
  const {
    tempo = 100,
    volume = 80,
    loopEnabled = false,
    loopStart = 1,
    loopEnd = 1,
    onBarChange,
    onTimeUpdate,
  } = options;

  const [state, setState] = useState<MidiPlayerState>({
    isLoading: false,
    isReady: false,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    error: null,
  });

  const instrumentRef = useRef<Soundfont.Player | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const notesRef = useRef<MidiNote[]>([]);
  const scheduledNotesRef = useRef<Soundfont.Player[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);
  const barTimingsRef = useRef<{ bar: number; startTime: number; endTime: number }[]>([]);
  const lastReportedBarRef = useRef<number>(0);
  const baseBpmRef = useRef<number>(120);

  // Initialize audio context and load trumpet soundfont
  const initialize = useCallback(async () => {
    if (instrumentRef.current) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Create audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      // Create gain node for volume control
      const gainNode = audioContext.createGain();
      gainNode.connect(audioContext.destination);
      gainNodeRef.current = gainNode;

      // Load trumpet soundfont
      const instrument = await Soundfont.instrument(audioContext, 'trumpet' as any, {
        gain: 2,
        destination: gainNode,
      });

      instrumentRef.current = instrument;
      setState(prev => ({ ...prev, isLoading: false, isReady: true }));
      console.log('[MIDI] Trumpet soundfont loaded successfully');
    } catch (error) {
      console.error('Failed to load soundfont:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'MIDI Trompeten-Sound konnte nicht geladen werden',
      }));
    }
  }, []);

  // Parse OSMD sheet using the cursor/iterator for accurate note extraction
  const parseOSMDSheet = useCallback((osmd: any, bpm: number = 120) => {
    if (!osmd?.Sheet) {
      console.warn('[MIDI] No sheet found in OSMD');
      return;
    }

    baseBpmRef.current = bpm;
    const notes: MidiNote[] = [];
    const barTimings: { bar: number; startTime: number; endTime: number }[] = [];
    
    // Calculate timing from tempo
    const secondsPerBeat = 60 / bpm;
    const secondsPerWholeNote = secondsPerBeat * 4;

    // Get measures from sheet
    const sourceMeasures = osmd.Sheet.SourceMeasures || [];
    console.log(`[MIDI] Found ${sourceMeasures.length} measures`);

    // Build bar timings first
    let currentTime = 0;
    sourceMeasures.forEach((measure: any, measureIndex: number) => {
      const measureDuration = (measure.Duration?.RealValue || 1) * secondsPerWholeNote;
      
      barTimings.push({
        bar: measureIndex + 1,
        startTime: currentTime,
        endTime: currentTime + measureDuration,
      });

      // Extract notes using the vertical containers
      measure.VerticalSourceStaffEntryContainers?.forEach((container: any) => {
        container.StaffEntries?.forEach((staffEntry: any) => {
          // Get the relative position within the measure
          const relativeTimestamp = staffEntry.Timestamp?.RealValue || 0;
          const noteStartTime = currentTime + (relativeTimestamp * secondsPerWholeNote);

          staffEntry.VoiceEntries?.forEach((voiceEntry: any) => {
            voiceEntry.Notes?.forEach((note: any) => {
              // Skip rests
              if (note.isRest?.()) return;
              
              if (note.Pitch) {
                const halfTone = note.Pitch.getHalfTone();
                // OSMD halfTone: C4 = 48, MIDI: C4 = 60
                // So we need to add 12 to convert
                const midiPitch = halfTone + 12;
                
                const noteDuration = (note.Length?.RealValue || 0.25) * secondsPerWholeNote;

                notes.push({
                  pitch: Math.max(0, Math.min(127, midiPitch)),
                  startTime: noteStartTime,
                  duration: Math.max(0.1, noteDuration * 0.9), // Slightly shorter for articulation
                  velocity: 80,
                  measureIndex: measureIndex,
                });
              }
            });
          });
        });
      });

      currentTime += measureDuration;
    });

    // Sort notes by start time
    notes.sort((a, b) => a.startTime - b.startTime);

    notesRef.current = notes;
    barTimingsRef.current = barTimings;

    const totalDuration = currentTime;
    console.log(`[MIDI] Parsed ${notes.length} notes, duration: ${totalDuration.toFixed(2)}s`);

    setState(prev => ({ ...prev, duration: totalDuration }));
  }, []);

  // Update volume
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume / 100;
    }
  }, [volume]);

  // Stop all scheduled notes
  const stopAllNotes = useCallback(() => {
    scheduledNotesRef.current.forEach(note => {
      try {
        note.stop();
      } catch (e) {
        // Ignore if already stopped
      }
    });
    scheduledNotesRef.current = [];
  }, []);

  // Get current bar from time
  const getBarFromTime = useCallback((time: number): number => {
    for (let i = barTimingsRef.current.length - 1; i >= 0; i--) {
      if (time >= barTimingsRef.current[i].startTime) {
        return barTimingsRef.current[i].bar;
      }
    }
    return 1;
  }, []);

  // Play function
  const play = useCallback(() => {
    if (!instrumentRef.current || !audioContextRef.current) {
      console.warn('[MIDI] Instrument not loaded');
      return;
    }

    const audioContext = audioContextRef.current;
    const instrument = instrumentRef.current;
    
    // Resume audio context if suspended
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    const tempoFactor = tempo / 100;
    const now = audioContext.currentTime;
    const offset = pauseTimeRef.current;
    
    startTimeRef.current = now - offset / tempoFactor;

    // Calculate effective time range
    let effectiveStartTime = offset;
    let effectiveEndTime = state.duration;

    // Apply loop if enabled
    if (loopEnabled && barTimingsRef.current.length > 0) {
      const loopStartTime = barTimingsRef.current[loopStart - 1]?.startTime || 0;
      const loopEndTime = barTimingsRef.current[Math.min(loopEnd, barTimingsRef.current.length) - 1]?.endTime || state.duration;
      
      if (offset < loopStartTime) {
        effectiveStartTime = loopStartTime;
        startTimeRef.current = now - effectiveStartTime / tempoFactor;
        pauseTimeRef.current = loopStartTime;
      }
      effectiveEndTime = loopEndTime;
    }

    console.log(`[MIDI] Playing from ${effectiveStartTime.toFixed(2)}s to ${effectiveEndTime.toFixed(2)}s at ${tempo}%`);

    // Schedule notes
    let scheduledCount = 0;
    notesRef.current.forEach(note => {
      const noteStartTime = note.startTime / tempoFactor;
      const noteDuration = note.duration / tempoFactor;

      // Skip notes that have already passed
      if (noteStartTime + noteDuration < effectiveStartTime / tempoFactor) return;
      
      // Skip notes outside loop range
      if (loopEnabled) {
        const loopStartTime = (barTimingsRef.current[loopStart - 1]?.startTime || 0) / tempoFactor;
        const loopEndTime = (barTimingsRef.current[Math.min(loopEnd, barTimingsRef.current.length) - 1]?.endTime || state.duration) / tempoFactor;
        if (noteStartTime < loopStartTime || noteStartTime >= loopEndTime) return;
      }

      // Skip notes after the end
      if (noteStartTime >= effectiveEndTime / tempoFactor) return;

      const when = now + Math.max(0, noteStartTime - effectiveStartTime / tempoFactor);
      
      try {
        const playedNote = instrument.play(note.pitch.toString(), when, {
          duration: noteDuration,
          gain: note.velocity / 127,
        });
        scheduledNotesRef.current.push(playedNote as any);
        scheduledCount++;
      } catch (e) {
        console.warn('[MIDI] Failed to schedule note:', e);
      }
    });

    console.log(`[MIDI] Scheduled ${scheduledCount} notes`);
    setState(prev => ({ ...prev, isPlaying: true }));

    // Animation loop for current time and bar updates
    const updateTime = () => {
      if (!audioContextRef.current) return;
      
      const elapsed = (audioContextRef.current.currentTime - startTimeRef.current) * tempoFactor;
      
      // Check if we've reached the end or loop point
      if (loopEnabled && barTimingsRef.current.length > 0) {
        const loopEndTime = barTimingsRef.current[Math.min(loopEnd, barTimingsRef.current.length) - 1]?.endTime || state.duration;
        if (elapsed >= loopEndTime) {
          // Restart from loop start
          stopAllNotes();
          pauseTimeRef.current = barTimingsRef.current[loopStart - 1]?.startTime || 0;
          lastReportedBarRef.current = 0;
          play();
          return;
        }
      } else if (elapsed >= state.duration) {
        stop();
        return;
      }

      setState(prev => ({ ...prev, currentTime: elapsed }));
      onTimeUpdate?.(elapsed);

      // Update current bar
      const currentBar = getBarFromTime(elapsed);
      if (currentBar !== lastReportedBarRef.current) {
        lastReportedBarRef.current = currentBar;
        onBarChange?.(currentBar);
      }

      animationFrameRef.current = requestAnimationFrame(updateTime);
    };

    animationFrameRef.current = requestAnimationFrame(updateTime);
  }, [tempo, loopEnabled, loopStart, loopEnd, state.duration, onBarChange, onTimeUpdate, stopAllNotes, getBarFromTime]);

  // Pause function
  const pause = useCallback(() => {
    stopAllNotes();
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    pauseTimeRef.current = state.currentTime;
    setState(prev => ({ ...prev, isPlaying: false }));
  }, [state.currentTime, stopAllNotes]);

  // Stop function
  const stop = useCallback(() => {
    stopAllNotes();
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    pauseTimeRef.current = 0;
    lastReportedBarRef.current = 0;
    setState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
    onBarChange?.(1);
  }, [stopAllNotes, onBarChange]);

  // Seek to specific time
  const seekTo = useCallback((time: number) => {
    const wasPlaying = state.isPlaying;
    if (wasPlaying) {
      stopAllNotes();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    pauseTimeRef.current = time;
    lastReportedBarRef.current = 0;
    setState(prev => ({ ...prev, currentTime: time }));

    // Update bar
    const bar = getBarFromTime(time);
    onBarChange?.(bar);

    if (wasPlaying) {
      // Small delay to allow state update
      setTimeout(() => play(), 50);
    }
  }, [state.isPlaying, stopAllNotes, play, getBarFromTime, onBarChange]);

  // Seek to specific bar
  const seekToBar = useCallback((bar: number) => {
    const barTiming = barTimingsRef.current[bar - 1];
    if (barTiming) {
      seekTo(barTiming.startTime);
    }
  }, [seekTo]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllNotes();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopAllNotes]);

  return {
    ...state,
    initialize,
    parseOSMDSheet,
    play,
    pause,
    stop,
    seekTo,
    seekToBar,
  };
}
