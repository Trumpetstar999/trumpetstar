import { useRef, useCallback, useEffect, useState } from 'react';
import { getScaleNotes, getWeightedNote, SPEED_SETTINGS, midiToStaffPosition } from '@/components/game/constants';
import type { GameSettings } from '@/hooks/useGameSettings';

export interface GameNote {
  id: number;
  midi: number;
  x: number; // position 0-1 (1 = right edge, 0 = left/clef)
  active: boolean;
  hit: boolean;
  missed: boolean;
  hitTime?: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export interface GameState {
  score: number;
  streak: number;
  bestStreak: number;
  lives: number;
  level: number;
  correctCount: number;
  totalCount: number;
  isRunning: boolean;
  isGameOver: boolean;
}

const INITIAL_STATE: GameState = {
  score: 0, streak: 0, bestStreak: 0, lives: 3, level: 1,
  correctCount: 0, totalCount: 0, isRunning: false, isGameOver: false,
};

export function useGameLoop(settings: GameSettings) {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const notesRef = useRef<GameNote[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const nextIdRef = useRef(1);
  const lastSpawnRef = useRef(0);
  const lastTimeRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const scaleNotesRef = useRef<number[]>([]);
  const stateRef = useRef<GameState>(INITIAL_STATE);
  const lastSpawnedMidiRef = useRef<number | null>(null);

  // Sync stateRef
  useEffect(() => { stateRef.current = gameState; }, [gameState]);

  // Update scale notes when settings change
  useEffect(() => {
    scaleNotesRef.current = getScaleNotes(
      settings.key, settings.scaleType, settings.rangeMinMidi, settings.rangeMaxMidi
    );
  }, [settings.key, settings.scaleType, settings.rangeMinMidi, settings.rangeMaxMidi]);

  const getSpeed = useCallback(() => {
    const { baseSpeed, speedMultiplier, speedUpPerLevel } = SPEED_SETTINGS;
    return baseSpeed + settings.startSpeed * speedMultiplier + (stateRef.current.level - 1) * speedUpPerLevel;
  }, [settings.startSpeed]);

  const spawnNote = useCallback(() => {
    if (scaleNotesRef.current.length === 0) return;
    // Avoid spawning the same note twice in a row
    let midi: number;
    let attempts = 0;
    do {
      midi = getWeightedNote(scaleNotesRef.current, settings.key);
      attempts++;
    } while (midi === lastSpawnedMidiRef.current && scaleNotesRef.current.length > 1 && attempts < 10);
    lastSpawnedMidiRef.current = midi;

    notesRef.current.push({
      id: nextIdRef.current++,
      midi,
      x: 1.1,
      active: true,
      hit: false,
      missed: false,
    });
  }, [settings.key]);

  const addHitParticles = useCallback((x: number, staffPos: number) => {
    const canvasY = 0.5 - staffPos * 0.02; // approximate
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      particlesRef.current.push({
        x, y: canvasY,
        vx: Math.cos(angle) * (0.1 + Math.random() * 0.15),
        vy: Math.sin(angle) * (0.1 + Math.random() * 0.15),
        life: 1, maxLife: 1,
        size: 2 + Math.random() * 3,
        color: `hsl(48, 100%, ${50 + Math.random() * 20}%)`,
      });
    }
  }, []);

  const checkHit = useCallback((writtenMidi: number): boolean => {
    // Find frontmost (smallest x) active note matching this MIDI
    let bestNote: GameNote | null = null;
    for (const note of notesRef.current) {
      if (note.active && !note.hit && !note.missed && note.midi === writtenMidi) {
        if (!bestNote || note.x < bestNote.x) {
          bestNote = note;
        }
      }
    }
    if (bestNote) {
      bestNote.hit = true;
      bestNote.hitTime = performance.now();
      bestNote.active = false;
      addHitParticles(bestNote.x, midiToStaffPosition(bestNote.midi));

      setGameState(prev => {
        const newStreak = prev.streak + 1;
        const newCorrect = prev.correctCount + 1;
        const newLevel = 1 + Math.floor(newCorrect / SPEED_SETTINGS.levelUpInterval);
        return {
          ...prev,
          score: prev.score + 10 * newStreak,
          streak: newStreak,
          bestStreak: Math.max(prev.bestStreak, newStreak),
          correctCount: newCorrect,
          totalCount: prev.totalCount + 1,
          level: newLevel,
        };
      });
      // Immediately update stateRef so speed change takes effect on next frame (no pause)
      stateRef.current = {
        ...stateRef.current,
        correctCount: stateRef.current.correctCount + 1,
        level: 1 + Math.floor((stateRef.current.correctCount + 1) / SPEED_SETTINGS.levelUpInterval),
      };
      return true;
    }
    return false;
  }, [addHitParticles]);

  const tick = useCallback((timestamp: number) => {
    if (!stateRef.current.isRunning) return;

    const dt = lastTimeRef.current ? (timestamp - lastTimeRef.current) / 1000 : 0.016;
    lastTimeRef.current = timestamp;

    const speed = getSpeed();
    const pixelsPerSec = speed / 1000; // normalized to 0-1 range

    // Move notes
    for (const note of notesRef.current) {
      if (note.hit) continue;
      note.x -= pixelsPerSec * dt;

      // Miss check
      if (note.x <= 0.08 && note.active && !note.missed) {
        note.missed = true;
        note.active = false;
        setGameState(prev => {
          const newLives = prev.lives - 1;
          if (newLives <= 0) {
            return { ...prev, lives: 0, streak: 0, totalCount: prev.totalCount + 1, isGameOver: true, isRunning: false };
          }
          return { ...prev, lives: newLives, streak: 0, totalCount: prev.totalCount + 1 };
        });
      }
    }

    // Remove old notes
    notesRef.current = notesRef.current.filter(n => {
      if (n.hit && n.hitTime && performance.now() - n.hitTime > 500) return false;
      if (n.missed && n.x < -0.1) return false;
      return true;
    });

    // Update particles
    for (const p of particlesRef.current) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt * 2;
    }
    particlesRef.current = particlesRef.current.filter(p => p.life > 0);

    // Spawn notes
    const spawnInterval = Math.max(800, 2500 - speed * 8);
    if (timestamp - lastSpawnRef.current > spawnInterval) {
      spawnNote();
      lastSpawnRef.current = timestamp;
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [getSpeed, spawnNote]);

  const startGame = useCallback(() => {
    notesRef.current = [];
    particlesRef.current = [];
    nextIdRef.current = 1;
    lastSpawnRef.current = 0;
    lastTimeRef.current = 0;
    lastSpawnedMidiRef.current = null;
    const initial = { ...INITIAL_STATE, isRunning: true };
    stateRef.current = initial;
    setGameState(initial);
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const pauseGame = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    stateRef.current = { ...stateRef.current, isRunning: false };
    setGameState(prev => ({ ...prev, isRunning: false }));
  }, []);

  const resumeGame = useCallback(() => {
    if (stateRef.current.isGameOver) return;
    lastTimeRef.current = 0; // reset dt so no jump
    stateRef.current = { ...stateRef.current, isRunning: true };
    setGameState(prev => ({ ...prev, isRunning: true }));
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const stopGame = useCallback(() => {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    setGameState(prev => ({ ...prev, isRunning: false }));
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return {
    gameState,
    notesRef,
    particlesRef,
    startGame,
    stopGame,
    pauseGame,
    resumeGame,
    checkHit,
  };
}
