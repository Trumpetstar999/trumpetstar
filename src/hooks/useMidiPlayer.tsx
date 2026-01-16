import { useState, useCallback, useRef, useEffect } from 'react';
import Soundfont from 'soundfont-player';

interface MidiNote {
  pitch: number; // MIDI pitch (0-127)
  startTime: number; // in seconds
  duration: number; // in seconds
  velocity: number; // 0-127
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
}

interface OSMDSheet {
  SourceMeasures?: Array<{
    AbsoluteTimestamp?: { RealValue: number };
    Duration?: { RealValue: number };
    VerticalSourceStaffEntryContainers?: Array<{
      StaffEntries?: Array<{
        VoiceEntries?: Array<{
          Notes?: Array<{
            Pitch?: {
              getHalfTone: () => number;
            };
            Length?: { RealValue: number };
          }>;
        }>;
      }>;
    }>;
  }>;
}

export function useMidiPlayer(options: MidiPlayerOptions = {}) {
  const {
    tempo = 100,
    volume = 80,
    loopEnabled = false,
    loopStart = 1,
    loopEnd = 1,
    onBarChange,
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
      // Using "trumpet" from the default soundfont (MusyngKite)
      const instrument = await Soundfont.instrument(audioContext, 'trumpet' as any, {
        gain: 2,
        destination: gainNode,
      });

      instrumentRef.current = instrument;
      setState(prev => ({ ...prev, isLoading: false, isReady: true }));
    } catch (error) {
      console.error('Failed to load soundfont:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'MIDI Trompeten-Sound konnte nicht geladen werden',
      }));
    }
  }, []);

  // Parse OSMD sheet to extract MIDI notes
  const parseOSMDSheet = useCallback((osmd: { Sheet?: OSMDSheet }, bpm: number = 120) => {
    if (!osmd?.Sheet?.SourceMeasures) {
      console.warn('No source measures found in OSMD');
      return;
    }

    const notes: MidiNote[] = [];
    const barTimings: { bar: number; startTime: number; endTime: number }[] = [];
    
    // Calculate seconds per beat based on BPM
    const secondsPerBeat = 60 / bpm;
    
    osmd.Sheet.SourceMeasures.forEach((measure, measureIndex) => {
      const measureStartTime = (measure.AbsoluteTimestamp?.RealValue || 0) * 4 * secondsPerBeat;
      const measureDuration = (measure.Duration?.RealValue || 1) * 4 * secondsPerBeat;
      
      barTimings.push({
        bar: measureIndex + 1,
        startTime: measureStartTime,
        endTime: measureStartTime + measureDuration,
      });

      // Extract notes from this measure
      measure.VerticalSourceStaffEntryContainers?.forEach(container => {
        container.StaffEntries?.forEach(staffEntry => {
          staffEntry.VoiceEntries?.forEach(voiceEntry => {
            voiceEntry.Notes?.forEach(note => {
              if (note.Pitch) {
                const halfTone = note.Pitch.getHalfTone();
                // Convert OSMD halftone to MIDI pitch (OSMD uses 0 = C0, MIDI uses 0 = C-1)
                // Adjust by adding 12 to get correct octave
                const midiPitch = halfTone + 12;
                
                const noteDuration = (note.Length?.RealValue || 0.25) * 4 * secondsPerBeat;

                notes.push({
                  pitch: Math.max(0, Math.min(127, midiPitch)),
                  startTime: measureStartTime,
                  duration: noteDuration,
                  velocity: 80,
                });
              }
            });
          });
        });
      });
    });

    notesRef.current = notes;
    barTimingsRef.current = barTimings;

    const totalDuration = barTimings.length > 0 
      ? barTimings[barTimings.length - 1].endTime 
      : 0;

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

  // Play function
  const play = useCallback(() => {
    if (!instrumentRef.current || !audioContextRef.current) {
      console.warn('Instrument not loaded');
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
    let startOffset = offset;
    let endTime = state.duration / tempoFactor;

    // Apply loop if enabled
    if (loopEnabled && barTimingsRef.current.length > 0) {
      const loopStartTime = barTimingsRef.current[loopStart - 1]?.startTime || 0;
      const loopEndTime = barTimingsRef.current[Math.min(loopEnd, barTimingsRef.current.length) - 1]?.endTime || state.duration;
      
      if (offset < loopStartTime / tempoFactor) {
        startOffset = loopStartTime / tempoFactor;
        startTimeRef.current = now - startOffset;
      }
      endTime = loopEndTime / tempoFactor;
    }

    // Schedule notes
    notesRef.current.forEach(note => {
      const noteStartTime = note.startTime / tempoFactor;
      const noteDuration = note.duration / tempoFactor;

      // Skip notes that have already passed or are before loop start
      if (noteStartTime + noteDuration < startOffset) return;
      if (loopEnabled) {
        const loopStartTime = (barTimingsRef.current[loopStart - 1]?.startTime || 0) / tempoFactor;
        const loopEndTime = (barTimingsRef.current[Math.min(loopEnd, barTimingsRef.current.length) - 1]?.endTime || state.duration) / tempoFactor;
        if (noteStartTime < loopStartTime || noteStartTime >= loopEndTime) return;
      }

      const when = now + Math.max(0, noteStartTime - startOffset);
      
      try {
        const playedNote = instrument.play(note.pitch.toString(), when, {
          duration: noteDuration,
          gain: note.velocity / 127,
        });
        scheduledNotesRef.current.push(playedNote as any);
      } catch (e) {
        console.warn('Failed to schedule note:', e);
      }
    });

    setState(prev => ({ ...prev, isPlaying: true }));

    // Animation loop for current time
    const updateTime = () => {
      if (!audioContextRef.current) return;
      
      const elapsed = (audioContextRef.current.currentTime - startTimeRef.current) * (tempo / 100);
      
      // Check if we've reached the end or loop point
      if (loopEnabled && barTimingsRef.current.length > 0) {
        const loopEndTime = barTimingsRef.current[Math.min(loopEnd, barTimingsRef.current.length) - 1]?.endTime || state.duration;
        if (elapsed >= loopEndTime) {
          // Restart from loop start
          stopAllNotes();
          pauseTimeRef.current = barTimingsRef.current[loopStart - 1]?.startTime || 0;
          play();
          return;
        }
      } else if (elapsed >= state.duration) {
        stop();
        return;
      }

      setState(prev => ({ ...prev, currentTime: elapsed }));

      // Update current bar
      if (onBarChange) {
        const currentBar = barTimingsRef.current.findIndex(
          bar => elapsed >= bar.startTime && elapsed < bar.endTime
        );
        if (currentBar >= 0) {
          onBarChange(currentBar + 1);
        }
      }

      animationFrameRef.current = requestAnimationFrame(updateTime);
    };

    animationFrameRef.current = requestAnimationFrame(updateTime);
  }, [tempo, loopEnabled, loopStart, loopEnd, state.duration, onBarChange, stopAllNotes]);

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
    setState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
  }, [stopAllNotes]);

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
    setState(prev => ({ ...prev, currentTime: time }));

    if (wasPlaying) {
      // Small delay to allow state update
      setTimeout(() => play(), 50);
    }
  }, [state.isPlaying, stopAllNotes, play]);

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
