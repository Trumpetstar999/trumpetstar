import { useRef, useEffect, useCallback } from 'react';
import { renderGame } from './NoteRenderer';
import type { GameNote, Particle } from '@/hooks/useGameLoop';

interface GameCanvasProps {
  notesRef: React.RefObject<GameNote[]>;
  particlesRef: React.RefObject<Particle[]>;
  isRunning: boolean;
}

export function GameCanvas({ notesRef, particlesRef, isRunning }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle DPI
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    renderGame(
      ctx,
      rect.width,
      rect.height,
      notesRef.current ?? [],
      particlesRef.current ?? [],
      performance.now()
    );

    if (isRunning) {
      rafRef.current = requestAnimationFrame(draw);
    }
  }, [isRunning, notesRef, particlesRef]);

  useEffect(() => {
    if (isRunning) {
      rafRef.current = requestAnimationFrame(draw);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isRunning, draw]);

  // Also render once when not running (for static display)
  useEffect(() => {
    if (!isRunning) {
      requestAnimationFrame(draw);
    }
  }, [isRunning, draw]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block"
      style={{ touchAction: 'none' }}
    />
  );
}
