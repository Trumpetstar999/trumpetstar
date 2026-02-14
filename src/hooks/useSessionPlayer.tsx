import { useState, useCallback, useMemo } from 'react';
import type { SessionWithDetails, PlayerQueueItem, PracticeSessionItem } from '@/types/sessions';

export type PlayerPhase = 'playing' | 'auto-pause' | 'finished';

export function useSessionPlayer(session: SessionWithDetails | null) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<PlayerPhase>('playing');

  const queue = useMemo<PlayerQueueItem[]>(() => {
    if (!session) return [];
    const q: PlayerQueueItem[] = [];
    let idx = 0;
    for (const sec of session.sections) {
      for (const item of sec.items) {
        q.push({ item, sectionTitle: sec.title, globalIndex: idx++ });
      }
    }
    return q;
  }, [session]);

  const totalItems = queue.length;
  const currentQueueItem = queue[currentIndex] || null;

  const goNext = useCallback(() => {
    if (currentIndex < totalItems - 1) {
      if (session?.break_enabled && phase === 'playing') {
        // Check if next item is not a pause itself
        const nextItem = queue[currentIndex + 1];
        if (nextItem?.item.item_type !== 'pause') {
          setPhase('auto-pause');
          return;
        }
      }
      setCurrentIndex(i => i + 1);
      setPhase('playing');
    } else {
      setPhase('finished');
    }
  }, [currentIndex, totalItems, session, phase, queue]);

  const skipPause = useCallback(() => {
    if (phase === 'auto-pause') {
      setCurrentIndex(i => i + 1);
      setPhase('playing');
    }
  }, [phase]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);
      setPhase('playing');
    }
  }, [currentIndex]);

  const replay = useCallback(() => {
    setPhase('playing');
    // Force re-render by toggling index
    setCurrentIndex(i => {
      // No-op setter to trigger re-render
      return i;
    });
  }, []);

  const jumpTo = useCallback((index: number) => {
    if (index >= 0 && index < totalItems) {
      setCurrentIndex(index);
      setPhase('playing');
    }
  }, [totalItems]);

  const restart = useCallback(() => {
    setCurrentIndex(0);
    setPhase('playing');
  }, []);

  return {
    queue,
    currentIndex,
    currentQueueItem,
    totalItems,
    phase,
    goNext,
    goPrev,
    skipPause,
    replay,
    jumpTo,
    restart,
    setPhase,
  };
}
